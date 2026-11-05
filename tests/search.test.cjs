const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const MiniSearch = require('../assets/vendor/minisearch-7.2.0.js');
const data = JSON.parse(fs.readFileSync(path.join(root, 'data/search-index.json')));
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'data/search-manifest.json')));
const calls = [];
let fail = false;
function makeContext(failure = () => fail) {
  return { window: { MiniSearch, ageSearchCore: require('../search-core.js'), location: { origin: 'https://1age.com' } }, URL,
    fetch: async url => {
      calls.push(url);
      const file = path.join(root, url.replace(/^\//, ''));
      return { ok: !failure(url) && fs.existsSync(file), json: async () => JSON.parse(fs.readFileSync(file)) };
    } };
}
const code = fs.readFileSync(path.join(root, 'search-index.js'), 'utf8');
const context = makeContext(); vm.runInNewContext(code, context);
const api = context.window.ageIndex;
(async () => {
  assert.equal(calls.length, 0, 'No eager catalog fetch');
  await api.prepare();
  assert.deepEqual(calls, ['/data/search-manifest.json'], 'Preparing search downloads only the routing manifest');
  const focused = await api.load('all', 'phantm');
  assert.equal(api.search(focused, 'phantm')[0].id, 'phantom');
  assert(!calls.includes('/data/search-index.json'), 'Normal search uses shards');
  assert(calls.filter(x => x.includes('search-shards')).length < manifest.shards.length, 'Focused query loads a subset');
  const records = await api.load('all');
  assert.equal(records.length, manifest.records);
  assert.equal(new Set(records.flatMap(x => x.networks)).size, Object.keys(manifest.networks).length);
  for (const [query,id] of [['Phantom','phantom'],['metam','metamask'],['BTC','bitcoin'],['solscan.io','solscan'],['ethereum wallet','metamask']]) {
    assert.equal(api.search(records, query)[0].id, id);
  }
  assert.equal(api.search(records, 'notarealblockchainprojectzz').length, 0);
  assert.equal(api.search(records, '').length, 0);
  assert(api.search(records, 'game', 'games').some(x => x.id === 'star-atlas'));
  assert(api.search(records, '.eth').some(x => x.id === 'ens'));
  assert(api.search(records, '.sol').some(x => x.id === 'sns'));
  assert((await api.load('solana')).every(x => x.networks.includes('Solana')));
  const count=calls.length;await api.load('all');assert.equal(calls.length,count,'Data cached');
  assert.equal(api.validLink({official_links:{website:'javascript:alert(1)'}}),null);
  assert.equal(api.authenticity(data.find(x => x.id === 'bitcoin')).label,'Unverified listing');
  // Routing must not drop results supported by the complete catalog, including typo searches.
  for (const q of ['Ethereum','blockchain','wallet','phantm','bitcoin/bitcoin','github:bitcoin/bitcoin','eip155:56','solscan.io','game','base developer','ENS','.sol']) {
    const routed=await api.load('all',q);
    assert.deepEqual(Array.from(api.search(routed,q),x=>x.id).sort(),Array.from(api.search(records,q),x=>x.id).sort(),q);
  }
  const neutral=[{id:'external',name:'Independent Wallet',type:'wallet',category:'Wallet',description:'wallet'},
    {id:'1age-test',name:'1AGE unrelated',type:'wallet',category:'Wallet',description:'wallet'}];
  assert.equal(api.search(neutral,'Independent Wallet')[0].id,'external');
  const recovery=makeContext();vm.runInNewContext(code,recovery);
  fail=true;await assert.rejects(recovery.window.ageIndex.load('all'));
  fail=false;assert.equal((await recovery.window.ageIndex.load('all')).length,manifest.records);
  const fallback=makeContext(url=>url.includes('search-shards'));
  vm.runInNewContext(code,fallback);
  assert.equal((await fallback.window.ageIndex.load('all','Phantom')).length,data.length);
  assert.equal(fallback.window.ageIndex.info().fallback,true);
  assert(records.some(x=>x.id==='github:bitcoin/bitcoin'),'Discovered repository is searchable');
  console.log(`Search checks passed: ${records.length} records, manifest-only preparation, routed/eager equivalence, ranking, scopes, retries, pagination inputs and full-catalog fallback.`);
})().catch(error=>{console.error(error);process.exitCode=1});
