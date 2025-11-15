// filepath: src/application/usecases/RegisterUserUseCase.ts
// 🔄 APPLICATION LAYER - Use Case
// Este caso de uso NO conoce Express, PostgreSQL, etc.
// Solo orquesta la lógica de negocio

import { v4 as uuidv4 } from 'uuid';
import { User, UserRole, UserStatus } from '../../domain/entities/User';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IPasswordService } from '../../domain/services/IPasswordService';
import { ITokenService } from '../../domain/services/ITokenService';
import { RegisterUserDTO, RegisterUserResponseDTO } from '../dtos/RegisterUserDTO';

export class RegisterUserUseCase {
  constructor(
    private userRepository: IUserRepository,
    private passwordService: IPasswordService,
    private tokenService: ITokenService
  ) {}

  async execute(dto: RegisterUserDTO): Promise<RegisterUserResponseDTO> {
    // 1. Validar que el email no exista
    const emailExists = await this.userRepository.emailExists(dto.email);
    if (emailExists) {
      throw new Error('Email already registered');
    }

    // 2. Validar fortaleza de la contraseña
    if (!this.passwordService.validateStrength(dto.password)) {
      throw new Error('Password does not meet strength requirements');
    }

    // 3. Hashear contraseña
    const passwordHash = await this.passwordService.hash(dto.password);

    // 4. Crear entidad User (reglas de negocio en el dominio)
    const user = User.create({
      uuid: uuidv4(),
      email: dto.email.toLowerCase().trim(),
      passwordHash,
      name: dto.name.trim(),
      role: dto.role ? UserRole[dto.role.toUpperCase() as keyof typeof UserRole] : UserRole.USER,
      status: UserStatus.ACTIVE,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // 5. Guardar en repositorio
    const savedUser = await this.userRepository.create(user);

    // 6. Generar tokens
    const accessToken = this.tokenService.generateAccessToken({
      uuid: savedUser.uuid,
      email: savedUser.email,
      role: savedUser.role
    });

    const refreshToken = this.tokenService.generateRefreshToken({
      uuid: savedUser.uuid,
      email: savedUser.email,
      role: savedUser.role
    });

    // 7. Retornar DTO de respuesta
    return {
      user: savedUser.toJSON(),
      accessToken,
      refreshToken
    };
  }
}
