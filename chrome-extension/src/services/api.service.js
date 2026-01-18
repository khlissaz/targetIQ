const API_URL = 'http://localhost:5000';

class ApiService {
  async login(email, password) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    return await response.json();
  }

  async getLeadsByTable(tableName, token) {
    const response = await fetch(`${API_URL}/leads/${tableName}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${tableName}`);
    }

    return await response.json();
  }

  async createLeadsBulk(tableName, data, token) {
    const response = await fetch(`${API_URL}/leads/${tableName}/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create ${tableName}`);
    }

    return await response.json();
  }
}

const apiService = new ApiService();
