(() => {
  const apps = {
    games: { name: 'Games', links: [['Discover Games', '/apps/games/'], ['Explore 1AGE World', '/world/']] },
    page: { name: 'Page', links: [['Open the profile editor', '/apps/page/']] },
    exchange: { name: 'Exchange', links: [['Open the conversion sandbox', '/apps/exchange/']] },
    space: { name: 'Space', links: [['Open the Spaces directory workspace', '/apps/space/']] },
    design: { name: 'Design', links: [['Open the design studio', '/apps/design/']] },
    quest: { name: 'Quest', links: [['Open the quest workspace', '/apps/quest/']] },
    cash: { name: 'Cash', links: [['Open the local ledger', '/apps/cash/']] },
    plus: { name: 'Plus', links: [['Open membership preferences', '/apps/plus/']] },
    app: { name: 'App', links: [['Open the application directory', '/apps/app/']] },
    store: { name: 'Store', links: [['Open the local storefront workspace', '/apps/store/']] },
    shop: { name: 'Shop', links: [['Open the local shopping workspace', '/apps/shop/']] },
    world: { name: 'World', links: [['Open 1AGE World launch options', '/world/']] },
  };
  const requested = new URLSearchParams(location.search).get('app') || document.body.dataset.homeApp;
  const slug = Object.hasOwn(apps, requested) ? requested : null;
  const config = apps[slug];
  const homeURL = app => '/home/' + encodeURIComponent(app) + '/';
  const workspace = document.body.dataset.app;
  const spatialApps = new Set(['world', 'games', 'page', 'space', 'exchange', 'quest', 'cash', 'design']);

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
  const searchURL = query => homeURL(slug) + '?q=' + encodeURIComponent(query);
  const categories = {
    games: [['Play', '/apps/games/', 'games'], ['Discover', searchURL('games'), 'games'], ['Sports', searchURL('sports'), 'quest'], ['World', '/world/', 'space']],
    page: [['My Page', '/apps/page/', 'page'], ['Community', searchURL('community'), 'space'], ['Profiles', searchURL('profile'), 'page']],
    exchange: [['Convert', '/apps/exchange/', 'exchange'], ['Markets', searchURL('market'), 'exchange'], ['Tokens', searchURL('token'), 'cash']],
    space: [['My Spaces', '/apps/space/', 'space'], ['Discover', searchURL('space'), 'space'], ['Businesses', searchURL('business'), 'page']],
    design: [['Create', '/apps/design/', 'quest'], ['Tools', searchURL('design'), 'quest'], ['Spaces', homeURL('space'), 'space']],
    quest: [['My Quests', '/apps/quest/', 'quest'], ['Opportunities', searchURL('opportunity'), 'quest'], ['Games', homeURL('games'), 'games']],
    cash: [['My Ledger', '/apps/cash/', 'cash'], ['Exchange', homeURL('exchange'), 'exchange'], ['About Cash', '/ecosystem/#cash', 'cash']],
    plus: [['Preferences', '/apps/plus/', 'home'], ['Membership', '/plus/', 'page']],
    app: [['Applications', '/apps/app/', 'home'], ['Search', '/apps/search/', 'page']],
    store: [['My Store', '/apps/store/', 'home'], ['Shop', homeURL('shop'), 'cash']],
    shop: [['My Catalog', '/apps/shop/', 'home'], ['Store', homeURL('store'), 'cash']],
    world: [['Launch options', '/world/', 'space'], ['Spaces', homeURL('space'), 'space'], ['Games', homeURL('games'), 'games']],
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
  const description = 'Explore ' + name + ' through the shared 1AGE interface.';
  const metadata = { 'meta[name="description"]': description, 'meta[property="og:title"]': name,
    'meta[property="og:site_name"]': name, 'meta[property="og:description"]': description,
    'meta[property="og:url"]': 'https://1age.com/' + homeURL(slug).slice(1) };
  for (const [selector, content] of Object.entries(metadata)) document.querySelector(selector)?.setAttribute('content', content);
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', 'https://1age.com/' + homeURL(slug).slice(1));
  for (const link of document.querySelectorAll('link[rel="icon"]')) link.remove();
  const favicon = document.createElement('link');
  favicon.rel = 'icon'; favicon.type = 'image/svg+xml'; favicon.href = '/assets/app-icons/' + slug + '.svg';
  document.head.append(favicon);
  const touchIcon = document.querySelector('link[rel="apple-touch-icon"]');
  if (touchIcon) { touchIcon.href = '/assets/app-icons/' + slug + '.png'; touchIcon.setAttribute('sizes', '96x96'); }
  document.querySelector('#search-title').textContent = 'Search ' + name;
  document.querySelector('#search-input').placeholder = 'Search ' + config.name + '…';
  document.querySelector('#search-input').setAttribute('aria-label', 'Search ' + name);
  const entry = document.querySelector('.world-entry');
  entry.href = spatialApps.has(slug) ? 'oneage://world/enter?destination=' + slug : destination;
  entry.setAttribute('aria-label', spatialApps.has(slug) ? 'Enter 1AGE ' + config.name + ' 3D on this computer' : title);
  entry.textContent = spatialApps.has(slug) ? 'Enter' : 'Open app';
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
