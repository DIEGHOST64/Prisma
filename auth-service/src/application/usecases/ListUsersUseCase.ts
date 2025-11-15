// filepath: src/application/usecases/ListUsersUseCase.ts
// 🔄 APPLICATION LAYER - Use Case
// Listar todos los usuarios (solo admin)

import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { UserResponseDTO } from '../dtos/CreateUserDTO';

export interface ListUsersResponseDTO {
  users: UserResponseDTO[];
  total: number;
}

export class ListUsersUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(): Promise<ListUsersResponseDTO> {
    const users = await this.userRepository.findAll();
    
    return {
      users: users.map(user => user.toJSON()),
      total: users.length
    };
  }
}
