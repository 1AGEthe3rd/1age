"""Local-test Page identity foundation. Not an OIDC provider or production SSO."""
import os,base64,hashlib,hmac,re,secrets,time,sqlite3,uuid
from urllib.parse import urlsplit
from core import CheckoutError

def digest(value):return hashlib.sha256(value.encode()).hexdigest()
def challenge(verifier):return base64.urlsafe_b64encode(hashlib.sha256(verifier.encode('ascii')).digest()).rstrip(b'=').decode()
class PageIdentity:
 def __init__(self,accounts,clients):
  self.accounts=accounts;self.checkout=accounts.checkout;self.clients=dict(clients)
  for client,url in self.clients.items():
   u=urlsplit(url)
   if not re.fullmatch('[a-z][a-z0-9-]{1,39}',client) or u.scheme!='http' or u.hostname!='127.0.0.1' or not u.port or u.query or u.fragment or u.username or u.path!='/callback':raise CheckoutError('Only explicit loopback test clients are supported')
  with self.checkout.connect() as c:
   if not c.execute("SELECT name FROM sqlite_master WHERE name='page_profiles'").fetchone():
    path=self.checkout.db+'.before-page-'+uuid.uuid4().hex[:8]+'.sqlite3'
    fd=os.open(path,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600);os.close(fd)
    with sqlite3.connect(path) as backup:c.backup(backup)
   c.executescript('''CREATE TABLE IF NOT EXISTS page_profiles(account TEXT PRIMARY KEY,display_name TEXT NOT NULL,bio TEXT NOT NULL DEFAULT '',discoverable INTEGER NOT NULL DEFAULT 0 CHECK(discoverable IN (0,1)));
    CREATE TABLE IF NOT EXISTS page_codes(hash TEXT PRIMARY KEY,account TEXT NOT NULL,parent_session TEXT NOT NULL,client TEXT NOT NULL,redirect TEXT NOT NULL,challenge TEXT NOT NULL,expires INTEGER NOT NULL,used INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS page_tokens(hash TEXT PRIMARY KEY,account TEXT NOT NULL,parent_session TEXT NOT NULL,client TEXT NOT NULL,expires INTEGER NOT NULL);''')
 def profile(self,token):
  aid=self.accounts.account(token)
  with self.checkout.connect() as c:row=c.execute('SELECT * FROM page_profiles WHERE account=?',(aid['id'],)).fetchone()
  return {'mode':'local-test','subject':aid['id'],'handle':aid['handle'],'display_name':row['display_name'] if row else aid['handle'],'bio':row['bio'] if row else '', 'discoverable':bool(row['discoverable']) if row else False,'avatar':None}
 def update_profile(self,token,data):
  if not isinstance(data,dict) or set(data)!={'display_name','bio','discoverable'} or not isinstance(data['display_name'],str) or not 1<=len(data['display_name'].strip())<=60 or not isinstance(data['bio'],str) or len(data['bio'])>500 or type(data['discoverable'])is not bool:raise CheckoutError('Only display name, bio and opt-in discoverability accepted')
  aid=self.accounts.account(token)
  with self.checkout.connect() as c:c.execute('INSERT INTO page_profiles VALUES(?,?,?,?) ON CONFLICT(account) DO UPDATE SET display_name=excluded.display_name,bio=excluded.bio,discoverable=excluded.discoverable',(aid['id'],data['display_name'].strip(),data['bio'],int(data['discoverable'])))
  return self.profile(token)
 def public_profile(self,handle):
  if not isinstance(handle,str) or not re.fullmatch('[a-zA-Z0-9_-]{3,40}',handle):raise CheckoutError('Profile unavailable')
  with self.checkout.connect() as c:row=c.execute('SELECT a.id,a.handle,p.display_name,p.bio FROM cash_accounts a JOIN page_profiles p ON p.account=a.id WHERE a.handle=? AND p.discoverable=1',(handle.lower(),)).fetchone()
  if not row:raise CheckoutError('Profile unavailable')
  return {'mode':'local-test','subject':row['id'],'handle':row['handle'],'display_name':row['display_name'],'bio':row['bio'],'avatar':None}
 def authorize(self,token,client,redirect,code_challenge,state,method='S256'):
  if self.clients.get(client)!=redirect or method!='S256' or not isinstance(code_challenge,str) or not re.fullmatch('[A-Za-z0-9_-]{43}',code_challenge) or not isinstance(state,str) or not 16<=len(state)<=128:raise CheckoutError('Invalid client, redirect, PKCE or state')
  aid=self.accounts.account(token);code=secrets.token_urlsafe(32)
  with self.checkout.connect() as c:c.execute('INSERT INTO page_codes VALUES(?,?,?,?,?,?,?,0)',(digest(code),aid['id'],digest(token),client,redirect,code_challenge,int(time.time())+90))
  return {'mode':'local-test','code':code,'state':state,'redirect_uri':redirect,'expires_in':90}
 def exchange(self,code,client,redirect,verifier):
  if not isinstance(code,str) or not 20<=len(code)<=128 or not isinstance(verifier,str) or not re.fullmatch('[A-Za-z0-9._~-]{43,128}',verifier) or self.clients.get(client)!=redirect:raise CheckoutError('Invalid code exchange')
  with self.checkout.connect() as c:
   c.execute('BEGIN IMMEDIATE');row=c.execute('SELECT g.* FROM page_codes g JOIN cash_sessions s ON s.token_hash=g.parent_session AND s.account=g.account WHERE g.hash=? AND g.used=0 AND g.expires>? AND s.expires>?',(digest(code),int(time.time()),int(time.time()))).fetchone()
   if not row or row['client']!=client or row['redirect']!=redirect or not hmac.compare_digest(row['challenge'],challenge(verifier)):raise CheckoutError('Code expired, used or not bound to this request')
   token=secrets.token_urlsafe(32);expires=int(time.time())+900
   c.execute('UPDATE page_codes SET used=1 WHERE hash=?',(digest(code),));c.execute('INSERT INTO page_tokens VALUES(?,?,?,?,?)',(digest(token),row['account'],row['parent_session'],client,expires))
  return {'mode':'local-test','access_token':token,'token_type':'Bearer','expires_in':900,'audience':client,'scope':'identity:read'}
 def userinfo(self,token,client):
  if not isinstance(token,str) or not 20<=len(token)<=128 or client not in self.clients:raise CheckoutError('Identity access denied')
  with self.checkout.connect() as c:
   row=c.execute('SELECT a.id,a.handle FROM page_tokens t JOIN cash_accounts a ON a.id=t.account JOIN cash_sessions s ON s.token_hash=t.parent_session AND s.account=t.account WHERE t.hash=? AND t.client=? AND t.expires>? AND s.expires>?',(digest(token),client,int(time.time()),int(time.time()))).fetchone()
   if not row:raise CheckoutError('Identity access denied')
   profile=c.execute('SELECT display_name,bio FROM page_profiles WHERE account=?',(row['id'],)).fetchone()
  return {'mode':'local-test','subject':row['id'],'handle':row['handle'],'display_name':profile['display_name'] if profile else row['handle'],'bio':profile['bio'] if profile else '', 'avatar':None,'audience':client,'scope':'identity:read'}
