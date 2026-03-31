class AdminApi {
    constructor() {
        const API_BASE = import.meta.env.PROD ? 'https://api-ynovconnect.skayizen.fr' : '';
        this.baseURL = `${API_BASE}/api`;
        this.token = null;
    }

    setToken(token) { this.token = token; }

    headers() {
        return {
            'Content-Type': 'application/json',
            ...(this.token ? { Authorization: `Bearer ${this.token}` } : {})
        };
    }

    async request(method, endpoint, body = null) {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method,
            headers: this.headers(),
            ...(body ? { body: JSON.stringify(body) } : {})
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Erreur serveur');
        return data;
    }

    get(endpoint) { return this.request('GET', endpoint); }
    post(endpoint, body) { return this.request('POST', endpoint, body); }
    put(endpoint, body) { return this.request('PUT', endpoint, body); }
    delete(endpoint) { return this.request('DELETE', endpoint); }
}

export default new AdminApi();