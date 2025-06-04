Este repositorio corresponde a la segunda entrega de la tarea de sistemas distribuidos.

Dentro de los archivos del repositorio se incluyen varios archivos ejecutables en bash.

El archivo primera_vez.sh (o primera_vesh como me gusta llamarlo) elimina los datos antiguos de mongodb, crea un ambiente virutal de python, lo activa e instala pymongo y redis. Luego crea los contenedores necesarios para el scraper, el almacenamiento y el generador de trafico. Esto era parte de la tarea 1

El archivo funcionamiento_normal.sh (funcionamiento normalsh) levanta los servicios necesarios para el funcionamiento del proyecto pero personalmente sugiero utilizar tarea2.sh (tarea dosh) el cual comprime los comandos de funcionamiento_normal.sh a 4 simples comandos especificos para la segunda.

Finalmente se encuentra start_clean.sh el cual fue producto de la desesperacion que surgio cuando los contenedores morian con un error indicando que no habia memoria suficiente. Este archivo bash aumenta el tamaño limite de los descriptores de archivos, aumenta el tamaño del swap temporal y, detiene y borra los volumenes creados, borra las carpetas de datos de mongo, crea las redes necesarias si no existen y luego inicia los servicios. Como su nombre indica, un comienzo limpio. Solo usarlo en caso de tormento extremo.

Ademas en el archivo funcionamiento.txt se incluye una explicacion paso a paso de los comandos.