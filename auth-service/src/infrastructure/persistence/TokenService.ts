// filepath: src/infrastructure/persistence/TokenService.ts
// 🔧 INFRASTRUCTURE LAYER - JWT Token Service Implementation

import jwt from 'jsonwebtoken';
import { ITokenService, TokenPayload } from '../../domain/services/ITokenService';

export class TokenService implements ITokenService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;
  private readonly jwtRefreshSecret: string;
  private readonly jwtRefreshExpiresIn: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'default_secret_change_me';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '15m';
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'default_refresh_secret_change_me';
    this.jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  }

  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn as string,
      issuer: 'auth-service',
      audience: 'recruitment-app'
    } as jwt.SignOptions);
  }

  generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.jwtRefreshSecret, {
      expiresIn: this.jwtRefreshExpiresIn as string,
      issuer: 'auth-service',
      audience: 'recruitment-app'
    } as jwt.SignOptions);
  }

  verifyToken(token: string, isRefreshToken: boolean = false): TokenPayload | null {
    try {
      const secret = isRefreshToken ? this.jwtRefreshSecret : this.jwtSecret;
      const decoded = jwt.verify(token, secret, {
        issuer: 'auth-service',
        audience: 'recruitment-app'
      }) as TokenPayload;
      
      return decoded;
    } catch (error) {
      return null;
    }
  }

  decodeToken(token: string): any {
    return jwt.decode(token);
  }
}
