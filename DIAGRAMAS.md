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

**Descripción:**
- **Frontend**: Aplicación React que consume las APIs de los microservicios
- **Auth Service**: Gestiona autenticación, autorización y usuarios
- **Recruitment Service**: Gestiona vacantes, postulaciones y notificaciones
- **Document Service**: Gestiona almacenamiento y recuperación de documentos
- Cada servicio tiene su propia base de datos (Database per Service pattern)
- Comunicación entre servicios mediante HTTP/REST
- JWT para autenticación y autorización

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
