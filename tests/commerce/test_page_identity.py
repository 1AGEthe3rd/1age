import concurrent.futures,sys,tempfile,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'services/checkout'))
from core import Checkout,CheckoutError
from accounts import Accounts
from page_identity import PageIdentity,challenge
class IdentityTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.accounts=Accounts(Checkout(Path(self.tmp.name)/'test.sqlite3'));self.session=self.accounts.register('alice','disposable-test-password')['session_token'];self.clients={'page':'http://127.0.0.1:4191/callback','games':'http://127.0.0.1:4193/callback'};self.identity=PageIdentity(self.accounts,self.clients);self.verifier='a'*43
 def code(self,client='page'):return self.identity.authorize(self.session,client,self.clients[client],challenge(self.verifier),'random-state-123456789')['code']
 def exchange(self,code,client='page',verifier=None):return self.identity.exchange(code,client,self.clients[client],verifier or self.verifier)['access_token']
 def test_same_subject_across_independent_clients_and_no_financial_access(self):
  a=self.exchange(self.code());b=self.exchange(self.code('games'),'games');self.assertEqual(self.identity.userinfo(a,'page')['subject'],self.identity.userinfo(b,'games')['subject'])
  with self.assertRaises(CheckoutError):self.identity.userinfo(a,'games')
  with self.assertRaises(CheckoutError):self.accounts.account(a)
 def test_redirect_pkce_replay_and_expiry(self):
  with self.assertRaises(CheckoutError):self.identity.authorize(self.session,'page',self.clients['page']+'?next=evil',challenge(self.verifier),'random-state-123456789')
  code=self.code()
  with self.assertRaises(CheckoutError):self.exchange(code,verifier='b'*43)
  self.exchange(code)
  with self.assertRaises(CheckoutError):self.exchange(code)
  code=self.code()
  with self.accounts.checkout.connect() as c:c.execute('UPDATE page_codes SET expires=0')
  with self.assertRaises(CheckoutError):self.exchange(code)
 def test_parent_logout_revokes_grants_and_pending_codes(self):
  token=self.exchange(self.code());pending=self.code();self.accounts.logout(self.session)
  with self.assertRaises(CheckoutError):self.identity.userinfo(token,'page')
  with self.assertRaises(CheckoutError):self.exchange(pending)
 def test_profile_default_private_and_wallet_fields_rejected(self):
  self.assertFalse(self.identity.profile(self.session)['discoverable'])
  data={'display_name':'Alice','bio':'Builder','discoverable':False};self.identity.update_profile(self.session,data)
  with self.assertRaises(CheckoutError):self.identity.public_profile('alice')
  with self.assertRaises(CheckoutError):self.identity.update_profile(self.session,data|{'wallet':'private'})
  self.identity.update_profile(self.session,data|{'discoverable':True});public=self.identity.public_profile('alice');self.assertEqual(set(public),{'mode','subject','handle','display_name','bio','avatar'})
 def test_concurrent_redemption_only_succeeds_once(self):
  code=self.code()
  def redeem(_):
   try:self.exchange(code);return True
   except CheckoutError:return False
  with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:self.assertEqual(sum(pool.map(redeem,range(4))),1)
