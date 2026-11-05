(() => {
  const hoverable = matchMedia('(hover: hover)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  document.querySelectorAll('.living-ticker').forEach(ticker => {
    const disclosure = ticker.querySelector('details');
    const headline = ticker.querySelector('.ticker-headline');
    const viewport = headline.parentElement;
    const pause = ticker.querySelector('.ticker-pause');
    const announcements = [...ticker.querySelectorAll('[data-animation]')]
      .sort((a, b) => Number(b.dataset.priority || 0) - Number(a.dataset.priority || 0));

    let index = 0;
    let timer;
    let animation;
    let paused = false;

    function showAnnouncement() {
      clearTimeout(timer);
      animation?.cancel();
      const announcement = announcements[index];
      headline.textContent = announcement.querySelector('strong').textContent;
      headline.classList.remove('ticker-moving');

      if ((matchMedia('(min-width:700px) and (orientation:landscape)').matches && document.body.classList.contains('search-open')) || paused || disclosure.open || reducedMotion.matches || document.hidden ||
          ticker.querySelector('summary').matches(':focus-visible') ||
          (hoverable.matches && ticker.matches(':hover'))) return;

      const hold = Number(announcement.dataset.duration) || 4000;
      let duration = hold;
      let frames;

      switch (announcement.dataset.animation) {
        case 'up':
          frames = [
            { transform: 'translateY(100%)' },
            { transform: 'translateY(0)', offset: .13 },
            { transform: 'translateY(0)', offset: .87 },
            { transform: 'translateY(-100%)' },
          ];
          break;
        case 'left':
        case 'right': {
          headline.classList.add('ticker-moving');
          const rightward = announcement.dataset.animation === 'right';
          const start = rightward ? -headline.offsetWidth : viewport.clientWidth;
          const end = rightward ? viewport.clientWidth : -headline.offsetWidth;
          duration = Math.max(hold, Math.abs(end - start) / (Number(announcement.dataset.speed) || 65) * 1000);
          frames = [{ transform: `translateX(${start}px)` }, { transform: `translateX(${end}px)` }];
          break;
        }
        case 'full':
          frames = [{ opacity: .55 }, { opacity: 1, offset: .12 }, { opacity: 1 }];
          break;
        case 'glow':
          frames = [
            { textShadow: '0 0 0 transparent' },
            { textShadow: '0 0 .55rem #1bfd9c', offset: .45 },
            { textShadow: '0 0 0 transparent' },
          ];
          break;
      }

      if (frames) animation = headline.animate(frames, { duration, fill: 'both' });
      timer = setTimeout(() => {
        index = (index + 1) % announcements.length;
        showAnnouncement();
      }, duration);
    }

    pause.addEventListener('click', () => {
      paused = !paused;
      pause.querySelector('span').textContent = paused ? '▶' : 'Ⅱ';
      pause.setAttribute('aria-label', paused ? 'Resume announcements' : 'Pause announcements');
      pause.setAttribute('aria-pressed', String(paused));
      showAnnouncement();
    });
    disclosure.addEventListener('toggle', showAnnouncement);
    ticker.addEventListener('pointerenter', showAnnouncement);
    ticker.addEventListener('pointerleave', showAnnouncement);
    ticker.addEventListener('focusin', showAnnouncement);
    ticker.addEventListener('focusout', () => requestAnimationFrame(showAnnouncement));
    reducedMotion.addEventListener('change', () => {
      pause.hidden = reducedMotion.matches;
      showAnnouncement();
    });
    document.addEventListener('visibilitychange', showAnnouncement);
    new MutationObserver(showAnnouncement).observe(document.body, {attributes: true, attributeFilter: ['class']});
    new ResizeObserver(showAnnouncement).observe(viewport);
    pause.hidden = reducedMotion.matches;
  });
})();
