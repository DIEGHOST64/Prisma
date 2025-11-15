// filepath: src/domain/repositories/IUserRepository.ts
// 🎯 DOMAIN LAYER - Repository Interface (Port)
// La implementación estará en Infrastructure

import { User } from '../entities/User';

export interface IUserRepository {
  // Buscar usuario por email
  findByEmail(email: string): Promise<User | null>;
  
  // Buscar usuario por UUID
  findByUuid(uuid: string): Promise<User | null>;
  
  // Buscar todos los usuarios
  findAll(): Promise<User[]>;
  
  // Crear usuario
  create(user: User): Promise<User>;
  
  // Actualizar usuario
  update(user: User): Promise<User>;
  
  // Eliminar usuario (soft delete)
  delete(uuid: string): Promise<boolean>;
  
  // Verificar si email existe
  emailExists(email: string): Promise<boolean>;
}
