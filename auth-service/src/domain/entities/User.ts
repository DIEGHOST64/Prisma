// filepath: src/domain/entities/User.ts
// 🎯 DOMAIN LAYER - NO DEPENDENCIES ALLOWED
// Esta entidad NO conoce nada de Express, PostgreSQL, JWT, etc.

export enum UserRole {
  ADMIN = 'admin',
  RECRUITER = 'recruiter',
  USER = 'user'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

export interface UserProps {
  uuid: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export class User {
  private constructor(private props: UserProps) {
    this.validate();
  }

  // Factory method - Clean Architecture pattern
  static create(props: UserProps): User {
    return new User(props);
  }

  // Regla de negocio: validación de la entidad
  private validate(): void {
    if (!this.props.email || !this.isValidEmail(this.props.email)) {
      throw new Error('Invalid email format');
    }

    if (!this.props.name || this.props.name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters');
    }

    if (!this.props.passwordHash || this.props.passwordHash.length < 10) {
      throw new Error('Invalid password hash');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Regla de negocio: un usuario puede iniciar sesión?
  canLogin(): boolean {
    return this.props.status === UserStatus.ACTIVE;
  }

  // Regla de negocio: actualizar último login
  updateLastLogin(): void {
    this.props.lastLoginAt = new Date();
    this.props.updatedAt = new Date();
  }

  // Regla de negocio: verificar email
  verifyEmail(): void {
    if (this.props.emailVerified) {
      throw new Error('Email already verified');
    }
    this.props.emailVerified = true;
    this.props.updatedAt = new Date();
  }

  // Regla de negocio: suspender usuario
  suspend(): void {
    if (this.props.status === UserStatus.SUSPENDED) {
      throw new Error('User already suspended');
    }
    this.props.status = UserStatus.SUSPENDED;
    this.props.updatedAt = new Date();
  }

  // Regla de negocio: activar usuario
  activate(): void {
    this.props.status = UserStatus.ACTIVE;
    this.props.updatedAt = new Date();
  }

  // Regla de negocio: actualizar email
  updateEmail(newEmail: string): void {
    if (!this.isValidEmail(newEmail)) {
      throw new Error('Invalid email format');
    }
    this.props.email = newEmail;
    this.props.updatedAt = new Date();
  }

  // Regla de negocio: actualizar nombre
  updateName(newName: string): void {
    if (!newName || newName.trim().length < 2) {
      throw new Error('Name must be at least 2 characters');
    }
    this.props.name = newName.trim();
    this.props.updatedAt = new Date();
  }

  // Regla de negocio: actualizar rol
  updateRole(newRole: UserRole): void {
    this.props.role = newRole;
    this.props.updatedAt = new Date();
  }

  // Regla de negocio: actualizar estado
  updateStatus(newStatus: UserStatus): void {
    this.props.status = newStatus;
    this.props.updatedAt = new Date();
  }

  // Getters (inmutabilidad)
  get uuid(): string {
    return this.props.uuid;
  }

  get email(): string {
    return this.props.email;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get name(): string {
    return this.props.name;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get status(): UserStatus {
    return this.props.status;
  }

  get emailVerified(): boolean {
    return this.props.emailVerified;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get lastLoginAt(): Date | undefined {
    return this.props.lastLoginAt;
  }

  // Para serialización (sin exponer password hash)
  toJSON() {
    return {
      uuid: this.props.uuid,
      email: this.props.email,
      name: this.props.name,
      role: this.props.role,
      status: this.props.status,
      emailVerified: this.props.emailVerified,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
      lastLoginAt: this.props.lastLoginAt
    };
  }
}
