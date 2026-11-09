(() => {
  const ticker = document.querySelector('.living-ticker');
  const search = document.querySelector('.search-home');
  if (!ticker || !search) return;
  const marker = document.createComment('mobile ticker position');
  ticker.before(marker);
  const desktop = matchMedia('((min-width:700px) and (orientation:landscape)) or ((orientation:landscape) and (max-height:600px) and (any-pointer:coarse))');
  function placeTicker() {
    if (desktop.matches) search.append(ticker);
    else marker.after(ticker);
  }
  desktop.addEventListener('change', placeTicker);
  placeTicker();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.classList.add('ticker-positioned');
    });
  });
  window.addEventListener('load', placeTicker, {once:true});
  window.addEventListener('orientationchange', placeTicker);
})();
