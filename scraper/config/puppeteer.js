// /tarea_enzzo/scraper/config/puppeteer.js
const puppeteer = require('puppeteer');

async function initBrowser() {
  return await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  });
}

module.exports = { initBrowser };
