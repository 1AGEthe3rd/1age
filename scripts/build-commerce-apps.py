#!/usr/bin/env python3
"""Prepare reviewed independent static app packages. Does not publish or change DNS."""
import argparse,hashlib,json,re,shutil,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--out',required=True);args=p.parse_args();out=Path(args.out).resolve()
if out.exists():raise SystemExit('Choose a new empty output path; existing output is never overwritten.')
out.mkdir(parents=True)
for app in ['store','blog','plus','checkout']:
 dest=out/app;dest.mkdir();shutil.copytree(ROOT/'experiences/shared',dest/'shared')
 for f in (ROOT/'experiences'/app).iterdir():
  if f.is_file():shutil.copy2(f,dest/f.name)
 if app!='checkout':shutil.copytree(ROOT/'experiences/checkout',dest/'checkout')
 for f in dest.rglob('*'):
  if f.suffix not in ('.html','.js','.json') or 'vendor' in f.parts:continue
  s=f.read_text()
  # Root app and nested checkout resolve the shared folder correctly.
  if f.parent==dest:s=s.replace('../shared/','./shared/').replace('../checkout/','./checkout/')
  for sibling in ['store','blog','plus']:s=s.replace('../'+sibling+'/',('https://1age.com/experiences/blog/' if sibling=='blog' else f'https://1age.{sibling}/'))
  if app=='checkout' and f.parent==dest:s=s.replace('./checkout/','./').replace("'../store/'","'https://1age.store/'").replace("'../plus/'","'https://1age.plus/'")
  f.write_text(s)
 # Keep build previews out of search results until separately authorized.
 (dest/'robots.txt').write_text('User-agent: *\nDisallow: /\n')
 if app!='checkout':(dest/'CNAME').write_text('1age.'+app+'\n')
 (dest/'BUILD.json').write_text(json.dumps({'app':app,'mode':'unpublished-demonstration','backend':'not-included','live_payments':False},indent=2)+'\n')
 hashes={str(f.relative_to(dest)):hashlib.sha256(f.read_bytes()).hexdigest() for f in dest.rglob('*') if f.is_file()}
 (dest/'checksums.json').write_text(json.dumps(hashes,indent=2)+'\n')
print(out)
