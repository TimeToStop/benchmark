import puppeteer from 'puppeteer';

const URL = process.argv[2];

async function runBenchmark() {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  const page = await browser.newPage();

  page.on('console', msg => console.log('[BROWSER]', msg.text()));
  page.on('pageerror', err => console.error('[ERROR]', err.message));

  console.log('Opening app at', URL);
  await page.goto(URL, { waitUntil: 'networkidle2' });

  console.log('Waiting for experiment to finish...');

  try {
    await page.waitForFunction(
      'window.__EXPERIMENT_DONE__ === true',
      { timeout: 30 * 60 * 1000 } // 30 minutes
    );
    console.log('[SUCCESS] Experiment complete!');
  } catch (err) {
    console.error('[ERROR] Timeout or error waiting for experiment to finish.');
  }

  await browser.close();
  process.exit(0);
}

runBenchmark();
