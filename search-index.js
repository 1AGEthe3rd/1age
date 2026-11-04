(() => {
'use strict';

const sources = { '1age': '/data/1age-index.json', solana: '/data/entities.json' };
const scopes = {
  games: ['games', 'game', 'game developer', 'gaming studio', 'sports', 'competition', 'tournament'],
  page: ['identity', 'profile', 'creator', 'community'],
  exchange: ['exchange', 'token', 'market', 'defi'],
  space: ['space', 'virtual destination', 'business'],
  design: ['design', 'creator tool'],
  quest: ['quest', 'mission', 'opportunity'],
  cash: ['cash'],
  work: ['job', 'bounty', 'opportunity'],
};
const cache = new Map();

function load(mode) {
  if (!Object.hasOwn(sources, mode)) return Promise.reject(new Error('Unknown search mode'));
  if (!cache.has(mode)) {
    const request = fetch(sources[mode]).then(response => {
      if (!response.ok) throw new Error('Search index request failed');
      return response.json();
    }).then(records => {
      if (!Array.isArray(records)) throw new Error('Invalid search index format');
      return records;
    }).catch(error => {
      cache.delete(mode);
      throw error;
    });
    cache.set(mode, request);
  }
  return cache.get(mode);
}

function normalize(value) {
  return String(value ?? '').toLowerCase().trim();
}

function scoreEntity(entity, query) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  const name = normalize(entity.name);
  const type = normalize(entity.type);
  const category = normalize(entity.category);
  const description = normalize(entity.description);
  const tags = (entity.tags || []).map(normalize);

  let score = 0;
  for (const term of terms) {
    if (name === term) score += 20;
    else if (name.includes(term)) score += 12;

    if (type.includes(term)) score += 8;
    if (category.includes(term)) score += 8;

    if (tags.some(tag => tag === term)) score += 10;
    else if (tags.some(tag => tag.includes(term))) score += 6;

    if (description.includes(term)) score += 3;
  }
  return score;
}

function search(records, query, scope) {
  const types = Object.hasOwn(scopes, scope) ? scopes[scope] : null;
  const hasQuery = Boolean(normalize(query));
  return (records || [])
    .filter(entity => !types || [entity.type, entity.category].some(value => types.includes(normalize(value))))
    .map(entity => ({ ...entity, score: hasQuery ? scoreEntity(entity, query) : 1 }))
    .filter(entity => entity.score > 0)
    .sort((a, b) => b.score - a.score);
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

window.ageIndex = { load, search, validLink, authenticity };
})();
