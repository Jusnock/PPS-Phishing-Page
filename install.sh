#!/bin/bash

# Colores para salida estructurada y visual
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # Sin color (Restablecer)

echo -e "${BLUE}===================================================================${NC}"
echo -e "${BLUE}    Instalador Interactivo y Configuración - Phishing Quiz (PPS)     ${NC}"
echo -e "${BLUE}===================================================================${NC}"
echo ""

# 1. Verificar dependencias necesarias
echo -e "${YELLOW}[*] Verificando prerrequisitos del sistema...${NC}"

if ! command -v docker >/dev/null 2>&1; then
    echo -e "${RED}[ERROR] Docker no está instalado en este servidor.${NC}"
    echo -e "Instálalo siguiendo la guía oficial: https://docs.docker.com/engine/install/"
    exit 1
fi
echo -e "${GREEN}[OK] Docker está instalado.${NC}"

# Verificar docker compose (v2) o docker-compose (v1)
DOCKER_COMPOSE_CMD=""
if docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
    echo -e "${GREEN}[OK] Docker Compose (v2) está instalado.${NC}"
elif docker-compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker-compose"
    echo -e "${GREEN}[OK] Docker-Compose (v1) está instalado.${NC}"
else
    echo -e "${RED}[ERROR] Docker Compose no está instalado en este servidor.${NC}"
    echo -e "Instálalo siguiendo la guía oficial: https://docs.docker.com/compose/install/"
    exit 1
fi
echo ""

# Generar claves por defecto seguras
if command -v openssl >/dev/null 2>&1; then
    SECRET_KEY_DEFAULT=$(openssl rand -hex 32)
    DB_PASSWORD_DEFAULT=$(openssl rand -hex 16)
