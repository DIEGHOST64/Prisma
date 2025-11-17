import axios from 'axios';
import type { AuthResponse, LoginCredentials, User } from '../types';

const API_URL = 'https://prismacvesta.xyz/api/v1';

const authAPI = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token
authAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores de autenticaci�n
authAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Sesi�n expirada o token inv�lido
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirigir al login con par�metro de sesi�n expirada
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?session=expired';
      }
    }
    return Promise.reject(error);
  }
);interface BackendAuthResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    user: {
      uuid: string;
      email: string;
      name: string;
      role: string;
      status: string;
    };
  };
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await authAPI.post<BackendAuthResponse>('/auth/login', credentials);
    
    if (response.data.success && response.data.data.accessToken) {
      const backendData = response.data.data;
      
      // Transformar la respuesta del backend al formato esperado por el frontend
      const authResponse: AuthResponse = {
        accessToken: backendData.accessToken,
        refreshToken: backendData.refreshToken,
        user: {
          id: backendData.user.uuid,
          applicant_email: backendData.user.email,
          firstName: backendData.user.name.split(' ')[0] || backendData.user.name,
          lastName: backendData.user.name.split(' ').slice(1).join(' ') || '',
          document: '',
          role: backendData.user.role as 'admin' | 'recruiter' | 'user',
          isEmailVerified: true,
          isActive: backendData.user.status === 'active',
          createdAt: new Date().toISOString(),
        }
      };
      
      localStorage.setItem('token', authResponse.accessToken);
      localStorage.setItem('user', JSON.stringify(authResponse.user));
      
      return authResponse;
    }
    
    throw new Error('Login failed');
  },

  async getProfile(): Promise<User> {
    const response = await authAPI.get<User>('/auth/profile');
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  },
};
