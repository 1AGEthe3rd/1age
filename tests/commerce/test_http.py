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

class ReceiptTests(unittest.TestCase):
 setUp=HTTPTests.setUp
 tearDown=HTTPTests.tearDown
 call=HTTPTests.call
 def test_receipt_requires_token_and_completed_payment(self):
  o=self.call('/api/orders',{'app':'cash','sku':'cash-demo','request_key':'receipt-001','consent_version':None})
  path='/api/orders/'+o['id']+'/receipt'
  for token in [None,'wrong',o['access_token']]:
   with self.assertRaises(urllib.error.HTTPError) as e:self.call(path,token=token)
   self.assertEqual(e.exception.code,409 if token==o['access_token'] else 403)
  self.call('/api/simulate',{'order_id':o['id'],'state':'paid'},o['access_token'])
  receipt=self.call(path,token=o['access_token']);self.assertEqual(receipt['state'],'paid');self.assertEqual(receipt['amount'],100);self.assertEqual(receipt['mode'],'demonstration')
  self.call('/api/simulate',{'order_id':o['id'],'state':'refunded'},o['access_token'])
  self.assertEqual(self.call(path,token=o['access_token'])['state'],'refunded')
 def test_retry_recovers_same_order_and_cannot_read_another(self):
  data={'app':'plus','sku':'plus-demo','request_key':'recovery-001','consent_version':'plus-demo-v1'}
  a=self.call('/api/orders',data);b=self.call('/api/orders',data)
  self.assertEqual(a['id'],b['id']);self.assertEqual(a['access_token'],b['access_token'])
  data['request_key']='recovery-002';c=self.call('/api/orders',data)
  with self.assertRaises(urllib.error.HTTPError):self.call('/api/orders/'+c['id'],token=a['access_token'])

 def test_pending_recovery_is_in_receipt_but_has_no_operator_http_route(self):
  o=self.call('/api/orders',{'app':'cash','sku':'cash-demo','request_key':'refund-review-http','consent_version':None})
  self.call('/api/simulate',{'order_id':o['id'],'state':'paid'},o['access_token'])
  self.server.checkout.debit('a'*32,100,'spent-test-balance')
  state=self.call('/api/simulate',{'order_id':o['id'],'state':'refunded'},o['access_token'])
  self.assertEqual(state['state'],'refunded');self.assertEqual(state['balance_minor'],0)
  receipt=self.call('/api/orders/'+o['id']+'/receipt',token=o['access_token'])
  self.assertEqual(receipt['refund_recovery'],{'status':'pending_review','amount':100})
  with self.assertRaises(urllib.error.HTTPError):self.call('/api/recover-refund',{'order_id':o['id']},o['access_token'])
