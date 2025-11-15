// filepath: src/infrastructure/persistence/PasswordService.ts
// 🔧 INFRASTRUCTURE LAYER - Password Service Implementation

import bcrypt from 'bcryptjs';
import { IPasswordService } from '../../domain/services/IPasswordService';

export class PasswordService implements IPasswordService {
  private readonly saltRounds = 10;

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  validateStrength(password: string): boolean {
    // Mínimo 8 caracteres
    if (password.length < 8) {
      return false;
    }

    // Al menos una mayúscula
    if (!/[A-Z]/.test(password)) {
      return false;
    }

    // Al menos una minúscula
    if (!/[a-z]/.test(password)) {
      return false;
    }

    // Al menos un número
    if (!/[0-9]/.test(password)) {
      return false;
    }

    // Al menos un carácter especial
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return false;
    }

    return true;
  }
}
