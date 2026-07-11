import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const legacyCommit = '5d0f926adcd46e247ec7504f7ead5a7333fb64e3';
const outputDir = path.resolve('qa-artifacts');
await fs.mkdir(outputDir, { recursive: true });

const source = execFileSync(
  'git',
  ['show', `${legacyCommit}:v18-photo.js`],
  { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
);
const match = source.match(/data:image\/(webp|jpeg|png);base64,([^'";]+)/);
if (!match) throw new Error('Legacy portrait data URL was not found');

const extension = match[1] === 'jpeg' ? 'jpg' : match[1];
const bytes = Buffer.from(match[2], 'base64');
const fileName = `legacy-portrait.${extension}`;
const outputPath = path.join(outputDir, fileName);
await fs.writeFile(outputPath, bytes);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
await page.setContent(`<!doctype html><style>html,body{margin:0;background:#111;display:grid;place-items:center;min-height:100%}img{display:block;max-width:100%;max-height:100vh;object-fit:contain}</style><img id="portrait" src="http://127.0.0.1:4173/qa-artifacts/${fileName}">`);
await page.waitForFunction(() => {
  const image = document.querySelector('#portrait');
  return image?.complete;
}, { timeout: 15000 });
const imageState = await page.evaluate(() => {
  const image = document.querySelector('#portrait');
  return {
    complete: image.complete,
    naturalWidth: image.naturalWidth,
    naturalHeight: image.naturalHeight,
    currentSrc: image.currentSrc,
  };
});
await page.screenshot({ path: path.join(outputDir, 'legacy-portrait-preview.png'), fullPage: true });
await browser.close();

const report = {
  legacyCommit,
  fileName,
  size: bytes.length,
  first16Hex: bytes.subarray(0, 16).toString('hex'),
  last16Hex: bytes.subarray(Math.max(0, bytes.length - 16)).toString('hex'),
  imageState,
};
await fs.writeFile(path.join(outputDir, 'legacy-portrait-report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (imageState.naturalWidth <= 0 || imageState.naturalHeight <= 0) process.exit(1);
