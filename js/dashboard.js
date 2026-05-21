let usuarioId;
let planoData = null;
let semanaAtual = 1;

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.isAuthenticated()) {
    window.location.href = '/login.html';
    return;
  }

  usuarioId = Auth.getUsuarioId();
  initUI();
  await loadAll();
});

function initUI() {
  const nome = Auth.getNome();
  setGreeting(nome);
  setUserDisplay(nome);
  renderSkeletons();
}

/* ── Load all data ── */
async function loadAll() {
  await Promise.allSettled([
    loadPlano(),
    loadDashboard(),
    loadTarefas(),
  ]);
}

/* ── Plano de estudos ── */
async function loadPlano() {
  try {
    const plano = await API.get(`/plano-estudo/usuario/${usuarioId}`);
    if (!plano || !plano.conteudoJson) return;

    planoData = JSON.parse(plano.conteudoJson);
    semanaAtual = calcSemanaAtual(plano.criadoEm);

    updatePlanMeta(planoData, semanaAtual, plano.criadoEm);
  } catch (err) {
    console.error('Plano error:', err);
  }
}

/* ── Dashboard metrics ── */
async function loadDashboard() {
  try {
    const dados = await API.get(`/dashboard/usuario/${usuarioId}`);
    renderMetrics(dados);
    renderTopicos(dados.topicosMaisFracos || []);
  } catch (err) {
    console.error('Dashboard error:', err);
    renderMetricsError();
  }
}

/* ── Tasks ── */
async function loadTarefas() {
  try {
    const [pendentes, concluidas] = await Promise.all([
      API.get(`/tarefas/usuario/${usuarioId}?status=PENDENTE`),
      API.get(`/tarefas/usuario/${usuarioId}?status=CONCLUIDA`),
    ]);

    const filterSemana = arr => arr.filter(t => t.semana === semanaAtual || !t.semana);
    const pendentesSemana = filterSemana(pendentes);
    const concluidasSemana = filterSemana(concluidas);

    const tarefasExibir = pendentesSemana.length || concluidasSemana.length
      ? pendentesSemana
      : pendentes.slice(0, 8);

    const totalInicial = (pendentesSemana.length || concluidasSemana.length)
      ? pendentesSemana.length + concluidasSemana.length
      : pendentes.slice(0, 8).length;

    const concluidasIniciais = (pendentesSemana.length || concluidasSemana.length)
      ? concluidasSemana.length
      : 0;

    renderTarefas(tarefasExibir, concluidasIniciais, totalInicial);
  } catch (err) {
    console.error('Tarefas error:', err);
    renderTarefasError();
  }
}

/* ── Rendering ── */
function setGreeting(nome) {
  const hour = new Date().getHours();
  const saudacao = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const el = document.getElementById('greeting');
  if (el) el.textContent = `${saudacao}, ${capitalize(nome)}`;
}

function setUserDisplay(nome) {
  const avatarEl = document.getElementById('sidebar-avatar');
  const nameEl = document.getElementById('sidebar-user-name');
  if (avatarEl) avatarEl.textContent = nome.charAt(0).toUpperCase();
  if (nameEl) nameEl.textContent = capitalize(nome);
}

function updatePlanMeta(plano, semana, criadoEm) {
  const metaEl = document.getElementById('dashboard-meta');
  if (!metaEl) return;

  const vestibular = plano.vestibular || 'Vestibular';
  const diasRestantes = plano.dataExame ? calcDiasRestantes(plano.dataExame) : null;

  let html = `<span class="meta-badge">Semana ${semana} de 12</span>`;
  html += `<span class="meta-dot"></span><span>${vestibular}</span>`;
  if (diasRestantes !== null) {
    html += `<span class="meta-dot"></span><span>${diasRestantes} dias restantes</span>`;
  }
  metaEl.innerHTML = html;
}

function renderMetrics(dados) {
  setMetric('metric-questoes', 
    formatNum(dados.totalRespostas ?? 0), 
    'questões respondidas');
  
  setMetric('metric-acerto', 
    `${Math.round(dados.taxaAcertoGeral ?? 0)}%`, 
    'taxa de acerto', 
    (dados.taxaAcertoGeral ?? 0) >= 70 ? 'success' : '');
  
  setMetric('metric-topicos',
    `${dados.desempenhoPorTopico?.length ?? 0}`,
    'tópicos estudados',
    'accent');
}

