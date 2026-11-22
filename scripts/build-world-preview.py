"""Prepare a separate Cloudflare preview export, streaming unchanged WASM chunks."""
import argparse,hashlib,importlib.util,json,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
CHUNK=16*1024*1024

def build(source,out):
 source=Path(source).resolve();out=Path(out).resolve()
 if out.exists():raise ValueError('Output exists; refusing to overwrite')
 if out.is_relative_to(source):raise ValueError('Preview output must be outside the source export')
 spec=importlib.util.spec_from_file_location('godot_export',ROOT/'scripts/validate-godot-export.py');validator=importlib.util.module_from_spec(spec);spec.loader.exec_module(validator)
 report=validator.validate(source)
 if not report['valid']:raise ValueError('Invalid Godot export: '+str(report['errors']))
 out.mkdir(parents=True);public=out/'public';public.mkdir()
 html=(source/'index.html').read_text();import re
 config=json.loads(re.search(r'const\s+GODOT_CONFIG\s*=\s*(\{[^\n]+\})\s*;',html).group(1));engine=config.get('executable','index')
 if '/' in engine or '\\' in engine or not engine:raise ValueError('Engine basename required')
 wasm=engine+'.wasm';data=source/wasm
 manifest={'path':'/'+wasm,'bytes':data.stat().st_size,'sha256':hashlib.sha256(data.read_bytes()).hexdigest(),'chunks':[]}
 parts=public/'_wasm-chunks';parts.mkdir()
 with data.open('rb') as stream:
  while block:=stream.read(CHUNK):
   name=f'{len(manifest["chunks"]):04d}.bin';(parts/name).write_bytes(block);manifest['chunks'].append({'path':'/_wasm-chunks/'+name,'bytes':len(block),'sha256':hashlib.sha256(block).hexdigest()})
 # Copy only validated engine dependencies and generated public icons/images.
 names={row['path'] for row in report['assets']}|{'index.html'}
 names.update(p.name for p in source.iterdir() if p.is_file() and p.suffix.lower() in {'.png','.ico','.svg','.webmanifest'})
 for name in names:
  if name==wasm:continue
  path=source/name
  if path.is_symlink() or not path.resolve().is_relative_to(source):raise ValueError('Unsafe asset path')
  target=public/name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(path,target)
 (public/'_headers').write_text('/*\n  Cross-Origin-Opener-Policy: same-origin\n  Cross-Origin-Embedder-Policy: require-corp\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  X-Robots-Tag: noindex\n')
 (public/'robots.txt').write_text('User-agent: *\nDisallow: /\n')
 (out/'wasm-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
 shutil.copyfile(ROOT/'deployment/world/world-handler.mjs',out/'world-handler.mjs')
 (out/'worker.mjs').write_text("import {createWorldHandler} from './world-handler.mjs';\nexport default createWorldHandler("+json.dumps(manifest)+");\n")
 config={'name':'oneage-world-preview-030','main':'worker.mjs','compatibility_date':'2026-11-22','workers_dev':True,'assets':{'directory':'./public','binding':'ASSETS','run_worker_first':[manifest['path']],'not_found_handling':'none','html_handling':'auto-trailing-slash'}}
 (out/'wrangler.json').write_text(json.dumps(config,indent=2)+'\n')
 oversized=[str(p.relative_to(public)) for p in public.rglob('*') if p.is_file() and p.stat().st_size>25*1024*1024]
 if oversized:raise ValueError('Oversized static assets: '+str(oversized))
 (out/'PREVIEW.json').write_text(json.dumps({'mode':'unpublished-preview','domainConfigured':False,'sourceExport':report,'engine':manifest,'largestStaticAsset':max(p.stat().st_size for p in public.rglob('*') if p.is_file()),'browserVerified':False,'wranglerVerified':False},indent=2)+'\n')
 return manifest
if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--source',required=True);p.add_argument('--out',required=True);a=p.parse_args();r=build(a.source,a.out);print(json.dumps({'engineBytes':r['bytes'],'chunks':len(r['chunks']),'published':False}))
