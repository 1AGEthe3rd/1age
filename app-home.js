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

  for (const link of orbit.querySelectorAll('.project-planet')) {
    const app = link.pathname.split('/')[2];
    if (Object.hasOwn(apps, app)) link.href = homeURL(app);
  }

  if (!config) return;
  const name = '1AGE ' + config.name;
  const [title, destination] = config.links[0];
  document.body.dataset.searchScope = slug;
  document.title = name;
  document.querySelector('#search-title').textContent = 'Search ' + name;
  document.querySelector('#search-input').placeholder = 'Search ' + name + '…';
  document.querySelector('.world-entry').href = destination;
  document.querySelector('.world-entry').setAttribute('aria-label', title);

  const returnLink = document.createElement('a');
  returnLink.className = 'app-home-return';
  returnLink.href = '/';
  returnLink.textContent = '1AGE Home';
  document.querySelector('.search-home').after(returnLink);

  const list = document.querySelector('.ticker-details');
  list.replaceChildren(...config.links.map(([label, href], i) => {
    const item = document.createElement('li');
    item.dataset.animation = i === 0 ? 'up' : 'full';
    const headline = document.createElement('strong');
    headline.textContent = label;
    const link = document.createElement('a');
    link.href = href;
    link.textContent = label;
    item.append(headline, link);
    return item;
  }));
  document.querySelector('.ticker-headline').textContent = title;
})();
