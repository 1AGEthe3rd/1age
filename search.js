(() => {
'use strict';
let entities = [], ready = false, pendingQuery = '';
const searchForm = document.querySelector('#search-form');
if (!searchForm) return;
const searchInput = document.querySelector('#search-input');
const results = document.querySelector('#results');
const resultsLabel = document.querySelector('#results-label');
const resultsSection = document.querySelector('#results-section');
const quickSearchButtons = document.querySelectorAll('.quick-search');
function closeResults() {
 if(resultsSection)resultsSection.hidden=true;
 searchInput.focus({preventScroll:true});
}
document.querySelector('[data-close-results]')?.addEventListener('click',closeResults);
searchForm.addEventListener('keydown',event=>{if(event.key==='Escape')closeResults();});
resultsSection?.addEventListener('keydown',event=>{if(event.key==='Escape')closeResults();});
function normalize(value) {
    return String(value ?? "").toLowerCase().trim();
}

function scoreEntity(entity, query) {
    const terms = normalize(query)
        .split(/\s+/)
        .filter(Boolean);

    let score = 0;

    const name = normalize(entity.name);
    const type = normalize(entity.type);
    const category = normalize(entity.category);
    const description = normalize(entity.description);
    const tags = (entity.tags || []).map(normalize);

    for (const term of terms) {
        if (name === term) {
            score += 20;
        } else if (name.includes(term)) {
            score += 12;
        }

        if (type.includes(term)) {
            score += 8;
        }

        if (category.includes(term)) {
            score += 8;
        }

        if (tags.some(tag => tag === term)) {
            score += 10;
        } else if (tags.some(tag => tag.includes(term))) {
            score += 6;
        }

        if (description.includes(term)) {
            score += 3;
        }
    }

    return score;
}

function searchEntities(query) {
    return entities
        .map(entity => ({
            ...entity,
            score: scoreEntity(entity, query)
        }))
        .filter(entity => entity.score > 0)
        .sort((a, b) => b.score - a.score);
}


function element(tag, className, text) {
 const node = document.createElement(tag); node.className = className;
 if (text !== undefined) node.textContent = text;
 return node;
}
function renderResults(items, query) {
 results.replaceChildren();
 resultsLabel.textContent = `${items.length} ${items.length === 1 ? 'result' : 'results'} for “${query}”`;
 if (!items.length) {
  results.append(element('p','empty-state','No matching entries yet. The early index is still small; try wallets, DeFi, developer tools or community.'));
  return;
 }
 for (const entity of items) {
  const card = element('article','result-card');
  const top = element('div','result-topline');
  top.append(element('h2','',entity.name),element('span','result-type',entity.type));
  card.append(top,element('p','result-status',`Directory entry · Reviewed ${entity.last_reviewed || 'date unavailable'}`),element('p','result-description',entity.description));
  const tags = element('div','result-tags');
  for (const tag of entity.tags || []) tags.append(element('span','',`#${tag}`));
  card.append(tags);
  try {
   const url = new URL(entity.official_links.website);
   if (url.protocol === 'https:') {
    const link = element('a','result-link','Visit website ↗');
    link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';card.append(link);
   }
  } catch (_) { /* An invalid directory link is omitted, not executed. */ }
  results.append(card);
 }
}
function runSearch(query) {
 const cleanQuery = query.trim();
 if (!cleanQuery) return;
 if (resultsSection) resultsSection.hidden = false;
 searchInput.value = cleanQuery;
 if (!ready) { pendingQuery = cleanQuery; resultsLabel.textContent='Loading the early index…'; return; }
 renderResults(searchEntities(cleanQuery), cleanQuery);
 const url = new URL(window.location.href);url.searchParams.set('q',cleanQuery);
 window.history.replaceState(null,'',url);
 if(resultsSection)resultsSection.scrollTop=0;
}
searchForm.addEventListener('submit',event=>{event.preventDefault();runSearch(searchInput.value);});
quickSearchButtons.forEach(button=>button.addEventListener('click',()=>runSearch(button.dataset.query)));
(async()=>{
 try {
  const response = await fetch('/data/entities.json');
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error('Invalid index');
  entities=data;ready=true;
  resultsLabel.textContent='Search the directory.';
  const query=pendingQuery || new URLSearchParams(window.location.search).get('q');
  if (query) runSearch(query);
 } catch (error) {
  if (resultsSection) resultsSection.hidden = false;
  resultsLabel.textContent='Interactive search is temporarily unavailable.';
  results.replaceChildren();
  const link=element('a','','Browse the readable directory instead ↗');link.href='/directory/';results.append(link);
  console.error('1AGE index could not load:',error);
 }
})();
})();
