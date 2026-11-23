import json,secrets,sys,tempfile,threading,unittest,urllib.request,urllib.error
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'services/checkout'))
from server import Handler,ThreadingHTTPServer
from core import Checkout
from accounts import Accounts
from page_identity import PageIdentity,challenge
class CashHTTPTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.server=ThreadingHTTPServer(('127.0.0.1',0),Handler);self.host=f'127.0.0.1:{self.server.server_port}';self.server.allowed_hosts={self.host};self.server.checkout=Checkout(Path(self.tmp.name)/'test.sqlite3');self.server.accounts=Accounts(self.server.checkout);self.server.auth_lock=threading.Lock();self.server.auth_attempts=[];self.thread=threading.Thread(target=self.server.serve_forever,daemon=True);self.thread.start()
 def tearDown(self):self.server.shutdown();self.server.server_close();self.thread.join();self.tmp.cleanup()
 def call(self,path,data=None,token=None,origin=None):
  headers={'Content-Type':'application/json','X-Demo-Account':'a'*32}
  if token:headers['Authorization']='Bearer '+token
  if origin:headers['Origin']=origin
  request=urllib.request.Request('http://'+self.host+path,data=json.dumps(data).encode() if data is not None else None,headers=headers)
  with urllib.request.urlopen(request) as result:return json.load(result)
 def test_authenticated_flow_and_ownership(self):
  token=self.call('/api/cash/register',{'handle':'alice','password':secrets.token_urlsafe(24)})['session_token']
  other=self.call('/api/cash/register',{'handle':'other','password':secrets.token_urlsafe(24)})['session_token']
  with self.assertRaises(urllib.error.HTTPError):self.call('/api/cash/account')
  order=self.call('/api/cash/orders',{'app':'cash','sku':'cash-demo','request_key':'http-cash-001','consent_version':None},token)
  payload={'order_id':order['id'],'order_token':order['access_token'],'state':'paid'}
  with self.assertRaises(urllib.error.HTTPError):self.call('/api/cash/simulate',payload,other)
  self.call('/api/cash/simulate',payload,token);self.call('/api/cash/simulate',payload,token)
  self.assertEqual(self.call('/api/cash/account',token=token)['balance_minor'],100)
  self.assertEqual(self.call('/api/cash/account',token=other)['balance_minor'],0)
  for extra in [{'account':'another-user'},{'amount':1}]:
   with self.assertRaises(urllib.error.HTTPError):self.call('/api/cash/orders',{'app':'cash','sku':'cash-demo','request_key':'tamper-001','consent_version':None,**extra},token)
  self.call('/api/cash/logout',{},token)
  with self.assertRaises(urllib.error.HTTPError):self.call('/api/cash/account',token=token)
 def test_no_client_balance_edit_and_cross_origin(self):
  for path in ['earn','debit','balance','reconcile','recover-refund']:
   with self.assertRaises(urllib.error.HTTPError):self.call('/api/cash/'+path,{'balance_minor':99999})
  with self.assertRaises(urllib.error.HTTPError):self.call('/api/cash/register',{'handle':'alice','password':secrets.token_urlsafe(24)},origin='https://untrusted.example')
 def test_entitlement_contract_requires_session_and_server_identity(self):
  token=self.call('/api/cash/register',{'handle':'member','password':secrets.token_urlsafe(24)})['session_token']
  result=self.call('/api/accounts/entitlements',token=token)
  self.assertEqual(result['mode'],'local-test');self.assertFalse(result['entitlements']['plus']['active'])
  for path in ['/api/accounts/entitlements?account=someone','/api/accounts/entitlements?active=true']:
   with self.assertRaises(urllib.error.HTTPError) as e:self.call(path,token=token)
   self.assertEqual(e.exception.code,400)
  with self.assertRaises(urllib.error.HTTPError) as e:self.call('/api/accounts/entitlements')
  self.assertEqual(e.exception.code,403)
  self.call('/api/cash/logout',{},token)
  with self.assertRaises(urllib.error.HTTPError):self.call('/api/accounts/entitlements',token=token)
 def test_page_identity_http_profile_and_client_handoff(self):
  redirect='http://127.0.0.1:4193/callback';self.server.page_identity=PageIdentity(self.server.accounts,{'games':redirect})
  token=self.call('/api/cash/register',{'handle':'page-user','password':secrets.token_urlsafe(24)})['session_token']
  profile=self.call('/api/page/profile',{'display_name':'Page user','bio':'Builder','discoverable':False},token)
  with self.assertRaises(urllib.error.HTTPError) as e:self.call('/api/page/public?handle=page-user')
  self.assertEqual(e.exception.code,404)
  verifier='x'*43;grant=self.call('/api/page/authorize',{'client_id':'games','redirect_uri':redirect,'code_challenge':challenge(verifier),'state':'random-state-123456789','method':'S256'},token)
  access=self.call('/api/page/token',{'code':grant['code'],'client_id':'games','redirect_uri':redirect,'verifier':verifier})['access_token']
  self.assertEqual(self.call('/api/page/userinfo?client_id=games',token=access)['subject'],profile['subject'])
  with self.assertRaises(urllib.error.HTTPError):self.call('/api/cash/account',token=access)
  self.call('/api/cash/logout',{},token)
  with self.assertRaises(urllib.error.HTTPError):self.call('/api/page/userinfo?client_id=games',token=access)
 def test_registration_throttle(self):
  self.server.auth_attempts=[__import__('time').monotonic()]*10
  with self.assertRaises(urllib.error.HTTPError) as e:self.call('/api/cash/login',{'handle':'alice','password':secrets.token_urlsafe(24)})
  self.assertEqual(e.exception.code,429)
