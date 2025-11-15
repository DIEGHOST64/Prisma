# Auth Service - Sistema de Reclutamiento

Microservicio de autenticación construido con **Clean Architecture** y **TypeScript**.

## 🏗️ Arquitectura

```
src/
├── domain/              # 🎯 CAPA DE DOMINIO (Reglas de negocio)
│   ├── entities/        # Entidades del dominio
│   ├── repositories/    # Interfaces de repositorios
│   └── services/        # Servicios de dominio
│
├── application/         # 🔄 CAPA DE APLICACIÓN (Casos de uso)
│   ├── usecases/        # Casos de uso específicos
│   └── dtos/            # Data Transfer Objects
│
├── infrastructure/      # 🔧 CAPA DE INFRAESTRUCTURA (Detalles técnicos)
│   ├── persistence/     # Implementación de repositorios (PostgreSQL)
│   └── config/          # Configuraciones
│
└── presentation/        # 🌐 CAPA DE PRESENTACIÓN (API REST)
    ├── controllers/     # Controladores HTTP
    ├── middlewares/     # Middlewares
    └── routes/          # Definición de rutas
```

## 🎯 Principios de Clean Architecture

### Reglas INQUEBRANTABLES:

✅ **Domain**: NO depende de nada externo  
✅ **Application**: Solo conoce interfaces del dominio  
✅ **Infrastructure**: Implementa interfaces del dominio  
✅ **Presentation**: Solo orquesta casos de uso  

❌ **NUNCA**: Dominio importa infraestructura  
❌ **NUNCA**: Casos de uso acceden directamente a DB  

## 🚀 Tecnologías

- **Node.js 18+** & **TypeScript 5**
- **Express** - Framework HTTP
- **PostgreSQL** - Base de datos
- **JWT** - Autenticación
- **Bcrypt** - Hash de contraseñas
- **Joi** - Validación

## 📋 Prerequisitos

- Node.js 18+
- PostgreSQL 15+
- npm o yarn

## 🛠️ Instalación

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env

# Editar .env con tus credenciales de PostgreSQL
```

## 🗄️ Base de Datos

```bash
# Crear base de datos en PostgreSQL
createdb auth_db

# O usando pgAdmin / psql
CREATE DATABASE auth_db;

# Ejecutar migraciones (script SQL en /database)
psql -U postgres -d auth_db -f database/schema.sql
```

## 🏃‍♂️ Ejecución

```bash
# Desarrollo (con hot reload)
npm run dev

# Producción
npm run build
npm start
```

## 🌐 API Endpoints

### Autenticación

#### `POST /api/v1/auth/register`
Registrar nuevo usuario

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "Juan Pérez",
  "role": "admin"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "uuid": "123e4567-e89b-12d3-a456-426614174000",
      "email": "user@example.com",
      "name": "Juan Pérez",
      "role": "admin"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### `POST /api/v1/auth/login`
Iniciar sesión

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

#### `POST /api/v1/auth/refresh`
Refrescar access token

**Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### `GET /api/v1/auth/me`
Obtener perfil del usuario autenticado

**Headers:**
```
Authorization: Bearer <access_token>
```

#### `POST /api/v1/auth/logout`
Cerrar sesión (invalidar refresh token)

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Con coverage
npm test -- --coverage
```

## 📦 Build

```bash
# Compilar TypeScript
npm run build

# Salida en /dist
```

## 🐳 Docker

```bash
# Build imagen
docker build -t auth-service .

# Ejecutar contenedor
docker run -p 3001:3001 --env-file .env auth-service
```

## 🚢 Deploy en AWS Lambda

```bash
# Instrucciones próximamente
```

## 👥 Autor

- **Diego (DIEGHOST64)** - Tech Lead

## 📝 Licencia

MIT
