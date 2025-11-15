// filepath: src/application/dtos/LoginUserDTO.ts
// 🔄 APPLICATION LAYER - Data Transfer Object

export interface LoginUserDTO {
  email: string;
  password: string;
}

export interface LoginUserResponseDTO {
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
