"""Prepare a sanitized static review copy. Never writes to source or changes DNS."""
import argparse,json,subprocess,shutil,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
DIRECTORIES={'assets','data','experiences','apps','about','contact','directory','ecosystem','faq','home','page'}
EXTENSIONS={'.html','.js','.mjs','.css','.json','.ico','.svg','.png','.webp','.jpg','.jpeg','.woff','.woff2','.glb','.txt','.webmanifest'}
def build(out):
 out=Path(out).resolve()
 if out.exists():raise ValueError('Choose a new output directory; never overwrite a review')
 tracked=subprocess.check_output(['git','ls-files','-z'],cwd=ROOT).decode().split('\0');files=[]
 for name in tracked:
  if not name:continue
  p=Path(name)
  if (len(p.parts)==1 or p.parts[0] in DIRECTORIES) and p.suffix.lower() in EXTENSIONS and p.name!='CNAME':
   source=ROOT/p
   if source.is_symlink():raise ValueError('Symlink not allowed in public review copy')
   files.append(p)
 if not Path('index.html') in files:raise ValueError('Homepage absent')
 out.mkdir(parents=True)
 for p in files:
  target=out/p;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(ROOT/p,target)
 (out/'robots.txt').write_text('User-agent: *\nDisallow: /\n')
 (out/'_headers').write_text('/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n')
 review=out/'review';review.mkdir();review.joinpath('index.html').write_text('''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>1AGE private build review</title><body style="background:#000;color:#e2ffdc;font:18px system-ui;padding:2rem"><h1>1AGE build review</h1><p>Private review copy. No live payments or account backend. Existing production domains are unchanged.</p><ul>'''+''.join(f'<li><a style="color:#1bfd9c" href="{url}">{name}</a></li>' for name,url in [('Search / homepage','/'),('Store','/experiences/store/'),('Blog','/experiences/blog/'),('Plus','/experiences/plus/'),('Cash','/experiences/cash/'),('Checkout','/experiences/checkout/'),('Page','/experiences/page/'),('Games','/experiences/games/'),('Exchange','/experiences/exchange/'),('Space entrance — dedicated platform remains separate','/apps/space/'),('Design entrance','/apps/design/')])+'''</ul><p>Static test panels may report the backend unavailable. That does not activate a real membership or credit balance. External links leave this review.</p></body></html>''')
 report={'sourceCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'mode':'private-static-review','backendIncluded':False,'livePayments':False,'files':{str(p.relative_to(out)):hashlib.sha256(p.read_bytes()).hexdigest() for p in out.rglob('*') if p.is_file()}}
 (out/'REVIEW-BUILD.json').write_text(json.dumps(report,indent=2)+'\n');return report
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--out',required=True);args=p.parse_args();r=build(args.out);print(json.dumps({'files':len(r['files']),'backend':False,'commit':r['sourceCommit']}))
