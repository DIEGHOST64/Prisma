// filepath: src/application/dtos/CreateUserDTO.ts
// 🔄 APPLICATION LAYER - DTO for creating users (admin only)

export interface CreateUserDTO {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'recruiter' | 'user';
}

export interface UserResponseDTO {
  uuid: string;
  email: string;
  name: string;
  role: string;
  status: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}
