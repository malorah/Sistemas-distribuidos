// /tarea_enzzo/scraper/scraper.js

const path = require('path');
const { initBrowser } = require('./config/puppeteer');
const { readCSVFile } = require('./utils/csvReader');
const { interactWithPage } = require('./pageInteractor');
const { interceptResponses } = require('./trafficInterceptor');
const { connect } = require('./services/mongoService');

async function runScraper() {
    // Conectamos a Mongo antes de arrancar Puppeteer
    await connect();

    // 1) Leemos CSV con URLs/ciudades
    const csvPath = path.join(__dirname, 'cities.csv');
    const targets = await readCSVFile(csvPath);

    // 2) Inicializamos Puppeteer
    const browser = await initBrowser();

    for (const { url, city } of targets) {
        const page = await browser.newPage();
        try {
            await page.goto(url, { waitUntil: 'load', timeout: 0 });
            await interactWithPage(page);
            await interceptResponses(page, city);
        } catch (error) {
            console.error(`Error procesando ${city} (${url}):`, error);
        } finally {
            await page.close();
        }
    }

    await browser.close();
}

(async () => {
    try {
        await runScraper();
        console.log('Scraper finalizado correctamente.');
    } catch (err) {
        console.error('Error fatal en Scraper:', err);
        process.exit(1);
    }
})();
