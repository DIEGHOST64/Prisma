// filepath: src/application/dtos/RegisterUserDTO.ts
// 🔄 APPLICATION LAYER - Data Transfer Object

export interface RegisterUserDTO {
  email: string;
  password: string;
  name: string;
  role?: 'admin' | 'recruiter' | 'user';
}

export interface RegisterUserResponseDTO {
  user: {
    uuid: string;
    email: string;
    name: string;
    role: string;
    status: string;
  };
  accessToken: string;
  refreshToken: string;
}
