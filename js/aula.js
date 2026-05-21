/* ── Query params ── */
const params = new URLSearchParams(window.location.search);
const topicoNome  = params.get('topicoNome') || 'Tópico';
const materiaNome = params.get('materiaNome') || '';
const meta        = parseInt(params.get('meta') || '5', 10);
const nivel       = params.get('nivel') || 'MEDIO';

let questoes = [];
let questaoAtual = 0;
let acertos = 0;
let respondida = false;

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.isAuthenticated()) {
    window.location.href = '/login.html';
    return;
  }

  const usuarioId = Auth.getUsuarioId();

  try {
    const status = await API.get(`/onboarding/status/${usuarioId}`);
    if (!status.onboardingConcluido) {
      window.location.href = '/chat.html';
      return;
    }
  } catch (err) {
    console.error('Onboarding check error:', err);
  }

  setUserDisplay();

  if (!topicoNome) {
    showError('Tópico não encontrado. Volte ao roadmap e tente novamente.');
    return;
  }

  await loadConteudo();
});

function setUserDisplay() {
  const nome = Auth.getNome();
  const avatarEl = document.getElementById('sidebar-avatar');
  const nameEl = document.getElementById('sidebar-user-name');
  if (avatarEl) avatarEl.textContent = nome.charAt(0).toUpperCase();
  if (nameEl) nameEl.textContent = capitalize(nome);
}

async function loadConteudo() {
  const loadingEl = document.getElementById('aula-loading');
  const contentEl = document.getElementById('aula-content');

  try {
    const data = await API.get(`/aula/topico/por-nome/conteudo?topicoNome=${encodeURIComponent(topicoNome)}&materiaNome=${encodeURIComponent(materiaNome)}&nivel=${encodeURIComponent(nivel)}`);

    if (loadingEl) loadingEl.style.display = 'none';
    if (contentEl) contentEl.style.display = 'block';

    renderConteudo(data);
  } catch (err) {
    console.error('Aula error:', err);
    if (loadingEl) loadingEl.style.display = 'none';
    showError(`Erro ao carregar o conteúdo: ${err.message}`);
  }
}

function renderConteudo(data) {
  const el = id => document.getElementById(id);

  const titulo = data.titulo || topicoNome;
  const materia = data.materia || materiaNome;
  const nivelDisplay = data.nivelDificuldade || nivel;

  if (el('aula-title')) el('aula-title').textContent = titulo;
  document.title = `StudyMind — ${titulo}`;

  if (el('aula-materia-badge')) {
    el('aula-materia-badge').textContent = materia;
    el('aula-materia-badge').style.display = materia ? '' : 'none';
  }

  if (el('aula-nivel-badge')) {
    el('aula-nivel-badge').textContent = nivelDisplay;
    el('aula-nivel-badge').style.display = nivelDisplay ? '' : 'none';
  }

  if (el('aula-texto')) el('aula-texto').textContent = data.conteudo || '';

  const recomendacoes = data.recomendacoes || [];
  const recSection = el('aula-recomendacoes');
  if (recSection) {
    if (recomendacoes.length) {
      const list = el('aula-recomendacoes-list');
      if (list) {
        list.innerHTML = recomendacoes.map(r =>
          `<li>${escapeHtml(r)}</li>`
        ).join('');
      }
    } else {
      recSection.style.display = 'none';
    }
  }

  const btnIniciar = el('btn-iniciar');
  if (btnIniciar) btnIniciar.style.display = 'inline-flex';
}

async function iniciarQuestoes() {
  const btnIniciar = document.getElementById('btn-iniciar');
  if (btnIniciar) {
    btnIniciar.disabled = true;
    btnIniciar.textContent = 'Carregando questões...';
  }

  try {
    const data = await API.get(`/aula/topico/por-nome/questoes?topicoNome=${encodeURIComponent(topicoNome)}&materiaNome=${encodeURIComponent(materiaNome)}&quantidade=${meta}`);
    questoes = data.questoes || [];

    if (!questoes.length) {
      showToastAula('Nenhuma questão disponível para este tópico.', 'warn');
      if (btnIniciar) {
        btnIniciar.disabled = false;
        btnIniciar.textContent = 'Iniciar Questões';
      }
      return;
    }

    if (btnIniciar) btnIniciar.style.display = 'none';

    const questoesArea = document.getElementById('questoes-area');
    if (questoesArea) questoesArea.classList.add('visible');

    acertos = 0;
    questaoAtual = 0;
    renderQuestao(0);
  } catch (err) {
    console.error('Questoes error:', err);
    showToastAula(`Erro ao carregar questões: ${err.message}`, 'error');
    if (btnIniciar) {
      btnIniciar.disabled = false;
      btnIniciar.textContent = 'Iniciar Questões';
    }
  }
}

function renderQuestao(idx) {
  const q = questoes[idx];
  if (!q) return;

  respondida = false;

  updateProgressBar(idx);

  const card = document.getElementById('questao-card');
  if (!card) return;

  const letras = ['A', 'B', 'C', 'D', 'E'];
  const alternativasHtml = (q.alternativas || []).map((alt, i) => `
    <button class="alternativa-btn" onclick="responder(${i})" data-idx="${i}">
      <span class="alternativa-letra">${letras[i] || i + 1}</span>
      <span>${escapeHtml(alt)}</span>
    </button>`).join('');

  card.innerHTML = `
    <div class="questao-numero">Questão ${q.numero || idx + 1} de ${questoes.length}</div>
    <div class="questao-enunciado">${escapeHtml(q.enunciado || '')}</div>
    <div class="alternativas-list" id="alternativas-list">${alternativasHtml}</div>
    <div class="questao-feedback" id="questao-feedback"></div>
    <button class="btn-proxima" id="btn-proxima" onclick="proximaQuestao()">
      ${idx + 1 < questoes.length ? 'Próxima questão →' : 'Ver resultado →'}
    </button>`;
}

