"""Local-only, nonfinancial checkout prototype. Never contacts a payment provider."""
import hashlib, hmac, json, os, secrets, sqlite3, time, uuid
from contextlib import contextmanager
from pathlib import Path

CATALOG = {
 'store-demo': dict(app='store', label='Showroom checkout demonstration', amount=0, currency='USD', kind='demo', terms='No product, charge, tax, shipping or fulfillment. Nonfinancial demonstration.'),
 'plus-demo': dict(app='plus', label='1AGE Plus membership demonstration', amount=199, currency='USD', kind='subscription', terms='Proposed $1.99 USD per month, recurring until cancelled. Demonstration only; no enrollment or billing.'),
 'cash-demo': dict(app='cash', label='1AGE Cash credit demonstration', amount=100, currency='USD', kind='credits', terms='Demonstrates 1 internal Cash credit at a $1 accounting reference. No redemption, transfer or cash-out. Sales disabled pending review.')
}
RETURNS={'store':'/experiences/store/','plus':'/experiences/checkout/?app=plus','cash':'/experiences/checkout/?app=cash'}
class CheckoutError(ValueError): pass
class MockAdapter:
 name='mock'
 def __init__(self, secret=None): self.secret=secret or secrets.token_bytes(32)
 def create_session(self, order_id): return 'mock_'+order_id
 def sign(self, body, stamp=None):
  stamp=int(time.time()) if stamp is None else stamp
  return str(stamp)+'.'+hmac.new(self.secret,str(stamp).encode()+b'.'+body,hashlib.sha256).hexdigest()
 def verify(self, body, signature):
  try: stamp,digest=signature.split('.',1); stamp=int(stamp)
  except (ValueError,AttributeError): raise CheckoutError('Invalid webhook signature')
  if abs(time.time()-stamp)>300 or not hmac.compare_digest(self.sign(body,stamp),signature): raise CheckoutError('Invalid or expired webhook signature')
  return json.loads(body)
