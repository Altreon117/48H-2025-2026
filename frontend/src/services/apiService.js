class ApiService {
  constructor() {
    const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? 'https://api-ynovconnect.skayizen.fr' : 'http://localhost:6001');

    this.baseURL = `${API_BASE}/api`;
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(method, endpoint, body = null) {
    const config = {
      method,
      headers: this.getHeaders(),
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, config);
    const raw = await response.text();
    let data = {};

    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = { error: raw || 'Réponse serveur invalide' };
    }

    if (!response.ok) {
      throw new Error(data.error || 'Une erreur est survenue');
    }

    return data;
  }

  get(endpoint) {
    return this.request('GET', endpoint);
  }

  post(endpoint, body) {
    return this.request('POST', endpoint, body);
  }

  async postForm(endpoint, formData) {
    const headers = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const raw = await response.text();
    let data = {};

    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = { error: raw || 'Réponse serveur invalide' };
    }

    if (!response.ok) {
      throw new Error(data.error || 'Une erreur est survenue');
    }

    return data;
  }

  put(endpoint, body) {
    return this.request('PUT', endpoint, body);
  }

  delete(endpoint) {
    return this.request('DELETE', endpoint);
  }
}

export default new ApiService();