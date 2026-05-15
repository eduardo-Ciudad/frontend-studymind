const Auth = {
  saveSession(token) {
    localStorage.setItem('token', token);
    const payload = JSON.parse(atob(token.split('.')[1]));
    localStorage.setItem('usuarioId', payload.id);
    const nome = payload.sub ? payload.sub.split('@')[0] : (payload.nome || 'Usuário');
    localStorage.setItem('usuarioNome', nome);
  },

  getUsuarioId() {
    return localStorage.getItem('usuarioId');
  },

  getToken() {
    return localStorage.getItem('token');
  },

  getNome() {
    return localStorage.getItem('usuarioNome') || 'Usuário';
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  },

  logout() {
    localStorage.clear();
    window.location.href = '/login.html';
  }
};
