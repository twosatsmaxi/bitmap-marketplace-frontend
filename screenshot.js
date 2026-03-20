const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 }
  });

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Browser error:', msg.text());
    }
  });

  // Navigate to mempool page
  await page.goto('http://localhost:3000/mempool', { waitUntil: 'networkidle' });

  // Wait longer for Three.js to initialize and render
  await page.waitForTimeout(12000);

  // Take screenshot
  await page.screenshot({ path: 'mempool-screenshot.png', fullPage: false });

  console.log('Screenshot saved to mempool-screenshot.png');
  await browser.close();
})();
