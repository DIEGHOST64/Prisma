// filepath: src/infrastructure/persistence/PostgresUserRepository.ts
// 🔧 INFRASTRUCTURE LAYER - Repository Implementation
// Esta clase SÍ conoce PostgreSQL (pero el dominio NO lo sabe)

import pool from '../config/database';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User, UserRole, UserStatus } from '../../domain/entities/User';

export class PostgresUserRepository implements IUserRepository {
  
  async findByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT * FROM users 
      WHERE email = $1 AND deleted_at IS NULL
    `;
    
    const result = await pool.query(query, [email]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapToEntity(result.rows[0]);
  }

  async findByUuid(uuid: string): Promise<User | null> {
    const query = `
      SELECT * FROM users 
      WHERE uuid = $1 AND deleted_at IS NULL
    `;
    
    const result = await pool.query(query, [uuid]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapToEntity(result.rows[0]);
  }

  async findAll(): Promise<User[]> {
    const query = `
      SELECT * FROM users 
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query);
    
    return result.rows.map(row => this.mapToEntity(row));
  }

  async create(user: User): Promise<User> {
    const query = `
      INSERT INTO users (
        uuid, email, password_hash, name, role, status, 
        email_verified, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const values = [
      user.uuid,
      user.email,
      user.passwordHash,
      user.name,
      user.role,
      user.status,
      user.emailVerified,
      user.createdAt,
      user.updatedAt
    ];
    
    const result = await pool.query(query, values);
    return this.mapToEntity(result.rows[0]);
  }

  async update(user: User): Promise<User> {
    const query = `
      UPDATE users 
      SET email = $1, password_hash = $2, name = $3, role = $4, 
          status = $5, email_verified = $6, updated_at = $7, last_login_at = $8
      WHERE uuid = $9 AND deleted_at IS NULL
      RETURNING *
    `;
    
    const values = [
      user.email,
      user.passwordHash,
      user.name,
      user.role,
      user.status,
      user.emailVerified,
      user.updatedAt,
      user.lastLoginAt || null,
      user.uuid
    ];
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('User not found for update');
    }
    
    return this.mapToEntity(result.rows[0]);
  }

  async delete(uuid: string): Promise<boolean> {
    // Soft delete
    const query = `
      UPDATE users 
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE uuid = $1 AND deleted_at IS NULL
    `;
    
    const result = await pool.query(query, [uuid]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  async emailExists(email: string): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count FROM users 
      WHERE email = $1 AND deleted_at IS NULL
    `;
    
    const result = await pool.query(query, [email]);
    return parseInt(result.rows[0].count) > 0;
  }

  // Mapear de database row a domain entity
  private mapToEntity(row: any): User {
    return User.create({
      uuid: row.uuid,
      email: row.email,
      passwordHash: row.password_hash,
      name: row.name,
      role: row.role as UserRole,
      status: row.status as UserStatus,
      emailVerified: row.email_verified,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastLoginAt: row.last_login_at
    });
  }
}
