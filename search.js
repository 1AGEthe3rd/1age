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

const indexes = { '1age': null, solana: null };
let mode = '1age';
let currentQuery = '';
let loadError = null;

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
  return window.ageIndex.search(indexes[mode], query, document.body.dataset.searchScope);
}

function render(items, query) {
  results.replaceChildren();
  label.textContent =
    `${items.length} ${items.length === 1 ? 'result' : 'results'} ` +
    `for “${query}”`;

  if (!items.length) {
    results.append(element(
      'p', 'empty-state',
      'No matching public entries in this early index.'
    ));
    return;
  }

  for (const entity of items) {
    const card = element('article', 'result-card');
    const top = element('div', 'result-topline');

    top.append(
      element('h2', '', entity.name),
      element('span', 'result-type', entity.type)
    );

    card.append(
      top,
      element(
        'p', 'result-status',
        (entity.id === '1age' || entity.id?.startsWith('1age-'))
          ? '1AGE · Ecosystem listing'
          : 'Blockchain community · Directory listing'
      ),
      element('p', 'result-description', entity.description)
    );

    const authenticity = window.ageIndex.authenticity(entity);
    card.append(element('p', 'result-status', authenticity.label));
    if (authenticity.reviewedOn) {
      card.append(element('p', 'result-status', 'Evidence reviewed ' + authenticity.reviewedOn));
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
}

function updateURL() {
  const url = new URL(window.location.href);
  if (currentQuery) url.searchParams.set('q', currentQuery);
  else url.searchParams.delete('q');

  if (mode === 'solana') url.searchParams.set('mode', 'solana');
  else url.searchParams.delete('mode');

  window.history.replaceState(null, '', url);
}

function showResults() {
  section.hidden = false;
  results.replaceChildren();

  if (loadError) {
    label.textContent = 'Search index unavailable.';
    results.append(element(
      'p', 'empty-state',
      'The search data could not be loaded. Please try again later.'
    ));
    return;
  }

  if (!indexes[mode]) {
    label.textContent = 'Loading search index…';
    return;
  }

  if (!currentQuery) {
    label.textContent = 'Enter a search term.';
    return;
  }

  render(searchEntities(currentQuery), currentQuery);
  section.scrollTop = 0;
}

function runSearch(query) {
  currentQuery = query.trim();
  if (!currentQuery) return;
  input.value = currentQuery;
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
  note.textContent = 'Early blockchain index · Listings show their review status';

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

(async () => {
  try {
    const [ageData, solanaData] = await Promise.all([
      window.ageIndex.load('1age'),
      window.ageIndex.load('solana')
    ]);
    indexes['1age'] = [...ageData, ...solanaData];
    indexes.solana = solanaData;

    if (!section.hidden) showResults();
  } catch (error) {
    loadError = error;
    console.error('1AGE Search index error:', error);
    if (!section.hidden) showResults();
  }
})();
})();
