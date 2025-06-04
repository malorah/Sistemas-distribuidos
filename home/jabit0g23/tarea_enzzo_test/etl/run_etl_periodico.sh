#!/usr/bin/env bash
set -e

# 1) Limpiar /input de HDFS (por si hubiera CSV residuales)
hdfs dfs -rm -r -f /input/* 2>/dev/null || true

# 2) Ejecutar ETL completo: extraer nuevos datos y subir CSV
python3 /app/mongo_to_hdfs.py

# 3) (Opcional) Registrar la hora de esta corrida
echo "ETL ejecutado a $(date -u '+%Y-%m-%dT%H:%M:%SZ')" >> /app/last_export_data/etl-cron.log
