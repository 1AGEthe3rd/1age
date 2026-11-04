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

  control.addEventListener('click', () => setExpanded(form.hidden));
  if (form.closest('.workspace-search')) {
    form.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      setExpanded(false);
      control.focus();
    });
  }
})();
