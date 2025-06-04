#!/usr/bin/env python3
"""
Script ETL: extrae documentos de la colección `jams` en MongoDB
y los vuelca a HDFS (creando un CSV en /input/).

Ahora con **export incremental**: sólo exporta los docs cuyo campo 'timestamp'
sea mayor al último export guardado en /app/last_export_data/last_export.txt.
"""

import os
import csv
import requests
from datetime import datetime
from pymongo import MongoClient

# --------------------
# Leer variables de entorno
# --------------------
mongo_host = os.getenv('MONGO_HOST', 'localhost')
mongo_port = int(os.getenv('MONGO_PORT', '27017'))
mongo_db   = os.getenv('MONGO_DB', 'waze_traffic')

# Usar WebHDFS sobre HTTP en lugar de hdfs://
hdfs_url = os.getenv('HDFS_URL', 'webhdfs://namenode:9870')

# Archivo donde guardamos el timestamp ISO de la última exportación
LAST_EXPORT_FILE = '/app/last_export_data/last_export.txt'

def read_last_export_time():
    """
    Si existe el archivo LAST_EXPORT_FILE, leer la última fecha exportada.
    En caso contrario, devolver None (export completo la primera vez).
    """
    if not os.path.exists(LAST_EXPORT_FILE):
        return None
    with open(LAST_EXPORT_FILE, 'r') as f:
        ts = f.read().strip()
        try:
            return datetime.fromisoformat(ts)
        except ValueError:
            return None

def write_last_export_time(ts: datetime):
    """
    Guarda la fecha ISO en LAST_EXPORT_FILE.
    """
    # Asegurarnos de que la carpeta existe
    parent = os.path.dirname(LAST_EXPORT_FILE)
    os.makedirs(parent, exist_ok=True)
    with open(LAST_EXPORT_FILE, 'w') as f:
        f.write(ts.isoformat())

def export_to_hdfs():
    # 1) Conectar a MongoDB
    client = MongoClient(f"mongodb://{mongo_host}:{mongo_port}")
    db = client[mongo_db]
    collection = db.jams

    # 2) Determinar el punto de corte para export incremental
    last_export = read_last_export_time()
    if last_export:
        filter_query = {"timestamp": {"$gt": last_export.isoformat()}}
        print(f"[ETL] Export incremental. Último export: {last_export.isoformat()}")
    else:
        filter_query = {}
        print("[ETL] Export total (primera vez / no se encontró last_export.txt).")

    # 3) Crear CSV localmente si hay datos nuevos
    cursor = collection.find(filter_query).sort("timestamp", 1)
    rows = list(cursor)
    if not rows:
        print("[ETL] No hay registros nuevos para exportar. Saltando.")
        client.close()
        return

    # 4) Preparar carpeta /input en HDFS
    try:
        base_http = hdfs_url.replace("webhdfs://", "http://").rstrip("/")
        mkdir_url = (
            f"{base_http}/webhdfs/v1/input"
            f"?op=MKDIRS"
            f"&permission=777"
            f"&user.name=root"
        )
        r = requests.put(mkdir_url)
        if r.status_code not in (200, 201):
            print(f"[ETL] Advertencia: no se pudo crear /input (HTTP {r.status_code}): {r.text}")
        else:
            print("[ETL] Directorio /input verificado/creado en HDFS (permiso 777).")
    except Exception as e:
        print(f"[ETL] Error al invocar WebHDFS MKDIRS: {e}")

    # 5) Crear CSV local con sólo los registros nuevos
    timestamp_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    local_csv = f"/app/jams_{timestamp_str}.csv"
    with open(local_csv, mode='w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([
            "_id", "idJam", "country", "commune",
            "streetName", "streetEnd", "speedKmh",
            "length", "timestamp", "city"
        ])
        for doc in rows:
            writer.writerow([
                str(doc.get("_id", "")),
                doc.get("idJam", ""),
                doc.get("country", ""),
                doc.get("commune", ""),
                doc.get("streetName", ""),
                doc.get("streetEnd", ""),
                doc.get("speedKmh", ""),
                doc.get("length", ""),
                doc.get("timestamp", ""),
                doc.get("city", "")
            ])
    print(f"[ETL] CSV incremental generado: {local_csv} ({len(rows)} registros)")

    # 6) Subir el CSV a HDFS vía WebHDFS (HTTP PUT + redirect automático)
    try:
        base_http = hdfs_url.replace("webhdfs://", "http://").rstrip("/")
        dest_path = f"/input/jams_{timestamp_str}.csv"
        create_url = (
            f"{base_http}/webhdfs/v1{dest_path}"
            f"?op=CREATE"
            f"&overwrite=true"
            f"&user.name=root"
        )
        with open(local_csv, "rb") as local_f:
            r2 = requests.put(create_url, data=local_f, allow_redirects=True)
        if r2.status_code in (200, 201):
            print(f"[ETL] Archivo subido a HDFS: {dest_path}")
        else:
            print(f"[ETL] Error subiendo a HDFS (HTTP {r2.status_code}): {r2.text}")
    except Exception as e:
        print(f"[ETL] Error al invocar WebHDFS CREATE: {e}")
    finally:
        # 7) Actualizar el último timestamp exportado (el más reciente de esta corrida)
        max_ts_str = rows[-1].get("timestamp")
        try:
            max_ts = datetime.fromisoformat(max_ts_str)
            write_last_export_time(max_ts)
            print(f"[ETL] last_export actualizado a {max_ts.isoformat()}")
        except Exception:
            print("[ETL] No se pudo actualizar last_export.txt (formato inválido).")
        client.close()

if __name__ == "__main__":
    export_to_hdfs()
