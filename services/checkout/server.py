"""Run with python3 services/checkout/server.py; loopback-only mock API and preview."""
import argparse, json, os, posixpath, secrets, sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse, unquote
from core import Checkout, CheckoutError
ROOT=Path(__file__).resolve().parents[2]
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
 def log_message(self,*args):pass
 def end_headers(self):
  self.send_header('Cache-Control','no-store');self.send_header('X-Content-Type-Options','nosniff');self.send_header('Referrer-Policy','no-referrer');super().end_headers()
 def json_response(self,status,data):
  raw=json.dumps(data).encode();self.send_response(status);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(raw)));self.end_headers();self.wfile.write(raw)
 def do_GET(self):
  if self.path=='/api/catalog':return self.json_response(200,{'mode':'demonstration','offers':__import__('core').CATALOG})
  if self.path.startswith('/api/orders/'):
   try:
    parts=urlparse(self.path).path.strip('/').split('/')
    if len(parts) not in (3,4) or (len(parts)==4 and parts[3]!='receipt'):return self.json_response(404,{'error':'Unknown order operation'})
    order=self.server.checkout.read(parts[2],self.headers.get('Authorization','').removeprefix('Bearer '))
    if len(parts)==4:
     if not order['receipt']:return self.json_response(409,{'error':'Receipt not issued for this order state'})
     return self.json_response(200,{'mode':'demonstration','order_id':order['id'],'reference':order['receipt'],'state':order['state'],'label':order['label'],'amount':order['amount'],'currency':order['currency'],'membership':order['membership'],'notice':'No real money or products changed hands.'})
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
   if self.path=='/api/orders':
    if set(data)!={'app','sku','request_key','consent_version'}:raise CheckoutError('Only approved application, offer and request key are accepted')
    account=self.headers.get('X-Demo-Account','')
    if len(account)!=32 or any(c not in '0123456789abcdef' for c in account):raise CheckoutError('Invalid local demo account')
    return self.json_response(201,self.server.checkout.create(data['app'],data['sku'],account,data['request_key'],data['consent_version']))
   if self.path=='/api/simulate' and set(data)=={'order_id','state'}:return self.json_response(200,self.server.checkout.simulate(data['order_id'],token,data['state']))
   return self.json_response(404,{'error':'Unknown demonstration operation'})
  except (CheckoutError,ValueError,KeyError,TypeError) as e:return self.json_response(400,{'error':str(e)})
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=4180);parser.add_argument('--db',default=str(Path.home()/'.local/state/1age/checkout-demo.sqlite3'));args=parser.parse_args()
 Path(args.db).parent.mkdir(parents=True,exist_ok=True)
 server=ThreadingHTTPServer(('127.0.0.1',args.port),Handler);server.allowed_hosts={f'127.0.0.1:{args.port}',f'localhost:{args.port}'};server.checkout=Checkout(args.db)
 print(f'Nonfinancial demonstration: http://127.0.0.1:{args.port}/experiences/checkout/',flush=True);server.serve_forever()
