# ================================================================
# PRISMA - DEPLOYMENT HÍBRIDO
# Frontend: GitHub Pages | Backend: AWS EC2
# ================================================================

## 🎯 Arquitectura

```
┌─────────────────────────────────────────────────┐
│          GITHUB PAGES (Gratis)                  │
│  https://dieghost64.github.io/Prisma            │
│  - Frontend React (estático)                    │
│  - HTTPS automático                             │
│  - CDN global                                   │
└─────────────────┬───────────────────────────────┘
                  │ API Calls
                  ▼
┌─────────────────────────────────────────────────┐
│           AWS EC2 (Free Tier)                   │
│  http://TU_IP_PUBLICA                           │
│  - Recruitment API :3002                        │
│  - Auth API :3001                               │
│  - Document API :3003                           │
│  - Queue Worker                                 │
│  - 3 PostgreSQL databases                       │
└─────────────────────────────────────────────────┘
```

---

## 📋 PARTE 1: Desplegar Backend en AWS EC2

### 1.1 Crear instancia EC2

1. Ve a [AWS EC2 Console](https://console.aws.amazon.com/ec2/)
2. Click **"Lanzar instancia"**
3. Configuración:
   - **Nombre:** `prisma-backend`
   - **AMI:** Ubuntu Server 22.04 LTS
   - **Tipo:** t2.micro (Free tier)
   - **Key pair:** Crear y descargar `.pem`
   - **Security Group:** Permitir puertos:
     * 22 (SSH)
     * 3001 (Auth API)
     * 3002 (Recruitment API)
     * 3003 (Document API)
     * 80 (HTTP - opcional)

### 1.2 Conectar por SSH

```bash
ssh -i tu-key.pem ubuntu@TU_IP_PUBLICA
```

### 1.3 Ejecutar script de deployment

```bash
# Descargar script
curl -o deploy.sh https://raw.githubusercontent.com/DIEGHOST64/Prisma/main/deploy.sh

# Ejecutar
chmod +x deploy.sh
./deploy.sh
```

### 1.4 Configurar variables de entorno

```bash
cd ~/prisma
nano .env
```

**Configuración mínima:**

```bash
# JWT Secret
JWT_SECRET=$(openssl rand -base64 32)

# AWS Credentials
AWS_ACCESS_KEY_ID=AKIAYJZZZQVM5PFLQIH6
AWS_SECRET_ACCESS_KEY=tu_secret_key
AWS_REGION=us-east-1
SES_FROM_EMAIL=kratexvertex90@gmail.com
SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/account/email-queue

# Passwords
RECRUITMENT_DB_PASSWORD=password123
AUTH_DB_PASSWORD=password456
DOCUMENT_DB_PASSWORD=password789
```

Guarda y reinicia:

```bash
docker-compose up -d
```

### 1.5 Verificar APIs

```bash
# Obtener IP pública
curl ifconfig.me

# Probar APIs
curl http://localhost:3002/health
curl http://localhost:3001/health
curl http://localhost:3003/health
```

✅ **Anota tu IP pública, la necesitarás para el frontend**

---

## 📋 PARTE 2: Desplegar Frontend en GitHub Pages

### 2.1 Habilitar GitHub Pages

1. Ve a tu repositorio: https://github.com/DIEGHOST64/Prisma
2. Click **Settings** > **Pages**
3. En **Source** selecciona: **GitHub Actions**

### 2.2 Configurar Secrets de GitHub

Ve a **Settings** > **Secrets and variables** > **Actions** > **New repository secret**

Agrega estos 4 secrets:

| Name | Value |
|------|-------|
| `VITE_API_URL` | `http://TU_IP_PUBLICA_EC2` |
| `VITE_RECRUITMENT_API` | `http://TU_IP_PUBLICA_EC2:3002` |
| `VITE_AUTH_API` | `http://TU_IP_PUBLICA_EC2:3001` |
| `VITE_DOCUMENT_API` | `http://TU_IP_PUBLICA_EC2:3003` |

**Ejemplo:**
```
VITE_API_URL = http://54.123.45.67
VITE_RECRUITMENT_API = http://54.123.45.67:3002
VITE_AUTH_API = http://54.123.45.67:3001
VITE_DOCUMENT_API = http://54.123.45.67:3003
```

### 2.3 Subir archivos a GitHub

En tu máquina local:

```powershell
cd C:\xampp\htdocs\frontend-prisma

# Asegurarse de tener la última versión
git pull origin main

# Agregar archivos nuevos
git add .

# Commit
git commit -m "Configurar deployment híbrido GitHub Pages + AWS EC2"

# Push
git push origin main
```

### 2.4 Verificar deployment automático

1. Ve a **Actions** en tu repositorio
2. Verás el workflow **"Deploy to GitHub Pages"** ejecutándose
3. Espera ~2-3 minutos
4. Tu sitio estará en: **https://dieghost64.github.io/Prisma/**

---

## 🔧 Configuración de CORS en Backend

Para que GitHub Pages pueda consumir las APIs, necesitas configurar CORS en cada servicio.

### Opción 1: Permitir GitHub Pages específicamente

En tu servidor EC2, edita cada servicio para permitir CORS:

**Recruitment Service (PHP):**
```bash
cd ~/prisma/recruitment-service
nano public/index.php
```

Agregar al inicio:
```php
header('Access-Control-Allow-Origin: https://dieghost64.github.io');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
```

**Auth Service (Node.js):**
```bash
cd ~/prisma/auth-service
npm install cors
```

En `src/app.ts`:
```typescript
import cors from 'cors';

app.use(cors({
  origin: 'https://dieghost64.github.io',
  credentials: true
}));
```

**Document Service (Python):**
```bash
cd ~/prisma/document-service
pip install fastapi-cors
```

En `main.py`:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://dieghost64.github.io"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Luego reinicia:
```bash
docker-compose restart
```

---

## ✅ Verificación Final

### Frontend (GitHub Pages):
- URL: `https://dieghost64.github.io/Prisma/`
- Estado: ✅ HTTPS automático
- Costo: $0

### Backend (AWS EC2):
- Recruitment API: `http://TU_IP:3002`
- Auth API: `http://TU_IP:3001`
- Document API: `http://TU_IP:3003`
- Estado: ✅ Free tier 12 meses
- Costo: $0/mes

---

## 🚀 Actualizar el proyecto

### Actualizar Frontend:
```bash
git add .
git commit -m "Update frontend"
git push origin main
# GitHub Actions desplegará automáticamente
```

### Actualizar Backend:
```bash
ssh -i tu-key.pem ubuntu@TU_IP_PUBLICA
cd ~/prisma
git pull origin main
docker-compose build
docker-compose up -d
```

---

## 🔒 Mejorar Seguridad (OPCIONAL)

### Opción A: Usar dominio personalizado

1. Comprar dominio en Namecheap/GoDaddy (~$10/año)
2. Configurar:
   - **Frontend:** CNAME a `dieghost64.github.io`
   - **Backend:** A record a tu IP de EC2
3. Configurar SSL con Let's Encrypt (gratis)

### Opción B: Usar CloudFlare (Gratis)

1. Cuenta en [CloudFlare](https://cloudflare.com)
2. Agregar dominio gratuito `.workers.dev`
3. Proxy inverso para ocultar IP de EC2
4. HTTPS automático

---

## 💰 Costos Mensuales

| Servicio | Costo |
|----------|-------|
| GitHub Pages | $0 |
| AWS EC2 t2.micro | $0 (12 meses) |
| AWS SES | $0 (62K emails/mes) |
| AWS SQS | $0 (1M requests/mes) |
| **TOTAL** | **$0/mes** ✅ |

---

## 🆘 Troubleshooting

### Frontend no se conecta a APIs

1. Verifica CORS en backend
2. Revisa GitHub Secrets
3. Mira consola del navegador (F12)

### APIs no responden

```bash
# En EC2
docker-compose ps
docker-compose logs
```

### Error de HTTPS mixto

GitHub Pages usa HTTPS, pero tus APIs son HTTP. Soluciones:
1. Usar dominio con SSL en backend
2. Usar CloudFlare como proxy
3. Configurar SSL en EC2 con Let's Encrypt

---

## 📝 Próximos pasos

- [ ] Configurar dominio personalizado
- [ ] Agregar SSL al backend
- [ ] Configurar CDN para assets
- [ ] Implementar caché
- [ ] Monitoreo con CloudWatch

---

**¿Listo para desplegar?** Sigue los pasos en orden y tendrás todo funcionando en ~30 minutos. 🚀
