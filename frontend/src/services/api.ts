import axios from 'axios';

// Configuración de axios para Auth Service
export const authAPI = axios.create({
  baseURL: 'http://52.0.197.30:3001/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Configuración de axios para Recruitment Service
export const recruitmentAPI = axios.create({
  baseURL: 'http://52.0.197.30:3002/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Configuración de axios para Document Service
export const documentAPI = axios.create({
  baseURL: 'http://52.0.197.30:3003/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token a todas las peticiones de auth
authAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores de autenticación en auth
authAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?session=expired';
      }
    }
    return Promise.reject(error);
  }
);

// Interceptor para agregar token a todas las peticiones de recruitment
recruitmentAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores de autenticación en recruitment
recruitmentAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?session=expired';
      }
    }
    return Promise.reject(error);
  }
);

// Interceptor para agregar token a todas las peticiones de document
documentAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores de autenticación en document
documentAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?session=expired';
      }
    }
    return Promise.reject(error);
  }
);

