const initialTanks = [
  { id: 'UMB 1072', category: 'UMB', capacity: 12000, icon: 'VISUAL/ICONE UMB.png' },
  { id: 'UMB 1123', category: 'UMB', capacity: 10500, icon: 'VISUAL/ICONE UMB.png' },
  { id: 'EBE 1', category: 'EBE', capacity: 42000, icon: 'VISUAL/ICONE EBE.png' },
  { id: 'EBE 2', category: 'EBE', capacity: 42000, icon: 'VISUAL/ICONE EBE.png' },
  { id: 'EBE 3', category: 'EBE', capacity: 42000, icon: 'VISUAL/ICONE EBE.png' },
];

const initialRecords = [
  ['EBE 1', 16389],
  ['EBE 2', 40741],
  ['EBE 3', 42193],
  ['UMB 1123', 10500],
  ['UMB 1072', 12000],
].map(([tank, qty]) => ({
  id: `initial-${tank.toLowerCase().replaceAll(' ', '-')}`,
  date: '2026-07-24',
  type: 'Entrada',
  category: tank.startsWith('EBE') ? 'EBE' : 'UMB',
  tank,
  qty,
  note: 'Estoque inicial',
}));

const state = {
  tanks: initialTanks,
  records: initialRecords,
  editingId: null,
};

const MAX_TABLE_ROWS = 500;
const MAX_OVERVIEW_ROWS = 20;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const fmt = (value) =>
  new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0) + ' kg';

const formatDate = (value) => {
  const raw = String(value || '');
  const date = new Date(raw.includes('T') ? raw : `${raw}T12:00:00`);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('pt-BR');
};

const escapeHtml = (value) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

function toast(message) {
  const element = $('#toast');
  if (!element) return;
  element.textContent = message;
  element.classList.add('show');
  setTimeout(() => element.classList.remove('show'), 2800);
}

const session = JSON.parse(sessionStorage.getItem('paiol-session') || 'null');
if (!session) {
  location.replace('login.html');
}

function balance(tank) {
  return state.records
    .filter((record) => record.tank === tank.id)
    .reduce((sum, record) => sum + (record.type === 'Entrada' ? record.qty : -record.qty), 0);
}

function getBalances() {
  const balances = Object.fromEntries(state.tanks.map((tank) => [tank.id, 0]));
  state.records.forEach((record) => {
    balances[record.tank] = (balances[record.tank] || 0) + (record.type === 'Entrada' ? record.qty : -record.qty);
  });
  return balances;
}

function recordDetails(record) {
  return [
    record.note || '-',
    record.origin && `Origem: ${record.origin}`,
    record.destination && `Destino: ${record.destination}`,
    record.movementClass && `Classe: ${record.movementClass}`,
  ]
    .filter(Boolean)
    .join(' · ');
}

function tankOptions(selected = '') {
  return state.tanks
    .map((tank) => `<option${tank.id === selected ? ' selected' : ''}>${escapeHtml(tank.id)}</option>`)
    .join('');
}

function renderTankCard(tank, balances) {
  const stock = balances[tank.id] || 0;
  const percent = tank.capacity ? Math.min(100, (stock / tank.capacity) * 100) : 0;
  return `<article class="tank-card">
    <img class="tank-icon" src="${escapeHtml(tank.icon)}" alt="${escapeHtml(tank.category)}" onerror="this.style.display='none'">
    <p>${escapeHtml(tank.category)}</p>
    <h3>${escapeHtml(tank.id)}</h3>
    <div class="capacity">${fmt(tank.capacity)}</div>
    <small class="muted">capacidade nominal</small>
    <div class="bar" style="margin-top:18px"><i style="width:${percent}%"></i></div>
  </article>`;
}

function renderRecordRow(record) {
  return `<tr>
    <td>${formatDate(record.date)}</td>
    <td><span class="badge ${record.type === 'Entrada' ? 'in' : 'out'}">${escapeHtml(record.type)}</span></td>
    <td><b>${escapeHtml(record.tank)}</b></td>
    <td>${escapeHtml(record.category)}</td>
    <td><b>${fmt(record.qty)}</b></td>
    <td>${escapeHtml(recordDetails(record))}</td>
    <td><button class="edit-btn" data-edit="${escapeHtml(record.id)}">Corrigir / excluir</button></td>
  </tr>`;
}

function renderOverviewRecordRow(record) {
  return `<tr>
    <td>${formatDate(record.date)}</td>
    <td><span class="badge ${record.type === 'Entrada' ? 'in' : 'out'}">${escapeHtml(record.type)}</span></td>
    <td><b>${escapeHtml(record.tank)}</b></td>
    <td><b>${fmt(record.qty)}</b></td>
    <td>${escapeHtml(recordDetails(record))}</td>
  </tr>`;
}

