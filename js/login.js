document.addEventListener('DOMContentLoaded', () => {
  // Redirect if already authenticated
  if (Auth.isAuthenticated()) {
    window.location.href = '/dashboard.html';
    return;
  }

  initTabs();
  initParticles();
  initLoginForm();
  initRegisterForm();
});

/* ── Tab switching ── */
function initTabs() {
  const tabs = document.querySelectorAll('.form-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
      document.getElementById(`${target}-form`).classList.add('active');
      clearAlerts();
    });
  });
}

/* ── Login form ── */
function initLoginForm() {
  const form = document.getElementById('login-form');
  const emailInput = document.getElementById('login-email');
  const senhaInput = document.getElementById('login-senha');
  const toggleBtn = document.getElementById('toggle-login-senha');
  const submitBtn = document.getElementById('login-submit');
  const alert = document.getElementById('login-alert');

  toggleBtn.addEventListener('click', () => togglePassword(senhaInput, toggleBtn));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlerts();

    const email = emailInput.value.trim();
    const senha = senhaInput.value;

    if (!validateEmail(email)) {
      showFieldError('login-email-error', 'Email inválido');
      emailInput.classList.add('error');
      return;
    }
    if (senha.length < 8) {
      showFieldError('login-senha-error', 'Senha deve ter no mínimo 8 caracteres');
      senhaInput.classList.add('error');
      return;
    }

    setLoading(submitBtn, true);

    try {
      const data = await API.post('/auth/login', { email, senha });
      Auth.saveSession(data.token);

      const usuarioId = Auth.getUsuarioId();
      const status = await API.get(`/onboarding/status/${usuarioId}`);

      if (status.onboardingConcluido) {
        window.location.href = '/dashboard.html';
      } else {
        window.location.href = '/chat.html';
      }
    } catch (err) {
      showAlert(alert, err.message || 'Email ou senha incorretos');
      setLoading(submitBtn, false);
    }
  });

  [emailInput, senhaInput].forEach(input => {
    input.addEventListener('input', () => input.classList.remove('error'));
  });
}

/* ── Register form ── */
function initRegisterForm() {
  const form = document.getElementById('register-form');
  const nomeInput = document.getElementById('register-nome');
  const emailInput = document.getElementById('register-email');
  const senhaInput = document.getElementById('register-senha');
  const toggleBtn = document.getElementById('toggle-register-senha');
  const submitBtn = document.getElementById('register-submit');
  const alert = document.getElementById('register-alert');

  toggleBtn.addEventListener('click', () => togglePassword(senhaInput, toggleBtn));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlerts();

    const nome = nomeInput.value.trim();
    const email = emailInput.value.trim();
    const senha = senhaInput.value;

    let valid = true;
    if (nome.length < 2) {
      showFieldError('register-nome-error', 'Nome deve ter pelo menos 2 caracteres');
      nomeInput.classList.add('error');
      valid = false;
    }
    if (!validateEmail(email)) {
      showFieldError('register-email-error', 'Email inválido');
      emailInput.classList.add('error');
      valid = false;
    }
    if (senha.length < 8) {
      showFieldError('register-senha-error', 'Senha deve ter no mínimo 8 caracteres');
      senhaInput.classList.add('error');
      valid = false;
    }
    if (!valid) return;

    setLoading(submitBtn, true);

    try {
      await API.post('/auth/registro', { nome, email, senha });
      // Auto-login after registration
      const loginData = await API.post('/auth/login', { email, senha });
      Auth.saveSession(loginData.token);
      window.location.href = '/chat.html';
    } catch (err) {
      showAlert(alert, err.message || 'Erro ao criar conta. Tente novamente.');
      setLoading(submitBtn, false);
    }
  });

  [nomeInput, emailInput, senhaInput].forEach(input => {
    input.addEventListener('input', () => input.classList.remove('error'));
  });
}

/* ── Helpers ── */
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showFieldError(id, msg) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = msg;
    el.classList.add('visible');
  }
}

function showAlert(el, msg) {
  el.innerHTML = `<span>⚠</span><span>${msg}</span>`;
  el.className = 'form-alert error';
}

function clearAlerts() {
  document.querySelectorAll('.form-alert').forEach(a => {
    a.className = 'form-alert';
    a.innerHTML = '';
  });
  document.querySelectorAll('.form-error').forEach(e => e.classList.remove('visible'));
  document.querySelectorAll('.form-input.error').forEach(i => i.classList.remove('error'));
}

function togglePassword(input, btn) {
  const isText = input.type === 'text';
  input.type = isText ? 'password' : 'text';
  btn.textContent = isText ? '👁' : '🙈';
}

function setLoading(btn, loading) {
  btn.disabled = loading;
  if (loading) {
    btn.dataset.originalText = btn.textContent;
    btn.innerHTML = '<span class="spinner"></span>';
  } else {
    btn.innerHTML = btn.dataset.originalText || 'Entrar';
  }
}

/* ── Particles canvas ── */
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let particles = [];
  let animId;

  function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.5 + 0.1,
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: 80 }, createParticle);
  }

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(108, 99, 255, ${0.08 * (1 - dist / 120)})`;
          ctx.lineWidth = 1;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawConnections();

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(108, 99, 255, ${p.opacity})`;
      ctx.fill();
    });

    animId = requestAnimationFrame(animate);
  }

  init();
  animate();
  window.addEventListener('resize', () => { cancelAnimationFrame(animId); init(); animate(); });
}
