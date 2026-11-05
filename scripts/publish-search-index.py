#!/usr/bin/env python3
"""Publish a validated Actions candidate to the existing main/root Pages source.

Only invoked by the reviewed default-branch workflow. Never changes Pages settings,
forces a push, bypasses branch protection or modifies application code.
"""
import argparse
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import time
from indexlib import ROOT,MANUAL,read,merged_catalog,outputs

INPUTS=['data/discovered-records.json','data/link-health.json','data/index-state.json',
        'data/index-rollback.json','data/search-last-good.json','reports/index-latest.json',
        'reports/index-latest-attempt.json']

def command(*args): return subprocess.check_output(args,cwd=ROOT,text=True).strip()
def api(path,method=None):
    args=['gh','api',path]
    if method: args+=['--method',method]
    return json.loads(command(*args))

def validate_candidate(candidate):
    # Validate against the reviewed checkout's curated data, not metadata supplied in an artifact.
    with tempfile.TemporaryDirectory() as directory:
        root=Path(directory)
        for name in (*MANUAL,'data/search-overrides.json','data/index-exclusions.json'):
            dest=root/name;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(ROOT/name,dest)
        for name in INPUTS[:3]:
            source=candidate/name
            if source.is_symlink() or not source.is_file(): raise ValueError('Missing/unsafe candidate input: '+name)
            dest=root/name;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source,dest)
        records,_=merged_catalog(root)
        config=read(ROOT/'data/index-sources/config.json')
        if len(records)>config['limits']['max_records']: raise ValueError('Candidate record budget exceeded')
        files=outputs(records,root)
        for name,content in files.items():
            source=candidate/name
            if source.is_symlink() or not source.is_file() or source.read_text()!=content:
                raise ValueError('Candidate generated output mismatch: '+name)
        summary=read(candidate/'reports/index-latest.json')
        if summary['status'] not in ('success','partial') or summary['total_indexed_records']!=len(records):
            raise ValueError('Missing successful validation report')
        return files

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--candidate',type=Path,required=True);p.add_argument('--expected-sha',required=True)
    args=p.parse_args()
    if os.environ.get('GITHUB_REF')!='refs/heads/main' or os.environ.get('GITHUB_REPOSITORY')!='1AGEthe3rd/1age':
        raise SystemExit('Publication is restricted to the reviewed main branch of 1AGEthe3rd/1age')
    if command('git','rev-parse','HEAD')!=args.expected_sha: raise SystemExit('Main changed during indexing; rerun instead of overwriting it')
    files=validate_candidate(args.candidate)
    # GitHub-token pushes do not trigger Pages builds. Request the existing build
    # explicitly; fail before pushing if the hosting source differs or is inaccessible.
    site=api('repos/1AGEthe3rd/1age/pages')
    source=site.get('source') or {}
    if source.get('branch')!='main' or source.get('path')!='/' or site.get('build_type')=='workflow':
        raise SystemExit('Existing Pages source is not main/root branch publishing; owner review required')
    names=sorted(set(INPUTS+list(files)))
    for name in names:
        source=args.candidate/name;target=ROOT/name
        if source.is_symlink() or not source.is_file(): raise SystemExit('Unsafe artifact file: '+name)
        target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source,target)
    # Recheck after copying. No network or script downloaded from data sources is executed.
    command('python3','scripts/build-search-index.py','--check')
    command('git','config','user.name','1AGE Indexer')
    command('git','config','user.email','41898282+github-actions[bot]@users.noreply.github.com')
    command('git','add','--',*names)
    command('git','commit','-m','Refresh public blockchain search index')
    sha=command('git','rev-parse','HEAD')
    command('git','push','origin','HEAD:main')  # Normal fast-forward checks and branch rules apply.
    api('repos/1AGEthe3rd/1age/pages/builds','POST')
    for attempt in range(24):
        build=api('repos/1AGEthe3rd/1age/pages/builds/latest')
        if build.get('commit')==sha and build.get('status')=='built':
            print(json.dumps({'status':'published','commit':sha,'url':site.get('html_url')}));break
        if build.get('commit')==sha and build.get('status') in ('errored','failed'):
            raise SystemExit('Pages build failed; previous deployed site remains. Inspect the build logs.')
        time.sleep(5)
    else: raise SystemExit('Pages build requested but completion not confirmed; inspect Pages Actions before retrying')
