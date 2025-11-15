// filepath: src/application/usecases/LoginUserUseCase.ts
// 🔄 APPLICATION LAYER - Use Case

import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IPasswordService } from '../../domain/services/IPasswordService';
import { ITokenService } from '../../domain/services/ITokenService';
import { LoginUserDTO, LoginUserResponseDTO } from '../dtos/LoginUserDTO';

export class LoginUserUseCase {
  constructor(
    private userRepository: IUserRepository,
    private passwordService: IPasswordService,
    private tokenService: ITokenService
  ) {}

  async execute(dto: LoginUserDTO): Promise<LoginUserResponseDTO> {
    // 1. Buscar usuario por email
    const user = await this.userRepository.findByEmail(dto.email.toLowerCase().trim());
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // 2. Verificar que el usuario pueda iniciar sesión (regla de negocio)
    if (!user.canLogin()) {
      throw new Error('User account is not active');
    }

    // 3. Verificar contraseña
    const isPasswordValid = await this.passwordService.compare(dto.password, user.passwordHash);
    
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // 4. Actualizar último login (regla de negocio)
    user.updateLastLogin();
    await this.userRepository.update(user);

    // 5. Generar tokens
    const accessToken = this.tokenService.generateAccessToken({
      uuid: user.uuid,
      email: user.email,
      role: user.role
    });

    const refreshToken = this.tokenService.generateRefreshToken({
      uuid: user.uuid,
      email: user.email,
      role: user.role
    });

    // 6. Retornar respuesta
    return {
      user: user.toJSON(),
      accessToken,
      refreshToken
    };
  }
}
