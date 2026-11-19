(() => {
  const ticker = document.querySelector('.living-ticker');
  const search = document.querySelector('.search-home');
  if (!ticker || !search) return;
  const marker = document.createComment('mobile ticker position');
  ticker.before(marker);
  const compactTouch = matchMedia('(orientation:landscape) and (max-height:900px) and (max-width:1400px) and (any-pointer:coarse), (orientation:landscape) and (max-height:600px) and (pointer:coarse)');
  function placeTicker() {
    if (compactTouch.matches) search.append(ticker);
    else marker.after(ticker);
  }
  compactTouch.addEventListener('change', placeTicker);
  placeTicker();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.classList.add('ticker-positioned');
    });
  });
  window.addEventListener('load', placeTicker, {once:true});
  window.addEventListener('orientationchange', placeTicker);
})();
