import json,subprocess,tempfile,unittest
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit
ROOT=Path(__file__).resolve().parents[1]
class Links(HTMLParser):
 def __init__(self):super().__init__();self.links=[]
 def handle_starttag(self,tag,attrs):
  self.assert_unique(attrs)
  for k,v in attrs:
   if k in ('href','src') and v and not v.startswith(('#','https:','http:','data:')):self.links.append(v)
 def assert_unique(self,attrs):
  keys=[k for k,v in attrs]
  if len(keys)!=len(set(keys)):raise ValueError('Duplicate HTML attribute')
class VirtualAppsTests(unittest.TestCase):
 def test_independent_roots_have_assets_and_no_central_redirect(self):
  with tempfile.TemporaryDirectory() as tmp:
   out=Path(tmp)/'apps';subprocess.run(['python3',str(ROOT/'scripts/build-virtual-apps.py'),'--out',str(out)],check=True,capture_output=True)
   self.assertEqual(len(list(out.iterdir())),12)
   for app in out.iterdir():
    meta=json.loads((app/'VIRTUAL-BUILD.json').read_text());self.assertEqual(meta['presentation'],'3d-first');self.assertFalse(meta['domainVerified'])
    parser=Links();parser.feed((app/'index.html').read_text())
    for url in parser.links:
     value=urlsplit(url).path;target=app/value.lstrip('/') if value.startswith('/') else app/value
     self.assertTrue(target.resolve().exists(),(app.name,url))
    self.assertNotIn('http-equiv="refresh"',(app/'index.html').read_text())
    self.assertFalse((app/'services').exists());self.assertFalse(list(app.rglob('*.sqlite3')))
 def test_all_registered_routes_are_spatial_by_default(self):
  slugs=[a['slug'] for a in json.loads((ROOT/'data/app-domains.json').read_text())]+['world']
  for slug in slugs:
   for prefix in ('apps','home'):
    p=ROOT/prefix/slug/'index.html'
    if not p.exists():continue
    s=p.read_text()
    if 'http-equiv="refresh"' in s:
     self.assertIn('/experiences/'+slug+'/',s);continue
    self.assertIn('/virtual-entry.css',s);self.assertIn('/virtual-entry.mjs',s);self.assertIn('virtual-entry',s)
