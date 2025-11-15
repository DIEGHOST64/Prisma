# Document Service 📄

Microservicio para gestión de documentos del sistema de reclutamiento PRISMA.COM. Implementado con **Clean Architecture** usando **Python + FastAPI**.

## 🏗️ Arquitectura

```
document-service/
├── app/
│   ├── domain/              # Capa de Dominio
│   │   ├── entities/        # Entidades de negocio
│   │   └── repositories/    # Interfaces de repositorios
│   ├── application/         # Capa de Aplicación
│   │   └── usecases/        # Casos de uso
│   ├── infrastructure/      # Capa de Infraestructura
│   │   ├── persistence/     # PostgreSQL repositories
│   │   ├── storage/         # Local/S3 storage
│   │   └── auth/            # JWT verification
│   ├── presentation/        # Capa de Presentación
│   │   ├── controllers/     # Controladores FastAPI
│   │   ├── middlewares/     # Auth middleware
│   │   └── models/          # DTOs (Pydantic)
│   ├── config/              # Configuración
│   └── main.py              # FastAPI app
├── database/
│   └── schema.sql           # PostgreSQL schema
├── storage/                 # Archivos (local)
├── .env                     # Variables de entorno
├── requirements.txt         # Dependencias
├── Dockerfile
└── docker-compose.yml
```

## 🚀 Características

- ✅ **Clean Architecture** con separación estricta de capas
- ✅ **FastAPI** con documentación automática (Swagger)
- ✅ **Dual Storage**: Local filesystem o AWS S3
- ✅ **PostgreSQL 18.1** para metadata de documentos
- ✅ **JWT Authentication** integrado con Auth Service
- ✅ **Async/Await** para operaciones I/O
- ✅ **File Validation**: Tipos y tamaños permitidos
- ✅ **Docker** containerizado

## 📋 Requisitos

- Python 3.11+
- PostgreSQL 18.1
- Docker & Docker Compose
- AWS Account (opcional, para S3)

## 🔧 Instalación

### Con Docker (Recomendado)

```bash
# Iniciar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f document-service

# Detener servicios
docker-compose down
```

### Sin Docker

```bash
# Crear entorno virtual
python -m venv venv
venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env

# Crear base de datos
docker exec -it document-db psql -U postgres -c "CREATE DATABASE document_db;"

# Ejecutar aplicación
uvicorn app.main:app --reload --port 3003
```

## 📝 Variables de Entorno

```env
# Base de datos
DB_HOST=localhost
DB_PORT=5434
DB_NAME=document_db
DB_USER=postgres
DB_PASSWORD=postgres

# JWT (debe coincidir con auth-service)
JWT_SECRET=your_jwt_secret_change_in_production

# Storage
STORAGE_TYPE=local
STORAGE_BASE_PATH=./storage

# AWS S3 (si STORAGE_TYPE=s3)
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
S3_BUCKET_NAME=your_bucket
```

## 🔑 Autenticación

Todos los endpoints requieren JWT token del **Auth Service**.

```bash
# Obtener token
curl -X POST http://localhost:3001/api/v1/auth/login -H "Content-Type: application/json" -d "{\"email\":\"superadmin@prisma.com\",\"password\":\"SuperAdmin2025!@#\"}"
```

## 📡 Endpoints

### Health Check
```bash
GET /health
```

### Subir Documento
```bash
POST /api/v1/documents/upload
Authorization: Bearer {token}

Form Data:
- file: archivo (PDF, DOC, DOCX, JPG, PNG - máx 10MB)
- user_document: número de documento
- application_id: UUID de postulación
- document_type: cv | carta_presentacion | certificado
```

### Obtener URL de Documento
```bash
GET /api/v1/documents/{document_id}/url
Authorization: Bearer {token}
```

### Listar por Postulación
```bash
GET /api/v1/documents/application/{application_id}
Authorization: Bearer {token}
```

### Listar por Usuario
```bash
GET /api/v1/documents/user/{user_document}
Authorization: Bearer {token}
```

### Eliminar (Admin/Recruiter)
```bash
DELETE /api/v1/documents/{document_id}
Authorization: Bearer {token}
```

## 🧪 Pruebas

```bash
# Con PowerShell
$token = "YOUR_JWT_TOKEN"
curl.exe -X POST http://localhost:3003/api/v1/documents/upload -H "Authorization: Bearer $token" -F "file=@cv.pdf" -F "user_document=1234567890" -F "application_id=84a17550-56c4-4299-9f97-0de9856ea586" -F "document_type=cv"
```

## 📊 Base de Datos

### Tabla documents
- id (UUID)
- user_document (VARCHAR)
- application_id (UUID)
- filename (VARCHAR)
- file_path (VARCHAR)
- file_size (INTEGER, máx 10MB)
- mime_type (VARCHAR)
- document_type (ENUM)
- uploaded_at (TIMESTAMP)
- uploaded_by (UUID)

## 🗂️ Storage

### Local
```
storage/
└── 2025/
    └── 01/
        └── 1234567890/
            └── uuid/
                └── cv_20250111.pdf
```

### AWS S3
Archivos con AES256 encryption y presigned URLs.

## 🔐 Validaciones

- Tamaño máximo: 10 MB
- Tipos: PDF, DOC, DOCX, JPG, PNG
- Categorías: cv, carta_presentacion, certificado, diploma, referencia, otro

## 📚 Documentación

- Swagger: http://localhost:3003/docs
- ReDoc: http://localhost:3003/redoc

## 🛠️ Stack

- FastAPI 0.115.0
- asyncpg 0.29.0
- boto3 1.35.36
- Pydantic 2.9.2
- PostgreSQL 18.1

---
**PRISMA.COM Recruitment System** ✨
