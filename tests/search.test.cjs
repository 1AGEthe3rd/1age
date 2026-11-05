const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const MiniSearch = require('../assets/vendor/minisearch-7.2.0.js');
const data = JSON.parse(fs.readFileSync(path.join(root, 'data/search-index.json')));
const calls = [];
let fail = false;
const context = { window: { MiniSearch, location: { origin: 'https://1age.com' } }, URL,
  fetch: async url => { calls.push(url); return { ok: !fail, json: async () => data }; } };
vm.runInNewContext(fs.readFileSync(path.join(root, 'search-index.js'), 'utf8'), context);
const api = context.window.ageIndex;
(async () => {
  assert.equal(calls.length, 0, 'No eager data fetch');
  const records = await api.load('all');
  assert.equal(records.length, 42);
  assert.equal(new Set(records.flatMap(x => x.networks)).size, 8);
  assert.equal(api.search(records, 'Phantom')[0].id, 'phantom');
  assert.equal(api.search(records, 'phantm')[0].id, 'phantom', 'Typo tolerance');
  assert.equal(api.search(records, 'metam')[0].id, 'metamask', 'Partial name');
  assert.equal(api.search(records, 'BTC')[0].id, 'bitcoin', 'Exact alias');
  assert.equal(api.search(records, 'solscan.io')[0].id, 'solscan', 'Exact domain');
  assert.equal(api.search(records, 'ethereum wallet')[0].id, 'metamask', 'Multi-term AND across fields');
  assert.equal(api.search(records, 'notarealblockchainprojectzz').length, 0);
  assert.equal(api.search(records, '').length, 0);
  assert(api.search(records, 'game', 'games').some(x => x.id === 'star-atlas'));
  assert(api.search(records, '.eth').some(x => x.id === 'ens'));
  assert(api.search(records, '.sol').some(x => x.id === 'sns'));
  assert(api.search(records, 'tool', 'design').every(x => x.type === 'design' || x.type === 'creator tool'));
  assert((await api.load('solana')).every(x => x.networks.includes('Solana')));
  await api.load('all');
  assert.equal(calls.length, 1, 'Cached data');
  assert.equal(api.validLink({official_links:{website:'javascript:alert(1)'}}), null);
  assert.equal(api.validLink({official_links:{website:'http://example.com'}}), null);
  assert.equal(api.authenticity(data.find(x => x.id === 'bitcoin')).label, 'Unverified listing');
  const neutral = [{id:'external', name:'Independent Wallet', type:'wallet', category:'Wallet', description:'wallet'},
    {id:'1age-test', name:'1AGE unrelated', type:'wallet', category:'Wallet', description:'wallet'}];
  assert.equal(api.search(neutral, 'Independent Wallet')[0].id, 'external');
  // A failed fetch can be retried without reloading the page.
  const retryContext = { ...context, window:{...context.window} };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'search-index.js'), 'utf8'), retryContext);
  fail = true;
  await assert.rejects(retryContext.window.ageIndex.load('all'));
  fail = false;
  assert.equal((await retryContext.window.ageIndex.load('all')).length, 42);
  console.log('Search checks passed: lazy loading, eight networks, exact/partial/typo/AND ranking, scopes, links, retry and no brand boost.');
})().catch(error => { console.error(error); process.exitCode = 1; });
