(() => {
  const control = document.querySelector('.search-circle');
  const form = document.querySelector('#search-form');
  if (!control || !form) return;

  function setExpanded(expanded) {
    control.setAttribute('aria-expanded', String(expanded));
    form.hidden = !expanded;
    document.body.classList.toggle('search-open', expanded);
    if (expanded) form.querySelector('#search-input').focus();
  }

  // Open search by default on mobile portrait.
  const portrait = matchMedia(
    '(orientation: portrait) and (max-width: 700px) and (pointer: coarse)'
  );

  function initializePortraitSearch() {
    if (!portrait.matches || !form.hidden) return;
    control.setAttribute('aria-expanded', 'true');
    form.hidden = false;
    document.body.classList.add('search-open');
  }

  initializePortraitSearch();
  portrait.addEventListener('change', initializePortraitSearch);

  control.addEventListener('click', () => setExpanded(form.hidden));
  form.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    setExpanded(false);
    control.focus();
  });
})();
