"""Run with python3 services/checkout/server.py; loopback-only mock API and preview."""
import argparse, json, os, posixpath, secrets, sys, time, threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse, unquote
from core import Checkout, CheckoutError
from accounts import Accounts
from page_identity import PageIdentity
ROOT=Path(__file__).resolve().parents[2]
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
 def log_message(self,*args):pass
 def end_headers(self):
  self.send_header('Cache-Control','no-store');self.send_header('X-Content-Type-Options','nosniff');self.send_header('Referrer-Policy','no-referrer');super().end_headers()
 def json_response(self,status,data):
  raw=json.dumps(data).encode();self.send_response(status);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(raw)));self.end_headers();self.wfile.write(raw)
 def do_GET(self):
  if self.headers.get('Host','') not in self.server.allowed_hosts:return self.json_response(403,{'error':'Host denied'})
  if urlparse(self.path).path.startswith('/api/page/'):
   from urllib.parse import parse_qs
   path=urlparse(self.path);q=parse_qs(path.query,keep_blank_values=True);identity=getattr(self.server,'page_identity',None)
   if not identity:return self.json_response(503,{'error':'Local Page identity is not enabled'})
   try:
    if any(len(v)!=1 for v in q.values()):raise CheckoutError('Invalid query')
    token=self.headers.get('Authorization','').removeprefix('Bearer ')
    if path.path=='/api/page/profile' and not q:return self.json_response(200,identity.profile(token))
    if path.path=='/api/page/userinfo' and set(q)=={'client_id'}:return self.json_response(200,identity.userinfo(token,q['client_id'][0]))
    if path.path=='/api/page/public' and set(q)=={'handle'}:
     try:return self.json_response(200,identity.public_profile(q['handle'][0]))
     except CheckoutError:return self.json_response(404,{'error':'Profile unavailable'})
    return self.json_response(400,{'error':'Invalid identity query'})
   except CheckoutError:return self.json_response(403,{'error':'Identity access denied'})
  if urlparse(self.path).path=='/api/accounts/entitlements':
   if urlparse(self.path).query:return self.json_response(400,{'error':'Entitlements take no client-supplied account or entitlement fields'})
   if not getattr(self.server,'accounts',None):return self.json_response(503,{'error':'Local test accounts are not enabled'})
   try:return self.json_response(200,self.server.accounts.entitlements(self.headers.get('Authorization','').removeprefix('Bearer ')))
   except CheckoutError:return self.json_response(403,{'error':'Valid local test session required'})
  if self.path.startswith('/api/cash/'):
   try:
    if not getattr(self.server,'accounts',None):return self.json_response(503,{'error':'Local Cash test backend is not enabled'})
    from urllib.parse import parse_qs
    path=urlparse(self.path)
    if path.path!='/api/cash/account':return self.json_response(404,{'error':'Unknown Cash operation'})
    query=parse_qs(path.query)
    return self.json_response(200,self.server.accounts.summary(self.headers.get('Authorization','').removeprefix('Bearer '),int(query.get('offset',['0'])[0])))
   except (CheckoutError,ValueError):return self.json_response(403,{'error':'Sign in again or check the history page'})
  if self.path=='/api/catalog':return self.json_response(200,{'mode':'demonstration','offers':__import__('core').CATALOG})
  if self.path.startswith('/api/orders/'):
   try:
    parts=urlparse(self.path).path.strip('/').split('/')
    if len(parts) not in (3,4) or (len(parts)==4 and parts[3]!='receipt'):return self.json_response(404,{'error':'Unknown order operation'})
    order=self.server.checkout.read(parts[2],self.headers.get('Authorization','').removeprefix('Bearer '))
    if len(parts)==4:
     if not order['receipt']:return self.json_response(409,{'error':'Receipt not issued for this order state'})
     return self.json_response(200,{'mode':'demonstration','order_id':order['id'],'reference':order['receipt'],'state':order['state'],'label':order['label'],'amount':order['amount'],'currency':order['currency'],'membership':order['membership'],'refund_recovery':order['refund_recovery'],'notice':'No real money or products changed hands.'})
    return self.json_response(200,order)
   except CheckoutError as e:return self.json_response(403,{'error':str(e)})
  # Static preview must never expose service source, runtime databases, or repository metadata.
  if not posixpath.normpath(unquote(urlparse(self.path).path)).startswith(('/experiences/','/assets/')):return self.send_error(404)
  return super().do_GET()
 def do_POST(self):
  try:
   origin=self.headers.get('Origin');host=self.headers.get('Host','')
   if host not in self.server.allowed_hosts: return self.json_response(403,{'error':'Host denied'})
   if origin and urlparse(origin).netloc not in self.server.allowed_hosts:return self.json_response(403,{'error':'Cross-origin writes disabled in local demo'})
   length=int(self.headers.get('Content-Length','0'))
   if length<1 or length>8192:raise CheckoutError('Invalid body size')
   raw=self.rfile.read(length)
   if self.path=='/api/webhooks/mock':
    return self.json_response(200,self.server.checkout.webhook(raw,self.headers.get('X-Mock-Signature','')))
   data=json.loads(raw)
   token=self.headers.get('Authorization','').removeprefix('Bearer ')
   if self.path.startswith('/api/page/'):
    identity=getattr(self.server,'page_identity',None)
    if not identity:return self.json_response(503,{'error':'Local Page identity is not enabled'})
    if not isinstance(data,dict):raise CheckoutError('Invalid identity body')
    if self.path=='/api/page/profile':return self.json_response(200,identity.update_profile(token,data))
    if self.path=='/api/page/authorize' and set(data)=={'client_id','redirect_uri','code_challenge','state','method'}:return self.json_response(200,identity.authorize(token,data['client_id'],data['redirect_uri'],data['code_challenge'],data['state'],data['method']))
    if self.path=='/api/page/token' and set(data)=={'code','client_id','redirect_uri','verifier'}:return self.json_response(200,identity.exchange(data['code'],data['client_id'],data['redirect_uri'],data['verifier']))
    raise CheckoutError('Invalid identity operation')
   if self.path.startswith('/api/cash/'):
    accounts=getattr(self.server,'accounts',None)
    if not accounts:return self.json_response(503,{'error':'Local Cash test backend is not enabled'})
    if self.path in ('/api/cash/register','/api/cash/login'):
     if set(data)!={'handle','password'}:raise CheckoutError('Only test handle and password accepted')
     with self.server.auth_lock:
      now=time.monotonic();self.server.auth_attempts=[t for t in self.server.auth_attempts if now-t<60]
      if len(self.server.auth_attempts)>=10:return self.json_response(429,{'error':'Wait before trying test sign-in again'})
      self.server.auth_attempts.append(now)
     method=accounts.register if self.path.endswith('register') else accounts.login
     return self.json_response(200,method(data['handle'],data['password']))
    accounts.account(token)
    if self.path=='/api/cash/logout' and data=={}:
     accounts.logout(token);return self.json_response(200,{'signed_out':True})
    if self.path=='/api/cash/orders' and set(data)=={'app','sku','request_key','consent_version'}:
     return self.json_response(201,accounts.create_order(token,data['app'],data['sku'],data['request_key'],data['consent_version']))
    if self.path=='/api/cash/simulate' and set(data)=={'order_id','order_token','state'}:
     accounts.owned_order(token,data['order_id'])
     return self.json_response(200,self.server.checkout.simulate(data['order_id'],data['order_token'],data['state']))
    raise CheckoutError('Unknown test account operation')
   if self.path=='/api/orders':
    if set(data)!={'app','sku','request_key','consent_version'}:raise CheckoutError('Only approved application, offer and request key are accepted')
    account=self.headers.get('X-Demo-Account','')
    if len(account)!=32 or any(c not in '0123456789abcdef' for c in account):raise CheckoutError('Invalid local demo account')
    return self.json_response(201,self.server.checkout.create(data['app'],data['sku'],account,data['request_key'],data['consent_version']))
   if self.path=='/api/simulate' and set(data)=={'order_id','state'}:return self.json_response(200,self.server.checkout.simulate(data['order_id'],token,data['state']))
   return self.json_response(404,{'error':'Unknown demonstration operation'})
  except (CheckoutError,ValueError,KeyError,TypeError) as e:return self.json_response(400,{'error':str(e)})
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=4180);parser.add_argument('--page-identity',action='store_true',help='Enable local Page identity protocol tests');parser.add_argument('--cash-accounts',action='store_true',help='Enable local disposable test accounts only');parser.add_argument('--db',default=str(Path.home()/'.local/state/1age/checkout-demo.sqlite3'));args=parser.parse_args()
 if args.page_identity and not args.cash_accounts:parser.error('--page-identity requires --cash-accounts')
 Path(args.db).parent.mkdir(parents=True,exist_ok=True)
 server=ThreadingHTTPServer(('127.0.0.1',args.port),Handler);server.allowed_hosts={f'127.0.0.1:{args.port}',f'localhost:{args.port}'};server.checkout=Checkout(args.db)
 Path(args.db).chmod(0o600)
 server.accounts=Accounts(server.checkout) if args.cash_accounts else None;server.auth_lock=threading.Lock();server.auth_attempts=[]
 server.page_identity=PageIdentity(server.accounts,{app:f'http://127.0.0.1:{port}/callback' for app,port in [('page',4191),('exchange',4192),('games',4193),('space',4194)]}) if args.page_identity else None
 print(f'Nonfinancial demonstration: http://127.0.0.1:{args.port}/experiences/checkout/',flush=True);server.serve_forever()
