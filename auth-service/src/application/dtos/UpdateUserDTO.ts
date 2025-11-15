// filepath: src/application/dtos/UpdateUserDTO.ts
// 🔄 APPLICATION LAYER - DTO for updating users

export interface UpdateUserDTO {
  uuid: string;
  name?: string;
  email?: string;
  role?: 'admin' | 'recruiter' | 'user';
  status?: 'active' | 'inactive' | 'suspended';
}

export interface UpdateUserPasswordDTO {
  uuid: string;
  currentPassword: string;
  newPassword: string;
}
