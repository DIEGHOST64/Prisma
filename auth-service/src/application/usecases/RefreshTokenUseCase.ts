// filepath: src/application/usecases/RefreshTokenUseCase.ts
// 🔄 APPLICATION LAYER - Use Case

import { ITokenService } from '../../domain/services/ITokenService';
import { IUserRepository } from '../../domain/repositories/IUserRepository';

export interface RefreshTokenDTO {
  refreshToken: string;
}

export interface RefreshTokenResponseDTO {
  accessToken: string;
  refreshToken: string;
}

export class RefreshTokenUseCase {
  constructor(
    private tokenService: ITokenService,
    private userRepository: IUserRepository
  ) {}

  async execute(dto: RefreshTokenDTO): Promise<RefreshTokenResponseDTO> {
    // 1. Verificar refresh token
    const payload = this.tokenService.verifyToken(dto.refreshToken, true);
    
    if (!payload) {
      throw new Error('Invalid or expired refresh token');
    }

    // 2. Buscar usuario (verificar que aún existe y está activo)
    const user = await this.userRepository.findByUuid(payload.uuid);
    
    if (!user || !user.canLogin()) {
      throw new Error('User not found or inactive');
    }

    // 3. Generar nuevos tokens
    const newAccessToken = this.tokenService.generateAccessToken({
      uuid: user.uuid,
      email: user.email,
      role: user.role
    });

    const newRefreshToken = this.tokenService.generateRefreshToken({
      uuid: user.uuid,
      email: user.email,
      role: user.role
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  }
}
