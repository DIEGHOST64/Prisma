# Auth Service - Microservicio de Autenticación

FROM node:18-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./
COPY tsconfig.json ./

# Instalar TODAS las dependencias (incluyendo devDependencies para build)
RUN npm ci && npm cache clean --force

# Copiar código fuente
COPY src ./src

# Build TypeScript
RUN npm run build

# ═════════════════════════════════════════════════════════════
# Production stage
# ═════════════════════════════════════════════════════════════
FROM node:18-alpine

WORKDIR /app

# Crear usuario non-root
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copiar dependencias y build
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --chown=nodejs:nodejs package*.json ./

# Cambiar a usuario non-root
USER nodejs

# Exponer puerto
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de inicio
CMD ["node", "dist/index.js"]
