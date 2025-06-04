# /tarea_enzzo/scraper/Dockerfile

FROM node:18-slim

# 1) Instalamos dependencias de sistema para Puppeteer
RUN apt-get update && \
    apt-get install -y wget gnupg ca-certificates \
       fonts-liberation libnss3 libx11-xcb1 libxcomposite1 libxcursor1 \
       libxdamage1 libxrandr2 libxss1 libxkbcommon0 libgbm1 libgtk-3-0 \
       libasound2 libatk-bridge2.0-0 libatspi2.0-0 libdrm2 libepoxy0 libgbm-dev \
       libwayland-client0 libwayland-egl1 libwoff1 libxshmfence1 xdg-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/scraper

# 2) Copiamos package.json e instalamos dependencias de scraper (incluye mongodb, puppeteer, csv-parser, dotenv)
COPY scraper/package.json ./package.json
RUN npm install --only=production

# 3) Copiamos el código completo del scraper
COPY scraper/. ./

# 4) Copiamos dossier de servicios (mongoService.js, trafficProcessor.js)
#    El contexto de build es la raíz del proyecto, así que podemos acceder a scraper/services/.
COPY scraper/services ./services

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# 5) Comando por defecto al levantar este contenedor
CMD ["node", "scraper.js"]
