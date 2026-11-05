(() => {
  const ticker = document.querySelector('.living-ticker');
  const search = document.querySelector('.search-home');
  if (!ticker || !search) return;
  const marker = document.createComment('mobile ticker position');
  ticker.before(marker);
  const desktop = matchMedia('(min-width:700px) and (orientation:landscape)');
  function placeTicker() {
    if (desktop.matches) search.append(ticker);
    else marker.after(ticker);
  }
  desktop.addEventListener('change', placeTicker);
  placeTicker();
})();
