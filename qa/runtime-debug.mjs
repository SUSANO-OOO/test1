import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:4173/index.html';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`${baseUrl}#/home`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(8000);
const state = await page.evaluate(() => {
  const image = document.querySelector('img[data-photo]');
  return {
    scripts: [...document.scripts].map(script => script.src || '[inline]'),
    styles: [...document.querySelectorAll('link[rel="stylesheet"]')].map(link => link.href),
    image: image ? {
      outerHTML: image.outerHTML,
      src: image.getAttribute('src'),
      currentSrc: image.currentSrc,
      complete: image.complete,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
    } : null,
    siteVersion: document.documentElement.dataset.siteVersion || null,
  };
});
await fs.mkdir(path.resolve('qa-artifacts'), { recursive: true });
await fs.writeFile(
  path.resolve('qa-artifacts/runtime-state.json'),
  JSON.stringify(state, null, 2),
  'utf8',
);
console.log('PAOPAO_RUNTIME_STATE=' + JSON.stringify(state));
await browser.close();
