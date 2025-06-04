// /tarea_enzzo/cache/cacheManager.js
require('dotenv').config();
const redis = require('redis');

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || 6379;

let client;

async function connectCache() {
  client = redis.createClient({ url: `redis://${REDIS_HOST}:${REDIS_PORT}` });
  client.on('error', err => console.error('Redis Error:', err));
  await client.connect();
  console.log(`Conectado a Redis en ${REDIS_HOST}:${REDIS_PORT}`);
}

async function get(key) {
  if (!client) throw new Error('Cache no inicializado');
  const val = await client.get(key);
  return val ? JSON.parse(val) : null;
}

async function set(key, value, ttlSeconds = 300) {
  if (!client) throw new Error('Cache no inicializado');
  await client.set(key, JSON.stringify(value), { EX: ttlSeconds });
}

async function del(key) {
  if (!client) throw new Error('Cache no inicializado');
  await client.del(key);
}

async function quit() {
  if (client) await client.disconnect();
}

module.exports = {
  connectCache,
  get,
  set,
  del,
  quit
};
