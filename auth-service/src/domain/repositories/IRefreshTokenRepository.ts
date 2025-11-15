// filepath: src/domain/repositories/IRefreshTokenRepository.ts
// 🎯 DOMAIN LAYER - Repository Interface

import { RefreshToken } from '../entities/RefreshToken';

export interface IRefreshTokenRepository {
  // Crear refresh token
  create(refreshToken: RefreshToken): Promise<RefreshToken>;
  
  // Buscar por token
  findByToken(token: string): Promise<RefreshToken | null>;
  
  // Revocar token
  revoke(token: string): Promise<boolean>;
  
  // Revocar todos los tokens de un usuario
  revokeAllByUserId(userId: number): Promise<number>;
  
  // Eliminar tokens expirados
  deleteExpired(): Promise<number>;
}
