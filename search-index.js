(() => {
'use strict';

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
let manifestRequest;
let routingEngine;
let currentInfo = null;
const shardRequests = new Map();
const catalogCache = new Map();
let libraryRequest;
const engines = new WeakMap();
const modes = new Set(['all', '1age', 'solana']);

function loadLibrary() {
  if (window.MiniSearch) return Promise.resolve();
  if (!libraryRequest) {
    libraryRequest = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/assets/vendor/minisearch-7.2.0.js';
      script.onload = () => window.MiniSearch ? resolve() : reject(new Error('Search library unavailable'));
      script.onerror = () => { script.remove(); reject(new Error('Search library could not load')); };
      document.head.append(script);
    }).catch(error => { libraryRequest = null; throw error; });
  }
  return libraryRequest;
}

async function manifest() {
  if (!manifestRequest) manifestRequest = fetch('/data/search-manifest.json', { cache: 'no-cache' })
    .then(response => { if (!response.ok) throw new Error('Search manifest unavailable'); return response.json(); })
    .then(value => {
      if (value.schema_version !== 2 || !Number.isInteger(value.records) || !Array.isArray(value.shards) || !value.shards.length ||
          value.shards.some(shard => !/^\/data\/search-shards\/[a-z0-9-]+-[a-f0-9]{16}\.json$/.test(shard.url) || !shard.routing_text)) {
        throw new Error('Invalid search manifest');
      }
      return value;
    }).catch(error => { manifestRequest = null; throw error; });
  return manifestRequest;
}
function prepare() { return Promise.all([manifest(), loadLibrary()]); }
function fetchRecords(url) {
  if (!shardRequests.has(url)) shardRequests.set(url, fetch(url).then(response => {
    if (!response.ok) throw new Error('Search data unavailable'); return response.json();
  }).then(records => {
    if (!Array.isArray(records) || !records.length || records.some(item => !item.id || !item.name)) throw new Error('Invalid search data');
    return records;
  }).catch(error => { shardRequests.delete(url); throw error; }));
  return shardRequests.get(url);
}
async function load(mode = 'all', query) {
  if (!modes.has(mode)) throw new Error('Unknown search mode');
  await loadLibrary();
  try {
    const index = await manifest();
    if (!routingEngine) {
      routingEngine = new window.MiniSearch({ fields: ['routing_text'], searchOptions: { prefix: true, combineWith: 'AND', fuzzy: term => term.length >= 4 ? 0.2 : false } });
      routingEngine.addAll(index.shards);
    }
    const q = normalize(query).slice(0, 200);
    const ids = q ? new Set(routingEngine.search(q).map(hit => hit.id)) : null;
    const selected = index.shards.filter(shard => !ids || ids.has(shard.id));
    const cacheKey = mode + ':' + selected.map(shard => shard.url).join('|');
    if (!catalogCache.has(cacheKey)) {
      const groups = await Promise.all(selected.map(shard => fetchRecords(shard.url)));
      const records = [...new Map(groups.flat().map(item => [item.id, item])).values()];
      catalogCache.set(cacheKey, mode === 'solana' ? records.filter(item => item.networks?.includes('Solana')) : records);
      // Keep a small number of materialized query combinations; file fetches remain cached.
      if (catalogCache.size > 12) catalogCache.delete(catalogCache.keys().next().value);
    }
    currentInfo = { records: index.records, networks: Object.keys(index.networks).length, fallback: false };
    return catalogCache.get(cacheKey);
  } catch (error) {
    let records;
    try { records = await fetchRecords('/data/search-index.json'); }
    catch { records = await fetchRecords('/data/search-last-good.json'); }
    currentInfo = { records: records.length, networks: new Set(records.flatMap(item => item.networks || [])).size, fallback: true };
    return mode === 'solana' ? records.filter(item => item.networks?.includes('Solana')) : records;
  }
}

function normalize(value) { return String(value ?? '').toLowerCase().trim(); }
function joined(value) { return Array.isArray(value) ? value.join(' ') : String(value || ''); }
function getEngine(records) {
  if (engines.has(records)) return engines.get(records);
  const engine = new window.MiniSearch({
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
  const term = normalize(query).slice(0, 200);
  if (!records?.length || !term) return [];
  const types = Object.hasOwn(scopes, scope) ? scopes[scope] : null;
  const allowed = item => !types || [item.type, item.category].some(value => types.includes(normalize(value)));
  const { engine, byId } = getEngine(records);
  const scored = new Map(engine.search(term).map(hit => [hit.id, hit.score]));
  // Exact whole identifiers, domains, aliases and names always lead. No brand preference.
  for (const item of records) {
    const identifiers = [item.name, item.id, item.domain, ...(item.aliases || []), ...(item.identifiers || [])];
    if (identifiers.some(value => normalize(value) === term)) scored.set(item.id, 1000000 + (scored.get(item.id) || 0));
  }
  const completeness = item => ['description', 'category', 'networks', 'official_links'].filter(key => item[key]?.length || key === 'official_links' && item[key]?.website).length;
  return [...scored].map(([id, score]) => ({ ...byId.get(id), score }))
    .filter(allowed)
    .sort((a, b) => b.score - a.score ||
      String(b.source_review?.checked_on || '').localeCompare(a.source_review?.checked_on || '') ||
      completeness(b) - completeness(a) || a.name.localeCompare(b.name));
}

function validLink(entity) {
  const raw = entity.official_links?.website;
  if (typeof raw !== 'string') return null;

  try {
    const url = new URL(raw, window.location.origin);
    if (!['https:', 'http:'].includes(url.protocol)) return null;
    if (url.origin !== window.location.origin &&
        url.protocol !== 'https:') return null;
    return url;
  } catch (_) {
    return null;
  }
}

function authenticity(entity) {
  const review = entity.authenticity;
  const reviewedOn = review?.reviewed_on;
  const evidence = Array.isArray(review?.evidence) && review.evidence.some(url => {
    try { return new URL(url).protocol === 'https:'; }
    catch { return false; }
  });
  const documented = evidence && /^\d{4}-\d{2}-\d{2}$/.test(reviewedOn);
  const labels = {
    identity_verified: 'Identity verified · This does not establish financial or contract safety',
    independently_reviewed: 'Independently reviewed · This does not establish financial or contract safety',
    flagged: 'Flagged project',
    inactive: 'Inactive project',
  };
  if (documented && Object.hasOwn(labels, review.status)) return { label: labels[review.status], reviewedOn };
  if (entity.status === 'inactive') return { label: labels.inactive };
  return { label: 'Unverified listing' };
}

window.ageIndex = { load, prepare, info: () => currentInfo, search, validLink, authenticity };
})();
