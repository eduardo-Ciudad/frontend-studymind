let usuarioId;
let isWaiting = false;
let onboardingDone = false;

const WELCOME_MESSAGE = `Olá! Sou o assistente do StudyMind.
Vou te ajudar a criar um plano de estudos personalizado para o vestibular.
Me conta: qual vestibular você está se preparando?`;

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.isAuthenticated()) {
    window.location.href = '/login.html';
    return;
  }

  usuarioId = Auth.getUsuarioId();

  initInput();
  await loadStatus();
});

/* ── Load onboarding status and maybe show welcome ── */
async function loadStatus() {
  showChatLoading(true);

  try {
    const status = await API.get(`/onboarding/status/${usuarioId}`);

    if (status.onboardingConcluido) {
      window.location.href = '/dashboard.html';
      return;
    }

    // First time: show welcome message
    showChatLoading(false);
    appendMessage('ai', WELCOME_MESSAGE);
  } catch (err) {
    showChatLoading(false);
    appendMessage('ai', WELCOME_MESSAGE);
    console.error('Status error:', err);
  }
}

/* ── Send a message ── */
async function sendMessage() {
  if (isWaiting || onboardingDone) return;

  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  autoResizeInput(input);
  appendMessage('user', text);
  setWaiting(true);
  showTyping(true);

  try {
    const data = await API.post(`/onboarding/mensagem/${usuarioId}`, { mensagem: text });

    showTyping(false);
    appendMessage('ai', data.resposta);

    if (data.onboardingConcluido) {
      onboardingDone = true;
      await showCompletion();
    }
  } catch (err) {
    showTyping(false);
    appendMessage('ai', `Desculpe, ocorreu um erro. Por favor tente novamente.\n(${err.message})`);
  }

  setWaiting(false);
}

/* ── Append message bubble ── */
function appendMessage(role, text) {
  const container = document.getElementById('chat-messages');

  const wrapper = document.createElement('div');
  wrapper.className = `message ${role}`;

  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.textContent = role === 'ai' ? 'SM' : 'Eu';

  const content = document.createElement('div');
  content.className = 'message-content';

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  bubble.textContent = text;

  const time = document.createElement('div');
  time.className = 'message-time';
  time.textContent = formatTime(new Date());

  content.appendChild(bubble);
  content.appendChild(time);
  wrapper.appendChild(avatar);
  wrapper.appendChild(content);
  container.appendChild(wrapper);

  scrollToBottom();
}

/* ── Typing indicator ── */
function showTyping(visible) {
  const existing = document.getElementById('typing-indicator');
  if (visible) {
    if (existing) return;
    const container = document.getElementById('chat-messages');
    const el = document.createElement('div');
    el.id = 'typing-indicator';
    el.className = 'typing-indicator';
    el.innerHTML = `
      <div class="typing-avatar">SM</div>
      <div class="typing-dots">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>`;
    container.appendChild(el);
    scrollToBottom();
  } else {
    if (existing) existing.remove();
  }
}

/* ── Completion screen ── */
async function showCompletion() {
  const container = document.getElementById('chat-messages');

  const card = document.createElement('div');
  card.className = 'completion-card';
  card.innerHTML = `
    <div class="completion-icon">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" stroke="currentColor" stroke-width="2"/>
        <path d="M12 20l6 6 10-12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <div class="completion-title">Plano criado com sucesso!</div>
    <p class="completion-desc">
      Seu plano de estudos personalizado está pronto. Acesse o dashboard para começar.
    </p>
    <button class="btn btn-primary btn-lg" id="go-to-dashboard">
      Ver meu plano de estudos →
    </button>`;

  container.appendChild(card);
  scrollToBottom();

  document.getElementById('go-to-dashboard').addEventListener('click', () => {
    window.location.href = '/dashboard.html';
  });

  setInputDisabled(true);
}

/* ── Input setup ── */
function initInput() {
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send-btn');

  sendBtn.addEventListener('click', sendMessage);

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  input.addEventListener('input', () => autoResizeInput(input));
}

function autoResizeInput(input) {
  input.style.height = 'auto';
  input.style.height = `${Math.min(input.scrollHeight, 140)}px`;
}

function setWaiting(state) {
  isWaiting = state;
  setInputDisabled(state);
}

function setInputDisabled(disabled) {
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send-btn');
  input.disabled = disabled;
  sendBtn.disabled = disabled;
  if (!disabled) input.focus();
}

/* ── Helpers ── */
function showChatLoading(visible) {
  const container = document.getElementById('chat-messages');
  const existing = document.getElementById('chat-loading');
  if (visible) {
    if (existing) return;
    container.innerHTML = `
      <div class="chat-loading" id="chat-loading">
        <div class="spinner"></div>
        <span>Iniciando conversa...</span>
      </div>`;
  } else {
    if (existing) {
      container.innerHTML = '';
    }
  }
}

function scrollToBottom() {
  const container = document.getElementById('chat-messages');
  requestAnimationFrame(() => {
    container.scrollTop = container.scrollHeight;
  });
}

function formatTime(date) {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
