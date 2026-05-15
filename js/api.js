const API = {
  baseURL: 'http://localhost:8080',

  getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  },

  async request(method, endpoint, body = null) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method,
      headers: this.getHeaders(),
      ...(body && { body: JSON.stringify(body) })
    });

    if (response.status === 401) {
      localStorage.clear();
      window.location.href = '/login.html';
      return;
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.mensagem || `Erro ${response.status}`);
    }

    if (response.status === 204) return null;
    return response.json();
  },

  get(endpoint) { return this.request('GET', endpoint); },
  post(endpoint, body) { return this.request('POST', endpoint, body); },
  put(endpoint, body) { return this.request('PUT', endpoint, body); },
  delete(endpoint) { return this.request('DELETE', endpoint); },
};
