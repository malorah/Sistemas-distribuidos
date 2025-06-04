# ~/tarea_enzzo_test/etl/Dockerfile
FROM python:3.10-slim

# 1) Instalamos JRE y CRON
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      default-jre-headless \
      cron \
    && rm -rf /var/lib/apt/lists/*

# 2) Definimos JAVA_HOME y LD_LIBRARY_PATH (para Hadoop/HDFS)
ENV JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64 
ENV LD_LIBRARY_PATH="${JAVA_HOME}/lib/server"

WORKDIR /app

# 3) Copiamos requirements y los instalamos
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# 4) Copiamos scripts ETL
COPY mongo_to_hdfs.py ./
COPY run_etl_periodico.sh ./
RUN chmod +x /app/run_etl_periodico.sh   # Aquí nos aseguramos de que el script sea ejecutable

# No necesitamos CMD porque el entrypoint se define en docker-compose.yml
