// /tarea_enzzo/scraper/services/trafficProcessor.js

const { insertJam, insertAlert } = require('./mongoService');

function processTrafficData(data, city) {
  if (Array.isArray(data.jams)) {
    data.jams.forEach(jam => {
      const jamDetails = {
        idJam: jam.id,
        country: jam.country,
        commune: jam.city,
        streetName: jam.street,
        streetEnd: jam.endNode,
        speedKmh: jam.speedKMH,
        length: jam.length,
        timestamp: new Date().toISOString(),
        city
      };
      insertJam(jamDetails);
    });
  }

  if (Array.isArray(data.alerts)) {
    data.alerts.forEach(alert => {
      const alertDetails = {
        idAlert: alert.id,
        country: alert.country,
        commune: alert.city,
        typeAlert: alert.type,
        streetName: alert.street,
        timestamp: new Date().toISOString(),
        city
      };
      insertAlert(alertDetails);
    });
  } else {
    console.log('No se encontraron alertas.');
  }
}

module.exports = { processTrafficData };
