"""Prepare independent 3D review artifacts. No publication, DNS or hosting operations."""
import argparse,hashlib,importlib.util,json,subprocess,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
DEDICATED={'page','games','exchange','cash','plus','store','blog'}
def load(name):
 spec=importlib.util.spec_from_file_location(name,ROOT/'scripts'/f'{name}.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module
asset_checker=load('check-standalone-assets')
def validate(package,domain):
 if (package/'CNAME').read_text().strip()!=domain:raise ValueError('Unexpected domain')
 meta=json.loads((package/'VIRTUAL-BUILD.json').read_text())
 if meta.get('presentation')!='3d-first' or meta.get('liveBackend') is not False:raise ValueError('Invalid preview metadata')
 if 'http-equiv="refresh"' in (package/'index.html').read_text().lower():raise ValueError('Root redirects forbidden')
 hashes={}
 for path in sorted(package.rglob('*')):
  if path.is_symlink():raise ValueError('Symlink forbidden')
  if not path.is_file():continue
  relative=path.relative_to(package)
  if path.suffix in {'.sqlite3','.db','.bundle','.py','.pem','.key'} or any(p in {'.git','services','runtime'} or p.startswith('.env') for p in relative.parts):raise ValueError('Private/runtime file '+str(relative))
  hashes[str(relative)]=hashlib.sha256(path.read_bytes()).hexdigest()
 return hashes
def build(out):
 out=Path(out).resolve()
 if out.exists():raise ValueError('Output exists; refusing to overwrite')
 out.mkdir(parents=True);packages=out/'packages';load('build-virtual-apps').build(packages)
 apps=json.loads((ROOT/'data/app-domains.json').read_text())+[{'slug':'blog','name':'1AGE Blog','domain':'1age.blog','repository':'1age-blog'}]
 entries=[]
 configs=out/'cloudflare-preview';configs.mkdir()
 for app in apps:
  package=packages/app['repository'];assets=asset_checker.check(package)
  if assets['missing']:raise ValueError(str(assets['missing']))
  (package/'_headers').write_text('/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  X-Robots-Tag: noindex\n')
  # Update final manifest after adding preview response headers.
  (package/'checksums.json').unlink()
  (package/'checksums.json').write_text(json.dumps({str(f.relative_to(package)):hashlib.sha256(f.read_bytes()).hexdigest() for f in sorted(package.rglob('*')) if f.is_file()},indent=2)+'\n')
  config={'name':'oneage-'+app['slug']+'-preview-030','compatibility_date':'2026-11-22','workers_dev':True,'assets':{'directory':'../packages/'+app['repository'],'html_handling':'auto-trailing-slash','not_found_handling':'none'}}
  (configs/(app['repository']+'.json')).write_text(json.dumps(config,indent=2)+'\n')
  hashes=validate(package,app['domain']);(package/'PREVIEW-SHA256.json').write_text(json.dumps(hashes,indent=2)+'\n')
  archive=out/(app['repository']+'-preview.zip')
  with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
   for path in sorted(package.rglob('*')):
    if path.is_file():z.write(path,path.relative_to(package))
  entries.append({**app,'registrar':'unverified','currentHosting':'unverified','domainVerified':False,'productionApproved':False,'backendIncluded':False,'browserVerified':False,'presentation':'dedicated-3d-experience' if app['slug'] in DEDICATED else 'generic-3d-entrance','archive':archive.name,'archiveSha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'assetReferencesChecked':assets['referencesChecked'],'deployment':'not-published'})
 report={'sourceCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'sourceDirty':bool(subprocess.check_output(['git','status','--porcelain'],cwd=ROOT,text=True)),'apps':entries,'excluded':['1age.com: preserve Search hosting','1age.world: separate Godot export'],'changesApplied':{'dns':False,'hosting':False,'production':False}}
 (out/'domain-readiness.json').write_text(json.dumps(report,indent=2)+'\n')
 (out/'README.md').write_text('# Independent 3D preview artifacts\n\nNo DNS, hosting or production changes. CNAME files express intended domains only. Accounts and payments need separate services. Generic Space entrance must not replace the dedicated Space application or database. World is excluded.\n\n'+'\n'.join(f"- {a['domain']}: {a['presentation']} — {a['archive']}" for a in entries)+'\n')
 return report
if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--out',required=True);r=build(p.parse_args().out);print(json.dumps({'packages':len(r['apps']),'published':False}))
