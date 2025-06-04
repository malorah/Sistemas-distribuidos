// /tarea_enzzo/scraper/utils/csvReader.js
const fs = require('fs');
const csv = require('csv-parser');

async function readCSVFile(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', row => {
        if (row.url && row.city) {
          rows.push({ url: row.url.trim(), city: row.city.trim() });
        }
      })
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

module.exports = { readCSVFile };
