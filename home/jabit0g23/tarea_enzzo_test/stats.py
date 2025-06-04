#!/usr/bin/env python3

import os
import pymongo
import redis

def main_menu():
    print("======================================")
    print("  Menú de Estadísticas de la Aplicación")
    print("======================================")
    print("1. Ver cantidad de documentos en MongoDB")
    print("2. Ver estadísticas de cache (Redis INFO)")
    print("3. Salir")
    print("======================================")

def get_mongo_counts():
    mongo_host = os.getenv('MONGO_HOST', 'localhost')
    mongo_port = os.getenv('MONGO_PORT', '27017')
    db_name = os.getenv('MONGO_DB', 'waze_traffic')
    client = pymongo.MongoClient(f"mongodb://{mongo_host}:{mongo_port}")
    db = client[db_name]
    jams_count = db.jams.count_documents({})
    alerts_count = db.alerts.count_documents({})
    client.close()
    return jams_count, alerts_count

def get_redis_info():
    redis_host = os.getenv('REDIS_HOST', 'localhost')
    redis_port = os.getenv('REDIS_PORT', '6379')
    r = redis.Redis(host=redis_host, port=int(redis_port))
    try:
        info = r.info()
    except redis.exceptions.ConnectionError as e:
        print(f"No se pudo conectar a Redis: {e}")
        return None
    return info

def main():
    while True:
        main_menu()
        choice = input("Selecciona una opción: ").strip()
        if choice == '1':
            try:
                jams, alerts = get_mongo_counts()
                print(f"\nDocumentos en MongoDB:")
                print(f"  - jams:   {jams}")
                print(f"  - alerts: {alerts}\n")
            except Exception as e:
                print(f"Error al consultar MongoDB: {e}\n")

        elif choice == '2':
            info = get_redis_info()
            if info:
                hits = info.get('keyspace_hits', 0)
                misses = info.get('keyspace_misses', 0)
                used_memory = info.get('used_memory_human', 'N/A')
                total_keys = 0
                for k, v in info.items():
                    if str(k).startswith('db'):
                        total_keys += v.get('keys', 0)

                print("\nEstadísticas de Redis:")
                print(f"  - Keyspace Hits:   {hits}")
                print(f"  - Keyspace Misses: {misses}")
                print(f"  - Memoria usada:   {used_memory}")
                print(f"  - Total de keys en todas las DB: {total_keys}\n")
            else:
                print("No se encontró información de Redis.\n")

        elif choice == '3':
            print("Saliendo…")
            break
        else:
            print("Opción inválida. Intenta de nuevo.\n")

if __name__ == "__main__":
    main()
