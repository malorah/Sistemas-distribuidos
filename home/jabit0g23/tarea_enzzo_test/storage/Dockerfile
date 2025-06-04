# /tarea_enzzo/storage/Dockerfile
FROM node:18-slim

WORKDIR /app

# Copiamos solo package.json y luego instalamos
COPY package.json ./
RUN npm install --only=production

# Copiamos el resto del código (storage-api.js e init-scripts/)
COPY . .

# Exponemos el puerto que utiliza Storage-API
EXPOSE 4000

# Comando por defecto al arrancar el contenedor
CMD ["node", "storage-api.js"]
