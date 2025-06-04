-- procesamiento_incidentes.pig (Versión con renombrado agresivo y AS explícitos)

-- 1) Cargar los datos CSV
jams_raw = LOAD '/input/jams_*.csv' USING PigStorage(',')
    AS (
        docId:chararray,
        idJam:chararray,
        country:chararray,
        commune:chararray,
        streetName:chararray,
        streetEnd:chararray,
        speedKmh:double,
        length:int,
        timestamp_str:chararray, -- Renombrado de 'timestamp' a 'timestamp_str' para evitar confusión con el campo procesado
        city:chararray
    );

-- 2) Filtrar la fila de cabecera (si existe)
jams_filtered = FILTER jams_raw BY docId != '_id';

-- 3) Limpiar el campo de timestamp (quitar la 'Z' final)
jams_clean_ts_str = FOREACH jams_filtered GENERATE
    docId AS docId,
    idJam AS idJam,
    country AS country,
    commune AS commune,
    streetName AS streetName,
    streetEnd AS streetEnd,
    speedKmh AS speedKmh,
    length AS length,
    REPLACE(timestamp_str, 'Z$', '') AS ts_noz_str, -- Usar timestamp_str
    city AS city;

-- FILTRAR timestamps con longitud correcta para evitar error en ToDate
jams_clean_ts_str_valid = FILTER jams_clean_ts_str BY SIZE(ts_noz_str) == 19;

-- 4) Convertir el string de timestamp a un objeto datetime, usando un nombre de campo único
jams_with_event_time = FOREACH jams_clean_ts_str_valid GENERATE
    docId AS docId,
    idJam AS idJam,
    country AS country,
    commune AS commune,
    streetName AS streetName,
    streetEnd AS streetEnd,
    speedKmh AS speedKmh,
    length AS length,
    ToDate(ts_noz_str, 'yyyy-MM-dd\'T\'HH:mm:ss') AS event_timestamp, -- Nombre de campo cambiado
    city AS city;

-- 5) Filtrar registros donde la conversión de fecha NO haya resultado en null
jams_valid_event_time = FILTER jams_with_event_time BY event_timestamp IS NOT NULL;

-- 6) Estandarizar nombres de campos de texto a minúsculas
jams_standardized = FOREACH jams_valid_event_time GENERATE
    LOWER(country)    AS country,
    LOWER(commune)    AS commune,
    LOWER(streetName) AS streetName,
    LOWER(streetEnd)  AS streetEnd,
    speedKmh          AS speedKmh,
    length            AS length,
    event_timestamp   AS event_timestamp, -- Usando el nuevo nombre de campo
    LOWER(city)       AS city;

-- 7) Clasificar el tipo de incidente según la velocidad
jams_classified = FOREACH jams_standardized GENERATE
    country           AS country,
    commune           AS commune,
    city              AS city,
    (speedKmh > 20.0 ? 'speeding' : 'normal') AS speedType,
    event_timestamp   AS event_timestamp; -- Usando el nuevo nombre de campo

-- 8) Conteo de incidentes agrupados por comuna
incidentes_por_comuna_grouped = GROUP jams_classified BY commune;
conteo_incidentes_por_comuna = FOREACH incidentes_por_comuna_grouped GENERATE
    group              AS comuna,
    COUNT(jams_classified) AS totalIncidentes;

STORE conteo_incidentes_por_comuna INTO '/output/incidentes_por_comuna' USING PigStorage(',');

-- 9) Conteo de incidentes agrupados por (comuna, tipo de velocidad)
incidentes_por_comuna_tipo_grouped = GROUP jams_classified BY (commune, speedType);
conteo_incidentes_por_comuna_tipo = FOREACH incidentes_por_comuna_tipo_grouped GENERATE
    FLATTEN(group)     AS (comuna, speedType),
    COUNT(jams_classified) AS totalIncidentes;

STORE conteo_incidentes_por_comuna_tipo INTO '/output/incidentes_por_comuna_y_tipo' USING PigStorage(',');
