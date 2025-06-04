// /tarea_enzzo/services/mongoService.js
const { MongoClient } = require('mongodb');

const mongoHost = process.env.MONGO_HOST || 'localhost';
const mongoPort = process.env.MONGO_PORT || '27017';
const mongoDbName = process.env.MONGO_DB || 'waze_traffic';

const uri = `mongodb://${mongoHost}:${mongoPort}`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
});

let db;

async function connect() {
  try {
    await client.connect();
    db = client.db(mongoDbName);
    console.log(`Conectado a MongoDB: ${mongoDbName}`);

    // Crear colecciones si no existen
    const existing = await db.listCollections().toArray();
    const names = existing.map(c => c.name);

    if (!names.includes('jams')) {
      await db.createCollection('jams');
      console.log('Colección “jams” creada');
      await db.collection('jams').createIndex({ idJam: 1 }, { unique: true });
      await db.collection('jams').createIndex({ commune: 1 });
    }

    if (!names.includes('alerts')) {
      await db.createCollection('alerts');
      console.log('Colección “alerts” creada');
      await db.collection('alerts').createIndex({ idAlert: 1 }, { unique: true });
    }
  } catch (err) {
    console.error('Error conectando a MongoDB:', err);
    process.exit(1);
  }
}

async function insertJam(jam) {
  try {
    await db.collection('jams').insertOne(jam, { writeConcern: { w: 1 } });
  } catch (err) {
    // Si es E11000 (duplicado), lo ignoramos
    if (err.code === 11000) {
      // console.log(`Jam duplicado ignorado: ${jam.idJam}`);
      return;
    }
    console.error('Error insertando jam en MongoDB:', err);
  }
}

async function insertAlert(alert) {
  try {
    await db.collection('alerts').insertOne(alert, { writeConcern: { w: 1 } });
  } catch (err) {
    // Si es E11000 (duplicado), lo ignoramos
    if (err.code === 11000) {
      // console.log(`Alert duplicada ignorada: ${alert.idAlert}`);
      return;
    }
    console.error('Error insertando alert en MongoDB:', err);
  }
}

module.exports = {
  connect,
  client,
  insertJam,
  insertAlert,
};
