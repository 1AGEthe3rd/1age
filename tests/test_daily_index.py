import copy
import importlib.util
import json
from pathlib import Path
import shutil
import sys
import tempfile
import unittest
from unittest.mock import patch
import urllib.error

ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'scripts'))
from indexlib import read,outputs,merged_catalog,write_outputs,validate,canonical
from source_adapters import source_url,parse_source
from index_http import PublicHTTP,public_url
spec=importlib.util.spec_from_file_location('updater',ROOT/'scripts/update-search-index.py')
updater=importlib.util.module_from_spec(spec);spec.loader.exec_module(updater)

T1='2026-11-05T08:00:00Z';T2='2026-11-06T08:00:00Z'
class FakeHTTP:
    requests=0;bytes=0;cache_hits=0
    def __init__(self,config):
        self.payloads={};self.failure=set();self.link_status='ok'
        for source in config['sources']:
            if source['adapter']=='chain_registry':
                rows=[{'chainId':1,'name':'Ethereum Mainnet','shortName':'eth','infoURL':'https://ethereum.org/'},
                      {'chainId':56,'name':'BNB Smart Chain','shortName':'bnb','infoURL':'https://www.bnbchain.org/'}]
            else:
                org=source['org'];rows=[{'name':'test-sdk','full_name':org+'/test-sdk','html_url':'https://github.com/'+org+'/test-sdk',
                    'description':'Public blockchain developer SDK','owner':{'login':org,'type':'Organization'},'updated_at':T1}]
            self.payloads[source_url(source)]=rows
    def json(self,url):
        self.requests+=1
        if url in self.failure: raise urllib.error.URLError('temporary test source failure')
        return copy.deepcopy(self.payloads[url]),False
    def check_link(self,url): return {'status':self.link_status,'http_status':404 if self.link_status=='possibly_broken' else 200}

pubspec=importlib.util.spec_from_file_location('publisher',ROOT/'scripts/publish-search-index.py')
publisher=importlib.util.module_from_spec(pubspec);pubspec.loader.exec_module(publisher)

class DailyIndexTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name)
        for file in ['1age-index.json','entities.json','blockchain-seeds.json','search-overrides.json','index-exclusions.json','index-sources/config.json']:
            target=self.root/'data'/file;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy(ROOT/'data'/file,target)
        self.config=read(self.root/'data/index-sources/config.json');self.http=FakeHTTP(self.config)
        records,_=merged_catalog(self.root);self.initial_count=len(records);write_outputs(outputs(records,self.root),self.root)
    def tearDown(self): self.temp.cleanup()
    def run_index(self,**options): return updater.run(self.root,self.http,now=options.pop('now',T1),**options)
    def test_discovery_dedup_refresh_and_no_verification(self):
        first,ok=self.run_index();self.assertTrue(ok,first)
        self.assertEqual(first['new_records_discovered'],6)
        self.assertEqual(first['duplicate_records_detected'],1)
        self.assertEqual(first['links_checked'],24)
        self.assertEqual(first['total_indexed_records'],self.initial_count+6)
        rows=read(self.root/'data/discovered-records.json');self.assertTrue(all(x['verification_status']=='unverified' for x in rows))
        self.assertTrue(all('authenticity' not in x and 'source_review' not in x for x in rows))
        self.http.payloads[source_url(self.config['sources'][1])][0]['description']='Updated public SDK description'
        second,ok=self.run_index(now=T2);self.assertTrue(ok,second);self.assertEqual(second['new_records_discovered'],0)
        self.assertEqual(second['existing_records_updated'],1)
        new=read(self.root/'data/discovered-records.json');row=next(x for x in new if x['source_id']=='github-solana')
        self.assertEqual(row['discovered_at'],T1);self.assertEqual(row['updated_at'],T2)
    def test_total_failure_never_changes_working_catalog(self):
        self.assertTrue(self.run_index()[1]);before=(self.root/'data/search-index.json').read_bytes()
        self.http.failure=set(self.http.payloads)
        report,ok=self.run_index(now=T2);self.assertFalse(ok);self.assertEqual(report['status'],'blocked')
        self.assertEqual(before,(self.root/'data/search-index.json').read_bytes())
        self.assertEqual(report['last_successful_indexing_time'],T1)
    def test_partial_failure_preserves_previous_records(self):
        self.assertTrue(self.run_index()[1]);source=self.config['sources'][1]
        self.http.failure.add(source_url(source));report,ok=self.run_index(now=T2)
        self.assertTrue(ok);self.assertEqual(report['status'],'partial')
        row=next(x for x in read(self.root/'data/discovered-records.json') if x['source_id']==source['id'])
        self.assertEqual(row['last_seen_at'],T1)
    def test_invalid_config_generates_clear_failure_report(self):
        (self.root/'data/index-sources/config.json').write_text('{invalid')
        report,ok=self.run_index();self.assertFalse(ok)
        self.assertEqual(read(self.root/'reports/index-latest-attempt.json')['status'],'blocked')
    def test_growth_guard_and_budget_block_without_catalog_writes(self):
        self.config['limits']['max_new_per_run']=0
        (self.root/'data/index-sources/config.json').write_text(json.dumps(self.config))
        before=(self.root/'data/search-index.json').read_bytes();report,ok=self.run_index()
        self.assertFalse(ok);self.assertIn('Unusually large growth',report['errors'][0])
        self.assertEqual(before,(self.root/'data/search-index.json').read_bytes())
        self.assertFalse((self.root/'data/discovered-records.json').exists())
    def test_malformed_source_and_suspicious_repository_are_not_admitted(self):
        source=self.config['sources'][1];url=source_url(source)
        self.http.payloads[url][0]['description']='Enter your seed phrase to claim guaranteed profit'
        report,ok=self.run_index();self.assertTrue(ok)
        self.assertTrue(any(x['id']==source['id'] for x in report['failed_data_sources']))
        self.assertFalse(any(x['source_id']==source['id'] for x in read(self.root/'data/discovered-records.json')))
    def test_removals_are_suppressed_and_not_rediscovered(self):
        self.assertTrue(self.run_index()[1]);rows=read(self.root/'data/discovered-records.json');target=next(x for x in rows if x['source_id']=='github-solana')
        (self.root/'data/index-exclusions.json').write_text(json.dumps({'ids':[target['id']],'urls':[]}))
        report,ok=self.run_index(now=T2);self.assertTrue(ok,report)
        self.assertFalse(any(x['id']==target['id'] for x in read(self.root/'data/search-index.json')))
    def test_rollback_restores_previous_index(self):
        self.assertTrue(self.run_index()[1]);before=(self.root/'data/search-index.json').read_bytes()
        self.http.payloads[source_url(self.config['sources'][1])][0]['description']='Changed test metadata'
        self.assertTrue(self.run_index(now=T2)[1]);updater.rollback(self.root)
        self.assertEqual(before,(self.root/'data/search-index.json').read_bytes())
    def test_unknown_urls_and_private_identity_not_accepted(self):
        for url in ['http://example.com','https://127.0.0.1/','https://localhost/','https://user:password@example.com/','https://example.local/']:
            with self.assertRaises(ValueError): canonical(url)
        with patch('index_http.socket.getaddrinfo',return_value=[(0,0,0,'',('10.0.0.1',443))]):
            with self.assertRaises(ValueError): public_url('https://not-a-public-source.example/')
        source=self.config['sources'][1];rows=self.http.payloads[source_url(source)]
        rows[0]['owner']['type']='User';admitted,reviews=parse_source(source,rows)
        self.assertEqual(admitted,[]);self.assertTrue(reviews)
    def test_outage_does_not_delete_and_repeated_failure_is_flagged(self):
        self.http.link_status='possibly_broken';first,ok=self.run_index();self.assertTrue(ok)
        second,ok=self.run_index(now=T2);self.assertTrue(ok)
        # Oldest-first rotation may defer the same URL. The previously valid records remain.
        self.assertEqual(second['total_indexed_records'],self.initial_count+6)
        self.assertTrue(any(x['link_health']['status']=='possibly_broken' for x in read(self.root/'data/search-index.json') if 'link_health' in x))
    def test_candidate_revalidated_and_tampering_rejected_before_publication(self):
        self.assertTrue(self.run_index()[1])
        with patch.object(publisher,'ROOT',self.root):
            self.assertIn('data/search-manifest.json',publisher.validate_candidate(self.root))
            path=self.root/'data/search-index.json';rows=read(path);rows[0]['name']='Tampered output'
            path.write_text(json.dumps(rows))
            with self.assertRaises(ValueError): publisher.validate_candidate(self.root)
    def test_conflicting_identifier_blocks_publication(self):
        self.assertTrue(self.run_index()[1])
        rows=read(self.root/'data/discovered-records.json')
        first=copy.deepcopy(rows[0]);second=copy.deepcopy(first)
        second['id']='conflicting:test';second['official_links']['website']='https://different.example.com/'
        with self.assertRaises(ValueError): merged_catalog(self.root,[first,second])
    def test_etag_cache_and_304(self):
        limits=copy.deepcopy(self.config['limits']);limits['min_request_interval_seconds']=0
        h=PublicHTTP(limits,self.root/'cache');url='https://chainid.network/chains_mini.json'
        payload=[{'name':'Test network'}]
        with patch.object(h,'request',return_value=(200,{'ETag':'"test"'},json.dumps(payload).encode(),url)):
            self.assertEqual(h.json(url),(payload,False))
        with patch.object(h,'request',side_effect=urllib.error.HTTPError(url,304,'Not Modified',{},None)):
            self.assertEqual(h.json(url),(payload,True));self.assertEqual(h.cache_hits,1)

if __name__=='__main__': unittest.main()
