// filepath: src/domain/services/ITokenService.ts
// 🎯 DOMAIN LAYER - Service Interface
// Abstracción para generación de tokens JWT

export interface TokenPayload {
  uuid: string;
  email: string;
  role: string;
}

export interface ITokenService {
  // Generar access token
  generateAccessToken(payload: TokenPayload): string;
  
  // Generar refresh token
  generateRefreshToken(payload: TokenPayload): string;
  
  // Verificar token
  verifyToken(token: string, isRefreshToken?: boolean): TokenPayload | null;
  
  // Decodificar token sin verificar
  decodeToken(token: string): any;
}
