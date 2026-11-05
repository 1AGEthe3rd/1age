#!/usr/bin/env python3
"""Prepare/push reviewed feature branches. Never merges or deploys."""
import argparse,hashlib,json,os,subprocess,sys
from pathlib import Path
from urllib.request import urlopen,Request
HERE=Path(__file__).resolve().parent

def git(directory,*args,env=None):
    return subprocess.run(['git','-C',str(directory),*args],check=True,text=True,stdout=subprocess.PIPE,env=env).stdout.strip()

def identity(directory):
    env=os.environ.copy()
    for key,config in [('GIT_COMMITTER_NAME','user.name'),('GIT_COMMITTER_EMAIL','user.email')]:
        if env.get(key):continue
        for source in [directory,Path.home()/'Projects/1age',Path.home()/'Projects/1agethe3rd-branding-publish']:
            if not source.exists():continue
            result=subprocess.run(['git','-C',str(source),'config','--get',config],text=True,capture_output=True)
            if result.returncode==0 and result.stdout.strip():env[key]=result.stdout.strip();break
    if not env.get('GIT_COMMITTER_NAME'):env['GIT_COMMITTER_NAME']='1AGEthe3rd'
    if not env.get('GIT_COMMITTER_EMAIL'):
        raise RuntimeError('Git commit email is missing. Configure it in your existing ~/Projects/1age repository with git config user.email YOUR_GITHUB_COMMIT_EMAIL, then rerun. No global settings are changed.')
    return env

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--group',choices=['core','apps'],default='core')
    p.add_argument('--push',action='store_true',help='Push only the named development branches; never merge')
    p.add_argument('--check',action='store_true',help='Validate package checksums without network or repository changes')
    p.add_argument('--root',type=Path,default=Path.home()/'Projects/1age-app-rollout')
    a=p.parse_args();manifest=json.loads((HERE/'manifest.json').read_text())
    for item in manifest:
        patch=HERE/item['patch']
        if hashlib.sha256(patch.read_bytes()).hexdigest()!=item['sha256']:raise RuntimeError('Package checksum mismatch: '+item['patch'])
    if a.check:print('All 12 patches match their recorded checksums. No repositories changed.');return
    chosen=[x for x in manifest if (x['repository']=='1age')==(a.group=='core')]
    if a.group=='apps' and a.push:
        # Never publish aliases before their actual canonical destinations exist.
        for item in chosen:
            url='https://1age.com/home/'+item['slug']+'/'
            with urlopen(Request(url,headers={'User-Agent':'1AGE-owner-publish-check/1'}),timeout=20) as response:
                html=response.read(300000).decode('utf-8')
            if '<title>'+item['name']+'</title>' not in html:
                raise RuntimeError('Canonical app route is not live yet: '+url+'. Merge the core PR and wait for Pages first.')
    a.root.mkdir(parents=True,exist_ok=True)
    links=[]
    for item in chosen:
        repo=item['repository'];directory=a.root/repo;remote='https://github.com/1AGEthe3rd/'+repo+'.git'
        print('\nPreparing '+repo,flush=True)
        if not directory.exists():subprocess.run(['git','clone','--branch','main',remote,str(directory)],check=True)
        if git(directory,'remote','get-url','origin').removesuffix('.git') not in [remote.removesuffix('.git'),'git@github.com:1AGEthe3rd/'+repo]:
            raise RuntimeError('Unexpected origin in '+str(directory))
        if git(directory,'status','--porcelain'):raise RuntimeError('Working tree has changes; preserved at '+str(directory))
        if (directory/'.git/rebase-apply').exists():raise RuntimeError('An earlier patch session is unfinished in '+str(directory))
        git(directory,'fetch','origin','main')
        branch=item['branch']
        exists=subprocess.run(['git','-C',str(directory),'show-ref','--verify','--quiet','refs/heads/'+branch]).returncode==0
        if exists:
            git(directory,'switch',branch)
            if git(directory,'rev-parse','HEAD^{tree}')!=item['tree']:raise RuntimeError('Existing branch differs from the reviewed patch: '+str(directory))
        else:
            if git(directory,'rev-parse','origin/main')!=item['base']:
                raise RuntimeError(repo+' main has changed since this package was built. Nothing overwritten. Send the output so the patch can be refreshed safely.')
            env=identity(directory)
            git(directory,'switch','-c',branch,'origin/main')
            git(directory,'am',str(HERE/item['patch']),env=env)
            if git(directory,'rev-parse','HEAD^{tree}')!=item['tree']:raise RuntimeError('Applied tree differs from the reviewed files in '+str(directory))
        if a.push:
            git(directory,'push','-u','origin','HEAD:refs/heads/'+branch)
            links.append('https://github.com/1AGEthe3rd/'+repo+'/compare/main...'+branch+'?expand=1')
    print('\n'+('Feature branches pushed. Create/review PRs below. No merges or production deployments performed.' if a.push else 'Feature branches prepared locally. Rerun with --push when ready.'))
    for link in links:print(link)
    if a.group=='core':print('Merge the core PR, wait for Pages success, then run: python3 publish-app-updates.py --group apps --push')

if __name__=='__main__':
    try:main()
    except (RuntimeError,subprocess.CalledProcessError,OSError) as error:print('\nSTOPPED safely: '+str(error),file=sys.stderr);sys.exit(1)
