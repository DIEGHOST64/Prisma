# Recruitment Service - Clean Architecture

Microservicio de gestión de vacantes y postulaciones construido con PHP, Slim Framework y Clean Architecture.

## 📋 Características

- ✅ Gestión de vacantes (CRUD)
- ✅ Postulaciones de candidatos
- ✅ Validación de JWT desde Auth Service
- ✅ Clean Architecture
- ✅ PostgreSQL con PDO
- ✅ Docker containerizado

## 🏗️ Arquitectura

```
src/
├── Domain/           # Entidades y reglas de negocio
├── Application/      # Casos de uso
├── Infrastructure/   # Base de datos, servicios externos
└── Presentation/     # Controladores HTTP
```

## 🚀 Instalación

```bash
# Instalar dependencias
composer install

# Iniciar servidor de desarrollo
composer start
```

## 📦 Docker

```bash
docker-compose up -d
```

## 🔗 Endpoints

- `GET /api/v1/vacancies` - Listar vacantes
- `POST /api/v1/vacancies` - Crear vacante (admin/recruiter)
- `GET /api/v1/vacancies/{id}` - Ver vacante
- `PUT /api/v1/vacancies/{id}` - Actualizar vacante (admin/recruiter)
- `DELETE /api/v1/vacancies/{id}` - Eliminar vacante (admin)
- `POST /api/v1/applications` - Aplicar a vacante (público)
- `GET /api/v1/applications` - Listar postulaciones (admin/recruiter)
- `PUT /api/v1/applications/{id}/status` - Actualizar estado (admin/recruiter)
