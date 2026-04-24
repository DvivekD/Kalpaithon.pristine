import axios from 'axios';

const api = axios.create({ 
  baseURL: import.meta.env.VITE_API_URL || 'https://backend-weld-five-81.vercel.app/api'
});

// Attach token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('fasal_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, only redirect if we have a stored token (session expired)
api.interceptors.response.use(res => res, err => {
  if (err.response?.status === 401 && localStorage.getItem('fasal_token')) {
    localStorage.removeItem('fasal_token');
    window.location.href = '/login';
  }
  return Promise.reject(err);
});

export default api;
