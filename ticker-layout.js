(() => {
  const ticker = document.querySelector('.living-ticker');
  const search = document.querySelector('.search-home');
  if (!ticker || !search) return;
  const marker = document.createComment('mobile ticker position');
  ticker.before(marker);
  const compactTouch = {get matches(){return document.documentElement.dataset.touchLayout==='landscape';}};
  function placeTicker() {
    if (compactTouch.matches) search.append(ticker);
    else marker.after(ticker);
  }
  window.addEventListener('1age-layout-change', placeTicker);
  placeTicker();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.classList.add('ticker-positioned');
    });
  });
  window.addEventListener('load', placeTicker, {once:true});
  window.addEventListener('orientationchange', placeTicker);
})();
