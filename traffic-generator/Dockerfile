# /tarea_enzzo/traffic-generator/Dockerfile
FROM node:18-slim

WORKDIR /app

# Copiamos solo package.json y luego instalamos
COPY package.json ./
RUN npm install --only=production

COPY . .

CMD ["node", "runGenerator.js"]
