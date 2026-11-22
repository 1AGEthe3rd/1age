import functools,hashlib,importlib.util,json,tempfile,unittest,zipfile
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
from urllib.request import urlopen
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('previews',ROOT/'scripts/build-domain-previews.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
class PreviewTests(unittest.TestCase):
 def test_archives_and_local_http_assets(self):
  with tempfile.TemporaryDirectory() as tmp:
   output=Path(tmp)/'out';report=module.build(output);self.assertEqual(len(report['apps']),12)
   for app in report['apps']:
    package=output/'packages'/app['repository'];self.assertFalse(app['productionApproved'])
    with zipfile.ZipFile(output/app['archive']) as z:
     self.assertEqual(z.read('CNAME').decode().strip(),app['domain'])
     for manifest in ['checksums.json','PREVIEW-SHA256.json']:
      for name,digest in json.loads(z.read(manifest)).items():self.assertEqual(hashlib.sha256(z.read(name)).hexdigest(),digest)
    result=module.asset_checker.check(package);self.assertFalse(result['missing'])
    server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(package)));thread=Thread(target=server.serve_forever,daemon=True);thread.start()
    try:
     for name in ['index.html']+result['assets']:
      with urlopen(f'http://127.0.0.1:{server.server_port}/'+name,timeout=5) as r:
       self.assertEqual(r.status,200);self.assertEqual(r.read(),(package/name).read_bytes())
       if Path(name).suffix in ('.js','.mjs'):self.assertIn('javascript',r.headers['Content-Type'])
    finally:server.shutdown();server.server_close();thread.join()
   with self.assertRaises(ValueError):module.build(output)
 def test_missing_assets_and_runtime_files_are_rejected(self):
  with tempfile.TemporaryDirectory() as tmp:
   p=Path(tmp);(p/'test.mjs').write_text("image.src='/missing.svg'; import('./missing.mjs'); fetch('../outside.json');")
   self.assertEqual(len(module.asset_checker.check(p)['missing']),3)
   (p/'CNAME').write_text('1age.store');(p/'VIRTUAL-BUILD.json').write_text(json.dumps({'presentation':'3d-first','liveBackend':False}));(p/'index.html').write_text('<html></html>');(p/'.env.local').write_text('fixture')
   with self.assertRaises(ValueError):module.validate(p,'1age.store')
   (p/'.env.local').unlink()
   with self.assertRaises(ValueError):module.validate(p,'wrong.example')
 def test_workflow_cannot_publish(self):
  text=(ROOT/'.github/workflows/domain-preview-artifacts.yml').read_text()
  self.assertIn('contents: read',text)
  for forbidden in ['pages: write','id-token: write','wrangler','deploy-pages','git push','schedule:']:self.assertNotIn(forbidden,text)
