#!/bin/bash

# Script para configuração inicial do SSL com Let's Encrypt
# Uso: sudo ./init-letsencrypt.sh

set -e

DOMAIN="terraquest.com.br"
EMAIL="admin@terraquest.com.br"  # Altere para seu email
STAGING=0  # Mude para 1 para testar sem limite de rate

echo "=== Iniciando configuração SSL para $DOMAIN ==="

# Criar diretórios
mkdir -p ./certbot/conf
mkdir -p ./certbot/www

# Baixar parâmetros TLS recomendados
if [ ! -e "./certbot/conf/options-ssl-nginx.conf" ]; then
  echo "Baixando parâmetros TLS recomendados..."
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "./certbot/conf/options-ssl-nginx.conf"
fi

if [ ! -e "./certbot/conf/ssl-dhparams.pem" ]; then
  echo "Baixando ssl-dhparams.pem..."
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "./certbot/conf/ssl-dhparams.pem"
fi

# Criar certificado dummy para nginx iniciar
echo "Criando certificado temporário..."
CERT_PATH="./certbot/conf/live/$DOMAIN"
mkdir -p "$CERT_PATH"
openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
  -keyout "$CERT_PATH/privkey.pem" \
  -out "$CERT_PATH/fullchain.pem" \
  -subj "/CN=localhost" 2>/dev/null

echo "Subindo nginx com certificado temporário..."
docker compose up -d app

echo "Aguardando nginx iniciar..."
sleep 5

echo "Removendo certificado temporário..."
rm -rf "$CERT_PATH"

# Solicitar certificado real
echo "Solicitando certificado Let's Encrypt..."
STAGING_ARG=""
if [ $STAGING -eq 1 ]; then
  STAGING_ARG="--staging"
fi

docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN" \
  -d "www.$DOMAIN" \
  $STAGING_ARG

echo "Reiniciando nginx com certificado real..."
docker compose restart app

echo ""
echo "=== SSL configurado com sucesso! ==="
echo "Agora inicie todos os serviços com: docker compose up -d"
