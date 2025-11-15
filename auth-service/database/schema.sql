-- filepath: database/schema.sql
-- 🗄️ PostgreSQL Schema para Auth Service
-- Clean Architecture - Database Schema

-- Crear extensión para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Eliminar tablas si existen (solo para desarrollo)
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Tipos ENUM
CREATE TYPE user_role AS ENUM ('admin', 'recruiter', 'user');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');

-- ══════════════════════════════════════════════════════════════
-- Tabla: users
-- ══════════════════════════════════════════════════════════════
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role user_role DEFAULT 'user',
    status user_status DEFAULT 'active',
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL,
    deleted_at TIMESTAMP NULL,
    
    -- Constraints
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT name_length CHECK (char_length(name) >= 2)
);

-- Índices para users
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_uuid ON users(uuid) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_status ON users(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON users(role);

-- ══════════════════════════════════════════════════════════════
-- Tabla: refresh_tokens
-- ══════════════════════════════════════════════════════════════
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked BOOLEAN DEFAULT FALSE,
    
    -- Constraints
    CONSTRAINT expires_in_future CHECK (expires_at > created_at)
);

-- Índices para refresh_tokens
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token) WHERE NOT revoked;
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- ══════════════════════════════════════════════════════════════
-- Función: Actualizar updated_at automáticamente
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para users
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ══════════════════════════════════════════════════════════════
-- Datos de prueba (solo para desarrollo)
-- ══════════════════════════════════════════════════════════════

-- 🔐 SUPER ADMIN - Usuario inicial del sistema
-- Email: superadmin@prisma.com
-- Password: SuperAdmin2025!@#
-- IMPORTANTE: Cambiar contraseña después del primer login
INSERT INTO users (uuid, email, password_hash, name, role, status, email_verified)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'superadmin@prisma.com',
    '$2a$10$3/rOeQdUMYUUiz3j.dnheO9Hu49dYAHDezMnkgP4TpLz7GGKlBTty',
    'Super Admin',
    'admin',
    'active',
    TRUE
);

-- ══════════════════════════════════════════════════════════════
-- Vistas útiles
-- ══════════════════════════════════════════════════════════════

-- Vista: Usuarios activos
CREATE OR REPLACE VIEW active_users AS
SELECT 
    uuid,
    email,
    name,
    role,
    email_verified,
    created_at,
    last_login_at
FROM users
WHERE status = 'active' AND deleted_at IS NULL;

-- ══════════════════════════════════════════════════════════════
-- Comentarios en tablas
-- ══════════════════════════════════════════════════════════════
COMMENT ON TABLE users IS 'Usuarios del sistema - Auth Service';
COMMENT ON TABLE refresh_tokens IS 'Tokens de refresco JWT';
COMMENT ON COLUMN users.uuid IS 'Identificador público del usuario';
COMMENT ON COLUMN users.password_hash IS 'Hash bcrypt de la contraseña';

-- ══════════════════════════════════════════════════════════════
-- Permisos (ajustar según tu configuración)
-- ══════════════════════════════════════════════════════════════
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