function setupMovementFields() {
  const recordForm = $('#recordForm');
  if (!recordForm || $('#recordOrigin')) return;

  const fields = document.createElement('div');
  fields.className = 'form-grid movement-fields';
  fields.innerHTML = `<label>Origem
    <select id="recordOrigin">
      <option value="">Selecione a origem</option>
      <option>CD Escada</option>
      <option>CD Outro</option>
      <option>UMB 1072</option>
      <option>UMB 1123</option>
      <option>EBE 1</option>
      <option>EBE 2</option>
      <option>EBE 3</option>
    </select>
  </label>
  <label>Destino
    <select id="recordDestination">
      <option value="">Selecione o destino</option>
      <option>UMB 1072</option>
      <option>UMB 1123</option>
      <option>EBE 1</option>
      <option>EBE 2</option>
      <option>EBE 3</option>
      <option>Consumo</option>
    </select>
  </label>
  <label>Classe
    <select id="recordClass">
      <option value="">Selecione a classe</option>
      <option>CD Escada</option>
      <option>CD Outro</option>
      <option>Transferência entre tanques</option>
      <option>Consumo - Aplicado em Campo</option>
    </select>
  </label>`;

  $('#recordNote').closest('.form-grid').after(fields);
}

function render() {
  const balances = getBalances();
  const total = state.tanks.reduce((sum, tank) => sum + (balances[tank.id] || 0), 0);
  const capacity = state.tanks.reduce((sum, tank) => sum + tank.capacity, 0);
  const entries = state.records
    .filter((record) => record.type === 'Entrada')
    .reduce((sum, record) => sum + record.qty, 0);
  const exits = state.records
    .filter((record) => record.type === 'Saída')
    .reduce((sum, record) => sum + record.qty, 0);

  $('#totalStock').textContent = fmt(total);
  $('#stockCapacity').textContent = `de ${fmt(capacity)} de capacidade`;
  $('#totalIn').textContent = fmt(entries);
  $('#totalOut').textContent = fmt(exits);
  $('#occupancy').textContent = `${capacity ? Math.round((total / capacity) * 100) : 0}%`;
  $('#lastUpdated').textContent = new Date().toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  if (session?.role !== 'Supervisor') {
    $('#usersLink')?.remove();
  }

  $('#recordTank').innerHTML = tankOptions($('#recordTank').value);
  $$('[data-filter="tank"]').forEach((filter) => {
    filter.innerHTML = `<option value="">Todos</option>${tankOptions(filter.value)}`;
  });

  $('#tankBars').innerHTML = state.tanks
    .map((tank) => {
      const stock = balances[tank.id] || 0;
      const percent = tank.capacity ? Math.round((stock / tank.capacity) * 100) : 0;
      return `<div class="tank-row">
        <div class="tank-meta">
          <b>${escapeHtml(tank.id)}</b>
          <span>${fmt(stock)} / ${fmt(tank.capacity)} · ${percent}% cheio</span>
        </div>
        <div class="bar"><i class="${percent < 85 ? 'ok' : ''}" style="width:${Math.min(100, percent)}%"></i></div>
      </div>`;
    })
    .join('');

  const filters = Object.fromEntries($$('.column-filter').map((field) => [field.dataset.filter, field.value]));
  const search = $('#searchInput').value.toLowerCase();
  const filtered = state.records.filter((record) => {
    const note = recordDetails(record).toLowerCase();
    return (
      (!search || JSON.stringify(record).toLowerCase().includes(search)) &&
      (!filters.date || record.date === filters.date) &&
      (!filters.type || record.type === filters.type) &&
      (!filters.tank || record.tank === filters.tank) &&
      (!filters.category || record.category === filters.category) &&
      (!filters.note || note.includes(filters.note.toLowerCase()))
    );
  });

  const visibleRecords = filtered.slice(-MAX_TABLE_ROWS).reverse();
  $('#recordsBody').innerHTML =
    visibleRecords.map(renderRecordRow).join('') || '<tr><td colspan="7">Nenhum lançamento encontrado.</td></tr>';

  $('#overviewRecords').innerHTML =
    state.records.slice(-MAX_OVERVIEW_ROWS).reverse().map(renderOverviewRecordRow).join('') ||
    '<tr><td colspan="5">Nenhum lançamento encontrado.</td></tr>';

  $('#recentList').innerHTML = state.records
    .slice(-4)
    .reverse()
    .map(
      (record) => `<div class="activity">
        <div class="activity-sign ${record.type === 'Entrada' ? 'in' : 'out'}">${record.type === 'Entrada' ? '↑' : '↓'}</div>
        <div>
          <b>${escapeHtml(record.type)} · ${fmt(record.qty)}</b>
          <small>${escapeHtml(record.tank)} · ${escapeHtml(recordDetails(record))}</small>
        </div>
      </div>`
    )
    .join('');

  $('#tankCards').innerHTML = state.tanks.map((tank) => renderTankCard(tank, balances)).join('');
  $('#overviewTanks').innerHTML = state.tanks.map((tank) => renderTankCard(tank, balances)).join('');
}

