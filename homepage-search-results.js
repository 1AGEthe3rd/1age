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
const originalHub=$('.header-hub');
const menuHome=document.createComment('original 1AGE menu position');originalHub.before(menuHome);
const workspaceTop=element('div','search-workspace-top');
const menuDock=element('div','search-menu-dock');
const navigation=element('nav','search-view-nav');navigation.setAttribute('aria-label','Search workspace views');
const back=element('button','search-home-back','← Home');back.type='button';back.addEventListener('click',closeResults);
const searchNav=element('button','search-view-button','Search');searchNav.type='button';
const discoverNav=element('button','search-view-button','Discover');discoverNav.type='button';
const savedNav=element('button','search-view-button','Saved');savedNav.type='button';
const profile=element('a','search-view-button','Page');profile.href='https://1age.page/';
navigation.append(back,searchNav,discoverNav,savedNav,profile);
const tabs=element('div','search-category-tabs');tabs.setAttribute('role','group');tabs.setAttribute('aria-label','Filter result type');
workspaceTop.append(menuDock,searchBar,navigation,tabs);section.prepend(workspaceTop);
const intelligence=element('section','search-intelligence');intelligence.setAttribute('aria-label','1AGE Intelligence');intelligence.hidden=true;
section.querySelector('.results-header').after(intelligence);
let view='search',category='all',ranked=[],saved=new Map(),loaded=false;
try{const stored=JSON.parse(localStorage.getItem('1age-search-saved-v1')||'[]');if(Array.isArray(stored))for(const record of stored.slice(0,100)){if(record&&typeof record.id==='string'&&typeof record.name==='string')saved.set(record.id,record);}}catch{}
function persist(){try{localStorage.setItem('1age-search-saved-v1',JSON.stringify([...saved.values()]));}catch{}}
function mountMenu(){if(originalHub.parentElement!==menuDock){window.dispatchEvent(new Event('1age-header-close'));menuDock.append(originalHub);}}
function restoreMenu(){window.dispatchEvent(new Event('1age-header-close'));menuHome.after(originalHub);}
label.tabIndex = -1;

