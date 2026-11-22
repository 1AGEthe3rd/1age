"""Verify a release kit, create isolated checkouts and optionally push review branches only."""
import argparse,hashlib,json,os,subprocess,tempfile
from pathlib import Path
from urllib.parse import quote
ALLOWED={'1age','1age-space'}
def git(cwd,*args):return subprocess.check_output(['git','-C',str(cwd),*args],text=True,stderr=subprocess.STDOUT).strip()
def prepare(kit,out,push=False):
 kit=Path(kit).resolve();manifest=json.loads((kit/'release.json').read_text())
 for name,digest in manifest['sha256'].items():
  path=(kit/name).resolve()
  if not path.is_relative_to(kit) or not path.is_file() or path.is_symlink():raise ValueError('Unsafe/missing release path')
  if hashlib.sha256(path.read_bytes()).hexdigest()!=digest:raise ValueError('Checksum mismatch: '+name)
 out=Path(out).expanduser().resolve();out.mkdir(parents=True,exist_ok=True);session=Path(tempfile.mkdtemp(prefix='oneage-review-030-',dir=out));prepared=[]
 for app in manifest['repositories']:
  repo=app['repository'];branch=app['reviewBranch']
  if repo not in ALLOWED or not branch.startswith('review/') or '..' in branch:raise ValueError('Unexpected repository/review branch')
  checkout=session/repo;origin='https://github.com/1AGEthe3rd/'+repo+'.git'
  subprocess.run(['git','clone','--single-branch','--branch','main',origin,str(checkout)],check=True,env={**os.environ,'GIT_TERMINAL_PROMPT':'0'})
  bundle=(kit/app['bundle']).resolve()
  if not bundle.is_relative_to(kit):raise ValueError('Bundle escapes release kit')
  git(checkout,'bundle','verify',str(bundle))
  git(checkout,'fetch',str(bundle),app['sourceRef']+':refs/heads/'+branch)
  git(checkout,'switch',branch)
  if git(checkout,'rev-parse','HEAD')!=app['head'] or git(checkout,'status','--porcelain'):raise ValueError('Release head/tree mismatch')
  subprocess.run(['git','-C',str(checkout),'merge-base','--is-ancestor','origin/main','HEAD'],check=True)
  prepared.append({'repository':repo,'checkout':str(checkout),'branch':branch,'head':app['head'],'pushed':False})
 # Finish preparation for every repository before any remote write.
 report=session/'review-results.json'
 report.write_text(json.dumps(prepared,indent=2)+'\n')
 if push:
  for app in prepared:
   path=Path(app['checkout']);git(path,'fetch','origin','main');subprocess.run(['git','-C',str(path),'merge-base','--is-ancestor','origin/main','HEAD'],check=True)
   # Non-force ref creation/update only. main is never a push destination.
   git(path,'push','origin','HEAD:refs/heads/'+app['branch']);app['pushed']=True
   app['compareUrl']='https://github.com/1AGEthe3rd/'+app['repository']+'/compare/main...'+quote(app['branch'],safe='/')
   report.write_text(json.dumps(prepared,indent=2)+'\n')
 print(json.dumps({'prepared':prepared,'results':str(report),'productionChanged':False},indent=2))
 return prepared
if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--kit',default=str(Path(__file__).resolve().parent));p.add_argument('--out',default=str(Path.home()/'Projects/1age-release-reviews'));p.add_argument('--push-review',action='store_true');a=p.parse_args();prepare(a.kit,a.out,a.push_review)
