(() => {
  const ticker = document.querySelector('.living-ticker');
  const viewport = ticker.querySelector('.ticker-window');
  const headline = ticker.querySelector('.ticker-headline');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  function fitHeadline() {
    headline.classList.remove('is-scrolling');
    const distance = headline.scrollWidth - viewport.clientWidth;
    // Longer headlines get a single pass, with total motion capped at five seconds.
    if (distance <= 0 || ticker.open || reducedMotion.matches) return;
    headline.style.setProperty('--ticker-distance', `-${distance}px`);
    headline.style.setProperty('--ticker-duration', `${Math.min(4, Math.max(1, distance / 45))}s`);
    headline.classList.add('is-scrolling');
  }

  new ResizeObserver(fitHeadline).observe(viewport);
  ticker.addEventListener('toggle', fitHeadline);
  reducedMotion.addEventListener('change', fitHeadline);
})();
