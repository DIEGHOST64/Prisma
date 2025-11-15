-- Document Service Database Schema
-- PostgreSQL 18.1

-- Eliminar tabla si existe
DROP TABLE IF EXISTS documents CASCADE;

-- Crear tabla de documentos
CREATE TABLE documents (
    id UUID PRIMARY KEY,
    user_document VARCHAR(50) NOT NULL,
    application_id UUID NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    uploaded_by UUID NOT NULL,
    
    -- Constraints
    CONSTRAINT chk_file_size CHECK (file_size > 0 AND file_size <= 10485760), -- Máximo 10 MB
    CONSTRAINT chk_document_type CHECK (document_type IN ('cv', 'carta_presentacion', 'certificado', 'diploma', 'referencia', 'otro'))
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_documents_user_document ON documents(user_document);
CREATE INDEX idx_documents_application_id ON documents(application_id);
CREATE INDEX idx_documents_uploaded_at ON documents(uploaded_at DESC);
CREATE INDEX idx_documents_document_type ON documents(document_type);

-- Comentarios en la tabla
COMMENT ON TABLE documents IS 'Almacena metadata de documentos subidos por usuarios';
COMMENT ON COLUMN documents.id IS 'Identificador único del documento (UUID)';
COMMENT ON COLUMN documents.user_document IS 'Número de documento del usuario que sube el archivo';
COMMENT ON COLUMN documents.application_id IS 'ID de la postulación a la que pertenece el documento';
COMMENT ON COLUMN documents.filename IS 'Nombre original del archivo';
COMMENT ON COLUMN documents.file_path IS 'Ruta del archivo en el storage (local o S3)';
COMMENT ON COLUMN documents.file_size IS 'Tamaño del archivo en bytes';
COMMENT ON COLUMN documents.mime_type IS 'Tipo MIME del archivo';
COMMENT ON COLUMN documents.document_type IS 'Tipo de documento (cv, carta_presentacion, etc)';
COMMENT ON COLUMN documents.uploaded_at IS 'Fecha y hora de carga del documento';
COMMENT ON COLUMN documents.uploaded_by IS 'ID del usuario que cargó el documento';

-- Datos de ejemplo (opcional - comentar si no se necesita)
-- INSERT INTO documents (
--     id, user_document, application_id, filename, 
--     file_path, file_size, mime_type, document_type,
--     uploaded_at, uploaded_by
-- ) VALUES (
--     'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
--     '1234567890',
--     '84a17550-56c4-4299-9f97-0de9856ea586',
--     'cv_juan_perez.pdf',
--     '1234567890/84a17550-56c4-4299-9f97-0de9856ea586/cv_20250111_143022.pdf',
--     245678,
--     'application/pdf',
--     'cv',
--     CURRENT_TIMESTAMP,
--     'f47ac10b-58cc-4372-a567-0e02b2c3d479'
-- );

-- Document Service database schema created successfully
