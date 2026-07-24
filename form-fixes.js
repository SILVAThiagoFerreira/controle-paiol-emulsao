(() => {
  const $ = (selector) => document.querySelector(selector);
  const enforceFormRules = () => {
    const type = $('#recordType');
    const category = $('#recordCategory');
    $('#recordClass')?.closest('label')?.remove();
    const exitMode = type?.value === 'Saída';
    ['recordCategory', 'recordTank', 'recordQty', 'recordNote', 'recordOrigin', 'recordDestination']
      .forEach((id) => $(`#${id}`)?.closest('label')?.classList.toggle('hidden', exitMode));
    $('.movement-fields')?.classList.toggle('hidden', exitMode);
    $('#closingStockPanel')?.classList.toggle('hidden', !exitMode);
    if (exitMode && $('#modalTitle')) $('#modalTitle').textContent = 'Fechamento diário';
    if (type?.value === 'Entrada' && category) {
      category.value = 'EBE';
      category.disabled = true;
      if ($('#modalTitle')) $('#modalTitle').textContent = 'Registrar entrada';
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
