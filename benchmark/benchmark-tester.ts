import puppeteer from 'puppeteer';

let retryCount = 0;
const URL = process.argv[2];
const isHeadless = process.argv.includes('headless');

async function runBenchmark() {
  const browser = await puppeteer.launch({
    headless: isHeadless,
    defaultViewport: null,
    protocolTimeout: 0,
    args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  const page = await browser.newPage();

  page.on('console', msg => console.log('[BROWSER]', msg.text()));
  page.on('pageerror', err => console.error('[ERROR]', err.message));

  console.log('Opening app at', URL);
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 0 });

  console.log('Waiting for experiment to finish...');

  try {
    await page.waitForFunction(
      'window.__EXPERIMENT_DONE__ === true', 
      { timeout: 0 } 
    );
    await browser.close();
    console.log('[SUCCESS] Experiment complete!');
  } catch (err) {
    console.error('[ERROR] Timeout or error waiting for experiment to finish.');
    console.error(err);
    await browser.close();

    if (retryCount++ >= 5) {
      console.log('rerunning browser');
      await runBenchmark();
    }
  }
}

runBenchmark();