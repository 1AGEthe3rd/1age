import sys, unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'services/checkout'))
from core import CATALOG

class PlusPricingPolicy(unittest.TestCase):
 def test_mock_server_catalog_price(self):
  plus=CATALOG['plus-demo']
  self.assertEqual((plus['app'],plus['kind'],plus['currency'],plus['amount']),('plus','subscription','USD',333))
  self.assertIn('Demonstration only',plus['terms'])
 def test_static_mock_prices_and_consent(self):
  checkout=(ROOT/'experiences/checkout/checkout.js').read_text()
  plus=(ROOT/'experiences/plus/index.html').read_text()
  test_client=(ROOT/'experiences/plus/test-client.mjs').read_text()
  self.assertIn("amount:333,currency:'USD',kind:'subscription'",checkout)
  self.assertIn('$3.33 <span>USD / month',plus)
  self.assertIn('proposed $3.33 USD/month',plus)
  for s in (checkout,test_client,(ROOT/'services/checkout/core.py').read_text()):
   self.assertIn('plus-demo-v3',s)
   self.assertNotIn('plus-demo-v1',s)
 def test_studio_access_not_free_goods(self):
  plus=(ROOT/'experiences/plus/index.html').read_text()
  doc=(ROOT/'docs/membership/PLUS-333-STUDIO-ACCESS.md').read_text()
  self.assertIn('One membership for access across participating 1AGEthe3rd projects',plus)
  self.assertIn('Cash itself, merchandise',plus)
  self.assertIn('not currently live',doc)
  self.assertIn('no additional 1AGE Cash purchase checkout fee',doc)
  self.assertIn('333 USD cents',doc)
if __name__=='__main__':unittest.main()
