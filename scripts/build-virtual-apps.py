"""Prepare independent 3D-first app roots. No DNS or production changes."""
import argparse,hashlib,json,shutil,subprocess,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def build(out):
 out=Path(out).resolve()
 if out.exists():raise ValueError('Output already exists; refusing to overwrite')
 apps=json.loads((ROOT/'data/app-domains.json').read_text());apps.append({'slug':'blog','name':'1AGE Blog','domain':'1age.blog','repository':'1age-blog'})
 out.mkdir(parents=True)
 with tempfile.TemporaryDirectory() as temporary:
  commerce=Path(temporary)/'packages';subprocess.run(['python3',str(ROOT/'scripts/build-commerce-apps.py'),'--out',str(commerce)],check=True,capture_output=True)
  for app in apps:
   slug=app['slug'];dest=out/app['repository']
   if (commerce/slug).exists():shutil.copytree(commerce/slug,dest)
   else:
    dest.mkdir();source=ROOT/'experiences/cash/index.html' if slug=='cash' else ROOT/'apps'/slug/'index.html';(dest/'index.html').write_text(source.read_text())
    if slug=='cash':shutil.copyfile(ROOT/'experiences/cash/cash.js',dest/'cash.js')
    (dest/'apps').mkdir();shutil.copyfile(ROOT/'apps/suite.js',dest/'apps/suite.js');shutil.copyfile(ROOT/'apps/suite.css',dest/'apps/suite.css')
    shutil.copytree(ROOT/'experiences/shared',dest/'experiences/shared');shutil.copytree(ROOT/'assets/app-icons',dest/'assets/app-icons');shutil.copyfile(ROOT/'assets/1age-logo.svg',dest/'assets/1age-logo.svg')
    for name in ('interface-motion.css','app-home.js','search-toggle.js'):shutil.copyfile(ROOT/name,dest/name)
    if slug=='cash':
     # This legacy account UI references the shared stylesheet one level up.
     index=(dest/'index.html').read_text().replace('../shared/','/experiences/shared/');(dest/'index.html').write_text(index)
   for name in ('virtual-entry.css','virtual-entry.mjs'):shutil.copyfile(ROOT/name,dest/name)
   # Legacy sibling/parent routes leave for independent app domains; they are not copied rooms.
   for f in dest.rglob('*'):
    if f.suffix not in ('.html','.js','.mjs') or 'vendor' in f.parts:continue
    s=f.read_text()
    for target in apps:
     for prefix in ('/apps/','/home/','/experiences/','../'):
      s=s.replace(prefix+target['slug']+'/', '/' if target['slug']==slug else 'https://'+target['domain']+'/')
    if f.name=='virtual-entry.mjs' and (commerce/slug).exists():s=s.replace("'/experiences/shared/viewer.js'","'/shared/viewer.js'").replace("'/assets/1age-logo.svg'","'/shared/1age-logo.svg'")
    if f.name=='virtual-entry.mjs':
     s=s.replace("location.pathname!==routes[slug]", "location.pathname!=='/'&&location.pathname!==routes[slug]")
    s=s.replace('/apps/search/','https://1age.com/').replace('/apps/world/','https://1age.world/').replace('/home/world/','https://1age.world/').replace('/world/','https://1age.world/')
    if f.name=='app-home.js':s=s.replace('action="/"','action="https://1age.com/"')
    f.write_text(s)
   if slug in {'quest','design','shop','app'}:
    title=app['name'];description={'quest':'A 3D virtual mission environment. Gameplay and rewards are in development.','design':'A 3D virtual creator studio.','shop':'A 3D virtual marketplace foundation.','app':'A 3D application discovery hub.'}[slug]
    (dest/'index.html').write_text(f'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title}</title><meta name="description" content="{description}"><meta name="robots" content="noindex"><link rel="icon" href="/assets/1age-logo.svg"><link rel="stylesheet" href="/virtual-entry.css"></head><body data-app="{slug}" class="virtual-entry"><script type="module" src="/virtual-entry.mjs"></script><noscript>Enable JavaScript and WebGL to enter this 3D virtual environment.</noscript></body></html>')
   (dest/'.nojekyll').write_text('')
   (dest/'CNAME').write_text(app['domain']+'\n');(dest/'robots.txt').write_text('User-agent: *\nDisallow: /\n')
   (dest/'VIRTUAL-BUILD.json').write_text(json.dumps({'app':slug,'presentation':'3d-first','liveBackend':False,'domainVerified':False,'deployment':'not-published','geometry':'existing experience or labeled generic entrance'},indent=2)+'\n')
   for manifest in dest.rglob('checksums.json'):manifest.unlink()
   hashes={str(f.relative_to(dest)):hashlib.sha256(f.read_bytes()).hexdigest() for f in sorted(dest.rglob('*')) if f.is_file()}
   (dest/'checksums.json').write_text(json.dumps(hashes,indent=2)+'\n')
 return out
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--out',required=True);a=p.parse_args();print(build(a.out))