let requestVersion = 0;
let pageSize = 20;
let mode = '1age';
let currentQuery = '';
let currentRecords = [];
const categories=[['all','All'],['networks','Networks'],['apps','Apps'],['community','Community'],['earn','Earn'],['assets','Assets'],['people','People'],['knowledge','Knowledge']];
const tabButtons=new Map();
for(const [id,title] of categories){
 const button=element('button','search-category',title);button.type='button';button.setAttribute('aria-pressed',String(id==='all'));
 button.addEventListener('click',()=>{category=id;pageSize=20;renderView();});tabs.append(button);tabButtons.set(id,button);
}
function matchesCategory(item,kind){
 const type=String(item.type||'').toLowerCase(),cat=String(item.category||'').toLowerCase();
 if(kind==='all')return true;
 if(kind==='networks')return ['blockchain','network','ledger','layer2'].includes(type)||['network','blockchain','distributed ledger','permissioned ledger'].includes(cat);
 if(kind==='community')return ['community','social','discussion','message','announcement'].includes(type)||['community','social'].includes(cat);
 if(kind==='earn')return ['opportunity','bounty','quest','job','grant','hackathon'].includes(type)||['opportunities','bounties','quests','jobs','grants','hackathons'].includes(cat);
 if(kind==='assets')return ['nft','token','parcel','land','estate','asset','collection','property','listing','marketplace_listing'].includes(type)||['nft','nfts','tokens','virtual land','digital assets','property','properties'].includes(cat);
 if(kind==='people')return ['person','profile','creator','identity'].includes(type)||['people','identity'].includes(cat);
 if(kind==='knowledge')return ['tool','documentation','content','article','research','proposal','repository','tutorial'].includes(type)||['documentation','developer tools','content','research','governance'].includes(cat);
 return ['project','defi','wallet','explorer','platform','game','games','exchange','space','marketplace','shop','store','world','cash','design','membership'].includes(type);
}
function setView(next){if(next==='search'&&view!=='search'){showResults();return;}view=next;category='all';pageSize=20;renderView();}
searchNav.addEventListener('click',()=>setView('search'));
savedNav.addEventListener('click',()=>setView('saved'));
discoverNav.addEventListener('click',async()=>{
 if(view==='discover')return;
 const version=++requestVersion;view='discover';category='all';pageSize=20;loaded=false;ranked=[];renderView();
 try{const records=await window.ageIndex.load('all');if(version!==requestVersion||view!=='discover')return;currentRecords=records;ranked=records;loaded=true;renderView();}
 catch{if(version!==requestVersion)return;loaded=true;label.textContent='Discovery index unavailable';results.replaceChildren(element('p','empty-state','Return to Search and try again.'));}
});
function updateNavigation(){
 for(const [name,node] of [['search',searchNav],['discover',discoverNav],['saved',savedNav]])node.setAttribute('aria-pressed',String(view===name));
 for(const [id,button] of tabButtons)button.setAttribute('aria-pressed',String(category===id));
}
function renderIntelligence(items){
 intelligence.replaceChildren();intelligence.hidden=view!=='search'||!items.length;
 if(intelligence.hidden)return;
 const heading=element('h2','intelligence-heading','✦ 1AGE Intelligence');
 const status=element('span','intelligence-status','Index overview · not generative AI');
 intelligence.append(heading,status);
 const top=items.find(item=>item.description&&window.ageIndex.validLink(item));
 if(top){const p=element('p','intelligence-answer',top.name+' — '+top.description);intelligence.append(p);
  const source=element('a','intelligence-source','Source: '+top.name+' ↗');source.href=window.ageIndex.validLink(top).href;source.target='_blank';source.rel='noopener noreferrer';intelligence.append(source);}
 const overview=element('details','intelligence-more');overview.append(element('summary','','Explore indexed matches'));
 for(const item of items.slice(0,5)){const url=window.ageIndex.validLink(item);if(!url)continue;const link=element('a','intelligence-source',item.name+' ↗');link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';overview.append(link);}
 intelligence.append(overview);
}
function renderView(){
 updateNavigation();const records=view==='saved'?[...saved.values()]:ranked;
 const items=records.filter(item=>matchesCategory(item,category));renderIntelligence(items);render(items,currentQuery);
 if(view==='saved')label.textContent=items.length+' saved '+(items.length===1?'result':'results')+' · stored on this device';
 if(view==='discover')label.textContent=loaded?items.length+' indexed resources':'Loading discovery…';
 if(view==='search'&&!loaded)label.textContent='Loading search index…';
}
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
      view==='saved'?'No saved results in this category. Use the bookmark button on a search result.':view!=='saved'&&!loaded?'Loading indexed resources…':'No indexed matches in this category. Try All or a different query. Individual assets, messages and opportunities are shown only when indexed.'
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
    const bookmark=element('button','result-bookmark',saved.has(entity.id)?'★':'☆');bookmark.type='button';bookmark.setAttribute('aria-label',saved.has(entity.id)?'Remove saved result':'Save result');bookmark.setAttribute('aria-pressed',String(saved.has(entity.id)));
    bookmark.addEventListener('click',()=>{if(saved.has(entity.id))saved.delete(entity.id);else {if(saved.size>=100){bookmark.title='Saved results limit reached';return;}saved.set(entity.id,entity);}persist();if(view==='saved'){renderView();return;}bookmark.textContent=saved.has(entity.id)?'★':'☆';bookmark.setAttribute('aria-pressed',String(saved.has(entity.id)));bookmark.setAttribute('aria-label',saved.has(entity.id)?'Remove saved result':'Save result');});
    top.append(context,name);card.append(bookmark,top);
    if(url)card.append(element('p','result-domain',url.hostname));
    if(entity.description)card.append(element('p','result-description',entity.description));
    // Optional structured fields: render only data supplied by a real indexed record.
    const facts=element('dl','result-facts');
    for(const [key,title] of [['reward','Reward'],['deadline','Deadline'],['price','Price'],['coordinates','Coordinates'],['availability','Availability'],['provider','Platform']]){
     const value=entity[key];if((typeof value!=='string'&&typeof value!=='number')||String(value).length>180)continue;
     facts.append(element('dt','',title),element('dd','',String(value)));
    }
    if(facts.children.length)card.append(facts);
    if(view==='saved')card.append(element('p','result-status','Saved snapshot · check original source for updates'));
    const actions=element('div','result-actions');
    if(url)actions.append(linkTo(url,['bounty','quest','job','parcel','land','nft','token','listing','marketplace_listing','property','asset'].includes(String(entity.type).toLowerCase())?'Open listing ↗':'Open source ↗','result-primary'));
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
  view='search';category='all';ranked=[];loaded=false;
  section.hidden = false;
  document.body.classList.add('results-open', 'search-open');mountMenu();updateNavigation();intelligence.hidden=true;
  form.hidden = false;
  document.querySelector('.search-circle')?.setAttribute('aria-expanded','true');
  if(form.parentElement!==searchBar)searchBar.append(form);
  results.replaceChildren();
  if (!currentQuery) { label.textContent = 'Enter a search term.'; return; }
  label.textContent = 'Loading search index…';
  try {
    const records = await window.ageIndex.load('all', currentQuery);
    if (version !== requestVersion||view!=='search') return;
    const info = window.ageIndex.info();
    note.textContent = `${info.records} indexed resources · ${info.networks} networks · ${info.fallback ? 'Backup data loaded · ' : ''}Source checks do not establish ownership or safety${window.ageSearchCore.plan(currentQuery).requestedTop ? ' · Ranked by relevance, not popularity' : ''}`;
    ranked=searchEntities(currentQuery, records);loaded=true;if(view==='search')renderView();
    section.scrollTop = 0;
  } catch (error) {
    if (version !== requestVersion||view!=='search') return;
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
  restoreMenu();section.hidden = true;
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
