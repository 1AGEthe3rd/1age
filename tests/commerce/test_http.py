import importlib.util,json,sys,tempfile,threading,unittest,urllib.request,urllib.error
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'services/checkout'))
from server import Handler,ThreadingHTTPServer
from core import Checkout
class HTTPTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.server=ThreadingHTTPServer(('127.0.0.1',0),Handler);self.host=f'127.0.0.1:{self.server.server_port}';self.server.allowed_hosts={self.host};self.server.checkout=Checkout(Path(self.tmp.name)/'db');self.thread=threading.Thread(target=self.server.serve_forever,daemon=True);self.thread.start()
 def tearDown(self):self.server.shutdown();self.server.server_close();self.thread.join();self.tmp.cleanup()
 def call(self,path,data=None,token=None,origin=None):
  headers={'Content-Type':'application/json','X-Demo-Account':'a'*32}
  if token:headers['Authorization']='Bearer '+token
  if origin:headers['Origin']=origin
  req=urllib.request.Request('http://'+self.host+path,data=json.dumps(data).encode() if data is not None else None,headers=headers)
  with urllib.request.urlopen(req) as r:return json.load(r)
 def test_flow_price_tampering_and_cross_origin(self):
  with self.assertRaises(urllib.error.HTTPError):self.call('/api/orders',{'app':'cash','sku':'cash-demo','request_key':'http-001','consent_version':None,'amount':1})
  with self.assertRaises(urllib.error.HTTPError):self.call('/api/orders',{'app':'cash','sku':'cash-demo','request_key':'http-001','consent_version':None},origin='https://untrusted.example')
  o=self.call('/api/orders',{'app':'cash','sku':'cash-demo','request_key':'http-001','consent_version':None});s=self.call('/api/simulate',{'order_id':o['id'],'state':'paid'},o['access_token']);self.assertEqual(s['balance_minor'],100)
  with self.assertRaises(urllib.error.HTTPError):self.call('/api/orders/'+o['id'])
  self.assertEqual(self.call('/api/orders/'+o['id'],token=o['access_token'])['state'],'paid')
 def test_service_source_not_served(self):
  for path in ['/services/checkout/core.py','/experiences/../../services/checkout/core.py','/experiences/%2e%2e/services/checkout/core.py']:
   with self.assertRaises(urllib.error.HTTPError):self.call(path)
if __name__=='__main__':unittest.main()
