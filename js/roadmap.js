const MATERIA_ICONS = {
  'Matemática': '📐',
  'Física': '⚛️',
  'Química': '🧪',
  'Biologia': '🧬',
  'Português': '📖',
  'Literatura': '📖',
  'Redação': '✏️',
  'História': '🏛️',
  'Geografia': '🌍',
  'Sociologia': '👥',
  'Filosofia': '💭',
  'Inglês': '🌐',
  'Espanhol': '🌐',
};

const TIPO_CONFIG = {
  'REVISAO':    { label: 'Revisão',   color: '#6c63ff', bg: 'rgba(108,99,255,0.12)' },
  'QUESTOES':   { label: 'Questões',  color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  'META_ACERTO':{ label: 'Meta %',    color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
};

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.isAuthenticated()) {
    window.location.href = '/login.html';
    return;
  }

  const usuarioId = Auth.getUsuarioId();
  setUserDisplay();
  await loadRoadmap(usuarioId);
});

function setUserDisplay() {
  const nome = Auth.getNome();
  const avatarEl = document.getElementById('sidebar-avatar');
  const nameEl = document.getElementById('sidebar-user-name');
  if (avatarEl) avatarEl.textContent = nome.charAt(0).toUpperCase();
  if (nameEl) nameEl.textContent = capitalize(nome);
}

async function loadRoadmap(usuarioId) {
  const container = document.getElementById('roadmap-container');
  container.innerHTML = `
    <div class="roadmap-loading">
      <div class="spinner spinner-lg"></div>
      <span>Carregando seu plano de estudos...</span>
    </div>`;

  try {
    const plano = await API.get(`/plano-estudo/usuario/${usuarioId}`);

    if (!plano || !plano.conteudoJson) {
      showError(container, 'Plano de estudos não encontrado.');
      return;
    }

    const conteudo = JSON.parse(plano.conteudoJson);
    const semanaAtual = calcSemanaAtual(plano.criadoEm);

    renderRoadmap(container, conteudo, semanaAtual, plano.criadoEm);
  } catch (err) {
    console.error('Roadmap error:', err);
    showError(container, `Erro ao carregar o plano: ${err.message}`);
  }
}

function renderRoadmap(container, conteudo, semanaAtual, criadoEm) {
  const semanas = conteudo.semanas || [];

  if (!semanas.length) {
    showError(container, 'Nenhuma semana encontrada no plano.');
    return;
  }

  // Update header meta
  const metaEl = document.getElementById('roadmap-meta');
  if (metaEl) {
    const vestibular = conteudo.vestibular || 'Vestibular';
    const diasRestantes = conteudo.dataExame ? calcDiasRestantes(conteudo.dataExame) : null;
    metaEl.textContent = `${vestibular}${diasRestantes !== null ? ` · ${diasRestantes} dias restantes` : ''} · ${semanas.length} semanas`;
  }

  let html = `
    <div class="roadmap-legend">
      <div class="legend-item"><span class="legend-dot current"></span> Semana atual</div>
      <div class="legend-item"><span class="legend-dot past"></span> Concluída</div>
      <div class="legend-item"><span class="legend-dot future"></span> Futura</div>
    </div>
    <div class="timeline">`;

  semanas.forEach((semana, idx) => {
    const num = semana.numero || idx + 1;
    const isCurrent = num === semanaAtual;
    const isPast = num < semanaAtual;
    const statusClass = isCurrent ? 'current' : isPast ? 'past' : 'future';

    const inicioData = calcWeekDate(criadoEm, num - 1);
    const fimData = calcWeekDate(criadoEm, num - 1, 6);

    html += `
      <div class="week-block ${statusClass}">
        <div class="week-dot">
          ${isCurrent ? '★' : isPast ? '✓' : '<div class="week-dot-inner"></div>'}
        </div>
        <div class="week-header">
          <span class="week-label">Semana ${num}</span>
          ${isCurrent ? '<span class="week-badge badge-current">Atual</span>' : ''}
          ${isPast ? '<span class="week-badge badge-past">Concluída</span>' : ''}
          <span class="week-dates">${formatDateShort(inicioData)} – ${formatDateShort(fimData)}</span>
        </div>
        <div class="week-card">
          ${renderSemanaContent(semana)}
        </div>
      </div>`;
  });

  html += '</div>';
  container.innerHTML = html;
}

function renderSemanaContent(semana) {
  const tarefas = semana.tarefas || [];
  if (!tarefas.length) {
    return '<div class="week-empty">Sem tarefas definidas para esta semana.</div>';
  }

  // Group by subject
  const byMateria = {};
  tarefas.forEach(t => {
    const mat = t.materiaNome || 'Outras';
    if (!byMateria[mat]) byMateria[mat] = [];
    byMateria[mat].push(t);
  });

  return Object.entries(byMateria).map(([materia, tasks]) => `
    <div class="subject-group">
      <div class="subject-header">
        <span class="subject-icon">${MATERIA_ICONS[materia] || '📚'}</span>
        <span class="subject-name">${escapeHtml(materia)}</span>
      </div>
      ${tasks.map(t => renderTaskRow(t)).join('')}
    </div>`).join('');
}

function renderTaskRow(t) {
  const tipo = t.tipo || '';
  const cfg = TIPO_CONFIG[tipo] || { label: tipo, color: 'var(--text-muted)', bg: 'var(--bg-hover)' };
  const badgeStyle = `color:${cfg.color};background:${cfg.bg};border:1px solid ${cfg.color}33;`;
  const meta = t.meta ? `<span class="task-meta-text">Meta: ${t.meta}</span>` : '';

  return `
    <div class="task-row">
      <span class="task-arrow">→</span>
      <span class="task-topic">${escapeHtml(t.topicoNome || t.descricao || 'Tópico')}</span>
      ${tipo ? `<span class="task-tipo" style="${badgeStyle}">${escapeHtml(cfg.label)}</span>` : ''}
      ${meta}
    </div>`;
}

function showError(container, msg) {
  container.innerHTML = `
    <div class="roadmap-error">
      <div class="roadmap-error-icon">⚠️</div>
      <p style="color:var(--text-secondary)">${escapeHtml(msg)}</p>
      <button class="btn btn-secondary" style="margin-top:16px" onclick="window.location.reload()">
        Tentar novamente
      </button>
    </div>`;
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
  return Math.max(Math.ceil((exame - agora) / (1000 * 60 * 60 * 24)), 0);
}

function calcWeekDate(criadoEm, weekOffset, dayOffset = 0) {
  const base = criadoEm ? new Date(criadoEm) : new Date();
  const d = new Date(base);
  d.setDate(d.getDate() + weekOffset * 7 + dayOffset);
  return d;
}

function formatDateShort(date) {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
