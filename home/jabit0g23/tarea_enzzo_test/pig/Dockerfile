# ~/tarea_enzzo_test/pig/Dockerfile

FROM bde2020/hadoop-namenode:2.0.0-hadoop3.2.1-java8

ENV PIG_VERSION=0.17.0
ENV PIG_HOME=/opt/pig-${PIG_VERSION}
ENV PATH=$PATH:${PIG_HOME}/bin

USER root

# 1) Usar repositorios de archive.debian.org (para Stretch)
RUN sed -i 's|deb.debian.org|archive.debian.org|g' /etc/apt/sources.list && \
    sed -i '/security.debian.org/d' /etc/apt/sources.list && \
    sed -i '/stretch-updates/d' /etc/apt/sources.list && \
    echo 'Acquire::Check-Valid-Until false;' > /etc/apt/apt.conf.d/99no-check-valid-until

# 2) Instalar herramientas necesarias y descargar Pig 0.17.0
RUN apt-get update && \
    apt-get install -y wget ca-certificates && \
    wget https://archive.apache.org/dist/pig/pig-${PIG_VERSION}/pig-${PIG_VERSION}.tar.gz && \
    tar -xzf pig-${PIG_VERSION}.tar.gz -C /opt && \
    rm pig-${PIG_VERSION}.tar.gz && \
    chown -R root:root /opt/pig-${PIG_VERSION} && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 3) Copiar el entrypoint propio y darle permiso de ejecución
COPY pig-entrypoint.sh /pig-entrypoint.sh
RUN chmod +x /pig-entrypoint.sh

# 4) USER root ya está, y el entrypoint se invoca desde docker-compose.yml