class Checkout:
 def __init__(self, db, adapter=None):
  self.db=str(db)
  if adapter is None:
   key_path=Path(self.db+'.mock-key');key_path.parent.mkdir(parents=True,exist_ok=True)
   try:
    fd=os.open(key_path,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
    with os.fdopen(fd,'wb') as key_file:key_file.write(secrets.token_bytes(32))
   except FileExistsError:pass
   adapter=MockAdapter(key_path.read_bytes())
  self.adapter=adapter
  with self.connect() as c:
   if c.execute("SELECT name FROM sqlite_master WHERE name='orders'").fetchone() and not c.execute("SELECT name FROM sqlite_master WHERE name='refund_recovery'").fetchone():
    backup_path=Path(self.db+'.before-refund-recovery-'+uuid.uuid4().hex[:8]+'.sqlite3')
    with sqlite3.connect(backup_path) as backup:c.backup(backup)
    backup_path.chmod(0o600)
   c.executescript('''PRAGMA journal_mode=WAL;
   CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY, token_hash TEXT, account TEXT, app TEXT, sku TEXT, amount INTEGER, currency TEXT, kind TEXT, label TEXT, terms TEXT, state TEXT, session TEXT UNIQUE, created INTEGER);
   CREATE TABLE IF NOT EXISTS events(id TEXT PRIMARY KEY, order_id TEXT, state TEXT, created INTEGER);
   CREATE TABLE IF NOT EXISTS ledger(id TEXT PRIMARY KEY, account TEXT, order_id TEXT, delta INTEGER, reason TEXT, UNIQUE(order_id,reason));
   CREATE TABLE IF NOT EXISTS memberships(order_id TEXT PRIMARY KEY, account TEXT, status TEXT);
   CREATE TABLE IF NOT EXISTS fulfillment(order_id TEXT, kind TEXT, state TEXT, PRIMARY KEY(order_id,kind));
   CREATE TABLE IF NOT EXISTS refund_recovery(order_id TEXT PRIMARY KEY, account TEXT NOT NULL, amount INTEGER NOT NULL CHECK(amount>0), status TEXT NOT NULL CHECK(status IN ('pending_review','recovered')), created INTEGER NOT NULL, recovered INTEGER);
   CREATE INDEX IF NOT EXISTS refund_recovery_account ON refund_recovery(account,status);''')
 @contextmanager
 def connect(self):
  c=sqlite3.connect(self.db,timeout=10);c.row_factory=sqlite3.Row
  try:
   yield c;c.commit()
  except Exception:
   c.rollback();raise
  finally:c.close()
 def create(self, app, sku, account, request_key, consent_version=None):
  item=CATALOG.get(sku)
  if not item or item['app']!=app: raise CheckoutError('Application and offer do not match')
  if app=='plus' and consent_version!='plus-demo-v2':raise CheckoutError('Recurring terms consent required for this demonstration')
  if not isinstance(request_key,str) or not 8<=len(request_key)<=100: raise CheckoutError('Invalid request key')
  # Deterministic order capability makes creation retries idempotent within a demo account.
  token=hmac.new(self.adapter.secret,(account+':'+request_key).encode(),hashlib.sha256).hexdigest()
  oid='demo_'+hashlib.sha256((account+':'+request_key).encode()).hexdigest()[:24]
  with self.connect() as c:
   c.execute('BEGIN IMMEDIATE')
   row=c.execute('SELECT * FROM orders WHERE id=?',(oid,)).fetchone()
   if row and (row['app']!=app or row['sku']!=sku): raise CheckoutError('Request key already used for another offer')
   if not row:
    c.execute('INSERT INTO orders VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',(oid,hashlib.sha256(token.encode()).hexdigest(),account,app,sku,item['amount'],item['currency'],item['kind'],item['label'],item['terms'],'pending',self.adapter.create_session(oid),int(time.time())))
  return self.read(oid,token)|{'access_token':token}
 def read(self, oid, token):
  with self.connect() as c:
   row=c.execute('SELECT * FROM orders WHERE id=?',(oid,)).fetchone()
   if not row or not hmac.compare_digest(row['token_hash'],hashlib.sha256(token.encode()).hexdigest()): raise CheckoutError('Order access denied')
   result={k:row[k] for k in ('id','app','sku','amount','currency','kind','label','terms','state','session','created')}
   result.update(mode='demonstration',provider='mock',return_path=RETURNS[row['app']],receipt='DEMO-RECEIPT-'+oid if row['state'] in ('paid','refunded') else None)
   result['balance_minor']=c.execute('SELECT COALESCE(SUM(delta),0) FROM ledger WHERE account=?',(row['account'],)).fetchone()[0]
   member=c.execute('SELECT status FROM memberships WHERE order_id=?',(oid,)).fetchone()
   result['membership']=member[0] if member else 'inactive'
   recovery=c.execute('SELECT status,amount FROM refund_recovery WHERE order_id=?',(oid,)).fetchone()
   result['refund_recovery']=dict(recovery) if recovery else None
   return result
 def webhook(self, body, signature):
  event=self.adapter.verify(body,signature)
  required={'event_id','order_id','session','amount','currency','state'}
  if not isinstance(event,dict) or set(event)!=required or type(event.get('amount')) is not int or any(not isinstance(event.get(k),str) or not 1<=len(event[k])<=160 for k in ('event_id','order_id','session','currency','state')) or event['state'] not in ('pending','paid','failed','cancelled','refunded','subscription_cancelled'): raise CheckoutError('Invalid event')
  with self.connect() as c:
   c.execute('BEGIN IMMEDIATE')
   row=c.execute('SELECT * FROM orders WHERE id=?',(event['order_id'],)).fetchone()
   if not row or event['session']!=row['session'] or event['amount']!=row['amount'] or event['currency']!=row['currency']: raise CheckoutError('Provider event does not match order')
   seen=c.execute('SELECT order_id,state FROM events WHERE id=?',(event['event_id'],)).fetchone()
   if seen:
    if tuple(seen)!=(row['id'],event['state']): raise CheckoutError('Conflicting event identifier')
    return {'duplicate':True}
   state=event['state'];old=row['state'];oid=row['id'];account=row['account']
   if state=='subscription_cancelled':
    if row['kind']!='subscription' or old!='paid': raise CheckoutError('No active paid subscription')
    c.execute('UPDATE memberships SET status=? WHERE order_id=?',('cancelled',oid))
   else:
    allowed={'pending':{'pending','paid','failed','cancelled'},'paid':{'paid','refunded'},'failed':{'failed'},'cancelled':{'cancelled'},'refunded':{'refunded'}}
    if state not in allowed[old]: raise CheckoutError('Invalid payment state transition')
    if state=='paid':
     if row['kind']=='credits': c.execute('INSERT OR IGNORE INTO ledger VALUES(?,?,?,?,?)',(uuid.uuid4().hex,account,oid,100,'verified-demo-grant'))
     if row['kind']=='subscription': c.execute('INSERT OR IGNORE INTO memberships VALUES(?,?,?)',(oid,account,'active'))
     c.execute('INSERT OR IGNORE INTO fulfillment VALUES(?,?,?)',(oid,row['kind'],'demo-only'))
    if state=='refunded' and old!='refunded':
     if row['kind']=='credits':
      balance=c.execute('SELECT COALESCE(SUM(delta),0) FROM ledger WHERE account=?',(account,)).fetchone()[0]
      recovered=balance>=100
      if recovered:c.execute('INSERT INTO ledger VALUES(?,?,?,?,?)',(uuid.uuid4().hex,account,oid,-100,'demo-refund'))
      c.execute('INSERT INTO refund_recovery VALUES(?,?,?,?,?,?)',(oid,account,100,'recovered' if recovered else 'pending_review',int(time.time()),int(time.time()) if recovered else None))
     c.execute('UPDATE memberships SET status=? WHERE order_id=?',('inactive',oid))
     c.execute('UPDATE fulfillment SET state=? WHERE order_id=?',('reversed',oid))
    c.execute('UPDATE orders SET state=? WHERE id=?',(state,oid))
   c.execute('INSERT INTO events VALUES(?,?,?,?)',(event['event_id'],oid,state,int(time.time())))
  return {'duplicate':False}
 def recover_refund(self,oid):
  """Explicit trusted TEST-operator action; never called automatically or via HTTP."""
  with self.connect() as c:
   c.execute('BEGIN IMMEDIATE')
   row=c.execute('SELECT r.*,o.state FROM refund_recovery r JOIN orders o ON o.id=r.order_id AND o.account=r.account WHERE r.order_id=?',(oid,)).fetchone()
   if not row or row['state']!='refunded':raise CheckoutError('Unknown refunded credit order')
   if row['status']=='recovered':return {'status':'recovered','duplicate':True}
   balance=c.execute('SELECT COALESCE(SUM(delta),0) FROM ledger WHERE account=?',(row['account'],)).fetchone()[0]
   if balance<row['amount']:return {'status':'pending_review','duplicate':False}
   c.execute('INSERT INTO ledger VALUES(?,?,?,?,?)',(uuid.uuid4().hex,row['account'],oid,-row['amount'],'demo-refund'))
   c.execute('UPDATE refund_recovery SET status=?,recovered=? WHERE order_id=?',('recovered',int(time.time()),oid))
   return {'status':'recovered','duplicate':False}
 def simulate(self, oid, token, state):
  order=self.read(oid,token)
  event={k:order[k] for k in ('session','amount','currency')};event.update(event_id=uuid.uuid4().hex,order_id=oid,state=state)
  body=json.dumps(event,separators=(',',':')).encode();self.webhook(body,self.adapter.sign(body));return self.read(oid,token)
 def debit(self, account, amount, key):
  if type(amount) is not int or amount<=0: raise CheckoutError('Invalid debit')
  with self.connect() as c:
   c.execute('BEGIN IMMEDIATE');existing=c.execute('SELECT * FROM ledger WHERE order_id=? AND reason=?',(key,'demo-spend')).fetchone()
   if existing:
    if existing['account']!=account or existing['delta']!=-amount: raise CheckoutError('Debit key conflict')
    return
   balance=c.execute('SELECT COALESCE(SUM(delta),0) FROM ledger WHERE account=?',(account,)).fetchone()[0]
   if balance<amount: raise CheckoutError('Insufficient demo credits')
   c.execute('INSERT INTO ledger VALUES(?,?,?,?,?)',(uuid.uuid4().hex,account,key,-amount,'demo-spend'))
