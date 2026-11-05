import sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from source_adapters import parse_source
class EnterpriseSources(unittest.TestCase):
 def test_protocols_reject_bad_urls_and_do_not_assign_verification(self):
  source={'id':'protocols','adapter':'protocol_directory','url':'https://api.llama.fi/protocols','networks':['Solana'],'max_records':20}
  rows=[{'name':'Example','slug':'example','chains':['Solana'],'category':'DEX','url':'https://example.org/'},{'name':'Bad','slug':'bad','chains':['Solana'],'url':'javascript:bad()'},{'name':'Other','slug':'other','chains':['Other'],'url':'https://other.org/'}]
  admitted,review=parse_source(source,rows)
  self.assertEqual(len(admitted),1);self.assertEqual(len(review),1);self.assertEqual(admitted[0]['verification_status'],'unverified');self.assertNotIn('tvl',admitted[0])
 def test_hubs_admit_only_configured_public_paths(self):
  source={'id':'hub','adapter':'resource_hub','url':'https://example.org/','networks':['Solana'],'max_records':20,'path_prefixes':['/games/'],'attribution':'Official hub','terms_url':'https://example.org/terms'}
  rows,_=parse_source(source,'<html><a href="/games/one">Game one</a><a href="/games/one">Duplicate</a><a href="https://evil.org/games/two">Other</a><a href="/private/profile">Private</a></html>')
  self.assertEqual(len(rows),1);self.assertEqual(rows[0]['official_links']['website'],'https://example.org/games/one')
 def test_official_docs_schema_is_bounded(self):
  s={'id':'eth','adapter':'ethereum_docs','url':'https://api.github.com/repos/ethereum/ethereum-org-website/contents/public/content/developers/docs','max_records':1,'attribution':'Ethereum MIT'}
  rows,reviews=parse_source(s,[{'type':'dir','name':'smart-contracts'},{'type':'dir','name':'../private'},{'type':'file','name':'index.md'}])
  self.assertEqual(len(rows),1);self.assertEqual(len(reviews),1);self.assertEqual(rows[0]['type'],'documentation')
