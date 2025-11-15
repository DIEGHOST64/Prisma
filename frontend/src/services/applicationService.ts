import axios from 'axios';
import type { Application, CreateApplicationData } from '../types';

const API_URL = 'http://localhost:3002/api/v1';

const applicationAPI = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

applicationAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores de autenticación
applicationAPI.interceptors.response.use(
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

export const applicationService = {
  async createApplication(data: CreateApplicationData): Promise<Application> {
    // Transformar datos del frontend al formato que espera el backend
    const backendData = {
      vacancyUuid: data.vacancyId,
      fullName: data.applicantName,
      email: data.applicantEmail,
      phone: data.applicantPhone,
      documentNumber: data.applicantDocument,
      coverLetter: data.coverLetter || '',
      cvPath: '' // Se actualizará después de subir el archivo
    };

    const response = await applicationAPI.post<{ success: boolean; data: any }>('/applications', backendData);
    
    // Transformar respuesta del backend al formato del frontend
    const backendApp = response.data.data;
    return {
      uuid: backendApp.uuid,
      vacancyId: backendApp.vacancyUuid,
      applicantName: backendApp.fullName,
      applicantEmail: backendApp.email,
      applicantPhone: backendApp.phone,
      applicantDocument: backendApp.documentNumber,
      coverLetter: backendApp.coverLetter,
      status: backendApp.status,
      notes: backendApp.notes,
      createdAt: backendApp.createdAt,
      updatedAt: backendApp.updatedAt
    };
  },

  async getAllApplications(): Promise<Application[]> {
    const response = await applicationAPI.get<{ success: boolean; data: { applications: any[] } }>('/applications?limit=1000');
    
    return response.data.data.applications.map((app: any) => ({
      uuid: app.uuid,
      vacancyId: app.vacancyUuid,
      applicantName: app.fullName,
      applicantEmail: app.email,
      applicantPhone: app.phone,
      applicantDocument: app.documentNumber,
      coverLetter: app.coverLetter,
      status: app.status,
      notes: app.notes,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt
    }));
  },

  async getApplicationStatus(document: string): Promise<Application[]> {
    const response = await applicationAPI.get<{ success: boolean; data: { applications: any[] } }>(`/applications/status/${document}`);
    
    return response.data.data.applications.map((app: any) => ({
      uuid: app.uuid,
      vacancyId: app.vacancyUuid,
      applicantName: app.fullName,
      applicantEmail: app.email,
      applicantPhone: app.phone,
      applicantDocument: app.documentNumber,
      coverLetter: app.coverLetter,
      status: app.status,
      notes: app.notes,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt
    }));
  },

  async updateApplicationStatus(applicationId: string, status: string, notes?: string): Promise<Application> {
    const response = await applicationAPI.patch<{ success: boolean; data: any }>(`/applications/${applicationId}/status`, {
      status,
      notes,
    });
    
    const app = response.data.data;
    return {
      uuid: app.uuid,
      vacancyId: app.vacancyUuid,
      applicantName: app.fullName,
      applicantEmail: app.email,
      applicantPhone: app.phone,
      applicantDocument: app.applicantDocument,
      coverLetter: app.coverLetter,
      status: app.status,
      notes: app.notes,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt
    };
  },

  async deleteApplication(applicationId: string): Promise<void> {
    await applicationAPI.delete(`/applications/${applicationId}`);
  },

  async bulkDeleteByStatus(status: 'accepted' | 'rejected'): Promise<{ deleted: number }> {
    const response = await applicationAPI.post<{ success: boolean; deleted: number }>('/applications/bulk-delete', {
      status,
    });
    return { deleted: response.data.deleted };
  },
};