function responder(altIdx) {
  if (respondida) return;
  respondida = true;

  const q = questoes[questaoAtual];
  const correta = q.alternativaCorreta;
  const acertou = altIdx === correta;

  if (acertou) acertos++;

  const btns = document.querySelectorAll('.alternativa-btn');
  btns.forEach((btn, i) => {
    btn.disabled = true;
    if (i === correta) btn.classList.add('correta');
    else if (i === altIdx && !acertou) btn.classList.add('errada');
  });

  const feedbackEl = document.getElementById('questao-feedback');
  if (feedbackEl) {
    feedbackEl.className = `questao-feedback visible ${acertou ? 'feedback-correta' : 'feedback-errada'}`;
    feedbackEl.innerHTML = `
      <div class="feedback-icon ${acertou ? 'ok' : 'nok'}">
        ${acertou
          ? `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="vertical-align:middle;margin-right:6px"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.4"/><path d="M5 8l2.5 2.5 4-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>Correto!`
          : `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="vertical-align:middle;margin-right:6px"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.4"/><path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>Errado!`
        }
      </div>
      <div>${escapeHtml(q.explicacao || '')}</div>`;
  }

  const btnProxima = document.getElementById('btn-proxima');
  if (btnProxima) btnProxima.classList.add('visible');
}

async function proximaQuestao() {
  questaoAtual++;
  if (questaoAtual >= questoes.length) {
    await mostrarResultado();
  } else {
    renderQuestao(questaoAtual);
  }
}

async function mostrarResultado() {
  try {
    await API.post('/resultado-sessao', {
      topicoNome,
      materiaNome,
      totalQuestoes: questoes.length,
      acertos
    });
  } catch (err) {
    console.error('Erro ao salvar resultado:', err);
  }

  const card = document.getElementById('questao-card');
  if (card) card.style.display = 'none';

  const progressEl = document.getElementById('questoes-progress');
  if (progressEl) progressEl.style.display = 'none';

  const resultadoEl = document.getElementById('resultado-screen');
  if (!resultadoEl) return;

  const total = questoes.length;
  const pct = total > 0 ? Math.round((acertos / total) * 100) : 0;
  const msg = pct >= 70 ? 'Excelente desempenho!' : pct >= 40 ? 'Bom progresso, continue!' : 'Continue praticando!';
  const resultIcon = pct >= 70
    ? `<svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="21" stroke="currentColor" stroke-width="2.5"/><path d="M15 24l7 7 11-14" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    : pct >= 40
    ? `<svg width="48" height="48" viewBox="0 0 48 48" fill="none"><rect x="10" y="8" width="28" height="32" rx="3" stroke="currentColor" stroke-width="2.5"/><line x1="17" y1="18" x2="31" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="17" y1="24" x2="31" y2="24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="17" y1="30" x2="25" y2="30" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`
    : `<svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="21" stroke="currentColor" stroke-width="2.5"/><line x1="24" y1="15" x2="24" y2="28" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="24" cy="34" r="2" fill="currentColor"/></svg>`;

  resultadoEl.innerHTML = `
    <div class="resultado-emoji">${resultIcon}</div>
    <div class="resultado-titulo">${msg}</div>
    <div class="resultado-pontuacao">${acertos}/${total}</div>
    <div class="resultado-sub">${pct}% de aproveitamento</div>
    <button class="btn-voltar-resultado" onclick="window.location.href='/roadmap.html'">
      ← Voltar ao Roadmap
    </button>`;

  resultadoEl.classList.add('visible');
}

function updateProgressBar(idx) {
  const total = questoes.length;
  const pct = total > 0 ? Math.round((idx / total) * 100) : 0;

  const labelEl = document.getElementById('progress-label');
  const fillEl = document.getElementById('questoes-progress-fill');
  if (labelEl) labelEl.textContent = `${idx} de ${total} respondidas`;
  if (fillEl) fillEl.style.width = `${pct}%`;
}

function showError(msg) {
  const contentEl = document.getElementById('aula-content');
  const loadingEl = document.getElementById('aula-loading');
  if (loadingEl) loadingEl.style.display = 'none';
  if (contentEl) {
    contentEl.style.display = 'block';
    contentEl.innerHTML = `
      <div class="aula-error">
        <div class="aula-error-icon">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="21" stroke="currentColor" stroke-width="2.5"/>
            <line x1="24" y1="15" x2="24" y2="28" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
            <circle cx="24" cy="34" r="2" fill="currentColor"/>
          </svg>
        </div>
        <p style="color:var(--text-secondary);margin-bottom:var(--space-lg)">${escapeHtml(msg)}</p>
        <button class="aula-back" onclick="history.back()">← Voltar</button>
      </div>`;
  }
}

function showToastAula(msg, type) {
  const icons = {
    error: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.4"/><line x1="8" y1="5" x2="8" y2="9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="8" cy="11.5" r=".8" fill="currentColor"/></svg>`,
    success: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.4"/><path d="M5 8l2.5 2.5 4-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    warn: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.4"/><line x1="8" y1="7" x2="8" y2="11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="8" cy="4.5" r=".8" fill="currentColor"/></svg>`,
  };
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.warn}</span><span>${escapeHtml(msg)}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
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
