import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../public');

async function generateIcons() {
  console.log('Launching browser to generate PWA PNG icons...');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const svgPath = path.join(publicDir, 'icon.svg');
  await page.goto(`file://${svgPath}`);

  // Set viewport to 192x192
  await page.setViewportSize({ width: 192, height: 192 });
  await page.screenshot({ path: path.join(publicDir, 'icon-192.png'), omitBackground: false });
  console.log('Created public/icon-192.png');

  // Set viewport to 512x512
  await page.setViewportSize({ width: 512, height: 512 });
  await page.screenshot({ path: path.join(publicDir, 'icon-512.png'), omitBackground: false });
  console.log('Created public/icon-512.png');

  await browser.close();
  console.log('PWA icons successfully generated!');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
});
