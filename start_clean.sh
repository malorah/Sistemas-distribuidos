#!/bin/bash

echo "🧠 Aumentando límite de descriptores de archivos..."
ulimit -n 65535

echo "💾 Verificando si ya existe swap activado..."
if ! swapon --noheadings | grep -q '/swapfile'; then
  echo "➕ Creando archivo swap de 2 GB..."
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo "✅ Swap activado temporalmente:"
  swapon --show
else
  echo "✅ Ya existe swap activo:"
  swapon --show
fi

echo "🔌 Creando redes Docker necesarias (si no existen)..."
docker network create hadoop-net 2>/dev/null || echo "ℹ️ hadoop-net ya existe"
docker network create cache-net 2>/dev/null || echo "ℹ️ cache-net ya existe"
docker network create storage-net 2>/dev/null || echo "ℹ️ storage-net ya existe"

echo "🧹 Deteniendo y limpiando contenedores y volúmenes..."
sudo docker-compose -f docker-compose.yml -f docker-compose-hadoop.yml down -v

echo "🗑️ Borrando carpetas persistentes si existen..."
rm -rf mongo-data hdfs-output
mkdir -p hdfs-output

echo "🚀 Iniciando todos los servicios desde cero..."
sudo docker-compose -f docker-compose.yml -f docker-compose-hadoop.yml up -d --build

echo "✅ Todo listo. Verifica los servicios con:"
echo "   docker ps"
