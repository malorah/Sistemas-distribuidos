// /storage/init-scripts/init.js
/**
 * Este script se usa para ejecutar una sola vez:
 *  - conecta a Mongo
 *  - crea colecciones “jams” y “alerts” (si no existen)
 *  - crea índices básicos
 */
require('dotenv').config();
const { MongoClient } = require('mongodb');

async function run() {
  const mongoHost = process.env.MONGO_HOST || 'localhost';
  const mongoPort = process.env.MONGO_PORT || '27017';
  const mongoDbName = process.env.MONGO_DB || 'waze_traffic';
  const uri = `mongodb://${mongoHost}:${mongoPort}`;

  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  try {
    await client.connect();
    const db = client.db(mongoDbName);
    const existing = await db.listCollections().toArray();
    const names = existing.map(c => c.name);

    if (!names.includes('jams')) {
      await db.createCollection('jams');
      console.log('Colección "jams" creada.');
    }
    if (!names.includes('alerts')) {
      await db.createCollection('alerts');
      console.log('Colección "alerts" creada.');
    }

    // Creamos índices si no existen
    await db.collection('jams').createIndex({ idJam: 1 }, { unique: true });
    await db.collection('jams').createIndex({ commune: 1 });
    await db.collection('alerts').createIndex({ idAlert: 1 }, { unique: true });
    console.log('Índices creados en "jams" y "alerts".');

  } catch (err) {
    console.error('Error en init-scripts:', err);
  } finally {
    await client.close();
    process.exit(0);
  }
}

run();
