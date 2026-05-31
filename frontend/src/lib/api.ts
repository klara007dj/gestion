import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Injecter le token JWT automatiquement
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Gérer les erreurs 401 globalement
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.patch('/auth/change-password', data),
};

// ─── Formations ────────────────────────────────────────────────────────────
export const formationsApi = {
  list: (params) => api.get('/formations', { params }),
  get: (id) => api.get(`/formations/${id}`),
  create: (data) => api.post('/formations', data),
  update: (id, data) => api.put(`/formations/${id}`, data),
  delete: (id) => api.delete(`/formations/${id}`),
};

// ─── Domaines ──────────────────────────────────────────────────────────────
export const domainesApi = {
  list: () => api.get('/domaines'),
  create: (data) => api.post('/domaines', data),
  update: (id, data) => api.put(`/domaines/${id}`, data),
  delete: (id) => api.delete(`/domaines/${id}`),
};

// ─── Inscriptions ──────────────────────────────────────────────────────────
export const inscriptionsApi = {
  list: (params) => api.get('/inscriptions', { params }),
  create: (data) => api.post('/inscriptions', data),
  updateStatus: (id, data) => api.patch(`/inscriptions/${id}/status`, data),
};

// ─── Paiements ─────────────────────────────────────────────────────────────
export const paiementsApi = {
  list: (params) => api.get('/paiements', { params }),
  create: (data) => api.post('/paiements', data),
};

// ─── Présences ─────────────────────────────────────────────────────────────
export const presencesApi = {
  bulkCreate: (data) => api.post('/presences/bulk', data),
  getByFormation: (formationId) => api.get(`/presences/formation/${formationId}`),
};

// ─── Attestations ──────────────────────────────────────────────────────────
export const attestationsApi = {
  create: (data) => api.post('/attestations', data),
  myAttestations: () => api.get('/attestations/me'),
  verify: (code) => api.get(`/attestations/verify/${code}`),
};

// ─── Users ─────────────────────────────────────────────────────────────────
export const usersApi = {
  list: (params) => api.get('/users', { params }),
  createFormateur: (data) => api.post('/users/formateurs', data),
  toggle: (id) => api.patch(`/users/${id}/toggle`),
  updateMe: (data) => api.patch('/users/me', data),
};

// ─── Stats ─────────────────────────────────────────────────────────────────
export const statsApi = {
  dashboard: () => api.get('/stats/dashboard'),
  formateur: () => api.get('/stats/formateur'),
};

export default api;
