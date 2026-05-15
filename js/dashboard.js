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
    const tarefas = await API.get(`/tarefas/usuario/${usuarioId}?status=PENDENTE`);
    const semanaFilter = tarefas.filter(t => t.semana === semanaAtual || !t.semana);
    renderTarefas(semanaFilter.length ? semanaFilter : tarefas.slice(0, 8));
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
  if (el) el.textContent = `${saudacao}, ${capitalize(nome)} 👋`;
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
  setMetric('metric-questoes', formatNum(dados.totalQuestoes ?? 0), 'questões respondidas');
  setMetric('metric-acerto', `${Math.round(dados.taxaAcerto ?? 0)}%`, 'taxa de acerto', dados.taxaAcerto >= 70 ? 'success' : '');
  setMetric('metric-topicos',
    `${dados.topicosEstudados ?? 0}/${dados.totalTopicos ?? 0}`,
    'tópicos estudados', 'accent');
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
    const pct = Math.round(t.percentualAcerto ?? t.acerto ?? 0);
    return `
      <div class="topic-item">
        <div class="topic-row">
          <span class="topic-name">${escapeHtml(t.nome || t.topico || 'Tópico')}</span>
          <span class="topic-pct">${pct}%</span>
        </div>
        <div class="topic-bar">
          <div class="topic-fill" style="width:${pct}%"></div>
        </div>
      </div>`;
  }).join('');
}

function renderTarefas(tarefas) {
  const container = document.getElementById('tasks-list');
  const progressContainer = document.getElementById('week-progress');
  if (!container) return;

  if (!tarefas.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">✅</div>
        <div class="empty-state-title">Tudo em dia!</div>
        <p style="font-size:.82rem;">Você não tem tarefas pendentes esta semana.</p>
      </div>`;
    if (progressContainer) progressContainer.style.display = 'none';
    return;
  }

  updateTaskCount(tarefas.length);
  updateProgress(0, tarefas.length);

  container.innerHTML = tarefas.map(t => `
    <div class="task-item" id="task-${t.id}">
      <div class="task-check" onclick="toggleTask(${t.id}, this)" title="Marcar como concluída">
      </div>
      <div class="task-body">
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
        <div class="empty-state-icon">⚠</div>
        <div class="empty-state-title">Erro ao carregar tarefas</div>
        <p style="font-size:.82rem;">Não foi possível buscar suas tarefas. Tente recarregar a página.</p>
      </div>`;
  }
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

function updateTaskCount(total) {
  totalCount = total;
  completedCount = 0;
  const el = document.getElementById('task-count');
  if (el) el.textContent = `${total} pendente${total !== 1 ? 's' : ''}`;
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
  const icons = { error: '⚠', success: '✓', info: 'ℹ' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ'}</span><span>${escapeHtml(msg)}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

/* ── Helpers ── */
function calcSemanaAtual(criadoEm) {
  if (!criadoEm) return 1;
  const inicio = new Date(criadoEm);
  const agora = new Date();
  const diffDias = Math.floor((agora - inicio) / (1000 * 60 * 60 * 24));
  return Math.min(Math.max(Math.ceil(diffDias / 7), 1), 12);
}

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
