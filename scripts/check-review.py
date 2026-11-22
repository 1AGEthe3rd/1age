"""Check static entry assets without claiming browser rendering or live API operation."""
import argparse,importlib.util,json,re
from pathlib import Path
from html.parser import HTMLParser
class Assets(HTMLParser):
 def __init__(self):super().__init__();self.paths=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag in ('script','img','source') and a.get('src'):self.paths.append(a['src'])
  if tag=='link' and a.get('rel')=='stylesheet' and a.get('href'):self.paths.append(a['href'])
def check(root):
 root=Path(root).resolve();missing=[];checked=0
 for name in ['index.html','experiences/store/index.html','experiences/blog/index.html','experiences/plus/index.html','experiences/cash/index.html','experiences/checkout/index.html','experiences/page/index.html','experiences/games/index.html','experiences/exchange/index.html']:
  p=root/name
  if not p.is_file():missing.append(name);continue
  parser=Assets();parser.feed(p.read_text())
  for value in parser.paths:
   if value.startswith(('https:','http:','data:','//')):continue
   value=value.split('?')[0].split('#')[0];target=(root/value.lstrip('/') if value.startswith('/') else p.parent/value).resolve();checked+=1
   if root not in target.parents or not target.is_file():missing.append(name+': '+value)
 spec=importlib.util.spec_from_file_location('static_assets',Path(__file__).with_name('check-standalone-assets.py'));module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
 dependencies=module.check(root);checked+=dependencies['referencesChecked'];missing.extend(item['file']+': '+item['reference'] for item in dependencies['missing'])
 forbidden=[str(p.relative_to(root)) for p in root.rglob('*') if p.is_file() and (p.suffix in ('.sqlite3','.db','.py','.bundle') or '.git' in p.parts or p.name in ('CNAME','.env'))]
 return {'entrypoints':9,'assetReferencesChecked':checked,'missing':missing,'forbiddenFiles':forbidden,'backendIncluded':False,'browserVerified':False}
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('directory');args=parser.parse_args();result=check(args.directory);print(json.dumps(result,indent=2));raise SystemExit(bool(result['missing'] or result['forbiddenFiles']))
