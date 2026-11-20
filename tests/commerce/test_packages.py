import subprocess,tempfile,unittest
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit
ROOT=Path(__file__).resolve().parents[2]
class Links(HTMLParser):
 def __init__(self):super().__init__();self.links=[]
 def handle_starttag(self,tag,attrs):
  for k,v in attrs:
   if k in ('src','href') and v and not v.startswith(('#','http:','https:','data:')):self.links.append(v)
class Packages(unittest.TestCase):
 def test_independent_packages(self):
  with tempfile.TemporaryDirectory() as tmp:
   dest=Path(tmp)/'apps';subprocess.run(['python3',str(ROOT/'scripts/build-commerce-apps.py'),'--out',str(dest)],check=True,capture_output=True)
   for app in dest.iterdir():
    for html in app.rglob('*.html'):
     parser=Links();parser.feed(html.read_text())
     for url in parser.links:self.assertTrue((html.parent/urlsplit(url).path).resolve().exists(),(html,url))
    self.assertFalse((app/'services').exists())
if __name__=='__main__':unittest.main()