async function save(action, payload) {
  if (!window.PAIOL_CONFIG.apiUrl) {
    toast('Base online não configurada. Nenhum dado foi gravado.');
    return false;
  }

  try {
    const response = await fetch(window.PAIOL_CONFIG.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, ...payload }),
    });
    const data = await response.json();
    if (!data.ok) throw Error(data.error || 'A base online recusou a operação.');

    if (data.records) state.records = data.records;
    if (data.tanks) {
      const icons = Object.fromEntries(initialTanks.map((tank) => [tank.id, tank.icon]));
      state.tanks = data.tanks.map((tank) => ({ ...tank, icon: tank.icon || icons[tank.id] || '' }));
    }

    render();
    toast('Planilha atualizada.');
    return true;
  } catch (error) {
    toast(`Falha na base online: ${error.message}`);
    return false;
  }
}

async function sync(action = 'snapshot') {
  await save(action, { payload: state });
}

function openRecord(id) {
  state.editingId = id || null;
  const record = state.records.find((item) => item.id === id);

  $('#modalTitle').textContent = record ? 'Corrigir lançamento' : 'Registrar movimento';
  $('#recordDate').value = record?.date || new Date().toISOString().slice(0, 10);
  $('#recordType').value = record?.type || 'Entrada';
  $('#recordCategory').value = record?.category || 'UMB';
  $('#recordTank').value = record?.tank || state.tanks[0].id;
  $('#recordQty').value = record?.qty || '';
  $('#recordNote').value = record?.note || '';
  $('#recordOrigin').value = record?.origin || '';
  $('#recordDestination').value = record?.destination || '';
  $('#recordClass').value = record?.movementClass || '';
  $('#formError').textContent = '';
  $('#modal').classList.remove('hidden');
}

document.addEventListener('click', async (event) => {
  const tab = event.target.closest('[data-tab]');
  if (tab) {
    $$('.tab,.tab-panel').forEach((element) => element.classList.remove('active'));
    tab.classList.add('active');
    const target = $(`#${tab.dataset.tab}`);
    target.classList.add('active');
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (event.target.matches('[data-open-form]')) openRecord();
  if (event.target.matches('[data-close]')) $('#modal').classList.add('hidden');
  if (event.target.matches('[data-edit]')) openRecord(event.target.dataset.edit);
  if (event.target.matches('[data-tab-link]')) $(`[data-tab="${event.target.dataset.tabLink}"]`).click();
  if (event.target.id === 'userMenuBtn') $('#userMenu').classList.toggle('hidden');
  if (event.target.dataset.action === 'change-password') location.href = 'usuarios.html#senha';

  if (event.target.dataset.action === 'logout') {
    sessionStorage.removeItem('paiol-session');
    location.replace('login.html');
  }

  if (event.target.id === 'deleteRecord' && state.editingId) {
    const typed = prompt('Digite a senha do usuário logado para excluir este lançamento:');
    if (typed !== session?.pass) {
      toast('Senha incorreta. Lançamento não excluído.');
      return;
    }

    const ok = await save('delete-record', {
      id: state.editingId,
      user: session?.name || session?.user,
    });
    if (ok) {
      $('#modal').classList.add('hidden');
      toast('Lançamento excluído.');
    }
  }
});

$('#recordForm').addEventListener('submit', async (event) => {
  event.preventDefault();

  const qty = Number($('#recordQty').value);
  const tank = state.tanks.find((item) => item.id === $('#recordTank').value);
  const type = $('#recordType').value;

  if (!tank) {
    $('#formError').textContent = 'Selecione um tanque válido.';
    return;
  }

  if (!qty || qty <= 0) {
    $('#formError').textContent = 'Informe uma quantidade válida.';
    return;
  }

  if (type === 'Saída' && qty > balance(tank) && !state.editingId) {
    $('#formError').textContent = `Saldo insuficiente no ${tank.id}.`;
    return;
  }

  const item = {
    id: state.editingId || crypto.randomUUID(),
    date: $('#recordDate').value,
    type,
    category: $('#recordCategory').value,
    tank: tank.id,
    qty,
    note: $('#recordNote').value || '-',
    origin: $('#recordOrigin').value || '',
    destination: $('#recordDestination').value || '',
    movementClass: $('#recordClass').value || '',
    user: session?.name || session?.user || 'Operador',
  };

  const ok = await save(state.editingId ? 'update-record' : 'record', item);
  if (ok) {
    $('#modal').classList.add('hidden');
    toast(state.editingId ? 'Lançamento corrigido.' : 'Lançamento salvo.');
  }
});

$('#searchInput')?.addEventListener('input', render);
$$('.column-filter').forEach((field) => field.addEventListener('input', render));

setupMovementFields();
render();
sync('snapshot');
