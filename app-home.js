(() => {
  const apps = {
    games: { name: 'Games', links: [['Discover Games', '/apps/games/'], ['Explore 1AGE World', '/world/']] },
    page: { name: 'Page', links: [['Open the profile editor', '/apps/page/']] },
    exchange: { name: 'Exchange', links: [['Open the conversion sandbox', '/apps/exchange/']] },
    space: { name: 'Space', links: [['Open the Spaces directory workspace', '/apps/space/']] },
    design: { name: 'Design', links: [['Open the design studio', '/apps/design/']] },
    quest: { name: 'Quest', links: [['Open the quest workspace', '/apps/quest/']] },
    cash: { name: 'Cash', links: [['Open the local ledger', '/apps/cash/']] },
  };
  const requested = new URLSearchParams(location.search).get('app');
  const slug = Object.hasOwn(apps, requested) ? requested : null;
  const config = apps[slug];
  const homeURL = app => '/?app=' + encodeURIComponent(app);
  const workspace = document.body.dataset.app;

  if (Object.hasOwn(apps, workspace)) {
    const nav = document.querySelector('header nav');
    nav.querySelector('a[href="/"]').href = homeURL(workspace);
    const searchLink = nav.querySelector('a[href="/apps/search/"]');
    const search = document.createElement('div');
    search.className = 'workspace-search';
    search.innerHTML = `
      <button type="button" class="search-circle" aria-label="Open search"
              aria-expanded="false" aria-controls="search-form">⌕</button>
      <form id="search-form" action="/" role="search" hidden>
        <input type="hidden" name="app">
        <input type="search" id="search-input" name="q" required>
        <button type="submit">Search</button>
      </form>`;
    search.querySelector('[name="app"]').value = workspace;
    const input = search.querySelector('#search-input');
    input.setAttribute('aria-label', 'Search 1AGE ' + apps[workspace].name);
    input.placeholder = 'Search 1AGE ' + apps[workspace].name + '…';
    searchLink.replaceWith(search);
  }

  const orbit = document.querySelector('.project-orbit');
  if (!orbit) return;


  const icons = new Map([...orbit.querySelectorAll('.project-planet')].map(link =>
    [link.pathname.split('/')[2], link.querySelector('svg').cloneNode(true)]));
  const accents = { page: '#55B8FF', space: '#E2FFDC', games: '#FFBB55', exchange: '#50E3D4', quest: '#C18BFF', cash: '#1BFD9C' };
  const searchURL = query => homeURL(slug) + '&q=' + encodeURIComponent(query);
  const categories = {
    games: [['Play', '/apps/games/', 'games'], ['Discover', searchURL('games'), 'games'], ['Sports', searchURL('sports'), 'quest'], ['World', '/world/', 'space']],
    page: [['My Page', '/apps/page/', 'page'], ['Community', searchURL('community'), 'space'], ['Profiles', searchURL('profile'), 'page']],
    exchange: [['Convert', '/apps/exchange/', 'exchange'], ['Markets', searchURL('market'), 'exchange'], ['Tokens', searchURL('token'), 'cash']],
    space: [['My Spaces', '/apps/space/', 'space'], ['Discover', searchURL('space'), 'space'], ['Businesses', searchURL('business'), 'page']],
    design: [['Create', '/apps/design/', 'quest'], ['Tools', searchURL('design'), 'quest'], ['Spaces', homeURL('space'), 'space']],
    quest: [['My Quests', '/apps/quest/', 'quest'], ['Opportunities', searchURL('opportunity'), 'quest'], ['Games', homeURL('games'), 'games']],
    cash: [['My Ledger', '/apps/cash/', 'cash'], ['Exchange', homeURL('exchange'), 'exchange'], ['About Cash', '/ecosystem/#cash', 'cash']],
  };

  if (!config) {
    for (const link of orbit.querySelectorAll('.project-planet')) {
      const app = link.pathname.split('/')[2];
      if (Object.hasOwn(apps, app)) link.href = homeURL(app);
    }
    return;
  }

  const name = '1AGE ' + config.name;
  const [title, destination] = config.links[0];
  document.body.dataset.searchScope = slug;
  document.title = name;
  document.querySelector('#search-title').textContent = 'Search ' + name;
  document.querySelector('#search-input').placeholder = 'Search ' + config.name + '…';
  document.querySelector('.world-entry').href = destination;
  document.querySelector('.world-entry').setAttribute('aria-label', title);
  const brand = document.querySelector('.brand');
  brand.setAttribute('aria-label', config.name + ' menu');
  brand.style.setProperty('--app-accent', accents[slug] || '#1BFD9C');
  brand.querySelector('.brand-name').textContent = config.name;
  const brandVisual = icons.has(slug) ? icons.get(slug).cloneNode(true) : document.querySelector('.brand img').cloneNode();
  brand.querySelector('.brand-circle').replaceChildren(brandVisual);

  orbit.replaceChildren(...[...categories[slug], ['1AGE', '/', 'home']].map(([label, href, icon], i) => {
    const planet = document.createElement('a');
    planet.className = 'project-planet';
    planet.href = href;
    planet.dataset.slot = i;
    planet.style.setProperty('--accent', accents[icon] || '#1BFD9C');
    planet.setAttribute('aria-label', 'Open ' + label);
    const visual = icon === 'home' ? Object.assign(document.createElement('img'), {src: '/assets/1age-logo.svg', alt: ''}) : icons.get(icon).cloneNode(true);
    visual.setAttribute('aria-hidden', 'true');
    const caption = document.createElement('span');
    caption.textContent = label;
    planet.append(visual, caption);
    return planet;
  }));
})();
