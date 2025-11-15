// filepath: src/application/usecases/UpdateUserUseCase.ts
// 🔄 APPLICATION LAYER - Use Case
// Actualizar usuario (solo admin)

import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { UserRole, UserStatus } from '../../domain/entities/User';
import { UpdateUserDTO } from '../dtos/UpdateUserDTO';
import { UserResponseDTO } from '../dtos/CreateUserDTO';

export class UpdateUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(dto: UpdateUserDTO): Promise<UserResponseDTO> {
    // 1. Buscar usuario
    const user = await this.userRepository.findByUuid(dto.uuid);
    
    if (!user) {
      throw new Error('User not found');
    }

    // 2. Validar email único si se va a cambiar
    if (dto.email && dto.email !== user.email) {
      const emailExists = await this.userRepository.emailExists(dto.email);
      if (emailExists) {
        throw new Error('Email already in use');
      }
    }

    // 3. Actualizar campos permitidos
    if (dto.email !== undefined) user.updateEmail(dto.email);
    if (dto.name !== undefined) user.updateName(dto.name);
    if (dto.role !== undefined) user.updateRole(dto.role as UserRole);
    if (dto.status !== undefined) user.updateStatus(dto.status as UserStatus);

    const updatedUser = await this.userRepository.update(user);
    
    return updatedUser.toJSON();
  }
}
