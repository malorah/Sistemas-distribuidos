#!/bin/bash

echo "▶ Activando entorno virtual..."
source distri/bin/activate

sudo docker network create hadoop-net
sudo docker network create storage-net
sudo docker network create cache-net
echo "▶ Levantando servicios base: MongoDB, Redis, Storage-API..."
sudo docker-compose -f docker-compose.yml -f docker-compose-hadoop.yml up -d --build mongodb cache storage-api

echo "▶ Esperando 10 segundos para estabilizar servicios base..."
sleep 10

echo "▶ Iniciando el scraper..."
sudo docker-compose -f docker-compose.yml -f docker-compose-hadoop.yml up -d --build scraper

echo "▶ Iniciando el generador de tráfico sintético..."
sudo docker-compose -f docker-compose.yml -f docker-compose-hadoop.yml up -d --build traffic-generator

echo "▶ Levantando ecosistema Hadoop (namenode, datanode, yarn)..."
sudo docker-compose -f docker-compose.yml -f docker-compose-hadoop.yml up -d --build namenode datanode resourcemanager nodemanager

echo "▶ Esperando 30 segundos para estabilizar Hadoop..."
sleep 30

echo "▶ Iniciando proceso ETL..."
sudo docker-compose -f docker-compose.yml -f docker-compose-hadoop.yml up -d --build etl

echo "▶ Iniciando contenedor Pig para análisis..."
sudo docker-compose -f docker-compose.yml -f docker-compose-hadoop.yml up -d --build pig

echo "▶ Reiniciando Pig para asegurar procesamiento tras ETL..."
sudo docker-compose -f docker-compose.yml -f docker-compose-hadoop.yml restart pig

echo "▶ Listando resultados de Pig en ./hdfs-output:"
ls -lR ./hdfs-output

echo "▶ Ejecutando script de estadísticas (MongoDB y Redis)..."
python3 stats.py

echo "✅ Proceso completo."
