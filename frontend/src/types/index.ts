// User & Auth Types
export interface User {
  id: string;
  applicant_email: string;
  firstName: string;
  lastName: string;
  document: string;
  role: 'admin' | 'recruiter' | 'user';
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// Vacancy Types (actualizado para coincidir con backend PHP)
export interface Vacancy {
  uuid: string;
  title: string;
  description: string;
  requirements: string;
  location: string;
  salaryRange?: string;
  employmentType: string;
  status: string;
  publishedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  deletedAt?: string | null;
}

export interface CreateVacancyData {
  title: string;
  description: string;
  requirements: string;
  salary_min?: number;
  salary_max?: number;
  location: string;
  employment_type: 'full_time' | 'part_time' | 'contract' | 'freelance';
  experience_years?: number;
  education_level?: string;
}

// Application Types  
export interface Application {
  uuid: string;
  vacancyId: string;
  applicantName: string;
  applicant_email: string;
  applicant_phone: string;
  applicantDocument: string;
  cover_letter?: string;
  status: 'pending' | 'reviewing' | 'interviewed' | 'accepted' | 'rejected';
  notes?: string;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateApplicationData {
  vacancy_id: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string;
  applicant_document: string;
  cover_letter?: string;
}

export interface UpdateApplicationStatus {
  status: 'reviewing' | 'interviewed' | 'accepted' | 'rejected';
  notes?: string;
}

// Document Types
export interface Document {
  id: string;
  user_document: string;
  application_id: string;
  filename: string;
  original_filename?: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  document_type: 'cv' | 'carta_presentacion' | 'certificado' | 'diploma' | 'referencia' | 'otro';
  uploaded_at: string;
  uploaded_by: string;
}

export interface UploadDocumentData {
  file: File;
  user_document: string;
  application_id: string;
  document_type: 'cv' | 'carta_presentacion' | 'certificado' | 'diploma' | 'referencia' | 'otro';
}



