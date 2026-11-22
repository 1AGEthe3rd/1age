"""Authenticated LOCAL TEST accounts over the existing checkout ledger.
Not a production identity service. No external payment or money issuance.
"""
import hashlib, hmac, re, secrets, sqlite3, time, uuid
from pathlib import Path
from core import CheckoutError

class Accounts:
 def __init__(self, checkout):
  self.checkout=checkout
  # A consistent SQLite backup protects existing orders and ledger before migration.
  with checkout.connect() as c:
   exists=c.execute("SELECT name FROM sqlite_master WHERE name='cash_accounts'").fetchone()
   if not exists:
    path=Path(checkout.db+'.before-cash-accounts-'+uuid.uuid4().hex[:8]+'.sqlite3')
    with sqlite3.connect(path) as backup:c.backup(backup)
    path.chmod(0o600)
   c.executescript('''
    CREATE TABLE IF NOT EXISTS cash_accounts(id TEXT PRIMARY KEY, handle TEXT UNIQUE NOT NULL, salt BLOB NOT NULL, password_hash BLOB NOT NULL, created INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS cash_sessions(token_hash TEXT PRIMARY KEY, account TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS cash_ledger_times(ledger_id TEXT PRIMARY KEY, created INTEGER NOT NULL, estimated INTEGER NOT NULL DEFAULT 0);
    CREATE TRIGGER IF NOT EXISTS cash_ledger_time AFTER INSERT ON ledger BEGIN
      INSERT INTO cash_ledger_times VALUES(NEW.id,unixepoch(),0);
    END;
    CREATE TRIGGER IF NOT EXISTS cash_no_negative BEFORE INSERT ON ledger WHEN
      (SELECT COALESCE(SUM(delta),0) FROM ledger WHERE account=NEW.account)+NEW.delta<0 BEGIN
      SELECT RAISE(ABORT,'Insufficient test credits');
    END;
    CREATE TRIGGER IF NOT EXISTS cash_no_update BEFORE UPDATE ON ledger BEGIN SELECT RAISE(ABORT,'Ledger is append only'); END;
    CREATE TRIGGER IF NOT EXISTS cash_no_delete BEFORE DELETE ON ledger BEGIN SELECT RAISE(ABORT,'Ledger is append only'); END;
    CREATE INDEX IF NOT EXISTS cash_ledger_account ON ledger(account);
    CREATE INDEX IF NOT EXISTS cash_session_account ON cash_sessions(account);
   ''')
   # Legacy entries have no timestamp: label estimates rather than invent precision.
   c.execute('INSERT OR IGNORE INTO cash_ledger_times SELECT l.id,COALESCE(o.created,unixepoch()),1 FROM ledger l LEFT JOIN orders o ON o.id=l.order_id')
 @staticmethod
 def password_hash(password,salt):
  if not isinstance(password,str) or not 12<=len(password)<=128:raise CheckoutError('Use a test password between 12 and 128 characters')
  return hashlib.scrypt(password.encode(),salt=salt,n=32768,r=8,p=3,maxmem=64*1024*1024,dklen=32)
 def register(self,handle,password):
  if not isinstance(handle,str) or not re.fullmatch('[a-zA-Z0-9_-]{3,40}',handle):raise CheckoutError('Test handle must contain 3–40 letters, digits, underscores or hyphens')
  salt=secrets.token_bytes(16);digest=self.password_hash(password,salt);aid='test_'+uuid.uuid4().hex
  try:
   with self.checkout.connect() as c:c.execute('INSERT INTO cash_accounts VALUES(?,?,?,?,?)',(aid,handle.lower(),salt,digest,int(time.time())))
  except sqlite3.IntegrityError:raise CheckoutError('Test account could not be created') from None
  return self.login(handle,password)
 def login(self,handle,password):
  if not isinstance(handle,str):raise CheckoutError('Invalid test credentials')
  with self.checkout.connect() as c:row=c.execute('SELECT * FROM cash_accounts WHERE handle=?',(handle.lower(),)).fetchone()
  digest=self.password_hash(password,row['salt'] if row else bytes(16))
  if not row or not hmac.compare_digest(row['password_hash'],digest):raise CheckoutError('Invalid test credentials')
  token=secrets.token_urlsafe(32);expires=int(time.time())+3600
  with self.checkout.connect() as c:c.execute('INSERT INTO cash_sessions VALUES(?,?,?)',(hashlib.sha256(token.encode()).hexdigest(),row['id'],expires))
  return dict(mode='local-test',session_token=token,expires=expires,handle=row['handle'])
 def account(self,token):
  if not isinstance(token,str) or not 20<=len(token)<=128:raise CheckoutError('Sign in to a local test account')
  with self.checkout.connect() as c:
   row=c.execute('SELECT a.id,a.handle FROM cash_sessions s JOIN cash_accounts a ON a.id=s.account WHERE s.token_hash=? AND s.expires>?',(hashlib.sha256(token.encode()).hexdigest(),int(time.time()))).fetchone()
  if not row:raise CheckoutError('Local test session expired or invalid')
  return dict(row)
 def logout(self,token):
  with self.checkout.connect() as c:c.execute('DELETE FROM cash_sessions WHERE token_hash=?',(hashlib.sha256(token.encode()).hexdigest(),))
 def summary(self,token,offset=0,limit=25):
  aid=self.account(token)
  if type(offset)is not int or type(limit)is not int or offset<0 or not 1<=limit<=100:raise CheckoutError('Invalid history page')
  with self.checkout.connect() as c:
   c.execute('BEGIN')
   balance=c.execute('SELECT COALESCE(SUM(delta),0) FROM ledger WHERE account=?',(aid['id'],)).fetchone()[0]
   rows=c.execute('SELECT l.id,l.delta,l.reason,l.order_id,t.created,t.estimated FROM ledger l JOIN cash_ledger_times t ON t.ledger_id=l.id WHERE l.account=? ORDER BY t.created DESC,l.rowid DESC LIMIT ? OFFSET ?',(aid['id'],limit+1,offset)).fetchall()
  return dict(mode='local-test',handle=aid['handle'],balance_minor=balance,unit='1AGE Cash test credits',transactions=[dict(r) for r in rows[:limit]],next_offset=offset+limit if len(rows)>limit else None)
 def entitlements(self,token):
  """Authenticated local-test entitlement contract; not real paid membership."""
  account=self.account(token)
  with self.checkout.connect() as c:
   c.execute('BEGIN')
   active=c.execute("SELECT COUNT(*) FROM memberships m JOIN orders o ON o.id=m.order_id AND o.account=m.account WHERE m.account=? AND m.status='active' AND o.state='paid' AND o.kind='subscription' AND o.app='plus'",(account['id'],)).fetchone()[0]
  return {'mode':'local-test','provider':'mock','subject':account['id'],'entitlements':{'plus':{'active':bool(active),'source':'verified mock events','live_membership':False}},'notice':'Test entitlement only. No real subscription, charge or exclusive benefits are activated.'}
 def create_order(self,token,app,sku,key,consent=None):
  return self.checkout.create(app,sku,self.account(token)['id'],key,consent)
 def owned_order(self,token,oid):
  aid=self.account(token)['id']
  with self.checkout.connect() as c:row=c.execute('SELECT account FROM orders WHERE id=?',(oid,)).fetchone()
  if not row or row['account']!=aid:raise CheckoutError('Order access denied')
 def earn(self,account,amount,key):
  """Trusted test-operator call only; deliberately NOT exposed through HTTP."""
  if type(amount)is not int or not 1<=amount<=1000000 or not isinstance(key,str) or not 8<=len(key)<=100:raise CheckoutError('Invalid test earning event')
  ref='earn:'+account+':'+key
  with self.checkout.connect() as c:
   c.execute('BEGIN IMMEDIATE')
   if not c.execute('SELECT id FROM cash_accounts WHERE id=?',(account,)).fetchone():raise CheckoutError('Unknown test account')
   prior=c.execute('SELECT delta FROM ledger WHERE order_id=? AND reason=?',(ref,'test-earning')).fetchone()
   if prior:
    if prior['delta']!=amount:raise CheckoutError('Earning key conflict')
    return
   c.execute('INSERT INTO ledger VALUES(?,?,?,?,?)',(uuid.uuid4().hex,account,ref,amount,'test-earning'))
 def reverse_spend(self,account,entry_id):
  """Trusted operator correction; append a compensating entry, never edit history."""
  with self.checkout.connect() as c:
   c.execute('BEGIN IMMEDIATE');entry=c.execute('SELECT * FROM ledger WHERE id=? AND account=? AND reason=?',(entry_id,account,'demo-spend')).fetchone()
   if not entry:raise CheckoutError('Unknown test spend')
   c.execute('INSERT OR IGNORE INTO ledger VALUES(?,?,?,?,?)',(uuid.uuid4().hex,account,'reverse:'+entry_id,-entry['delta'],'test-spend-reversal'))
 def reconcile(self,account):
  """Local operator report; no unauthenticated administrative HTTP route."""
  with self.checkout.connect() as c:
   c.execute('BEGIN')
   totals=c.execute('SELECT COALESCE(SUM(delta),0),COUNT(*) FROM ledger WHERE account=?',(account,)).fetchone()
   missing=c.execute('SELECT COUNT(*) FROM orders o LEFT JOIN ledger l ON l.order_id=o.id AND l.reason=? WHERE o.account=? AND o.kind=? AND o.state=? AND l.id IS NULL',('verified-demo-grant',account,'credits','paid')).fetchone()[0]
   recovery=c.execute("SELECT COUNT(*),COALESCE(SUM(amount),0) FROM refund_recovery WHERE account=? AND status='pending_review'",(account,)).fetchone()
   # Older refunded orders predate the recovery queue. An existing matching
   # reversal is accepted; otherwise flag the gap rather than inventing entries.
   unreconciled=c.execute("SELECT COUNT(*) FROM orders o WHERE o.account=? AND o.kind='credits' AND o.state='refunded' AND NOT EXISTS(SELECT 1 FROM ledger l WHERE l.order_id=o.id AND l.account=o.account AND l.reason='demo-refund' AND l.delta=-100) AND NOT EXISTS(SELECT 1 FROM refund_recovery r WHERE r.order_id=o.id AND r.account=o.account AND r.status='pending_review')",(account,)).fetchone()[0]
  return dict(mode='local-test',balance_minor=totals[0],entries=totals[1],paid_credit_orders_missing_grant=missing,refunds_pending_review=recovery[0],refund_recovery_minor=recovery[1],refunded_credit_orders_unreconciled=unreconciled)
