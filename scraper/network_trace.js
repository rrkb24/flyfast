const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('.json') || response.headers()['content-type']?.includes('application/json')) {
      console.log('JSON URL found:', url);
    }
  });

  await page.goto('https://tsa.fromthetraytable.com/', { waitUntil: 'networkidle' });
  await browser.close();
})();