else
    # Fallback si openssl no está en la máquina
    SECRET_KEY_DEFAULT=$(head -c 32 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
    DB_PASSWORD_DEFAULT=$(head -c 16 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | fold -w 16 | head -n 1)
fi

# 2. Entrada interactiva de las variables de entorno
echo -e "${YELLOW}[*] Configuración de Puertos de Red (Host):${NC}"
read -p "Puerto para el Frontend [80]: " FRONTEND_PORT
FRONTEND_PORT=${FRONTEND_PORT:-80}

read -p "Puerto para el Backend [8000]: " BACKEND_PORT
BACKEND_PORT=${BACKEND_PORT:-8000}

read -p "Puerto para la Base de Datos [5432]: " DB_PORT
DB_PORT=${DB_PORT:-5432}

echo ""
echo -e "${YELLOW}[*] Configuración de URLs y Direcciones del Servidor:${NC}"
read -p "URL pública del Frontend (ej: http://phishing.cpcemza.org.ar) [http://localhost]: " FRONTEND_URL
FRONTEND_URL=${FRONTEND_URL:-http://localhost}

read -p "URL pública del Backend/API (ej: http://api-phishing.cpcemza.org.ar) [http://localhost:8000]: " BACKEND_URL
BACKEND_URL=${BACKEND_URL:-http://localhost:8000}

# El frontend inyecta la URL del backend a través de VITE_API_URL en tiempo de compilación
VITE_API_URL=$BACKEND_URL

echo ""
echo -e "${YELLOW}[*] Configuración de la Base de Datos PostgreSQL:${NC}"
read -p "Usuario administrador de BD [admin]: " DB_USER
DB_USER=${DB_USER:-admin}

read -p "Contraseña de la base de datos [$DB_PASSWORD_DEFAULT]: " DB_PASSWORD
DB_PASSWORD=${DB_PASSWORD:-$DB_PASSWORD_DEFAULT}

read -p "Nombre de la base de datos [phishing_quiz]: " DB_NAME
DB_NAME=${DB_NAME:-phishing_quiz}

echo ""
echo -e "${YELLOW}[*] Configuración de Seguridad e Inicialización:${NC}"
read -p "Clave Secreta JWT (SECRET_KEY) [Autogenerada]: " SECRET_KEY
SECRET_KEY=${SECRET_KEY:-$SECRET_KEY_DEFAULT}

read -p "Emails para Superadministrador inicial (separados por coma): " SUPERADMIN_EMAILS
SUPERADMIN_EMAILS=${SUPERADMIN_EMAILS:-vazquezjuanfrancisco49@gmail.com}

echo ""
echo -e "${YELLOW}[*] Autenticación con Google Workspace (Opcional - Presiona Enter para omitir):${NC}"
read -p "Google Client ID: " GOOGLE_CLIENT_ID
read -p "Google Client Secret: " GOOGLE_CLIENT_SECRET

echo ""
echo -e "${YELLOW}[*] Servidor de Correo SMTP (para campañas reales):${NC}"
read -p "Host del servidor SMTP [smtp.gmail.com]: " SMTP_HOST
SMTP_HOST=${SMTP_HOST:-smtp.gmail.com}

read -p "Puerto SMTP [587]: " SMTP_PORT
SMTP_PORT=${SMTP_PORT:-587}

read -p "Usuario/Correo SMTP: " SMTP_USER
read -p "Contraseña/App Password SMTP: " SMTP_PASSWORD

read -p "¿Usar TLS? (True/False) [True]: " SMTP_USE_TLS
SMTP_USE_TLS=${SMTP_USE_TLS:-True}

echo ""
echo -e "${YELLOW}[*] Generando archivo .env centralizado...${NC}"

# Escribir el .env
cat <<EOF > .env
# ==========================================
# CONFIGURACIÓN GENERADA POR INSTALADOR
# ==========================================

# Puertos expuestos en el Host
FRONTEND_PORT=$FRONTEND_PORT
BACKEND_PORT=$BACKEND_PORT
DB_PORT=$DB_PORT

# URLs públicas
FRONTEND_URL=$FRONTEND_URL
BACKEND_URL=$BACKEND_URL
VITE_API_URL=$VITE_API_URL

# Base de datos PostgreSQL
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME
DB_HOST=db

# Seguridad
SECRET_KEY=$SECRET_KEY
SUPERADMIN_EMAILS=$SUPERADMIN_EMAILS

# Google Workspace OAuth
GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET

# Servidor SMTP
SMTP_HOST=$SMTP_HOST
SMTP_PORT=$SMTP_PORT
SMTP_USER=$SMTP_USER
SMTP_PASSWORD=$SMTP_PASSWORD
SMTP_USE_TLS=$SMTP_USE_TLS
EOF

# Aplicar permisos de seguridad estrictos (lectura/escritura exclusiva para el dueño)
chmod 600 .env
echo -e "${GREEN}[OK] Archivo .env creado con permisos restrictivos de lectura (chmod 600).${NC}"
echo ""

# 3. Preguntar para construir e iniciar los servicios
read -p "¿Deseas compilar y levantar los contenedores ahora mismo? (s/n) [s]: " COMPILAR
COMPILAR=${COMPILAR:-s}

if [[ "$COMPILAR" =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}[*] Iniciando servicios de Docker en segundo plano...${NC}"
    $DOCKER_COMPOSE_CMD up -d --build
    echo ""
    echo -e "${GREEN}[OK] ¡Servicios de Docker levantados con éxito!${NC}"
    echo -e "Puedes verificar el estado ejecutando: ${BLUE}$DOCKER_COMPOSE_CMD ps${NC}"
    echo -e "Y ver los logs con: ${BLUE}$DOCKER_COMPOSE_CMD logs -f${NC}"
else
    echo -e "${YELLOW}[*] Proceso terminado. Puedes iniciar la app en cualquier momento ejecutando:${NC}"
    echo -e "    ${BLUE}$DOCKER_COMPOSE_CMD up -d --build${NC}"
fi

echo ""
echo -e "${GREEN}===================================================================${NC}"
echo -e "                 ¡Configuración completada con éxito!              "
echo -e "===================================================================${NC}"
