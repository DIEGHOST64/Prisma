# Document Service - PRISMA

Microservicio de gestión de documentos con FastAPI y almacenamiento S3/local.

## 📋 Características

- ✅ Subida de archivos (PDF, DOCX, JPG, PNG)
- ✅ Validación de tipo y tamaño de archivo
- ✅ Almacenamiento en S3 o sistema de archivos local
- ✅ Clean Architecture
- ✅ Generación de URLs firmadas
- ✅ Docker containerizado

## 🏗️ Arquitectura

```
app/
├── domain/           # Entidades y reglas de negocio
├── application/      # Casos de uso
├── infrastructure/   # S3, file storage
└── presentation/     # Controladores FastAPI
```

## 🚀 Instalación

```bash
# Instalar dependencias
pip install -r requirements.txt

# Iniciar servidor de desarrollo
uvicorn app.main:app --reload --port 3003
```

## 📦 Docker

```bash
docker-compose up -d
```

## 🔗 Endpoints

- `POST /api/v1/documents/upload` - Subir archivo
- `GET /api/v1/documents/{filename}` - Obtener URL del archivo
- `DELETE /api/v1/documents/{filename}` - Eliminar archivo (admin)
