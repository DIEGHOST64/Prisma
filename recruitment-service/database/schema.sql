-- filepath: database/schema.sql
-- 🗄️ PostgreSQL Schema para Recruitment Service
-- Clean Architecture - Database Schema

-- Crear extensión para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Eliminar tablas si existen (solo para desarrollo)
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS vacancies CASCADE;

-- Tipos ENUM
CREATE TYPE employment_type AS ENUM ('full-time', 'part-time', 'contract', 'internship');
CREATE TYPE vacancy_status AS ENUM ('draft', 'published', 'closed', 'filled');
CREATE TYPE application_status AS ENUM ('pending', 'reviewing', 'interviewed', 'accepted', 'rejected');

-- ══════════════════════════════════════════════════════════════
-- Tabla: vacancies
-- ══════════════════════════════════════════════════════════════
CREATE TABLE vacancies (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT NOT NULL,
    location VARCHAR(100) NOT NULL,
    salary_range VARCHAR(100),
    employment_type employment_type NOT NULL,
    status vacancy_status DEFAULT 'draft',
    published_at TIMESTAMP NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    -- Constraints
    CONSTRAINT title_length CHECK (char_length(title) >= 5),
    CONSTRAINT description_length CHECK (char_length(description) >= 20),
    CONSTRAINT expires_after_now CHECK (expires_at > created_at)
);

-- Índices para vacancies
CREATE INDEX idx_vacancies_uuid ON vacancies(uuid) WHERE deleted_at IS NULL;
CREATE INDEX idx_vacancies_status ON vacancies(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_vacancies_published_at ON vacancies(published_at) WHERE status = 'published';
CREATE INDEX idx_vacancies_expires_at ON vacancies(expires_at);
CREATE INDEX idx_vacancies_employment_type ON vacancies(employment_type);

-- ══════════════════════════════════════════════════════════════
-- Tabla: applications
-- ══════════════════════════════════════════════════════════════
CREATE TABLE applications (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    vacancy_id INTEGER NOT NULL REFERENCES vacancies(id) ON DELETE CASCADE,
    vacancy_uuid UUID NOT NULL,
    document_number VARCHAR(20) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    cv_path VARCHAR(500) NOT NULL,
    cover_letter TEXT,
    status application_status DEFAULT 'pending',
    review_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    -- Constraints
    CONSTRAINT document_length CHECK (char_length(document_number) >= 5),
    CONSTRAINT full_name_length CHECK (char_length(full_name) >= 3),
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT unique_application_per_vacancy UNIQUE (vacancy_id, document_number, deleted_at)
);

-- Índices para applications
CREATE INDEX idx_applications_uuid ON applications(uuid) WHERE deleted_at IS NULL;
CREATE INDEX idx_applications_vacancy_id ON applications(vacancy_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_applications_vacancy_uuid ON applications(vacancy_uuid) WHERE deleted_at IS NULL;
CREATE INDEX idx_applications_document ON applications(document_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_email ON applications(email);

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

-- Triggers
CREATE TRIGGER update_vacancies_updated_at
    BEFORE UPDATE ON vacancies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ══════════════════════════════════════════════════════════════
-- Datos de prueba (solo para desarrollo)
-- ══════════════════════════════════════════════════════════════

-- Vacante de ejemplo
INSERT INTO vacancies (uuid, title, description, requirements, location, salary_range, employment_type, status, published_at, expires_at)
VALUES (
    uuid_generate_v4(),
    'Desarrollador Full Stack Senior',
    'Buscamos un desarrollador full stack con experiencia en React, Node.js y PostgreSQL para unirse a nuestro equipo de desarrollo. Trabajarás en proyectos innovadores utilizando las últimas tecnologías.',
    'Mínimo 3 años de experiencia en desarrollo web, conocimientos sólidos en React, Node.js, PostgreSQL, Docker. Deseable experiencia en AWS y microservicios.',
    'Bogotá, Colombia (Remoto disponible)',
    '$4.000.000 - $6.000.000 COP',
    'full-time',
    'published',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '30 days'
);

-- ══════════════════════════════════════════════════════════════
-- Vistas útiles
-- ══════════════════════════════════════════════════════════════

-- Vista: Vacantes activas
CREATE OR REPLACE VIEW active_vacancies AS
SELECT 
    uuid,
    title,
    description,
    requirements,
    location,
    salary_range,
    employment_type,
    status,
    published_at,
    expires_at,
    created_at
FROM vacancies
WHERE status = 'published' 
    AND expires_at > CURRENT_TIMESTAMP
    AND deleted_at IS NULL;

-- Vista: Estadísticas de postulaciones por vacante
CREATE OR REPLACE VIEW vacancy_statistics AS
SELECT 
    v.uuid as vacancy_uuid,
    v.title,
    v.status,
    COUNT(a.id) as total_applications,
    COUNT(CASE WHEN a.status = 'pending' THEN 1 END) as pending_applications,
    COUNT(CASE WHEN a.status = 'reviewing' THEN 1 END) as reviewing_applications,
    COUNT(CASE WHEN a.status = 'accepted' THEN 1 END) as accepted_applications,
    COUNT(CASE WHEN a.status = 'rejected' THEN 1 END) as rejected_applications
FROM vacancies v
LEFT JOIN applications a ON v.id = a.vacancy_id AND a.deleted_at IS NULL
WHERE v.deleted_at IS NULL
GROUP BY v.uuid, v.title, v.status;

-- ══════════════════════════════════════════════════════════════
-- Comentarios en tablas
-- ══════════════════════════════════════════════════════════════
COMMENT ON TABLE vacancies IS 'Vacantes de empleo disponibles';
COMMENT ON TABLE applications IS 'Postulaciones de candidatos a vacantes';
COMMENT ON COLUMN vacancies.uuid IS 'Identificador público de la vacante';
COMMENT ON COLUMN applications.uuid IS 'Identificador público de la postulación';
COMMENT ON COLUMN applications.cv_path IS 'Ruta del CV en S3 o sistema de archivos';
