import concurrent.futures,sqlite3,sys,tempfile,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'services/checkout'))
from core import Checkout,CheckoutError
from accounts import Accounts
class AccountTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.checkout=Checkout(Path(self.tmp.name)/'test.sqlite3');self.accounts=Accounts(self.checkout)
  self.a=self.accounts.register('alice','disposable-test-password');self.b=self.accounts.register('bob','another-test-password');self.aid=self.accounts.account(self.a['session_token'])['id']
 def tearDown(self):self.tmp.cleanup()
 def test_shared_plus_entitlement_tracks_verified_states(self):
  token=self.a['session_token'];other=self.b['session_token']
  active=lambda:self.accounts.entitlements(token)['entitlements']['plus']['active']
  order=self.accounts.create_order(token,'plus','plus-demo','entitlement-001','plus-demo-v2');self.assertFalse(active())
  self.checkout.simulate(order['id'],order['access_token'],'paid');self.assertTrue(active());self.assertFalse(self.accounts.entitlements(other)['entitlements']['plus']['active'])
  self.assertFalse(self.accounts.entitlements(token)['entitlements']['plus']['live_membership'])
  self.checkout.simulate(order['id'],order['access_token'],'subscription_cancelled');self.assertFalse(active())
  self.checkout.simulate(order['id'],order['access_token'],'paid');self.assertFalse(active())
 def test_entitlements_multiple_orders_refund_and_logout(self):
  token=self.a['session_token'];orders=[self.accounts.create_order(token,'plus','plus-demo','membership-'+str(i),'plus-demo-v2') for i in range(2)]
  for o in orders:self.checkout.simulate(o['id'],o['access_token'],'paid')
  self.checkout.simulate(orders[0]['id'],orders[0]['access_token'],'refunded')
  self.assertTrue(self.accounts.entitlements(token)['entitlements']['plus']['active'])
  self.checkout.simulate(orders[1]['id'],orders[1]['access_token'],'subscription_cancelled')
  self.assertFalse(self.accounts.entitlements(token)['entitlements']['plus']['active'])
  self.accounts.logout(token)
  with self.assertRaises(CheckoutError):self.accounts.entitlements(token)
 def test_identity_expiry_and_logout(self):
  with self.assertRaises(CheckoutError):self.accounts.login('alice','incorrect-test-password')
  with self.assertRaises(CheckoutError):self.accounts.summary('a'*32)
  session=self.accounts.login('ALICE','disposable-test-password');self.assertEqual(self.accounts.account(session['session_token'])['id'],self.aid)
  self.accounts.logout(session['session_token'])
  with self.assertRaises(CheckoutError):self.accounts.summary(session['session_token'])
  with self.checkout.connect() as c:c.execute('UPDATE cash_sessions SET expires=0')
  with self.assertRaises(CheckoutError):self.accounts.summary(self.a['session_token'])
 def test_grants_and_account_isolation(self):
  o=self.accounts.create_order(self.a['session_token'],'cash','cash-demo','test-order-001');self.assertEqual(self.accounts.summary(self.a['session_token'])['balance_minor'],0)
  with self.assertRaises(CheckoutError):self.accounts.owned_order(self.b['session_token'],o['id'])
  for _ in range(2):self.checkout.simulate(o['id'],o['access_token'],'paid')
  self.assertEqual(self.accounts.summary(self.a['session_token'])['balance_minor'],100)
  self.assertEqual(self.accounts.summary(self.b['session_token'])['transactions'],[])
  self.checkout.simulate(o['id'],o['access_token'],'refunded');self.assertEqual(self.accounts.summary(self.a['session_token'])['balance_minor'],0)
 def test_concurrent_spend_earning_and_reversal(self):
  self.accounts.earn(self.aid,100,'earning-001');self.accounts.earn(self.aid,100,'earning-001')
  def spend(i):
   try:self.checkout.debit(self.aid,75,'spend-'+str(i));return True
   except CheckoutError:return False
  with concurrent.futures.ThreadPoolExecutor(max_workers=2) as p:self.assertEqual(sum(p.map(spend,[1,2])),1)
  rows=self.accounts.summary(self.a['session_token']);self.assertEqual(rows['balance_minor'],25)
  spendid=next(x['id'] for x in rows['transactions'] if x['delta']<0)
  self.accounts.reverse_spend(self.aid,spendid);self.accounts.reverse_spend(self.aid,spendid);self.assertEqual(self.accounts.summary(self.a['session_token'])['balance_minor'],100)
  self.assertEqual(self.accounts.reconcile(self.aid)['paid_credit_orders_missing_grant'],0)
 def test_pending_refund_reconciliation_and_account_isolation(self):
  order=self.accounts.create_order(self.a['session_token'],'cash','cash-demo','refund-review-001')
  self.checkout.simulate(order['id'],order['access_token'],'paid')
  self.checkout.debit(self.aid,100,'spent-before-refund')
  self.checkout.simulate(order['id'],order['access_token'],'refunded')
  report=self.accounts.reconcile(self.aid)
  self.assertEqual(report['refunds_pending_review'],1);self.assertEqual(report['refund_recovery_minor'],100)
  self.assertEqual(report['refunded_credit_orders_unreconciled'],0)
  self.assertEqual(self.accounts.reconcile(self.accounts.account(self.b['session_token'])['id'])['refunds_pending_review'],0)
  self.accounts.earn(self.aid,100,'operator-recovery-funds')
  self.checkout.recover_refund(order['id'])
  report=self.accounts.reconcile(self.aid)
  self.assertEqual(report['refunds_pending_review'],0);self.assertEqual(report['refund_recovery_minor'],0)
  self.assertEqual(report['balance_minor'],0)
 def test_append_only_and_backup(self):
  self.accounts.earn(self.aid,100,'earning-002')
  for statement in ['UPDATE ledger SET delta=999','DELETE FROM ledger']:
   with self.assertRaises(sqlite3.IntegrityError):
    with self.checkout.connect() as c:c.execute(statement)
  self.assertEqual(len(list(Path(self.tmp.name).glob('*.before-cash-accounts-*.sqlite3'))),1)
  Accounts(self.checkout)
  self.assertEqual(len(list(Path(self.tmp.name).glob('*.before-cash-accounts-*.sqlite3'))),1)
 def test_pagination(self):
  for i in range(3):self.accounts.earn(self.aid,10,'earning-page-'+str(i))
  first=self.accounts.summary(self.a['session_token'],limit=2);second=self.accounts.summary(self.a['session_token'],offset=first['next_offset'],limit=2)
  self.assertEqual(len(first['transactions'])+len(second['transactions']),3)
  self.assertFalse(set(x['id'] for x in first['transactions']) & set(x['id'] for x in second['transactions']))
