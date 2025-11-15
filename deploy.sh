#!/bin/bash

# ================================================================
# SCRIPT DE DESPLIEGUE AUTOMATIZADO - PRISMA
# Sistema de Reclutamiento con Microservicios
# ================================================================

set -e  # Detener en caso de error

echo "=========================================="
echo "  PRISMA - Deployment Script"
echo "=========================================="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ========================
# 1. ACTUALIZAR SISTEMA
# ========================
echo -e "${YELLOW}[1/7] Actualizando sistema...${NC}"
sudo apt-get update
sudo apt-get upgrade -y

# ========================
# 2. INSTALAR DOCKER
# ========================
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}[2/7] Instalando Docker...${NC}"
    
    # Instalar dependencias
    sudo apt-get install -y ca-certificates curl gnupg lsb-release
    
    # Agregar GPG key oficial de Docker
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    # Configurar repositorio
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Instalar Docker Engine
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Agregar usuario actual al grupo docker
    sudo usermod -aG docker $USER
    
    echo -e "${GREEN}✓ Docker instalado${NC}"
else
    echo -e "${GREEN}✓ Docker ya está instalado${NC}"
fi

# ========================
# 3. INSTALAR DOCKER COMPOSE
# ========================
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}[3/7] Instalando Docker Compose...${NC}"
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✓ Docker Compose instalado${NC}"
else
    echo -e "${GREEN}✓ Docker Compose ya está instalado${NC}"
fi

# ========================
# 4. INSTALAR GIT
# ========================
if ! command -v git &> /dev/null; then
    echo -e "${YELLOW}[4/7] Instalando Git...${NC}"
    sudo apt-get install -y git
    echo -e "${GREEN}✓ Git instalado${NC}"
else
    echo -e "${GREEN}✓ Git ya está instalado${NC}"
fi

# ========================
# 5. CLONAR REPOSITORIO
# ========================
echo -e "${YELLOW}[5/7] Clonando repositorio...${NC}"

if [ -d "/home/ubuntu/prisma" ]; then
    echo "Repositorio existente encontrado. Actualizando..."
    cd /home/ubuntu/prisma
    git pull origin main
else
    cd /home/ubuntu
    git clone https://github.com/DIEGHOST64/Prisma.git prisma
    cd prisma
fi

echo -e "${GREEN}✓ Repositorio listo${NC}"

# ========================
# 6. CONFIGURAR VARIABLES DE ENTORNO
# ========================
echo -e "${YELLOW}[6/7] Configurando variables de entorno...${NC}"

if [ ! -f ".env" ]; then
    echo -e "${RED}⚠ Archivo .env no encontrado${NC}"
    echo "Copiando plantilla..."
    cp .env.example .env
    echo -e "${YELLOW}IMPORTANTE: Edita el archivo .env con tus credenciales:${NC}"
    echo "  nano .env"
    echo ""
    read -p "Presiona Enter cuando hayas configurado el archivo .env..."
else
    echo -e "${GREEN}✓ Archivo .env encontrado${NC}"
fi

# ========================
# 7. LEVANTAR SERVICIOS
# ========================
echo -e "${YELLOW}[7/7] Iniciando servicios...${NC}"

# Detener contenedores existentes
docker-compose down 2>/dev/null || true

# Construir imágenes
echo "Construyendo imágenes Docker..."
docker-compose build

# Levantar servicios
echo "Iniciando contenedores..."
docker-compose up -d

# Esperar a que los servicios estén listos
echo "Esperando a que los servicios inicien..."
sleep 10

# Verificar estado
echo ""
echo -e "${GREEN}=========================================="
echo "  SERVICIOS DESPLEGADOS"
echo "==========================================${NC}"
docker-compose ps

echo ""
echo -e "${GREEN}✓ Despliegue completado exitosamente${NC}"
echo ""
echo "Accede a los servicios:"
echo "  Frontend:           http://$(curl -s ifconfig.me):5173"
echo "  Recruitment API:    http://$(curl -s ifconfig.me):3002"
echo "  Auth API:           http://$(curl -s ifconfig.me):3001"
echo "  Document API:       http://$(curl -s ifconfig.me):3003"
echo ""
echo "Ver logs:"
echo "  docker-compose logs -f"
echo ""
echo "Detener servicios:"
echo "  docker-compose down"
echo ""