function setMetric(id, value, sub, cls = '') {
  const card = document.getElementById(id);
  if (!card) return;
  const valEl = card.querySelector('.metric-value');
  const subEl = card.querySelector('.metric-sub');
  if (valEl) {
    valEl.textContent = value;
    valEl.className = `metric-value${cls ? ' ' + cls : ''}`;
    valEl.classList.remove('skeleton');
  }
  if (subEl) {
    subEl.textContent = sub;
    subEl.classList.remove('skeleton');
  }
}

function renderMetricsError() {
  ['metric-questoes', 'metric-acerto', 'metric-topicos'].forEach(id => {
    setMetric(id, '—', 'Erro ao carregar');
  });
}

function renderTopicos(topicos) {
  const container = document.getElementById('topicos-list');
  if (!container) return;

  if (!topicos.length) {
    container.innerHTML = '<p style="font-size:.82rem;color:var(--text-muted);">Nenhum tópico fraco registrado ainda.</p>';
    return;
  }

  container.innerHTML = topicos.slice(0, 5).map(t => {
    const pct = Math.round(t.taxaAcerto ?? 0);
    return `
      <div class="topic-item">
        <div class="topic-row">
          <span class="topic-name">${escapeHtml(t.topicoNome || 'Tópico')}</span>
          <span class="topic-pct">${pct}%</span>
        </div>
        <div class="topic-bar">
          <div class="topic-fill" style="width:${pct}%"></div>
        </div>
      </div>`;
  }).join('');
}

function renderTarefas(tarefas, concluidasIniciais = 0, totalInicial = 0) {
  const container = document.getElementById('tasks-list');
  const progressContainer = document.getElementById('week-progress');
  if (!container) return;

  if (!tarefas.length && concluidasIniciais === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="17" stroke="currentColor" stroke-width="2"/>
            <path d="M13 20l5 5 9-10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="empty-state-title">Tudo em dia!</div>
        <p style="font-size:.82rem;">Você não tem tarefas pendentes esta semana.</p>
      </div>`;
    if (progressContainer) progressContainer.style.display = 'none';
    return;
  }

  const total = totalInicial || tarefas.length;
  updateTaskCount(total, tarefas.length);
  completedCount = concluidasIniciais;
  updateProgress(concluidasIniciais, total);

  container.innerHTML = tarefas.map(t => `
    <div class="task-item" id="task-${t.id}">
      <div class="task-check" onclick="toggleTask(${t.id}, this)" title="Marcar como concluída">
      </div>
      <div class="task-body task-body-clickable" onclick="openTarefaModal(${t.id})" title="Ver detalhes">
        <div class="task-name">${escapeHtml(t.descricao || t.topicoNome || 'Tarefa')}</div>
        <div class="task-meta">${escapeHtml(t.materiaNome || '')}${t.meta ? ` · Meta: ${t.meta} questões` : ''}</div>
      </div>
      <div class="task-action">
        <button class="btn-complete" onclick="toggleTask(${t.id}, null)">Concluir</button>
      </div>
    </div>`).join('');
}

function renderTarefasError() {
  const container = document.getElementById('tasks-list');
  if (container) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="17" stroke="currentColor" stroke-width="2"/>
            <line x1="20" y1="13" x2="20" y2="22" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="20" cy="28" r="1.5" fill="currentColor"/>
          </svg>
        </div>
        <div class="empty-state-title">Erro ao carregar tarefas</div>
        <p style="font-size:.82rem;">Não foi possível buscar suas tarefas. Tente recarregar a página.</p>
      </div>`;
  }
}

