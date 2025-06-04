#!/usr/bin/env bash
set -e

echo "Servicio Pig iniciando..."

echo ""
echo "Configurando Hadoop (core-site.xml)..."
mkdir -p /etc/hadoop
cat <<EOF > /etc/hadoop/core-site.xml
<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="configuration.xsl"?>
<configuration>
  <property>
    <name>fs.defaultFS</name>
    <value>hdfs://hadoop-namenode:9000</value>
  </property>
  <property>
    <name>hadoop.security.dns.interface</name>
    <value>eth0</value>
  </property>
  <property>
    <name>hadoop.security.dns.nameserver</name>
    <value>127.0.0.11</value>
  </property>
</configuration>
EOF
echo "/etc/hadoop/core-site.xml creado:"
cat /etc/hadoop/core-site.xml

echo ""
echo "Pinging namenode desde el script del entrypoint..."
ping -c 3 hadoop-namenode

echo ""
echo "Esperando 30 segundos adicionales para que NameNode RPC se estabilice completamente..."
sleep 30

echo ""
echo "Intentando crear/verificar directorio /input en HDFS..."
# Creamos /input con permisos 777 para que el ETL pueda escribir ahí
hdfs dfs -mkdir -p /input
hdfs dfs -chmod 777 /input
echo "Directorio /input verificado/creado."

echo ""
echo "Esperando a que HDFS salga del modo seguro y acepte conexiones..."
loop_count=0
while true; do
  loop_count=$((loop_count + 1))
  echo "Loop iteration: $loop_count"

  hdfs dfsadmin -safemode get > /tmp/safemode.out 2>&1
  exit_code=$?
  safemode_cmd_output=$(cat /tmp/safemode.out)

  echo "Exit code of 'hdfs dfsadmin -safemode get': $exit_code"
  echo "Output of 'hdfs dfsadmin -safemode get': [$safemode_cmd_output]"

  if [ $exit_code -eq 0 ] && echo "$safemode_cmd_output" | grep -q "Safe mode is OFF"; then
    echo "HDFS ha salido del modo seguro."
    break
  fi

  if [ $exit_code -ne 0 ]; then
    echo "Error al invocar safemode get (exit $exit_code). Esperando 5s..."
  else
    echo "HDFS sigue en SafeMode. Esperando 5s..."
  fi

  if [ $loop_count -gt 30 ]; then
    echo "ERROR: Timeout esperando a que HDFS salga del modo seguro. Saliendo con código 1."
    exit 1
  fi

  sleep 5
done

echo ""
echo "Verificando si existen archivos en /input para procesar..."
# Si no hay ningún jams_*.csv, salimos sin error de Pig
if ! hdfs dfs -ls /input/jams_*.csv 2>/dev/null; then
  echo "No hay archivos en /input que coincidan con 'jams_*.csv'. Terminando sin ejecutar Pig."
  exit 0
fi

echo ""
echo "Eliminando directorios de salida anteriores de Pig si existen..."
hdfs dfs -rm -r -f /output/incidentes_por_comuna         || true
hdfs dfs -rm -r -f /output/incidentes_por_comuna_y_tipo   || true

echo ""
echo "Ejecutando script de Pig: /procesamiento_incidentes.pig"
export HADOOP_USER_NAME=root
export HADOOP_CONF_DIR=/etc/hadoop

pig \
  -Dfs.defaultFS=hdfs://hadoop-namenode:9000 \
  -Dhadoop.job.ugi=root \
  -x mapreduce \
  /procesamiento_incidentes.pig

echo ""
echo "Script de Pig finalizado."

echo ""
echo "Copiando resultados de HDFS a /mnt/pig_local_output_for_host/ (mapeado a ./hdfs-output en el host)..."
mkdir -p /mnt/pig_local_output_for_host

if hdfs dfs -test -d /output/incidentes_por_comuna; then
  echo "Copiando /output/incidentes_por_comuna..."
  rm -rf /mnt/pig_local_output_for_host/incidentes_por_comuna
  hdfs dfs -get /output/incidentes_por_comuna /mnt/pig_local_output_for_host/
else
  echo "Advertencia: El directorio HDFS /output/incidentes_por_comuna no existe. No se copiará."
fi

if hdfs dfs -test -d /output/incidentes_por_comuna_y_tipo; then
  echo "Copiando /output/incidentes_por_comuna_y_tipo..."
  rm -rf /mnt/pig_local_output_for_host/incidentes_por_comuna_y_tipo
  hdfs dfs -get /output/incidentes_por_comuna_y_tipo /mnt/pig_local_output_for_host/
else
  echo "Advertencia: El directorio HDFS /output/incidentes_por_comuna_y_tipo no existe. No se copiará."
fi

echo ""
echo "Contenido en el host (./hdfs-output):"
ls -lR /mnt/pig_local_output_for_host

echo ""
echo "Limpiando archivos en /input para la próxima corrida..."
hdfs dfs -rm -r -f /input/* || true

echo ""
echo "Proceso del contenedor Pig completado."
