// filepath: src/application/usecases/CreateUserByAdminUseCase.ts
// 🔄 APPLICATION LAYER - Use Case
// Solo admins pueden crear usuarios

import { v4 as uuidv4 } from 'uuid';
import { User, UserRole, UserStatus } from '../../domain/entities/User';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IPasswordService } from '../../domain/services/IPasswordService';
import { CreateUserDTO, UserResponseDTO } from '../dtos/CreateUserDTO';

export class CreateUserByAdminUseCase {
  constructor(
    private userRepository: IUserRepository,
    private passwordService: IPasswordService
  ) {}

  async execute(dto: CreateUserDTO): Promise<UserResponseDTO> {
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

    // 4. Crear entidad User
    const user = User.create({
      uuid: uuidv4(),
      email: dto.email.toLowerCase().trim(),
      passwordHash,
      name: dto.name.trim(),
      role: UserRole[dto.role.toUpperCase() as keyof typeof UserRole],
      status: UserStatus.ACTIVE,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // 5. Guardar en repositorio
    const savedUser = await this.userRepository.create(user);

    // 6. Retornar DTO (sin contraseña)
    return savedUser.toJSON();
  }
}
