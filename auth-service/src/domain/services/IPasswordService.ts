// filepath: src/domain/services/IPasswordService.ts
// 🎯 DOMAIN LAYER - Service Interface
// Abstracción para hash de contraseñas (implementación en Infrastructure)

export interface IPasswordService {
  // Hashear contraseña
  hash(password: string): Promise<string>;
  
  // Verificar contraseña
  compare(password: string, hash: string): Promise<boolean>;
  
  // Validar fortaleza de contraseña
  validateStrength(password: string): boolean;
}
