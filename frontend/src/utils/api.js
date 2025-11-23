import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==========================================
// AUTH
// ==========================================

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

// ==========================================
// BUYERS (Datos bancarios)
// ==========================================

export const buyersAPI = {
  saveBankData: (data) => api.post('/buyers/bank-data', data),
  getBankData: () => api.get('/buyers/bank-data'),
  getEncryptedData: () => api.get('/buyers/bank-data/encrypted'),
};

// ==========================================
// ASSETS (Obras digitales)
// ==========================================

export const assetsAPI = {
  getAll: () => api.get('/assets'),
  getById: (id) => api.get(`/assets/${id}`),
  getMyAssets: () => api.get('/assets/my-assets'),
  create: (formData) => api.post('/assets', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

// ==========================================
// TRANSFERS (Firmas digitales)
// ==========================================

export const transfersAPI = {
  create: (data) => api.post('/transfers', data),
  verify: (id) => api.get(`/transfers/verify/${id}`),
  getMyTransfers: () => api.get('/transfers/my-transfers'),
  getById: (id) => api.get(`/transfers/${id}`),
};

// ==========================================
// DOWNLOADS (Cifrado híbrido)
// ==========================================

export const downloadsAPI = {
  prepare: (transferId) => api.get(`/downloads/prepare/${transferId}`),
  decrypt: (data) => api.post('/downloads/decrypt', data),
  getMyDownloads: () => api.get('/downloads/my-downloads'),
};

// ==========================================
// DEMO (Endpoints de demostración)
// ==========================================

export const demoAPI = {
  getBcryptHashes: () => api.get('/demo/bcrypt-hashes'),
  getEncryptedData: () => api.get('/demo/encrypted-data'),
  getSignatures: () => api.get('/demo/signatures'),
  getHybridPackages: () => api.get('/demo/hybrid-packages'),
  getSecuritySummary: () => api.get('/demo/security-summary'),
};

export default api;