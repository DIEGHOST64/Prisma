# 📊 Diagramas del Proyecto PRISMA - Sistema de Reclutamiento

## Índice
1. [Diagrama de Arquitectura de Microservicios](#1-diagrama-de-arquitectura-de-microservicios)
2. [Diagrama de Base de Datos (ER)](#2-diagrama-de-base-de-datos-er)
3. [Diagrama de Casos de Uso](#3-diagrama-de-casos-de-uso)
4. [Diagramas de Secuencia](#4-diagramas-de-secuencia)
5. [Diagrama de Componentes - Clean Architecture](#5-diagrama-de-componentes---clean-architecture)
6. [Diagrama de Despliegue](#6-diagrama-de-despliegue)
7. [Diagrama de Clases del Dominio](#7-diagrama-de-clases-del-dominio)

---

## 1. Diagrama de Arquitectura de Microservicios

```mermaid
graph TB
    subgraph "Frontend Layer"
        FE[React + TypeScript Frontend<br/>Port: 5173/80]
    end

    subgraph "API Gateway / Load Balancer"
        NGINX[Nginx Reverse Proxy<br/>Port: 80/443]
    end

    subgraph "Microservices Layer"
        AUTH[Auth Service<br/>Node.js + TypeScript<br/>Port: 3001]
        REC[Recruitment Service<br/>PHP + Slim<br/>Port: 3002]
        DOC[Document Service<br/>Python + FastAPI<br/>Port: 3003]
    end

    subgraph "Database Layer"
        DB1[(Auth DB<br/>PostgreSQL<br/>Port: 5434)]
        DB2[(Recruitment DB<br/>PostgreSQL<br/>Port: 5433)]
        DB3[(Document DB<br/>PostgreSQL<br/>Port: 5435)]
    end

    subgraph "Storage Layer"
        S3[Local Storage/<br/>AWS S3]
    end

    subgraph "External Services"
        SES[AWS SES<br/>Email Service]
        SQS[AWS SQS<br/>Queue Service]
    end

    FE -->|HTTP/HTTPS| NGINX
    NGINX --> AUTH
    NGINX --> REC
    NGINX --> DOC
    
    AUTH -->|JWT Validation| REC
    AUTH -->|JWT Validation| DOC
    REC -->|Document Upload| DOC
    
    AUTH --> DB1
    REC --> DB2
    DOC --> DB3
    
    DOC --> S3
    REC --> SES
    REC --> SQS
    
    style FE fill:#61dafb,stroke:#333,stroke-width:2px,color:#000
    style AUTH fill:#68a063,stroke:#333,stroke-width:2px,color:#fff
    style REC fill:#8892be,stroke:#333,stroke-width:2px,color:#fff
    style DOC fill:#009688,stroke:#333,stroke-width:2px,color:#fff
```

### 📖 Funcionamiento Detallado de la Arquitectura

**PRISMA** es un sistema de reclutamiento construido con una arquitectura de microservicios que sigue los principios de **Clean Architecture** y **Domain-Driven Design (DDD)**. El sistema está diseñado para ser escalable, mantenible y permitir el desarrollo independiente de cada componente.

#### **1. Frontend Layer (Capa de Presentación)**
El **Frontend** es una aplicación **Single Page Application (SPA)** desarrollada con:
- **React 19** con **TypeScript** para type safety
- **Vite** como bundler para desarrollo rápido
- **Tailwind CSS** para estilos
- **React Router** para navegación
- **Axios** para peticiones HTTP

**Flujo de trabajo:**
1. El usuario accede a la aplicación desde el navegador
2. React carga la interfaz y muestra las páginas según la ruta
3. Cuando el usuario realiza una acción (login, postular, crear vacante), el frontend envía peticiones HTTP a los microservicios
4. Los **tokens JWT** se almacenan en `localStorage` para mantener la sesión
5. En cada petición protegida, el frontend envía el token JWT en el header `Authorization: Bearer <token>`

#### **2. API Gateway / Load Balancer**
**Nginx** actúa como **reverse proxy** y punto de entrada único:
- **Enrutamiento**: Redirige peticiones a los servicios correspondientes según la URL
- **HTTPS/SSL**: Maneja certificados y encriptación
- **Load Balancing**: Distribuye carga entre múltiples instancias (si existen)
- **CORS**: Configura políticas de origen cruzado
- **Compresión**: Reduce tamaño de respuestas (gzip)

**Ejemplo de enrutamiento:**
```
/api/v1/auth/*        → Auth Service (3001)
/api/v1/vacancies/*   → Recruitment Service (3002)
/api/v1/documents/*   → Document Service (3003)
```

#### **3. Microservices Layer (Capa de Servicios)**

##### **3.1 Auth Service (Node.js + TypeScript)**
**Responsabilidades:**
- Registro de usuarios (sign up)
- Autenticación (login/logout)
- Generación y validación de tokens JWT
- Gestión de roles (admin, recruiter, user)
- Actualización de perfiles

**Tecnologías:**
- **Express**: Framework web minimalista
- **JWT (jsonwebtoken)**: Para tokens de autenticación
- **Bcrypt**: Hash seguro de contraseñas con salt
- **PostgreSQL**: Base de datos relacional
- **Joi**: Validación de datos de entrada

**Proceso de autenticación:**
1. Usuario envía credenciales (email + password)
2. El servicio busca el usuario en la BD por email
3. Verifica el password usando bcrypt.compare()
4. Si es correcto, genera:
   - **Access Token** (vida corta: 15 min) - Para autenticar peticiones
   - **Refresh Token** (vida larga: 7 días) - Para renovar access token
5. Guarda el refresh token en BD (tabla `refresh_tokens`)
6. Retorna ambos tokens al cliente

**Seguridad:**
- Passwords nunca se almacenan en texto plano
- Tokens firmados con secret key (HS256)
- Refresh tokens revocables
- Rate limiting para prevenir ataques de fuerza bruta

##### **3.2 Recruitment Service (PHP + Slim Framework)**
**Responsabilidades:**
- CRUD de vacantes de empleo
- Recepción y gestión de postulaciones
- Cambio de estados de postulaciones (pending → reviewing → accepted/rejected)
- Envío de emails transaccionales
- Mejora de textos con IA (OpenAI API)

**Tecnologías:**
- **Slim 4**: Micro-framework PHP para APIs REST
- **PDO**: Acceso a base de datos
- **AWS SES**: Servicio de email de Amazon
- **AWS SQS**: Cola de mensajes para procesamiento asíncrono
- **PHP-DI**: Contenedor de inyección de dependencias

**Proceso de postulación:**
1. Candidato completa formulario con sus datos
2. Servicio valida que la vacante existe y está activa
3. Crea registro en tabla `applications` con status='pending'
4. Retorna el UUID de la aplicación
5. Frontend usa ese UUID para subir el CV al Document Service
6. Encola mensaje en **SQS** para enviar email de confirmación
7. Un **worker** (cli/queue-worker.php) procesa la cola en background
8. Email se envía usando **AWS SES**

**Estados de una postulación:**
```
pending → reviewing → interviewed → accepted/rejected
```

**Notificaciones por email:**
- Confirmación de recepción (candidato)
- Nueva postulación (reclutador)
- Cambio de estado (candidato)
- Recordatorios (automatizados)

##### **3.3 Document Service (Python + FastAPI)**
**Responsabilidades:**
- Subida y almacenamiento de archivos (CV, cartas, certificados)
- Validación de tipo y tamaño de archivo
- Generación de URLs firmadas para descarga
- Listado de documentos por usuario o postulación
- Eliminación de documentos

**Tecnologías:**
- **FastAPI**: Framework web moderno y rápido
- **Uvicorn**: Servidor ASGI de alto rendimiento
- **AsyncPG**: Driver asíncrono para PostgreSQL
- **Pydantic**: Validación de datos con type hints
- **Boto3**: SDK de AWS para S3 (opcional)

**Proceso de subida de documento:**
1. Cliente envía archivo en formato `multipart/form-data`
2. Servicio valida:
   - Tipo MIME permitido (PDF, DOCX, JPG, PNG)
   - Tamaño máximo (10 MB)
   - Metadata completa (user_document, application_id, document_type)
3. Genera nombre único: `{user_doc}/{app_id}/{tipo}_{timestamp}.ext`
4. Guarda archivo en:
   - **Local Storage**: `/app/storage/` (desarrollo)
   - **AWS S3**: bucket configurado (producción)
5. Guarda metadata en tabla `documents`
6. Retorna información del documento

**Tipos de documentos:**
- `cv`: Curriculum Vitae
- `carta_presentacion`: Cover letter
- `certificado`: Certificaciones
- `diploma`: Títulos académicos
- `referencia`: Referencias laborales
- `otro`: Otros documentos

#### **4. Database Layer (Capa de Persistencia)**

Cada microservicio tiene su **propia base de datos PostgreSQL 16**, siguiendo el patrón **Database per Service**:

**Ventajas:**
- ✅ Independencia: Cambios en un servicio no afectan a otros
- ✅ Escalabilidad: Cada BD puede escalar independientemente
- ✅ Tecnología específica: Cada servicio puede usar la BD que prefiera
- ✅ Resiliencia: Fallo en una BD no afecta todo el sistema

**Desventajas:**
- ❌ No hay transacciones distribuidas
- ❌ Joins entre servicios requieren agregación en código
- ❌ Mayor complejidad operacional

**Soluciones implementadas:**
- **Eventual Consistency**: Los datos se sincronizan eventualmente
- **UUIDs**: Identificadores únicos globales para relacionar entidades
- **Event Sourcing**: (futuro) Para mantener historial de cambios

#### **5. Storage Layer**
**Dos estrategias de almacenamiento:**

**Local Storage (Desarrollo):**
- Archivos en `/app/storage/` dentro del contenedor
- Volume de Docker para persistencia
- Acceso directo por filesystem

**AWS S3 (Producción):**
- Bucket S3 configurado
- URLs firmadas con expiración (presigned URLs)
- Alta disponibilidad y durabilidad (99.999999999%)
- CDN CloudFront para distribución global

#### **6. External Services (Servicios Externos)**

##### **AWS SES (Simple Email Service)**
- Envío de emails transaccionales
- Plantillas HTML personalizadas
- Tracking de bounces y quejas
- Reputación de sender gestionada por AWS

##### **AWS SQS (Simple Queue Service)**
- Cola de mensajes FIFO o estándar
- Procesamiento asíncrono de tareas
- Reintento automático en caso de fallo
- Dead Letter Queue para mensajes fallidos

**Flujo de procesamiento asíncrono:**
1. Application crea postulación → Encola mensaje en SQS
2. Worker (CLI) consulta cola cada X segundos
3. Procesa mensaje (envía email)
4. Elimina mensaje de la cola
5. Si falla, SQS reintenta automáticamente

#### **7. Comunicación entre Servicios**

**REST API con JSON:**
- Protocolo HTTP/HTTPS
- Formato JSON para request/response
- Status codes estándar (200, 201, 400, 401, 403, 404, 500)
- Versionado en URL: `/api/v1/...`

**Autenticación JWT entre servicios:**
1. Frontend obtiene JWT del Auth Service
2. Incluye JWT en todas las peticiones a otros servicios
3. Cada servicio verifica el JWT usando el **mismo secret compartido**
4. Extrae información del payload (uuid, role, email)
5. Valida permisos según el rol

**Ejemplo de JWT payload:**
```json
{
  "uuid": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  "email": "user@example.com",
  "role": "admin",
  "iat": 1700000000,
  "exp": 1700000900
}
```

#### **8. Principios de Diseño Aplicados**

**Clean Architecture:**
- Separación en 4 capas: Domain, Application, Infrastructure, Presentation
- Independencia de frameworks
- Regla de dependencias: hacia adentro

**SOLID:**
- **S**ingle Responsibility: Cada clase/módulo tiene una sola razón para cambiar
- **O**pen/Closed: Abierto a extensión, cerrado a modificación
- **L**iskov Substitution: Los tipos derivados deben ser sustituibles
- **I**nterface Segregation: Interfaces específicas mejor que generales
- **D**ependency Inversion: Depender de abstracciones, no de concreciones

**Domain-Driven Design:**
- Entities: User, Vacancy, Application, Document
- Value Objects: Email, UUID, Token
- Repositories: Abstracción del acceso a datos
- Use Cases: Lógica de negocio aislada

---

---

## 2. Diagrama de Base de Datos (ER)

### 2.1 Auth Database

```mermaid
erDiagram
    users ||--o{ refresh_tokens : "has"
    
    users {
        serial id PK
        uuid uuid UK "NOT NULL"
        varchar email UK "NOT NULL"
        varchar password_hash "NOT NULL"
        varchar name "NOT NULL"
        user_role role "DEFAULT 'user'"
        user_status status "DEFAULT 'active'"
        boolean email_verified "DEFAULT FALSE"
        timestamp created_at
        timestamp updated_at
        timestamp last_login_at
        timestamp deleted_at
    }
    
    refresh_tokens {
        serial id PK
        integer user_id FK
        varchar token UK "NOT NULL"
        timestamp expires_at "NOT NULL"
        timestamp created_at
        boolean revoked "DEFAULT FALSE"
    }
```

### 2.2 Recruitment Database

```mermaid
erDiagram
    vacancies ||--o{ applications : "receives"
    
    vacancies {
        serial id PK
        uuid uuid UK "NOT NULL"
        varchar title "NOT NULL"
        text description "NOT NULL"
        text requirements "NOT NULL"
        varchar location "NOT NULL"
        varchar salary_range
        employment_type employment_type "NOT NULL"
        vacancy_status status "DEFAULT 'draft'"
        timestamp published_at
        timestamp expires_at "NOT NULL"
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }
    
    applications {
        serial id PK
        uuid uuid UK "NOT NULL"
        integer vacancy_id FK
        uuid vacancy_uuid "NOT NULL"
        varchar document_number "NOT NULL"
        varchar full_name "NOT NULL"
        varchar email "NOT NULL"
        varchar phone "NOT NULL"
        varchar cv_path "NOT NULL"
        text cover_letter
        application_status status "DEFAULT 'pending'"
        text review_notes
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }
```

### 2.3 Document Database

```mermaid
erDiagram
    documents {
        uuid id PK
        varchar user_document "NOT NULL"
        uuid application_id "NOT NULL"
        varchar filename "NOT NULL"
        varchar original_filename "NOT NULL"
        varchar file_path "NOT NULL"
        integer file_size "NOT NULL"
        varchar mime_type "NOT NULL"
        varchar document_type "NOT NULL"
        timestamp uploaded_at
        uuid uploaded_by
    }
```

### 📖 Explicación Detallada del Modelo de Datos

#### **Base de Datos 1: Auth Database (auth_db)**

Esta base de datos centraliza toda la información de **autenticación y autorización** del sistema.

**Tabla `users`:**
- **Propósito**: Almacenar información de todos los usuarios del sistema
- **id**: Clave primaria auto-incremental (para relaciones internas)
- **uuid**: Identificador público único (UUID v4) usado en APIs para mayor seguridad
- **email**: Correo electrónico único, usado para login
- **password_hash**: Contraseña hasheada con bcrypt (nunca se guarda texto plano)
- **name**: Nombre completo del usuario
- **role**: Define permisos del usuario:
  - `admin`: Acceso total, puede crear usuarios, eliminar postulaciones
  - `recruiter`: Puede crear vacantes, revisar postulaciones
  - `user`: Usuario básico (futuro uso)
- **status**: Estado de la cuenta:
  - `active`: Puede acceder al sistema
  - `inactive`: Cuenta desactivada temporalmente
  - `suspended`: Suspendido por violación de políticas
- **email_verified**: Flag booleano para verificación de email (futuro)
- **created_at**: Fecha de registro
- **updated_at**: Última modificación (actualizado automáticamente por trigger)
- **last_login_at**: Última vez que inició sesión
- **deleted_at**: Soft delete - si tiene valor, el usuario está eliminado lógicamente

**Tabla `refresh_tokens`:**
- **Propósito**: Almacenar tokens de refresco para renovar access tokens
- **user_id**: Relación con tabla users (ON DELETE CASCADE)
- **token**: JWT de larga duración (7 días)
- **expires_at**: Fecha de expiración del token
- **revoked**: Si es true, el token ya no es válido (logout, cambio de password)

**Índices:**
- `idx_users_email`: Búsqueda rápida por email durante login
- `idx_users_uuid`: Búsqueda por UUID en peticiones API
- `idx_refresh_tokens_token`: Validación rápida de refresh tokens

**Triggers:**
- `update_users_updated_at`: Actualiza automáticamente el campo `updated_at` en cada UPDATE

#### **Base de Datos 2: Recruitment Database (recruitment_db)**

Gestiona el núcleo del negocio: **vacantes y postulaciones**.

**Tabla `vacancies`:**
- **Propósito**: Almacenar ofertas de empleo publicadas
- **uuid**: Identificador público para URLs amigables
- **title**: Título del puesto (ej: "Desarrollador Full Stack Senior")
- **description**: Descripción detallada del puesto y empresa
- **requirements**: Requisitos técnicos y experiencia necesaria
- **location**: Ubicación del trabajo (puede incluir "Remoto")
- **salary_range**: Rango salarial (ej: "$3.000.000 - $5.000.000 COP")
- **employment_type**: Tipo de empleo:
  - `full-time`: Tiempo completo
  - `part-time`: Medio tiempo
  - `contract`: Por contrato
  - `internship`: Pasantía
- **status**: Estado de la vacante:
  - `draft`: Borrador, no visible públicamente
  - `published`: Publicada y aceptando postulaciones
  - `closed`: Cerrada manualmente
  - `filled`: Puesto cubierto
- **published_at**: Fecha de publicación (NULL si está en draft)
- **expires_at**: Fecha límite para postular

**Tabla `applications`:**
- **Propósito**: Almacenar postulaciones de candidatos
- **vacancy_id**: ID interno de la vacante (FK con CASCADE)
- **vacancy_uuid**: UUID de la vacante (para consultas entre servicios)
- **document_number**: Número de documento del candidato (DNI, cédula, pasaporte)
- **full_name**: Nombre completo del candidato
- **email**: Email de contacto
- **phone**: Teléfono de contacto
- **cv_path**: Ruta del CV en storage (referencia al Document Service)
- **cover_letter**: Carta de presentación (opcional)
- **status**: Estado del proceso:
  - `pending`: Recién recibida
  - `reviewing`: En revisión por reclutador
  - `interviewed`: Candidato entrevistado
  - `accepted`: Aceptado para el puesto
  - `rejected`: Rechazado
- **review_notes**: Notas del reclutador sobre el candidato

**Restricciones importantes:**
- `unique_application_per_vacancy`: Un candidato no puede postular dos veces a la misma vacante
- `email_format`: Valida formato de email con regex
- `expires_after_now`: La fecha de expiración debe ser futura

**Vistas (Views):**
- `active_vacancies`: Solo vacantes publicadas y no expiradas
- `vacancy_statistics`: Contadores de postulaciones por estado para cada vacante

#### **Base de Datos 3: Document Database (document_db)**

Gestiona **metadata de archivos** subidos por usuarios.

**Tabla `documents`:**
- **id**: UUID único del documento
- **user_document**: Número de documento del usuario que subió
- **application_id**: UUID de la postulación asociada
- **filename**: Nombre procesado del archivo
- **original_filename**: Nombre original del archivo
- **file_path**: Ruta en storage (local o S3)
  - Formato: `{user_doc}/{app_id}/{tipo}_{timestamp}.ext`
  - Ejemplo: `12345678/uuid-app/cv_20250120_143022.pdf`
- **file_size**: Tamaño en bytes (máx 10 MB = 10,485,760 bytes)
- **mime_type**: Tipo MIME del archivo:
  - `application/pdf`
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (DOCX)
  - `image/jpeg`, `image/png`
- **document_type**: Categoría del documento
- **uploaded_at**: Timestamp de subida
- **uploaded_by**: UUID del usuario que subió (NULL si es público)

**Relaciones lógicas (no FK físicas por microservicios):**
- `user_document` se relaciona conceptualmente con `users.email` o identificador
- `application_id` se relaciona con `applications.uuid`

**Índices:**
- `idx_documents_application_id`: Listar todos los docs de una postulación
- `idx_documents_user_document`: Ver histórico de documentos de un usuario

**Tipos ENUM:**
- **user_role**: 'admin', 'recruiter', 'user'
- **user_status**: 'active', 'inactive', 'suspended'
- **employment_type**: 'full-time', 'part-time', 'contract', 'internship'
- **vacancy_status**: 'draft', 'published', 'closed', 'filled'
- **application_status**: 'pending', 'reviewing', 'interviewed', 'accepted', 'rejected'
- **document_type**: 'cv', 'carta_presentacion', 'certificado', 'diploma', 'referencia', 'otro'

---

## 3. Diagrama de Casos de Uso

```mermaid
graph TB
    subgraph "Sistema PRISMA"
        subgraph "Gestión de Autenticación"
            UC1[Registrar Usuario]
            UC2[Iniciar Sesión]
            UC3[Cerrar Sesión]
            UC4[Refrescar Token]
        end
        
        subgraph "Gestión de Vacantes"
            UC5[Crear Vacante]
            UC6[Editar Vacante]
            UC7[Eliminar Vacante]
            UC8[Publicar Vacante]
            UC9[Listar Vacantes Activas]
            UC10[Ver Detalle de Vacante]
            UC11[Mejorar Texto con IA]
        end
        
        subgraph "Gestión de Postulaciones"
            UC12[Aplicar a Vacante]
            UC13[Subir CV]
            UC14[Consultar Estado de Postulación]
            UC15[Listar Postulaciones]
            UC16[Actualizar Estado de Postulación]
            UC17[Descargar CV]
            UC18[Eliminar Postulación]
        end
        
        subgraph "Gestión de Documentos"
            UC19[Subir Documento]
            UC20[Obtener URL de Documento]
            UC21[Listar Documentos por Usuario]
            UC22[Eliminar Documento]
        end
        
        subgraph "Gestión de Usuarios"
            UC23[Listar Usuarios]
            UC24[Cambiar Rol de Usuario]
            UC25[Ver Perfil]
            UC26[Actualizar Perfil]
        end
    end
    
    CAND[👤 Candidato<br/>Público]
    REC[👤 Reclutador]
    ADMIN[👤 Administrador]
    
    CAND --> UC2
    CAND --> UC9
    CAND --> UC10
    CAND --> UC12
    CAND --> UC13
    CAND --> UC14
    
    REC --> UC2
    REC --> UC5
    REC --> UC6
    REC --> UC8
    REC --> UC9
    REC --> UC10
    REC --> UC11
    REC --> UC15
    REC --> UC16
    REC --> UC17
    REC --> UC25
    
    ADMIN --> UC1
    ADMIN --> UC2
    ADMIN --> UC3
    ADMIN --> UC5
    ADMIN --> UC6
    ADMIN --> UC7
    ADMIN --> UC8
    ADMIN --> UC9
    ADMIN --> UC10
    ADMIN --> UC11
    ADMIN --> UC15
    ADMIN --> UC16
    ADMIN --> UC17
    ADMIN --> UC18
    ADMIN --> UC23
    ADMIN --> UC24
    ADMIN --> UC25
    ADMIN --> UC26
    
    style CAND fill:#90caf9,stroke:#333,stroke-width:2px
    style REC fill:#ffb74d,stroke:#333,stroke-width:2px
    style ADMIN fill:#e57373,stroke:#333,stroke-width:2px
```

### 📖 Explicación de Casos de Uso por Actor

El sistema PRISMA tiene **3 tipos de actores principales**, cada uno con permisos y funcionalidades específicas:

#### **👤 Candidato (Público) - Sin autenticación requerida**

Los candidatos pueden interactuar con el sistema **sin necesidad de crear una cuenta**. Solo necesitan proporcionar sus datos personales al postular.

**Casos de Uso:**

1. **UC9: Listar Vacantes Activas**
   - **Descripción**: Ver todas las ofertas de empleo disponibles
   - **Flujo**: 
     1. Accede a la página principal
     2. Sistema consulta vacantes con status='published' y no expiradas
     3. Muestra tarjetas con título, ubicación, tipo de empleo, salario
   - **Endpoint**: `GET /api/v1/vacancies/active`

2. **UC10: Ver Detalle de Vacante**
   - **Descripción**: Ver información completa de una oferta
   - **Flujo**:
     1. Click en una vacante
     2. Sistema muestra descripción completa, requisitos, beneficios
   - **Endpoint**: `GET /api/v1/vacancies/{uuid}`

3. **UC12: Aplicar a Vacante**
   - **Descripción**: Enviar postulación con datos personales
   - **Flujo**:
     1. Completa formulario (nombre, email, teléfono, documento, carta)
     2. Adjunta CV
     3. Sistema valida datos y crea application
     4. Envía email de confirmación
   - **Endpoint**: `POST /api/v1/applications`
   - **Validaciones**:
     - Email válido
     - Documento único por vacante
     - CV obligatorio
     - Vacante activa

4. **UC13: Subir CV**
   - **Descripción**: Adjuntar archivo de CV
   - **Flujo**:
     1. Selecciona archivo desde su dispositivo
     2. Sistema valida tipo (PDF/DOCX/IMG) y tamaño (max 10MB)
     3. Sube a Document Service
   - **Endpoint**: `POST /api/v1/documents/upload/public`

5. **UC14: Consultar Estado de Postulación**
   - **Descripción**: Ver el progreso de su aplicación
   - **Flujo**:
     1. Ingresa su número de documento
     2. Sistema busca sus postulaciones
     3. Muestra estado actual (pending, reviewing, interviewed, accepted, rejected)
   - **Endpoint**: `GET /api/v1/applications/status/{document}`

#### **👤 Reclutador - Requiere autenticación (role: recruiter)**

Los reclutadores gestionan el proceso de reclutamiento: crean vacantes y evalúan candidatos.

**Casos de Uso:**

1. **UC2: Iniciar Sesión**
   - **Descripción**: Autenticarse en el sistema
   - **Flujo**:
     1. Ingresa email y password
     2. Sistema valida credenciales
     3. Retorna access token (15 min) y refresh token (7 días)
   - **Endpoint**: `POST /api/v1/auth/login`

2. **UC5: Crear Vacante**
   - **Descripción**: Publicar nueva oferta de empleo
   - **Flujo**:
     1. Completa formulario con título, descripción, requisitos, etc.
     2. Puede guardar como 'draft' o publicar directamente
     3. Sistema genera UUID único
   - **Endpoint**: `POST /api/v1/vacancies`
   - **Campos requeridos**:
     - Título (min 5 caracteres)
     - Descripción (min 20 caracteres)
     - Requisitos
     - Ubicación
     - Tipo de empleo
     - Fecha de expiración

3. **UC6: Editar Vacante**
   - **Descripción**: Modificar datos de una oferta existente
   - **Flujo**:
     1. Selecciona vacante de su lista
     2. Modifica campos necesarios
     3. Sistema actualiza y registra updated_at
   - **Endpoint**: `PUT /api/v1/vacancies/{uuid}`

4. **UC8: Publicar Vacante**
   - **Descripción**: Cambiar status de 'draft' a 'published'
   - **Flujo**:
     1. Revisa borrador
     2. Confirma publicación
     3. Sistema establece published_at y cambia status
   - **Endpoint**: `PUT /api/v1/vacancies/{uuid}` (con isActive=true)

5. **UC11: Mejorar Texto con IA**
   - **Descripción**: Usar OpenAI para mejorar descripciones
   - **Flujo**:
     1. Escribe texto base
     2. Click en "Mejorar con IA"
     3. Sistema envía a API de OpenAI
     4. Retorna versión mejorada profesionalmente
   - **Endpoint**: `POST /api/v1/ai/improve-text`

6. **UC15: Listar Postulaciones**
   - **Descripción**: Ver todos los candidatos que han aplicado
   - **Flujo**:
     1. Accede al dashboard de admin
     2. Sistema muestra tabla con todas las applications
     3. Puede filtrar por vacante, estado, fecha
   - **Endpoint**: `GET /api/v1/applications`

7. **UC16: Actualizar Estado de Postulación**
   - **Descripción**: Cambiar fase del proceso de un candidato
   - **Flujo**:
     1. Selecciona una postulación
     2. Cambia status (ej: pending → reviewing)
     3. Opcionalmente añade notas
     4. Sistema actualiza y envía email al candidato
   - **Endpoint**: `PATCH /api/v1/applications/{uuid}/status`
   - **Estados posibles**:
     - pending → reviewing
     - reviewing → interviewed
     - interviewed → accepted/rejected

8. **UC17: Descargar CV**
   - **Descripción**: Obtener archivo CV del candidato
   - **Flujo**:
     1. Click en botón "Descargar CV"
     2. Sistema obtiene URL del Document Service
     3. Descarga archivo
   - **Endpoint**: `GET /api/v1/documents/application/{application_id}`

9. **UC25: Ver Perfil**
   - **Descripción**: Ver información de su cuenta
   - **Endpoint**: `GET /api/v1/auth/me`

#### **👤 Administrador - Máximo nivel de permisos (role: admin)**

Los administradores tienen **control total** del sistema.

**Casos de Uso heredados de Reclutador:**
- Todos los casos de uso del reclutador

**Casos de Uso exclusivos:**

1. **UC1: Registrar Usuario**
   - **Descripción**: Crear nuevos usuarios del sistema (admin/recruiter)
   - **Flujo**:
     1. Ingresa datos: email, password, name, role
     2. Sistema hashea password con bcrypt
     3. Crea usuario en BD
   - **Endpoint**: `POST /api/v1/auth/register`
   - **Seguridad**: Solo admin puede crear otros admins

2. **UC3: Cerrar Sesión**
   - **Descripción**: Invalidar tokens de sesión
   - **Flujo**:
     1. Usuario cierra sesión
     2. Sistema revoca refresh token (revoked=true)
     3. Frontend elimina tokens de localStorage
   - **Endpoint**: `POST /api/v1/auth/logout`

3. **UC7: Eliminar Vacante**
   - **Descripción**: Borrar una oferta de empleo
   - **Flujo**:
     1. Confirma eliminación
     2. Sistema hace soft delete (deleted_at=NOW)
     3. Aplicaciones asociadas también se marcan como eliminadas (CASCADE)
   - **Endpoint**: `DELETE /api/v1/vacancies/{uuid}`

4. **UC18: Eliminar Postulación**
   - **Descripción**: Eliminar una o múltiples postulaciones
   - **Flujo individual**:
     1. Selecciona postulación
     2. Confirma eliminación
     3. Soft delete
   - **Flujo masivo**:
     1. Selecciona criterio (ej: todos los rechazados)
     2. Confirma eliminación masiva
     3. Sistema elimina en batch
   - **Endpoints**:
     - `DELETE /api/v1/applications/{uuid}`
     - `POST /api/v1/applications/bulk-delete`

5. **UC23: Listar Usuarios**
   - **Descripción**: Ver todos los usuarios del sistema
   - **Flujo**:
     1. Accede a panel de usuarios
     2. Sistema muestra tabla con uuid, email, name, role, status
   - **Endpoint**: `GET /api/v1/users`

6. **UC24: Cambiar Rol de Usuario**
   - **Descripción**: Promover/degradar usuarios (admin ↔ recruiter)
   - **Flujo**:
     1. Selecciona usuario
     2. Cambia rol en dropdown
     3. Confirma cambio
     4. Sistema actualiza role
   - **Endpoint**: `PATCH /api/v1/users/{uuid}/role`

7. **UC26: Actualizar Perfil**
   - **Descripción**: Modificar datos de cualquier usuario
   - **Endpoint**: `PATCH /api/v1/users/{uuid}`

8. **UC22: Eliminar Documento**
   - **Descripción**: Borrar archivos del storage
   - **Flujo**:
     1. Selecciona documento
     2. Sistema elimina archivo físico (S3 o local)
     3. Elimina registro de BD
   - **Endpoint**: `DELETE /api/v1/documents/{id}`

### 🔐 Matriz de Permisos

| Caso de Uso | Candidato | Reclutador | Admin |
|-------------|-----------|------------|-------|
| Ver vacantes | ✅ | ✅ | ✅ |
| Postular | ✅ | ❌ | ❌ |
| Crear vacante | ❌ | ✅ | ✅ |
| Editar vacante | ❌ | ✅ | ✅ |
| Eliminar vacante | ❌ | ❌ | ✅ |
| Ver postulaciones | ❌ | ✅ | ✅ |
| Cambiar estado | ❌ | ✅ | ✅ |
| Eliminar postulación | ❌ | ❌ | ✅ |
| Crear usuarios | ❌ | ❌ | ✅ |
| Cambiar roles | ❌ | ❌ | ✅ |

---

## 4. Diagramas de Secuencia

### 4.1 Flujo de Autenticación (Login)

```mermaid
sequenceDiagram
    participant U as Usuario
    participant FE as Frontend
    participant AUTH as Auth Service
    participant DB as Auth DB
    
    U->>FE: Ingresa credenciales
    FE->>AUTH: POST /api/v1/auth/login
    AUTH->>DB: Buscar usuario por email
    DB-->>AUTH: Datos del usuario
    AUTH->>AUTH: Verificar contraseña (bcrypt)
    
    alt Credenciales válidas
        AUTH->>AUTH: Generar JWT Access Token
        AUTH->>AUTH: Generar Refresh Token
        AUTH->>DB: Guardar Refresh Token
        AUTH-->>FE: {accessToken, refreshToken, user}
        FE->>FE: Guardar tokens en localStorage
        FE-->>U: Redirigir a dashboard
    else Credenciales inválidas
        AUTH-->>FE: 401 Unauthorized
        FE-->>U: Mostrar error
    end
```

### 4.2 Flujo de Postulación a Vacante

```mermaid
sequenceDiagram
    participant C as Candidato
    participant FE as Frontend
    participant REC as Recruitment Service
    participant DOC as Document Service
    participant RDB as Recruitment DB
    participant DDB as Document DB
    participant SQS as AWS SQS
    participant S3 as Storage
    
    C->>FE: Completa formulario + CV
    FE->>REC: POST /api/v1/applications
    REC->>RDB: Validar vacante existe y está activa
    RDB-->>REC: Datos de vacante
    
    REC->>RDB: Crear aplicación (status: pending)
    RDB-->>REC: Application UUID
    REC-->>FE: {uuid, status}
    
    FE->>DOC: POST /api/v1/documents/upload/public
    DOC->>DOC: Validar archivo (tipo, tamaño)
    DOC->>S3: Guardar archivo
    S3-->>DOC: file_path
    DOC->>DDB: Guardar metadata del documento
    DDB-->>DOC: Document ID
    DOC-->>FE: {document_id, file_path}
    
    REC->>SQS: Encolar email de confirmación
    SQS-->>REC: Message ID
    
    FE-->>C: Postulación exitosa
    
    Note over SQS: Worker procesa cola en background
    SQS->>REC: Procesar mensaje
    REC->>SES: Enviar email de confirmación
    SES-->>C: Email recibido
```

### 4.3 Flujo de Actualización de Estado de Postulación

```mermaid
sequenceDiagram
    participant R as Reclutador
    participant FE as Frontend
    participant AUTH as Auth Service
    participant REC as Recruitment Service
    participant RDB as Recruitment DB
    participant SQS as AWS SQS
    participant SES as AWS SES
    participant C as Candidato
    
    R->>FE: Cambiar estado a "accepted"
    FE->>REC: PATCH /api/v1/applications/{uuid}/status
    Note over FE,REC: Header: Authorization: Bearer {JWT}
    
    REC->>REC: Verificar JWT (middleware)
    REC->>REC: Verificar rol (admin/recruiter)
    
    REC->>RDB: Actualizar status y review_notes
    RDB-->>REC: Application actualizada
    
    REC->>SQS: Encolar email de notificación
    REC-->>FE: {success: true, application}
    FE-->>R: Estado actualizado
    
    Note over SQS: Background Worker
    SQS->>REC: Procesar mensaje
    REC->>SES: Enviar email de notificación
    SES-->>C: Email de actualización de estado
```

### 4.4 Flujo de Validación JWT entre Servicios

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant REC as Recruitment Service
    participant AUTH as Auth Service
    
    FE->>REC: GET /api/v1/applications<br/>Authorization: Bearer {JWT}
    
    REC->>REC: Extraer token del header
    REC->>REC: Verificar firma JWT con secret compartido
    
    alt Token válido
        REC->>REC: Extraer payload (uuid, role)
        REC->>REC: Verificar rol requerido
        
        alt Rol autorizado
            REC->>REC: Ejecutar caso de uso
            REC-->>FE: 200 OK + datos
        else Rol no autorizado
            REC-->>FE: 403 Forbidden
        end
    else Token inválido o expirado
        REC-->>FE: 401 Unauthorized
        FE->>AUTH: POST /api/v1/auth/refresh
        Note over FE,AUTH: Renovar token
    end
```

### 📖 Explicación Detallada de los Flujos de Secuencia

#### **4.1 Flujo de Autenticación (Login) - Paso a Paso**

Este diagrama muestra el proceso completo de inicio de sesión con JWT.

**Paso 1-2: Inicio de sesión**
- El usuario ingresa su email y contraseña en el formulario
- El frontend valida formato básico (email válido, password no vacío)
- Envía petición POST a `/api/v1/auth/login` con:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!"
  }
  ```

**Paso 3-4: Búsqueda del usuario**
- Auth Service busca en la base de datos por email
- Consulta SQL: `SELECT * FROM users WHERE email = ? AND deleted_at IS NULL`
- Si no existe, retorna error 401 inmediatamente

**Paso 5: Verificación de contraseña**
- Usa bcrypt.compare() para verificar:
  ```javascript
  const isValid = await bcrypt.compare(
    passwordIngresada, 
    user.password_hash
  );
  ```
- **¿Por qué bcrypt?**
  - Hash de una sola vía (no se puede revertir)
  - Incluye salt automático (previene rainbow tables)
  - Función costosa computacionalmente (previene fuerza bruta)

**Paso 6-8: Generación de tokens (si credenciales válidas)**
- **Access Token**:
  ```javascript
  jwt.sign(
    { uuid: user.uuid, email: user.email, role: user.role },
    SECRET_KEY,
    { expiresIn: '15m' } // Vida corta
  )
  ```
- **Refresh Token**:
  ```javascript
  jwt.sign(
    { uuid: user.uuid, type: 'refresh' },
    REFRESH_SECRET_KEY,
    { expiresIn: '7d' } // Vida larga
  )
  ```
- Guarda refresh token en tabla `refresh_tokens` con `expires_at` y `revoked=false`

**Paso 9-11: Respuesta exitosa**
- Retorna al frontend:
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "user": {
        "uuid": "...",
        "email": "...",
        "name": "...",
        "role": "admin"
      }
    }
  }
  ```
- Frontend guarda tokens en localStorage:
  ```javascript
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  ```
- Redirige según rol: admin → dashboard, recruiter → vacantes

**Paso 12-13: Credenciales inválidas**
- Si password no coincide o usuario no existe
- Retorna 401 con mensaje genérico (por seguridad):
  ```json
  {
    "success": false,
    "error": "Invalid credentials"
  }
  ```
- Frontend muestra mensaje de error

#### **4.2 Flujo de Postulación a Vacante - Proceso Completo**

Este es el flujo más complejo, involucra 3 microservicios.

**Paso 1-2: Envío de formulario**
- Candidato completa todos los campos:
  - Datos personales (nombre, email, teléfono, documento)
  - Carta de presentación (opcional)
  - Archivo CV (obligatorio)
- Frontend valida:
  - Formato de email
  - Archivo seleccionado
  - Tamaño < 10MB

**Paso 3-4: Validación de vacante**
- Recruitment Service verifica:
  ```sql
  SELECT * FROM vacancies 
  WHERE uuid = ? 
    AND status = 'published' 
    AND expires_at > NOW()
    AND deleted_at IS NULL
  ```
- Si no cumple condiciones → Error 400 "Vacancy not available"

**Paso 5-7: Creación de aplicación**
- Inserta en tabla `applications`:
  ```sql
  INSERT INTO applications (
    uuid, vacancy_id, document_number, full_name, 
    email, phone, cv_path, cover_letter, status
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  ```
- Genera UUID único para la aplicación
- `cv_path` se guarda como placeholder inicialmente
- Retorna UUID al frontend

**Paso 8-13: Subida de documento**
- Frontend usa el UUID de la aplicación para subir CV
- Document Service recibe multipart/form-data:
  ```
  POST /api/v1/documents/upload/public
  Content-Type: multipart/form-data
  
  file: [binary data]
  user_document: "12345678"
  application_id: "uuid-de-aplicacion"
  document_type: "cv"
  ```

**Paso 9: Validación del archivo**
- Valida tipo MIME:
  ```python
  ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument...',
    'image/jpeg',
    'image/png'
  ]
  ```
- Valida tamaño: `file_size <= 10 * 1024 * 1024` (10 MB)

**Paso 10-11: Almacenamiento físico**
- Genera nombre único:
  ```python
  filename = f"{user_doc}/{app_id}/cv_{timestamp}.{ext}"
  # Ejemplo: 12345678/uuid-app/cv_20250120_143022.pdf
  ```
- **Local Storage**:
  ```python
  with open(f'/app/storage/{filename}', 'wb') as f:
    f.write(file_content)
  ```
- **S3** (producción):
  ```python
  s3_client.put_object(
    Bucket='prisma-documents',
    Key=filename,
    Body=file_content,
    ContentType=mime_type
  )
  ```

**Paso 12-13: Guardar metadata**
- Inserta en tabla `documents`:
  ```sql
  INSERT INTO documents (
    id, user_document, application_id, filename,
    original_filename, file_path, file_size, mime_type, document_type
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  ```
- Retorna información del documento al frontend

**Paso 14-16: Encolado de email**
- Recruitment Service encola mensaje en SQS:
  ```php
  $message = [
    'type' => 'application_received',
    'application_id' => $uuid,
    'candidate_email' => $email,
    'candidate_name' => $name,
    'vacancy_title' => $vacancyTitle
  ];
  
  $sqs->sendMessage([
    'QueueUrl' => $queueUrl,
    'MessageBody' => json_encode($message)
  ]);
  ```

**Paso 17: Respuesta al usuario**
- Frontend muestra modal de éxito
- Mensaje: "¡Postulación enviada! Revisa tu email para confirmación"

**Paso 18-21: Procesamiento asíncrono (Background Worker)**
- CLI worker corre cada 30 segundos:
  ```php
  php cli/queue-worker.php
  ```
- Consulta cola SQS:
  ```php
  $result = $sqs->receiveMessage([
    'QueueUrl' => $queueUrl,
    'MaxNumberOfMessages' => 10,
    'WaitTimeSeconds' => 20
  ]);
  ```
- Procesa cada mensaje:
  1. Genera HTML del email usando plantilla
  2. Envía vía AWS SES
  3. Elimina mensaje de la cola (si éxito)
  4. Si falla, SQS reintenta automáticamente

**Plantilla de email:**
```html
Hola {candidate_name},

Tu postulación para el puesto de {vacancy_title} ha sido recibida exitosamente.

Estado actual: Pendiente de revisión
Número de postulación: {application_uuid}

Te notificaremos cualquier actualización a tu email.

Saludos,
Equipo PRISMA
```

#### **4.3 Flujo de Actualización de Estado - Notificación al Candidato**

**Paso 1-2: Acción del reclutador**
- Reclutador revisa candidato en dashboard
- Cambia estado de "pending" a "accepted" (por ejemplo)
- Puede agregar notas internas

**Paso 3: Petición autenticada**
- Frontend envía con JWT:
  ```
  PATCH /api/v1/applications/{uuid}/status
  Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
  Content-Type: application/json
  
  {
    "status": "accepted",
    "notes": "Excelente perfil, pasar a entrevista técnica"
  }
  ```

**Paso 4-5: Validación de seguridad**
- Middleware extrae token del header
- Verifica firma JWT:
  ```php
  $payload = JWT::decode($token, new Key($secret, 'HS256'));
  ```
- Verifica rol en payload:
  ```php
  if (!in_array($payload->role, ['admin', 'recruiter'])) {
    throw new UnauthorizedException();
  }
  ```

**Paso 6-7: Actualización en BD**
- UPDATE en tabla applications:
  ```sql
  UPDATE applications 
  SET status = ?, 
      review_notes = ?,
      updated_at = NOW()
  WHERE uuid = ?
  ```
- Trigger actualiza automáticamente `updated_at`

**Paso 8-9: Encolado de notificación**
- Mensaje SQS con tipo diferente:
  ```php
  $message = [
    'type' => 'status_update',
    'application_id' => $uuid,
    'candidate_email' => $email,
    'new_status' => 'accepted',
    'vacancy_title' => $vacancyTitle
  ];
  ```

**Paso 10-11: Respuesta al reclutador**
- Retorna aplicación actualizada
- Frontend actualiza UI sin recargar página (optimistic update)

**Paso 12-14: Envío de email (Background)**
- Worker procesa cola
- Genera email personalizado según estado:

**Email de aceptación:**
```
¡Felicidades {name}!

Tu postulación para {vacancy} ha sido ACEPTADA.

Próximos pasos:
- Te contactaremos para coordinar entrevista
- Prepara tu portafolio
- Revisa la descripción del puesto

Estamos emocionados de conocerte!
```

**Email de rechazo:**
```
Hola {name},

Agradecemos tu interés en {vacancy}.

Lamentamos informarte que en esta ocasión no continuaremos con tu proceso.

Te invitamos a postular a futuras vacantes que se ajusten a tu perfil.

Mucho éxito!
```

#### **4.4 Flujo de Validación JWT - Seguridad entre Servicios**

**Paso 1-2: Petición con token**
- Frontend incluye JWT en todas las peticiones protegidas
- Header estándar:
  ```
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```

**Paso 3: Extracción del token**
- Middleware intercepta la petición
- Regex para extraer token:
  ```javascript
  const authHeader = req.headers.authorization;
  const token = authHeader.replace(/^Bearer\s+/, '');
  ```

**Paso 4: Verificación de firma**
- Cada servicio tiene el **mismo secret compartido** (en .env)
- Verifica que el token no ha sido modificado:
  ```javascript
  try {
    const payload = jwt.verify(token, SECRET_KEY);
    // Token válido
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      // Token expirado
    } else {
      // Token inválido
    }
  }
  ```

**Paso 5-6: Extracción de datos**
- Payload decodificado contiene:
  ```json
  {
    "uuid": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "email": "admin@prisma.com",
    "role": "admin",
    "iat": 1705750000,  // Issued At
    "exp": 1705750900   // Expiration (15 min después)
  }
  ```

**Paso 7-8: Verificación de permisos**
- Middleware de rol verifica:
  ```php
  $allowedRoles = ['admin', 'recruiter'];
  if (!in_array($payload->role, $allowedRoles)) {
    return 403 Forbidden;
  }
  ```

**Paso 9-10: Ejecución del caso de uso (si autorizado)**
- Request llega al controlador con datos del usuario:
  ```php
  $user = $request->getAttribute('user');
  // $user->uuid, $user->role disponibles
  ```

**Paso 11-12: Token expirado - Renovación**
- Si access token expiró (después de 15 min)
- Frontend usa refresh token:
  ```javascript
  POST /api/v1/auth/refresh
  {
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
  ```
- Auth Service verifica refresh token en BD
- Si válido, genera nuevo access token
- Reintenta la petición original

**Ventajas de este sistema:**
- ✅ No requiere validar con Auth Service en cada petición
- ✅ Stateless: no se guarda sesión en memoria
- ✅ Escalable: múltiples instancias sin sincronización
- ✅ Secret compartido permite validación local
- ✅ Tokens de corta duración minizan riesgo si son robados

---

## 5. Diagrama de Componentes - Clean Architecture

### 5.1 Auth Service (TypeScript)

```mermaid
graph TB
    subgraph "Presentation Layer"
        API[Express API<br/>Controllers & Routes]
        MW[Middlewares<br/>Auth, Validation]
    end
    
    subgraph "Application Layer"
        UC1[RegisterUserUseCase]
        UC2[LoginUserUseCase]
        UC3[RefreshTokenUseCase]
        UC4[GetUserProfileUseCase]
        UC5[UpdateUserRoleUseCase]
        UC6[ListUsersUseCase]
    end
    
    subgraph "Domain Layer"
        ENT[Entities<br/>User, RefreshToken]
        REP[Repository Interfaces<br/>IUserRepository<br/>IRefreshTokenRepository]
        SVC[Domain Services<br/>PasswordService<br/>TokenService]
    end
    
    subgraph "Infrastructure Layer"
        REPO[Repository Implementations<br/>PostgresUserRepository]
        JWT[JWT Service]
        HASH[Bcrypt Service]
        DB[(PostgreSQL)]
    end
    
    API --> MW
    MW --> UC1
    MW --> UC2
    MW --> UC3
    MW --> UC4
    MW --> UC5
    MW --> UC6
    
    UC1 --> REP
    UC2 --> REP
    UC3 --> REP
    UC4 --> REP
    UC5 --> REP
    UC6 --> REP
    
    UC1 --> SVC
    UC2 --> SVC
    UC3 --> SVC
    
    REP -.implements.- REPO
    SVC -.uses.- JWT
    SVC -.uses.- HASH
    
    REPO --> DB
    
    style API fill:#61dafb,stroke:#333,stroke-width:2px
    style UC1 fill:#90caf9,stroke:#333,stroke-width:2px
    style ENT fill:#ffb74d,stroke:#333,stroke-width:2px
    style REPO fill:#a5d6a7,stroke:#333,stroke-width:2px
```

### 5.2 Recruitment Service (PHP)

```mermaid
graph TB
    subgraph "Presentation"
        CTRL[Controllers<br/>VacancyController<br/>ApplicationController<br/>AIController]
        ROUTES[Routes<br/>api.php]
        MWARE[Middlewares<br/>AuthMiddleware<br/>RoleMiddleware]
    end
    
    subgraph "Application"
        VUC[Vacancy UseCases<br/>CreateVacancy<br/>UpdateVacancy<br/>ListVacancies]
        AUC[Application UseCases<br/>SubmitApplication<br/>UpdateStatus<br/>ListApplications]
    end
    
    subgraph "Domain"
        VENT[Vacancy Entity]
        AENT[Application Entity]
        VREP[IVacancyRepository]
        AREP[IApplicationRepository]
    end
    
    subgraph "Infrastructure"
        VREPO[VacancyRepository<br/>PDO]
        AREPO[ApplicationRepository<br/>PDO]
        EMAIL[EmailService<br/>AWS SES]
        QUEUE[QueueService<br/>AWS SQS]
        JWTV[JWTService]
        PG[(PostgreSQL)]
    end
    
    ROUTES --> CTRL
    CTRL --> MWARE
    MWARE --> VUC
    MWARE --> AUC
    
    VUC --> VREP
    AUC --> AREP
    
    VREP -.implements.- VREPO
    AREP -.implements.- AREPO
    
    AUC --> EMAIL
    AUC --> QUEUE
    
    VREPO --> PG
    AREPO --> PG
    
    style CTRL fill:#8892be,stroke:#333,stroke-width:2px
    style VUC fill:#90caf9,stroke:#333,stroke-width:2px
    style VENT fill:#ffb74d,stroke:#333,stroke-width:2px
    style VREPO fill:#a5d6a7,stroke:#333,stroke-width:2px
```

### 5.3 Document Service (Python)

```mermaid
graph TB
    subgraph "Presentation"
        DCTRL[DocumentController<br/>FastAPI Router]
        DMOD[Models<br/>Pydantic]
        DMW[Auth Middleware]
    end
    
    subgraph "Application"
        DUC1[UploadDocumentUseCase]
        DUC2[GetDocumentUrlUseCase]
        DUC3[GetDocumentsByApplicationUseCase]
        DUC4[DeleteDocumentUseCase]
    end
    
    subgraph "Domain"
        DENT[Document Entity]
        DREP[IDocumentRepository]
        DSTO[IStorageService]
    end
    
    subgraph "Infrastructure"
        DREPO[PostgresDocumentRepository<br/>AsyncPG]
        DLOCAL[LocalStorageService]
        DS3[S3StorageService]
        DJWT[JWTService]
        DDB[(PostgreSQL)]
        STORAGE[Local/S3 Storage]
    end
    
    DCTRL --> DMW
    DMW --> DUC1
    DMW --> DUC2
    DMW --> DUC3
    DMW --> DUC4
    
    DUC1 --> DREP
    DUC1 --> DSTO
    DUC2 --> DREP
    DUC2 --> DSTO
    DUC3 --> DREP
    DUC4 --> DREP
    DUC4 --> DSTO
    
    DREP -.implements.- DREPO
    DSTO -.implements.- DLOCAL
    DSTO -.implements.- DS3
    
    DREPO --> DDB
    DLOCAL --> STORAGE
    DS3 --> STORAGE
    
    style DCTRL fill:#009688,stroke:#333,stroke-width:2px
    style DUC1 fill:#90caf9,stroke:#333,stroke-width:2px
    style DENT fill:#ffb74d,stroke:#333,stroke-width:2px
    style DREPO fill:#a5d6a7,stroke:#333,stroke-width:2px
```

---

## 6. Diagrama de Despliegue

```mermaid
graph TB
    subgraph "Docker Network: prisma-network"
        subgraph "Frontend Container"
            FE[React App<br/>Nginx Server<br/>Port: 80]
        end
        
        subgraph "Auth Service Container"
            AUTH[Node.js 18<br/>Auth Service<br/>Port: 3001]
        end
        
        subgraph "Recruitment Service Container"
            REC[PHP 8.2 FPM<br/>Recruitment Service<br/>Port: 3002]
        end
        
        subgraph "Document Service Container"
            DOC[Python 3.11<br/>FastAPI + Uvicorn<br/>Port: 3003]
        end
        
        subgraph "Database Containers"
            DB1[(Auth PostgreSQL 16<br/>Port: 5434)]
            DB2[(Recruitment PostgreSQL 16<br/>Port: 5433)]
            DB3[(Document PostgreSQL 16<br/>Port: 5435)]
        end
        
        subgraph "Volumes"
            V1[auth_postgres_data]
            V2[recruitment_postgres_data]
            V3[document_postgres_data]
            V4[document_storage]
        end
    end
    
    subgraph "External Cloud Services"
        SES[AWS SES<br/>Email Service]
        SQS[AWS SQS<br/>Queue Service]
        S3[AWS S3<br/>Optional Storage]
    end
    
    USER[👤 Usuario<br/>Browser]
    
    USER -->|HTTP/HTTPS<br/>Port 80/443| FE
    FE -->|HTTP| AUTH
    FE -->|HTTP| REC
    FE -->|HTTP| DOC
    
    AUTH --> DB1
    REC --> DB2
    DOC --> DB3
    
    DB1 --> V1
    DB2 --> V2
    DB3 --> V3
    DOC --> V4
    
    REC -.->|SMTP| SES
    REC -.->|API| SQS
    DOC -.->|Optional| S3
    
    style FE fill:#61dafb,stroke:#333,stroke-width:3px
    style AUTH fill:#68a063,stroke:#333,stroke-width:3px
    style REC fill:#8892be,stroke:#333,stroke-width:3px
    style DOC fill:#009688,stroke:#333,stroke-width:3px
    style DB1 fill:#336791,stroke:#333,stroke-width:2px,color:#fff
    style DB2 fill:#336791,stroke:#333,stroke-width:2px,color:#fff
    style DB3 fill:#336791,stroke:#333,stroke-width:2px,color:#fff
```

**Especificaciones de Despliegue:**

- **Orquestación**: Docker Compose
- **Red**: Bridge network compartida (prisma-network)
- **Persistencia**: Volumes de Docker para bases de datos y storage
- **Health Checks**: Configurados para todos los servicios
- **Environment Variables**: Configuradas mediante `.env` files
- **Restart Policy**: `unless-stopped` en producción

---

## 7. Diagrama de Clases del Dominio

### 7.1 Auth Service Domain

```mermaid
classDiagram
    class User {
        -UUID uuid
        -string email
        -string passwordHash
        -string name
        -UserRole role
        -UserStatus status
        -boolean emailVerified
        -Date createdAt
        -Date updatedAt
        -Date? lastLoginAt
        +validateEmail() boolean
        +validatePassword() boolean
        +isActive() boolean
        +canManageUsers() boolean
    }
    
    class RefreshToken {
        -UUID id
        -UUID userId
        -string token
        -Date expiresAt
        -Date createdAt
        -boolean revoked
        +isValid() boolean
        +revoke() void
    }
    
    class IUserRepository {
        <<interface>>
        +findByEmail(email: string) Promise~User~
        +findByUuid(uuid: UUID) Promise~User~
        +create(user: User) Promise~User~
        +update(user: User) Promise~User~
        +delete(uuid: UUID) Promise~void~
        +listAll() Promise~User[]~
    }
    
    class IRefreshTokenRepository {
        <<interface>>
        +findByToken(token: string) Promise~RefreshToken~
        +create(token: RefreshToken) Promise~RefreshToken~
        +revoke(token: string) Promise~void~
    }
    
    class PasswordService {
        +hash(password: string) Promise~string~
        +verify(password: string, hash: string) Promise~boolean~
    }
    
    class TokenService {
        +generateAccessToken(user: User) string
        +generateRefreshToken(user: User) string
        +verifyToken(token: string) Payload
    }
    
    User "1" -- "0..*" RefreshToken : has
    IUserRepository ..> User : manages
    IRefreshTokenRepository ..> RefreshToken : manages
    PasswordService ..> User : secures
    TokenService ..> User : authenticates
```

### 7.2 Recruitment Service Domain

```mermaid
classDiagram
    class Vacancy {
        -UUID uuid
        -string title
        -string description
        -string requirements
        -string location
        -string salaryRange
        -EmploymentType employmentType
        -VacancyStatus status
        -Date? publishedAt
        -Date expiresAt
        -Date createdAt
        -Date updatedAt
        +isActive() boolean
        +isExpired() boolean
        +publish() void
        +close() void
        +canReceiveApplications() boolean
    }
    
    class Application {
        -UUID uuid
        -UUID vacancyId
        -UUID vacancyUuid
        -string documentNumber
        -string fullName
        -string email
        -string phone
        -string cvPath
        -string coverLetter
        -ApplicationStatus status
        -string reviewNotes
        -Date createdAt
        -Date updatedAt
        +isPending() boolean
        +accept(notes: string) void
        +reject(notes: string) void
        +updateStatus(status: ApplicationStatus) void
    }
    
    class IVacancyRepository {
        <<interface>>
        +findByUuid(uuid: UUID) Promise~Vacancy~
        +listActive() Promise~Vacancy[]~
        +create(vacancy: Vacancy) Promise~Vacancy~
        +update(vacancy: Vacancy) Promise~Vacancy~
        +delete(uuid: UUID) Promise~void~
    }
    
    class IApplicationRepository {
        <<interface>>
        +findByUuid(uuid: UUID) Promise~Application~
        +findByVacancy(vacancyId: UUID) Promise~Application[]~
        +findByDocument(document: string) Promise~Application[]~
        +create(application: Application) Promise~Application~
        +update(application: Application) Promise~Application~
        +delete(uuid: UUID) Promise~void~
    }
    
    class EmailService {
        +sendConfirmation(application: Application) Promise~void~
        +sendStatusUpdate(application: Application) Promise~void~
        +sendWelcome(vacancy: Vacancy) Promise~void~
    }
    
    class QueueService {
        +enqueue(message: EmailMessage) Promise~void~
        +processQueue() Promise~void~
    }
    
    Vacancy "1" -- "0..*" Application : receives
    IVacancyRepository ..> Vacancy : manages
    IApplicationRepository ..> Application : manages
    EmailService ..> Application : notifies
    QueueService ..> EmailService : uses
```

### 7.3 Document Service Domain

```mermaid
classDiagram
    class Document {
        -UUID id
        -string userDocument
        -UUID applicationId
        -string filename
        -string originalFilename
        -string filePath
        -int fileSize
        -string mimeType
        -DocumentType documentType
        -Date uploadedAt
        -UUID? uploadedBy
        +isValid() boolean
        +getExtension() string
        +getSizeInMB() float
    }
    
    class IDocumentRepository {
        <<interface>>
        +findById(id: UUID) Promise~Document~
        +findByApplication(applicationId: UUID) Promise~Document[]~
        +findByUser(userDocument: string) Promise~Document[]~
        +create(document: Document) Promise~Document~
        +delete(id: UUID) Promise~void~
    }
    
    class IStorageService {
        <<interface>>
        +upload(file: bytes, path: string) Promise~string~
        +download(path: string) Promise~bytes~
        +delete(path: string) Promise~void~
        +getUrl(path: string) Promise~string~
    }
    
    class LocalStorageService {
        -string basePath
        +upload(file: bytes, path: string) Promise~string~
        +download(path: string) Promise~bytes~
        +delete(path: string) Promise~void~
        +getUrl(path: string) Promise~string~
    }
    
    class S3StorageService {
        -string bucket
        -string region
        +upload(file: bytes, path: string) Promise~string~
        +download(path: string) Promise~bytes~
        +delete(path: string) Promise~void~
        +getSignedUrl(path: string) Promise~string~
    }
    
    IDocumentRepository ..> Document : manages
    IStorageService <|.. LocalStorageService : implements
    IStorageService <|.. S3StorageService : implements
    Document ..> IStorageService : stored by
```

---

## 8. Patrones de Diseño Implementados

### 8.1 Arquitectura y Estructurales
- **Clean Architecture**: Separación de capas (Domain, Application, Infrastructure, Presentation)
- **Microservices Pattern**: Servicios independientes con bases de datos separadas
- **Repository Pattern**: Abstracción de acceso a datos
- **Dependency Injection**: Inyección de dependencias en constructores
- **DTO Pattern**: Data Transfer Objects para comunicación entre capas

### 8.2 Comportamentales
- **Use Case Pattern**: Casos de uso para lógica de aplicación
- **Strategy Pattern**: LocalStorageService vs S3StorageService
- **Observer Pattern**: Queue service para procesamiento asíncrono

### 8.3 Seguridad
- **JWT Authentication**: Token-based authentication
- **Role-Based Access Control (RBAC)**: admin, recruiter, user
- **Middleware Pattern**: Validación de autenticación y autorización

---

## 9. Tecnologías Utilizadas

| Capa | Auth Service | Recruitment Service | Document Service | Frontend |
|------|--------------|-------------------|------------------|----------|
| **Lenguaje** | TypeScript | PHP | Python | TypeScript |
| **Framework** | Express | Slim 4 | FastAPI | React + Vite |
| **Base de Datos** | PostgreSQL 16 | PostgreSQL 16 | PostgreSQL 16 | - |
| **ORM/Driver** | pg (node-postgres) | PDO | AsyncPG | - |
| **Autenticación** | JWT + Bcrypt | JWT Verification | JWT Verification | JWT Client |
| **Validación** | Joi | Built-in | Pydantic | Zod |
| **Contenedor** | Node 18 Alpine | PHP 8.2 FPM | Python 3.11 Slim | Nginx Alpine |
| **Comunicación** | REST | REST | REST | Axios HTTP |

---

## 10. Endpoints de API

### Auth Service (Port 3001)
```
POST   /api/v1/auth/register         - Registrar usuario
POST   /api/v1/auth/login            - Iniciar sesión
POST   /api/v1/auth/refresh          - Refrescar token
GET    /api/v1/auth/me               - Obtener perfil (autenticado)
POST   /api/v1/auth/logout           - Cerrar sesión (autenticado)
GET    /api/v1/users                 - Listar usuarios (admin)
GET    /api/v1/users/:uuid           - Obtener usuario (admin)
PATCH  /api/v1/users/:uuid/role      - Actualizar rol (admin)
```

### Recruitment Service (Port 3002)
```
GET    /api/v1/vacancies/active      - Listar vacantes activas (público)
GET    /api/v1/vacancies/all         - Listar todas (público)
GET    /api/v1/vacancies/:uuid       - Ver vacante (público)
POST   /api/v1/vacancies             - Crear vacante (admin/recruiter)
PUT    /api/v1/vacancies/:uuid       - Actualizar vacante (admin/recruiter)
DELETE /api/v1/vacancies/:uuid       - Eliminar vacante (admin)

POST   /api/v1/applications          - Enviar postulación (público)
GET    /api/v1/applications/status/:document - Consultar estado (público)
GET    /api/v1/applications          - Listar postulaciones (admin/recruiter)
PATCH  /api/v1/applications/:uuid/status - Actualizar estado (admin/recruiter)
DELETE /api/v1/applications/:uuid    - Eliminar postulación (admin)
POST   /api/v1/applications/bulk-delete - Eliminación masiva (admin)

POST   /api/v1/ai/improve-text       - Mejorar texto con IA (público)
```

### Document Service (Port 3003)
```
POST   /api/v1/documents/upload/public    - Subir documento (público)
POST   /api/v1/documents/upload           - Subir documento (autenticado)
GET    /api/v1/documents/:id/url          - Obtener URL (autenticado)
GET    /api/v1/documents/application/:id  - Listar por aplicación (autenticado)
GET    /api/v1/documents/user/:document   - Listar por usuario (autenticado)
DELETE /api/v1/documents/:id              - Eliminar documento (admin)
```

---

## 📝 Notas

- Todos los diagramas están en formato **Mermaid** y se pueden visualizar directamente en GitHub, VS Code o cualquier visor compatible
- Para generar imágenes PNG/SVG, puedes usar herramientas como [Mermaid Live Editor](https://mermaid.live/)
- Los diagramas se actualizan conforme evoluciona el proyecto
- Fecha de creación: 19 de Noviembre de 2025

---

**Proyecto PRISMA** - Sistema de Reclutamiento con Microservicios  
**Autor**: DIEGHOST64  
**Repositorio**: github.com/DIEGHOST64/Prisma