/* ── Tarefa modal ── */
async function openTarefaModal(tarefaId) {
  let overlay = document.getElementById('tarefa-modal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'tarefa-modal-overlay';
    overlay.className = 'tarefa-modal-overlay';
    overlay.innerHTML = `
      <div class="tarefa-modal" id="tarefa-modal" role="dialog" aria-modal="true">
        <button class="tarefa-modal-close" onclick="closeTarefaModal()" aria-label="Fechar">✕</button>
        <div id="tarefa-modal-body"></div>
      </div>`;
    overlay.addEventListener('click', e => { if (e.target === overlay) closeTarefaModal(); });
    document.body.appendChild(overlay);
  }

  const bodyEl = document.getElementById('tarefa-modal-body');
  bodyEl.innerHTML = `
    <div class="tarefa-modal-loading">
      <div class="tarefa-modal-spinner"></div>
      <span>Carregando detalhes...</span>
    </div>`;

  overlay.classList.add('visible');
  document.body.style.overflow = 'hidden';

  try {
    const data = await API.get(`/aula/tarefa/${tarefaId}/descricao`);

    const passosHtml = (data.passos || []).map((p, i) =>
      `<li><span class="tarefa-passo-num">${i + 1}</span>${escapeHtml(p)}</li>`
    ).join('');

    bodyEl.innerHTML = `
      <div class="tarefa-modal-titulo">${escapeHtml(data.titulo || 'Tarefa')}</div>
      <p class="tarefa-modal-desc">${escapeHtml(data.descricaoDetalhada || '')}</p>
      ${passosHtml ? `
        <div class="tarefa-passos-titulo">Como realizar</div>
        <ol class="tarefa-passos-list">${passosHtml}</ol>` : ''}`;
  } catch (err) {
    bodyEl.innerHTML = `
      <div class="tarefa-modal-error">
        <div style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;color:var(--text-muted);">
          <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="17" stroke="currentColor" stroke-width="2"/>
            <line x1="20" y1="13" x2="20" y2="22" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="20" cy="28" r="1.5" fill="currentColor"/>
          </svg>
        </div>
        <p style="color:var(--text-secondary)">Não foi possível carregar os detalhes da tarefa.</p>
      </div>`;
  }
}

function closeTarefaModal() {
  const overlay = document.getElementById('tarefa-modal-overlay');
  if (overlay) overlay.classList.remove('visible');
  document.body.style.overflow = '';
}

/* ── Task interactions ── */
let completedCount = 0;
let totalCount = 0;

async function toggleTask(id, checkEl) {
  const taskEl = document.getElementById(`task-${id}`);
  if (!taskEl || taskEl.classList.contains('done')) return;

  taskEl.classList.add('done');
  completedCount++;
  updateProgress(completedCount, totalCount);

  try {
    await API.put(`/tarefas/${id}`, { status: 'CONCLUIDA' });
  } catch (err) {
    taskEl.classList.remove('done');
    completedCount--;
    updateProgress(completedCount, totalCount);
    showToast('Erro ao concluir tarefa. Tente novamente.', 'error');
  }
}

function updateTaskCount(total, pendentes) {
  totalCount = total;
  completedCount = 0;
  const el = document.getElementById('task-count');
  if (el) el.textContent = `${pendentes} pendente${pendentes !== 1 ? 's' : ''}`;
}

function updateProgress(done, total) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const fillEl = document.getElementById('progress-fill');
  const numsEl = document.getElementById('progress-nums');
  const pctEl = document.getElementById('progress-pct');
  if (fillEl) fillEl.style.width = `${pct}%`;
  if (numsEl) numsEl.textContent = `${done} de ${total} concluídas`;
  if (pctEl) pctEl.textContent = `${pct}%`;
}

/* ── Skeletons ── */
function renderSkeletons() {
  ['metric-questoes', 'metric-acerto', 'metric-topicos'].forEach(id => {
    const card = document.getElementById(id);
    if (!card) return;
    card.querySelector('.metric-value').classList.add('skeleton');
    card.querySelector('.metric-sub').classList.add('skeleton');
  });

  const tasksList = document.getElementById('tasks-list');
  if (tasksList) {
    tasksList.innerHTML = [1, 2, 3].map(() =>
      `<div class="skeleton task-skeleton"></div>`
    ).join('');
  }
}

/* ── Toast ── */
function showToast(msg, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = {
    error: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.4"/><line x1="8" y1="5" x2="8" y2="9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="8" cy="11.5" r=".8" fill="currentColor"/></svg>`,
    success: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.4"/><path d="M5 8l2.5 2.5 4-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    info: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.4"/><line x1="8" y1="7" x2="8" y2="11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="8" cy="4.5" r=".8" fill="currentColor"/></svg>`,
  };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span>${escapeHtml(msg)}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

/* ── Helpers ── */
function calcDiasRestantes(dataExame) {
  const exame = new Date(dataExame);
  const agora = new Date();
  const diff = Math.ceil((exame - agora) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 0);
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatNum(n) {
  return n.toLocaleString('pt-BR');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
