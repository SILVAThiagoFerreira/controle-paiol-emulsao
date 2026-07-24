(() => {
  const $ = (selector) => document.querySelector(selector);
  const enforceFormRules = () => {
    const type = $('#recordType');
    const category = $('#recordCategory');
    $('#recordClass')?.closest('label')?.remove();
    if (type?.value === 'Entrada' && category) {
      category.value = 'EBE';
      category.disabled = true;
    }
  };
  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-open-form]')) requestAnimationFrame(enforceFormRules);
  }, true);
  document.addEventListener('change', (event) => {
    if (event.target.id === 'recordType') requestAnimationFrame(enforceFormRules);
  });
  new MutationObserver(enforceFormRules).observe(document.body, { childList: true, subtree: true });
  enforceFormRules();
})();
