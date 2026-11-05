(() => {
'use strict';

const $ = selector => document.querySelector(selector);
const form = $('#search-form');
if (!form) return;

const input = $('#search-input');
const results = $('#results');
const label = $('#results-label');
const section = $('#results-section');
const note = section.querySelector('.index-note');
const buttons = [...document.querySelectorAll('[data-search-mode]')];
const quickLinks = document.querySelector('.quick-links');

let records = null;
let pendingLoad;
let requestVersion = 0;
let pageSize = 20;
let mode = '1age';
let currentQuery = '';


const suggestions = {
  '1age': [
    ['World', 'world'],
    ['Games', 'games'],
    ['Page', 'page'],
    ['Wallets', 'wallet'],
    ['Tools', 'tool']
  ],
  solana: [
    ['Wallets', 'wallet'],
    ['DeFi', 'defi'],
    ['Tools', 'tool'],
    ['Community', 'community']
  ]
};

function element(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function searchEntities(query) {
  return window.ageIndex.search(records, query, document.body.dataset.searchScope);
}

function render(items, query) {
  results.replaceChildren();
  label.textContent =
    `${items.length} ${items.length === 1 ? 'result' : 'results'} ` +
    `for “${query}”`;

  if (!items.length) {
    results.append(element(
      'p', 'empty-state',
      'No match in the current index. Try a project, network, wallet, developer tool or community name. Individual wallets, transactions and profiles are not yet indexed.'
    ));
    return;
  }

  for (const entity of items.slice(0, pageSize)) {
    const card = element('article', 'result-card');
    const top = element('div', 'result-topline');

    top.append(
      element('h2', '', entity.name),
      element('span', 'result-type', entity.category || entity.type)
    );

    card.append(
      top,
      element(
        'p', 'result-status',
        (entity.id === '1age' || entity.id?.startsWith('1age-'))
          ? '1AGE · Ecosystem listing'
          : (entity.networks || []).join(' · ') || 'Blockchain community · Directory listing'
      ),
      element('p', 'result-description', entity.description)
    );

    const authenticity = window.ageIndex.authenticity(entity);
    card.append(element('p', 'result-status', authenticity.label));
    if (authenticity.reviewedOn) {
      card.append(element('p', 'result-status', 'Evidence reviewed ' + authenticity.reviewedOn));
    }

    if (entity.source_review?.status === 'source_checked') {
      const source = element('a', 'result-link', 'Public source checked ' + entity.source_review.checked_on);
      source.href = entity.source_review.evidence[0];
      source.target = '_blank';
      source.rel = 'noopener noreferrer';
      card.append(source);
    }

    const tags = element('div', 'result-tags');
    for (const tag of entity.tags || []) {
      tags.append(element('span', '', `#${tag}`));
    }
    card.append(tags);

    const url = window.ageIndex.validLink(entity);
    if (url) {
      const link = element(
        'a', 'result-link',
        'Visit website ↗'
      );
      link.href = url.href;

      if (url.origin !== window.location.origin) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
      card.append(link);
    }

    results.append(card);
  }
  if (items.length > pageSize) {
    const more = element('button', 'quick-search', `Show more (${items.length - pageSize} remaining)`);
    more.type = 'button';
    more.addEventListener('click', () => { pageSize += 20; render(items, query); results.querySelectorAll('.result-card')[pageSize - 20]?.querySelector('a')?.focus(); });
    results.append(more);
  }
}

function updateURL() {
  const url = new URL(window.location.href);
  if (currentQuery) url.searchParams.set('q', currentQuery);
  else url.searchParams.delete('q');

  if (mode === 'solana') url.searchParams.set('mode', 'solana');
  else url.searchParams.delete('mode');

  window.history.replaceState(null, '', url);
}

async function ensureRecords() {
  if (records) return records;
  if (!pendingLoad) pendingLoad = window.ageIndex.load('all')
    .then(items => { records = items; return items; })
    .finally(() => { pendingLoad = null; });
  return pendingLoad;
}

async function showResults() {
  const version = ++requestVersion;
  section.hidden = false;
  results.replaceChildren();
  if (!currentQuery) { label.textContent = 'Enter a search term.'; return; }
  label.textContent = 'Loading search index…';
  try {
    await ensureRecords();
    if (version !== requestVersion) return;
    const networks = new Set(records.flatMap(item => item.networks || []));
    note.textContent = `${records.length} indexed resources · ${networks.size} networks · Source checks do not establish ownership or safety`;
    render(searchEntities(currentQuery), currentQuery);
    section.scrollTop = 0;
  } catch (error) {
    if (version !== requestVersion) return;
    label.textContent = 'Search index unavailable.';
    results.append(element('p', 'empty-state', 'Check your connection and try again.'));
    const retry = element('button', 'quick-search', 'Retry search');
    retry.type = 'button';
    retry.addEventListener('click', showResults);
    results.append(retry);
  }
}

function runSearch(query) {
  currentQuery = query.trim().slice(0, 200);
  input.value = currentQuery;
  pageSize = 20;
  updateURL();
  showResults();
}

function updateSuggestions() {
  quickLinks.replaceChildren();

  for (const [title, query] of suggestions[mode]) {
    const button = element('button', 'quick-search', title);
    button.type = 'button';
    button.dataset.query = query;
    button.addEventListener('click', () => runSearch(query));
    quickLinks.append(button);
  }
}

function selectMode(next, updateHistory = true) {
  if (!['1age', 'solana'].includes(next)) return;

  mode = next;
  buttons.forEach(button => {
    button.setAttribute(
      'aria-pressed',
      String(button.dataset.searchMode === mode)
    );
  });

  input.placeholder = document.body.dataset.searchScope
    ? 'Search ' + document.title.replace(/^1AGE /, '') + '…'
    : 'Search the blockchain community…';
  note.textContent = 'Independent multichain index · Listings show their review status';

  updateSuggestions();
  if (updateHistory) updateURL();

  if (!section.hidden) showResults();
}

buttons.forEach(button => {
  button.addEventListener('click', () => {
    selectMode(button.dataset.searchMode);
  });
});

form.addEventListener('submit', event => {
  event.preventDefault();
  runSearch(input.value);
});

function closeResults() {
  requestVersion++;
  section.hidden = true;
  input.focus({preventScroll: true});
}

document.querySelector('[data-close-results]')
  ?.addEventListener('click', closeResults);

for (const node of [form, section]) {
  node.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeResults();
  });
}

const params = new URLSearchParams(window.location.search);
selectMode('1age', false);

const initialQuery = params.get('q');
if (initialQuery) {
  currentQuery = initialQuery.trim();
  input.value = currentQuery;
  document.querySelector('.search-circle')?.setAttribute(
    'aria-expanded', 'true'
  );
  form.hidden = false;
  document.body.classList.add('search-open');
  showResults();
}

// Load data and the vendored engine only when search is used.
input.addEventListener('focus', () => { ensureRecords().catch(() => {}); });
})();
