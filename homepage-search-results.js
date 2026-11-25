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
const formHome = document.createComment('homepage search position');
form.before(formHome);
const searchBar = document.createElement('div');
searchBar.className = 'results-searchbar';
const homeButton = document.createElement('button');
homeButton.type = 'button';homeButton.className = 'results-home';
homeButton.setAttribute('aria-label','Return to 1AGE home');
const homeLogo=document.createElement('img');
homeLogo.src='/assets/1age-logo.svg';homeLogo.alt='';homeLogo.width=44;homeLogo.height=44;
homeButton.append(homeLogo);
homeButton.addEventListener('click',closeResults);
searchBar.append(homeButton);section.prepend(searchBar);
label.tabIndex = -1;

let requestVersion = 0;
let pageSize = 20;
let mode = '1age';
let currentQuery = '';
let currentRecords = [];
const categorySelect = document.createElement('select');
categorySelect.setAttribute('aria-label', 'Filter search category');categorySelect.className='result-category-select';
for (const [value,title] of [['','All categories'],['projects','Projects'],['people','People'],['communities','Communities'],['social','Social'],['games','Games'],['space','Spaces'],['opportunities','Opportunities'],['content','Content'],['developers','Developers']]) {
 const option=document.createElement('option');option.value=value;option.textContent=title;categorySelect.append(option);
}
categorySelect.addEventListener('change',()=>{pageSize=20;render(searchEntities(currentQuery,currentRecords),currentQuery);});
label.after(categorySelect);


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

function searchEntities(query, records) {
  currentRecords=records;
  return window.ageIndex.search(records, query, categorySelect.value || document.body.dataset.searchScope);
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
    const card=element('article','result-card');
    const url=window.ageIndex.validLink(entity);
    function linkTo(destination,title,cls='result-link'){
      const a=element('a',cls,title);a.href=destination.href;
      if(destination.origin!==location.origin){a.target='_blank';a.rel='noopener noreferrer';}
      return a;
    }
    const top=element('div','result-topline'),context=element('div','result-context');
    context.append(element('span','result-type',entity.category||entity.type||'Resource'));
    const networks=(entity.networks||[]).join(' · ');
    if(networks)context.append(element('span','result-network',networks));
    const name=element('h2','result-title');
    if(url)name.append(linkTo(url,entity.name,'result-title-link'));else name.textContent=entity.name;
    top.append(context,name);card.append(top);
    if(url)card.append(element('p','result-domain',url.hostname));
    if(entity.description)card.append(element('p','result-description',entity.description));
    const actions=element('div','result-actions');
    if(url)actions.append(linkTo(url,'Open website ↗','result-primary'));
    const labels={docs:'Documentation',documentation:'Documentation',github:'GitHub',discord:'Discord',twitter:'X',x:'X',marketplace:'Marketplace',app:'Open app',explorer:'Explorer'};
    for(const [kind,destination] of Object.entries(entity.official_links||{})){
      if(kind==='website'||!destination)continue;
      const checked=window.ageIndex.validLink({official_links:{website:destination}});if(checked)actions.append(linkTo(checked,labels[kind.toLowerCase()]||kind));
    }
    if(actions.children.length)card.append(actions);
    const details=element('details','result-evidence');
    const authenticity=window.ageIndex.authenticity(entity);
    card.append(element('p','result-status result-review-summary',authenticity.label));
    details.append(element('summary','','Source & review details'));
    if(authenticity.reviewedOn)details.append(element('p','result-status','Evidence reviewed '+authenticity.reviewedOn));
    if(entity.source_review?.status==='source_checked'){
      const source=window.ageIndex.validLink({official_links:{website:entity.source_review.evidence?.[0]}});
      if(source)details.append(linkTo(source,'Public source checked '+entity.source_review.checked_on));
    }
    if(!entity.source_review&&entity.provenance?.length){
      const source=window.ageIndex.validLink({official_links:{website:entity.provenance[0].url}});
      if(source)details.append(linkTo(source,'Source: '+entity.provenance[0].attribution));
    }
    if(entity.updated_at)details.append(element('p','result-status','Metadata updated '+new Date(entity.updated_at).toLocaleDateString()));
    if(entity.quality_flags?.length)card.append(element('p','result-review-warning','Needs review: '+entity.quality_flags.map(flag=>flag.replaceAll('_',' ')).join(' · ')));
    if(entity.tags?.length)details.append(element('p','result-status','Topics: '+entity.tags.join(' · ')));
    card.append(details);
    const related=window.ageIndex.related(currentRecords,entity.id);
    if(related.length){
      const group=element('details','result-evidence result-related');group.append(element('summary','','Related resources'));
      const links=element('div','result-actions');
      for(const item of related.slice(0,8)){const destination=window.ageIndex.validLink(item);if(destination)links.append(linkTo(destination,item.name));}
      if(links.children.length){group.append(links);card.append(group);}
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

async function showResults() {
  const version = ++requestVersion;
  section.hidden = false;
  document.body.classList.add('results-open', 'search-open');
  form.hidden = false;
  document.querySelector('.search-circle')?.setAttribute('aria-expanded','true');
  if(form.parentElement!==searchBar)searchBar.append(form);
  results.replaceChildren();
  if (!currentQuery) { label.textContent = 'Enter a search term.'; return; }
  label.textContent = 'Loading search index…';
  try {
    const records = await window.ageIndex.load('all', currentQuery);
    if (version !== requestVersion) return;
    const info = window.ageIndex.info();
    note.textContent = `${info.records} indexed resources · ${info.networks} networks · ${info.fallback ? 'Backup data loaded · ' : ''}Source checks do not establish ownership or safety${window.ageSearchCore.plan(currentQuery).requestedTop ? ' · Ranked by relevance, not popularity' : ''}`;
    render(searchEntities(currentQuery, records), currentQuery);
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
  if(!query.trim()){input.focus();return;}
  currentQuery = query.trim().slice(0, 200);
  input.value = currentQuery;
  pageSize = 20;
  updateURL();
  input.blur();
  showResults();
  label.focus({preventScroll:true});
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

// Typing only edits the query. Submit explicitly to load or refresh results.
form.addEventListener('submit', event => {
  event.preventDefault();
  runSearch(input.value);
});

function closeResults() {
  requestVersion++;
  section.hidden = true;
  document.body.classList.remove('results-open','search-open');
  formHome.after(form);form.hidden = true;
  const control=document.querySelector('.search-circle');
  control?.setAttribute('aria-expanded','false');
  currentQuery='';updateURL();
  control?.focus({preventScroll:true});
  window.dispatchEvent(new Event('1age-home-restored'));
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
input.addEventListener('focus', () => { window.ageIndex.prepare().catch(() => {}); });
})();
