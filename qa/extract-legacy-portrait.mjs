import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { chromium } from 'playwright';

const candidates = [
  ['b8f2347f22a71aa2e93ab9fe1b232a5485dc45d5', 'approved-new-image'],
  ['6e36fbc262062e71e0139d50531dfdcac97bd72c', 'reliable-new-image'],
  ['009ce17e3339122cfc69873592fb9ab93b964715', 'approved-direct'],
  ['d1117183e77b46b4dfda10b4ab5312ace2ddb653', 'fallback'],
  ['5d0f926adcd46e247ec7504f7ead5a7333fb64e3', 'approved-artwork'],
];
const outputDir = path.resolve('qa-artifacts/legacy-candidates');
await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
const reports = [];

for (const [commit, label] of candidates) {
  const report = { commit, label };
  try {
    const source = execFileSync(
      'git',
      ['show', `${commit}:v18-photo.js`],
      { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
    );
    const match = source.match(/data:image\/(webp|jpeg|png);base64,([^'";]+)/);
    if (!match) {
      report.error = 'No data URL found';
      reports.push(report);
      continue;
    }
    const extension = match[1] === 'jpeg' ? 'jpg' : match[1];
    const bytes = Buffer.from(match[2], 'base64');
    const fileName = `${label}.${extension}`;
    const outputPath = path.join(outputDir, fileName);
    await fs.writeFile(outputPath, bytes);

    await page.goto(`http://127.0.0.1:4173/qa-artifacts/legacy-candidates/${fileName}`, {
      waitUntil: 'load', timeout: 15000,
    });
    const imageState = await page.evaluate(() => {
      const image = document.images[0];
      return image ? {
        complete: image.complete,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        currentSrc: image.currentSrc,
      } : null;
    });
    await page.screenshot({ path: path.join(outputDir, `${label}-preview.png`), fullPage: true });

    Object.assign(report, {
      fileName,
      size: bytes.length,
      sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
      first16Hex: bytes.subarray(0, 16).toString('hex'),
      last16Hex: bytes.subarray(Math.max(0, bytes.length - 16)).toString('hex'),
      imageState,
    });
  } catch (error) {
    report.error = String(error?.stack || error);
  }
  reports.push(report);
}

await browser.close();
await fs.writeFile(
  path.join(outputDir, 'legacy-candidates-report.json'),
  JSON.stringify(reports, null, 2),
  'utf8',
);
console.log(JSON.stringify(reports, null, 2));
if (!reports.some(report => report.imageState?.naturalWidth > 0 && report.imageState?.naturalHeight > 0)) {
  process.exit(1);
}
