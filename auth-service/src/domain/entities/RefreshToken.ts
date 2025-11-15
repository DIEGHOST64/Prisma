// filepath: src/domain/entities/RefreshToken.ts
// 🎯 DOMAIN LAYER - Entity

export interface RefreshTokenProps {
  id?: number;
  userId: number;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  revoked: boolean;
}

export class RefreshToken {
  private constructor(private props: RefreshTokenProps) {
    this.validate();
  }

  static create(props: RefreshTokenProps): RefreshToken {
    return new RefreshToken(props);
  }

  private validate(): void {
    if (!this.props.token || this.props.token.length < 20) {
      throw new Error('Invalid refresh token');
    }

    if (!this.props.expiresAt || this.props.expiresAt <= new Date()) {
      throw new Error('Refresh token must have a future expiration date');
    }
  }

  // Regla de negocio: el token es válido?
  isValid(): boolean {
    return !this.props.revoked && this.props.expiresAt > new Date();
  }

  // Regla de negocio: revocar token
  revoke(): void {
    if (this.props.revoked) {
      throw new Error('Token already revoked');
    }
    this.props.revoked = true;
  }

  // Regla de negocio: está expirado?
  isExpired(): boolean {
    return this.props.expiresAt <= new Date();
  }

  get id(): number | undefined {
    return this.props.id;
  }

  get userId(): number {
    return this.props.userId;
  }

  get token(): string {
    return this.props.token;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get revoked(): boolean {
    return this.props.revoked;
  }
}
