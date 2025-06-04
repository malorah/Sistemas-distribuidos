// /traffic-generator/trafficGenerator.js
/**
 * trafficGenerator.js
 *
 *  - Se conecta a Storage-API vía HTTP para obtener la lista de IDs de 'jams'.
 *  - Expone dos distribuciones: 'poisson' y 'bursty'.
 *  - Cada vez que “llega” una consulta, hace GET /jams/:id a Storage-API.
 */
const axios = require('axios');

const STORAGE_API_URL = process.env.STORAGE_API_URL || 'http://storage-api:4000';

let eventIds = [];
let running = false;
let timerHandle = null;

function uniform01() {
  return Math.random();
}

function sampleExpMillis(rate) {
  if (rate <= 0) return Infinity;
  const u = uniform01();
  const interSec = -Math.log(1 - u) / rate;
  return interSec * 1000;
}

async function loadAllEventIds() {
  try {
    const resp = await axios.get(`${STORAGE_API_URL}/jams/ids`);
    eventIds = resp.data.ids || [];
    console.log(`[Generator] Cargados ${eventIds.length} IDs desde Storage-API.`);
  } catch (err) {
    console.error('Error obteniendo IDs de Storage-API:', err.message);
    eventIds = [];
  }
}

function pickRandomEventId() {
  if (!eventIds.length) return null;
  const idx = Math.floor(Math.random() * eventIds.length);
  return eventIds[idx];
}

function startPoisson(rate, handleQuery, maxQueries = null) {
  let emitted = 0;

  async function scheduleNext() {
    if (!running) return;
    if (maxQueries !== null && emitted >= maxQueries) {
      console.log(`[Generator·Poisson] Emitidas ${emitted} consultas → deteniendo.`);
      return;
    }
    const delay = sampleExpMillis(rate);
    timerHandle = setTimeout(async () => {
      if (!running) return;
      const eventId = pickRandomEventId();
      if (eventId) await handleQuery(eventId);
      emitted++;
      scheduleNext();
    }, delay);
  }

  console.log(`[Generator·Poisson] Iniciando con λ = ${rate} c/s.`);
  scheduleNext();
}

function startBursty(lambdaHigh, lambdaLow, burstDuration, quietDuration, handleQuery, maxQueries = null) {
  let emitted = 0;
  let isBurst = false;
  let phaseTimer = null;
  let interTimer = null;

  function generarEnFase(lambdaFase) {
    if (!running) return;
    if (maxQueries !== null && emitted >= maxQueries) {
      console.log(`[Generator·Bursty] Emitidas ${emitted} consultas → deteniendo.`);
      return;
    }
    const delay = sampleExpMillis(lambdaFase);
    interTimer = setTimeout(async () => {
      if (!running) return;
      const eventId = pickRandomEventId();
      if (eventId) await handleQuery(eventId);
      emitted++;
      generarEnFase(lambdaFase);
    }, delay);
  }

  function switchPhase() {
    if (!running) return;
    isBurst = !isBurst;
    // Cancelamos el interTimer actual para reiniciar con nueva tasa
    if (interTimer) {
      clearTimeout(interTimer);
      interTimer = null;
    }

    const lambdaNow = isBurst ? lambdaHigh : lambdaLow;
    const durNow = isBurst ? burstDuration : quietDuration;
    console.log(`[Generator·Bursty] Entrando en ${isBurst ? 'BURST' : 'QUIET'} (λ = ${lambdaNow} c/s, duración = ${durNow} ms)`);
    generarEnFase(lambdaNow);
    phaseTimer = setTimeout(switchPhase, durNow);
  }

  // Inicial: quiet
  isBurst = false;
  switchPhase();
}

async function startGenerator(options, handleQuery, maxQueries = null) {
  if (running) {
    console.warn('[Generator] Ya está corriendo. Detener primero con stop().');
    return;
  }
  running = true;

  // 1) Cargamos IDs desde Storage-API
  await loadAllEventIds();

  const dist = (options.distribution || '').toLowerCase();
  switch (dist) {
    case 'poisson':
      if (typeof options.rate !== 'number') {
        throw new Error('[Generator] Poisson necesita “rate” (c/s).');
      }
      startPoisson(options.rate, handleQuery, maxQueries);
      break;
    case 'bursty':
      const { lambdaHigh, lambdaLow, burstDuration, quietDuration } = options;
      if (
        typeof lambdaHigh !== 'number' ||
        typeof lambdaLow !== 'number' ||
        typeof burstDuration !== 'number' ||
        typeof quietDuration !== 'number'
      ) {
        throw new Error('[Generator] Bursty necesita: lambdaHigh, lambdaLow, burstDuration(ms), quietDuration(ms).');
      }
      startBursty(lambdaHigh, lambdaLow, burstDuration, quietDuration, handleQuery, maxQueries);
      break;
    default:
      throw new Error('[Generator] Opción inválida en distribution → “poisson” o “bursty”.');
  }

  return {
    stop: () => {
      console.log('[Generator] Deteniendo...');
      running = false;
      if (timerHandle) clearTimeout(timerHandle);
      // No hay pool de BD que cerrar, pero podrías limpiar algo si hace falta.
    }
  };
}

module.exports = { startGenerator };
