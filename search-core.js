(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ageSearchCore=factory();})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const instructionWords = new Set(['find','show','me','list','top','best','popular','recommended','recommend','the','a','an','for','on','in','of','please','what','is','who','where','how','to','can','i','get','use','are','some','projects','project','apps','applications','blockchain','crypto']);
const aliases = {wallets:'wallet',games:'game',gaming:'game',exchanges:'exchange',tokens:'token',communities:'community',developers:'developer',tools:'tool',build:'developer',nfts:'nft',eth:'ethereum',sol:'solana',btc:'bitcoin'};
function plan(value) {
 const raw=normalize(value).slice(0,200);
 const phrase=raw.replace(/decentralized finance/g,'defi').replace(/non[ -]fungible tokens?/g,'nft');
 const words=phrase.split(/\s+/).filter(Boolean);
 const meaningful=words.filter(x=>!instructionWords.has(x)).map(x=>aliases[x]||x);
 return {raw,query: meaningful.join(' '),browse:meaningful.length===0&&/\b(projects|apps|applications|blockchain|crypto)\b/.test(raw),projectOnly:/\b(projects|apps|applications)\b/.test(raw),ranking:'relevance',requestedTop:/\b(top|best|popular)\b/.test(raw)};
}
function normalize(value){return String(value??'').toLowerCase().trim();}
function joined(value){return Array.isArray(value)?value.join(' '):String(value||'');}
const scopes = {
  games: ['games', 'game', 'game developer', 'gaming studio', 'sports', 'competition', 'tournament'],
  page: ['identity', 'profile', 'creator', 'community'],
  exchange: ['exchange', 'token', 'market', 'defi'],
  space: ['space', 'virtual destination', 'business'],
  design: ['design', 'creator tool'],
  quest: ['quest', 'mission', 'opportunity'],
  cash: ['cash'],
  work: ['job', 'bounty', 'opportunity'],
  plus: ['membership'],
  app: ['platform'],
  store: ['store', 'shop', 'marketplace'],
  shop: ['shop', 'store', 'marketplace'],
  world: ['world', 'space', 'virtual destination'],
};
function createEngine(MiniSearch){
const engines=new WeakMap();
function getEngine(records) {
  if (engines.has(records)) return engines.get(records);
  const engine = new MiniSearch({
    fields: ['name', 'id', 'domain', 'aliases', 'identifiers', 'networks', 'type', 'category', 'tags', 'description'],
    searchOptions: {
      boost: { name: 8, id: 8, domain: 6, aliases: 5, identifiers: 8, networks: 3, tags: 2, category: 2 },
      combineWith: 'AND',
      prefix: true,
      fuzzy: term => term.length >= 4 ? 0.2 : false,
    },
  });
  engine.addAll(records.map(item => ({ ...item,
    aliases: joined(item.aliases), identifiers: joined(item.identifiers),
    networks: joined(item.networks), tags: joined(item.tags),
  })));
  const cached = { engine, byId: new Map(records.map(item => [item.id, item])) };
  engines.set(records, cached);
  return cached;
}

function search(records, query, scope) {
  const raw = normalize(query).slice(0, 200);
  const term = plan(query).query;
  if (!records?.length || (!term && !plan(query).browse)) return [];
  const types = Object.hasOwn(scopes, scope) ? scopes[scope] : null;
  const intent=plan(query);
  const projectDiscovery=intent.projectOnly&&!/\b(developer|sdk|tool|repository|code)\b/.test(term);
  const allowed = item => (!projectDiscovery || !['blockchain','tool','documentation'].includes(item.type)) && (!types || [item.type, item.category].some(value => types.includes(normalize(value))));
  const { engine, byId } = getEngine(records);
  const scored = new Map((term?engine.search(term):records.map(item=>({id:item.id,score:0}))).map(hit => {const item=byId.get(hit.id);const discovery=intent.projectOnly||intent.requestedTop;const weight=discovery&&(item.type==='tool'||item.id.startsWith('github:')||item.category==='Ecosystem resource')?0.15:1;return [hit.id,hit.score*weight];}));
  // Exact whole identifiers, domains, aliases and names always lead. No brand preference.
  for (const item of records) {
    const identifiers = [item.name, item.id, item.domain, ...(item.aliases || []), ...(item.identifiers || [])];
    if (identifiers.some(value => normalize(value) === raw)) scored.set(item.id, 1000000 + (scored.get(item.id) || 0));
  }
  const completeness = item => ['description', 'category', 'networks', 'official_links'].filter(key => item[key]?.length || key === 'official_links' && item[key]?.website).length;
  return [...scored].map(([id, score]) => ({ ...byId.get(id), score }))
    .filter(allowed)
    .sort((a, b) => b.score - a.score ||
      String(b.source_review?.checked_on || '').localeCompare(a.source_review?.checked_on || '') ||
      completeness(b) - completeness(a) || a.name.localeCompare(b.name));
}

return {search,plan};
}
return {createEngine,plan,version:1};
});
