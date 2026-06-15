const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('rtm_token');
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(data.error || 'Request failed', response.status, data);
  }

  return data;
}

export const authApi = {
  register: (payload) => apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  login: (payload) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  me: () => apiRequest('/auth/me')
};

export const gameApi = {
  start: (bet_points) => apiRequest('/game/start', {
    method: 'POST',
    body: JSON.stringify({ bet_points })
  }),
  cashout: (round_id) => apiRequest('/game/cashout', {
    method: 'POST',
    body: JSON.stringify({ round_id })
  }),
  crash: (round_id) => apiRequest('/game/crash', {
    method: 'POST',
    body: JSON.stringify({ round_id })
  }),
  history: () => apiRequest('/game/history')
};
