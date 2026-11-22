"""Validate literal static dependencies; this does not execute WebGL or APIs."""
import argparse,json,re
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import unquote,urlsplit
class References(HTMLParser):
 def __init__(self):super().__init__();self.paths=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  self.paths.extend(a[k] for k in ('src','poster') if a.get(k))
  if tag=='link' and a.get('href'):self.paths.append(a['href'])
def check(root):
 root=Path(root).resolve();checked=set();missing=[];assets=set()
 for path in root.rglob('*'):
  if not path.is_file() or path.suffix not in ('.html','.js','.mjs','.css'):continue
  text=path.read_text()
  if path.suffix=='.html':
   parser=References();parser.feed(text);refs=parser.paths
  elif path.suffix=='.css':refs=re.findall(r"url\(\s*['\"]?([^)'\"\s]+)",text)
  else:refs=re.findall(r"(?:from\s*|import\s*\(|import\s+|fetch\s*\(|\.src\s*=\s*)\s*['\"]([^'\"]+)['\"]",text)
  for value in refs:
   url=urlsplit(value)
   if url.scheme or url.netloc or not url.path or url.path.startswith('/api/'):continue
   if path.suffix in ('.js','.mjs') and not value.startswith(('./','../','/')):continue
   target=(root/unquote(url.path).lstrip('/') if url.path.startswith('/') else path.parent/unquote(url.path)).resolve()
   checked.add((str(path.relative_to(root)),value))
   if root not in target.parents or not target.is_file():missing.append({'file':str(path.relative_to(root)),'reference':value})
   else:assets.add(str(target.relative_to(root)))
 return {'referencesChecked':len(checked),'missing':missing,'assets':sorted(assets),'browserVerified':False}
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('directory');r=check(p.parse_args().directory);print(json.dumps(r,indent=2));raise SystemExit(bool(r['missing']))
