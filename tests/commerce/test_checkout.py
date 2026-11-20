import concurrent.futures, json, sys, tempfile, time, unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'services/checkout'))
from core import Checkout, CheckoutError
class CheckoutTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.db=Path(self.tmp.name)/'demo.sqlite3';self.service=Checkout(self.db)
 def tearDown(self):self.tmp.cleanup()
 def order(self,app='cash',sku='cash-demo',key='request-001',account='account-a'):
  return self.service.create(app,sku,account,key,'plus-demo-v1' if app=='plus' else None)
 def event(self,o,state='paid',event_id='evt-001',**extra):
  e=dict(event_id=event_id,order_id=o['id'],session=o['session'],amount=o['amount'],currency=o['currency'],state=state);e.update(extra)
  raw=json.dumps(e).encode();return raw,self.service.adapter.sign(raw)
 def test_price_and_scope(self):
  o=self.order();self.assertEqual(o['amount'],100)
  with self.assertRaises(CheckoutError):self.order('store','cash-demo')
  with self.assertRaises(CheckoutError):self.service.read(o['id'],'wrong-token')
  with self.assertRaises(CheckoutError):self.service.webhook(*self.event(o,amount=1))
 def test_creation_retries_and_restart(self):
  o=self.order();self.assertEqual(o,self.order())
  self.assertEqual(o,Checkout(self.db).create('cash','cash-demo','account-a','request-001'))
  with self.assertRaises(CheckoutError):self.order('plus','plus-demo')
 def test_signature_tamper_and_expiry(self):
  o=self.order();raw,sig=self.event(o)
  with self.assertRaises(CheckoutError):self.service.webhook(raw+b' ',sig)
  with self.assertRaises(CheckoutError):self.service.webhook(raw,self.service.adapter.sign(raw,int(time.time())-400))
  self.assertEqual(self.service.read(o['id'],o['access_token'])['state'],'pending')
 def test_concurrent_duplicate_fulfillment(self):
  o=self.order();event=self.event(o)
  with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:list(pool.map(lambda _:self.service.webhook(*event),range(12)))
  self.service.webhook(*self.event(o,event_id='different-event-same-order'))
  status=self.service.read(o['id'],o['access_token']);self.assertEqual(status['balance_minor'],100)
  with self.service.connect() as c:self.assertEqual(c.execute('SELECT COUNT(*) FROM fulfillment').fetchone()[0],1)
 def test_pending_then_paid_and_illegal_regression(self):
  o=self.order();self.service.webhook(*self.event(o,'pending'))
  self.service.webhook(*self.event(o,'paid','evt-002'))
  with self.assertRaises(CheckoutError):self.service.webhook(*self.event(o,'failed','evt-003'))
 def test_fail_cancel_do_not_grant(self):
  for i,state in enumerate(('failed','cancelled')):
   o=self.order(key='request-'+str(i));s=self.service.simulate(o['id'],o['access_token'],state)
   self.assertEqual(s['balance_minor'],0);self.assertIsNone(s['receipt'])
 def test_debit_and_refund_atomicity(self):
  o=self.order();self.service.webhook(*self.event(o));self.service.debit('account-a',25,'spend-1');self.service.debit('account-a',25,'spend-1')
  self.assertEqual(self.service.read(o['id'],o['access_token'])['balance_minor'],75)
  with self.assertRaises(CheckoutError):self.service.debit('account-a',100,'spend-2')
  with self.assertRaises(CheckoutError):self.service.simulate(o['id'],o['access_token'],'refunded')
  self.assertEqual(self.service.read(o['id'],o['access_token'])['state'],'paid')
 def test_recurring_consent_required(self):
  with self.assertRaises(CheckoutError):self.service.create('plus','plus-demo','account-a','plus-no-consent')
 def test_refund_and_subscription(self):
  o=self.order();self.service.webhook(*self.event(o));s=self.service.simulate(o['id'],o['access_token'],'refunded');self.assertEqual(s['balance_minor'],0)
  plus=self.order('plus','plus-demo','request-plus');s=self.service.simulate(plus['id'],plus['access_token'],'paid');self.assertEqual(s['membership'],'active')
  s=self.service.simulate(plus['id'],plus['access_token'],'subscription_cancelled');self.assertEqual(s['membership'],'cancelled')
if __name__=='__main__':unittest.main()
