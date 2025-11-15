// filepath: src/application/usecases/DeleteUserUseCase.ts
// 🔄 APPLICATION LAYER - Use Case
// Eliminar/desactivar usuario (solo admin)

import { IUserRepository } from '../../domain/repositories/IUserRepository';

export interface DeleteUserDTO {
  uuid: string;
  adminUuid: string; // UUID del admin que ejecuta la acción
}

export class DeleteUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(dto: DeleteUserDTO): Promise<boolean> {
    // 1. Validar que no sea el mismo usuario
    if (dto.uuid === dto.adminUuid) {
      throw new Error('Cannot delete your own account');
    }

    // 2. Buscar usuario a eliminar
    const user = await this.userRepository.findByUuid(dto.uuid);
    
    if (!user) {
      throw new Error('User not found');
    }

    // 3. Soft delete
    const deleted = await this.userRepository.delete(dto.uuid);
    
    return deleted;
  }
}
