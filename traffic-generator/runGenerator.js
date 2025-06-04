// /traffic-generator/runGenerator.js
/**
 * runGenerator.js
 *
 * Ejemplo de uso:
 *   node runGenerator.js poisson
 *   node runGenerator.js bursty
 *
 * Configurar STORAGE_API_URL en .env si es necesario (p.ej. http://localhost:4000)
 */
const axios = require('axios');
const { startGenerator } = require('./trafficGenerator');

async function handleQuery(eventId) {
  const ts = new Date().toISOString();
  try {
    // Aquí hacemos la petición a Storage-API (que ya chequea cache internamente).
    const resp = await axios.get(`${process.env.STORAGE_API_URL || 'http://storage-api:4000'}/jams/${eventId}`);
    console.log(`[${ts}] → Consulta JAM ${eventId} → status ${resp.status}`);
  } catch (err) {
    console.error(`[${ts}] Error consultando jam ${eventId}:`, err.message);
  }
}

(async () => {
  const mode = process.argv[2] || 'poisson';
  let controller;

  if (mode.toLowerCase() === 'poisson') {
    const options = { distribution: 'poisson', rate: 2 };
    controller = await startGenerator(options, handleQuery, null);
  } else if (mode.toLowerCase() === 'bursty') {
    const options = {
      distribution: 'bursty',
      lambdaHigh: 10,
      lambdaLow: 1,
      burstDuration: 10000,
      quietDuration: 15000
    };
    controller = await startGenerator(options, handleQuery, null);
  } else {
    console.error('Modo inválido. Usa: node runGenerator.js [poisson|bursty]');
    process.exit(1);
  }

  // Detener automáticamente después de 1 minuto (por ejemplo)
  setTimeout(() => {
    if (controller && controller.stop) {
      controller.stop();
      process.exit(0);
    }
  }, 60 * 1000);
})();
