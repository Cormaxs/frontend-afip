import axios from 'axios';

const desarrollo ="https://dev.facstock.com/";//'http://localhost:3010'
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3010" , // Usa variable de entorno https://api.facstock.com
  headers: {
    'Content-Type': 'application/json',
  },
});


// Interceptor para agregar token de autenticación (opcional)
/*
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);
*/
export default api;