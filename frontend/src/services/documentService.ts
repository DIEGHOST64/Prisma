import axios from 'axios';
import type { Document, UploadDocumentData } from '../types';

const API_URL = 'http://localhost:3003/api/v1';

const documentAPI = axios.create({
  baseURL: API_URL,
});

documentAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const documentService = {
  async uploadDocument(data: UploadDocumentData): Promise<Document> {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('user_document', data.user_document);
    formData.append('application_id', data.application_id);
    formData.append('document_type', data.document_type);

    // Usar endpoint público para uploads de CVs durante postulación
    const response = await documentAPI.post<Document>('/documents/upload/public', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getDocumentUrl(documentId: string): Promise<{ document_id: string; url: string }> {
    const response = await documentAPI.get(`/documents/${documentId}/url`);
    return response.data;
  },

  async getDocumentsByApplication(applicationId: string): Promise<Document[]> {
    const response = await documentAPI.get<Document[]>(`/documents/application/${applicationId}`);
    return response.data;
  },

  async downloadDocument(applicationId: string): Promise<void> {
    try {
      // Obtener documentos de la aplicación (usa el token del interceptor)
      const response = await documentAPI.get(`/documents/application/${applicationId}`);
      const documents = response.data;
      
      // Buscar el CV
      const cvDoc = documents.find((doc: any) => doc.document_type === 'cv');
      
      if (!cvDoc) {
        throw new Error('No se encontró el CV para esta aplicación');
      }

      // Construir la URL correcta del archivo (público, no requiere auth)
      const fileUrl = `http://localhost:3003/storage/${cvDoc.file_path}`;
      
      // Descargar el archivo sin autenticación (los archivos en /storage son públicos)
      const fileResponse = await axios.get(fileUrl, {
        responseType: 'blob',
      });

      // Crear un enlace temporal y hacer clic para descargar
      const blob = new Blob([fileResponse.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = cvDoc.original_filename || cvDoc.filename || 'CV.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error al descargar documento:', error);
      if (error.response?.status === 401) {
        throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente.');
      }
      throw new Error('Error al descargar el documento. Verifique que el CV exista.');
    }
  },
};
