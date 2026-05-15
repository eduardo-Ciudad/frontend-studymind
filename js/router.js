const Router = {
  async init() {
    if (!Auth.isAuthenticated()) {
      const currentPage = window.location.pathname;
      if (!currentPage.includes('login.html')) {
        window.location.href = '/login.html';
      }
      return;
    }

    const usuarioId = Auth.getUsuarioId();
    if (!usuarioId) {
      Auth.logout();
      return;
    }

    try {
      const status = await API.get(`/onboarding/status/${usuarioId}`);
      const currentPage = window.location.pathname;

      if (!status.onboardingConcluido) {
        if (!currentPage.includes('chat.html')) {
          window.location.href = '/chat.html';
        }
      } else {
        const isRoot = currentPage === '/' || currentPage.endsWith('/index.html') || currentPage.endsWith('/');
        if (isRoot || currentPage.includes('index.html')) {
          window.location.href = '/dashboard.html';
        } else if (currentPage.includes('chat.html')) {
          window.location.href = '/dashboard.html';
        }
      }
    } catch (error) {
      console.error('Router error:', error);
    }
  },

  requireAuth() {
    if (!Auth.isAuthenticated()) {
      window.location.href = '/login.html';
      return false;
    }
    return true;
  }
};
