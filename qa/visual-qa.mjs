import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:4173/index.html';
const outputPrefix = process.env.OUTPUT_PREFIX || 'local';
const outputDir = path.resolve('qa-artifacts');
const viewports = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'tablet-1024', width: 1024, height: 768 },
  { name: 'mobile-390', width: 390, height: 844 },
];
const routes = ['home', 'work', 'experience', 'process', 'current', 'journal', 'contact'];

await fs.mkdir(outputDir, { recursive: true });

const report = {
  baseUrl,
  outputPrefix,
  startedAt: new Date().toISOString(),
  viewports: [],
  failures: [],
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

for (const viewport of viewports) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const sameOrigin404 = [];
  const failedRequests = [];

  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', error => pageErrors.push(String(error)));
  page.on('requestfailed', request => {
    failedRequests.push({ url: request.url(), reason: request.failure()?.errorText || 'unknown' });
  });
  page.on('response', response => {
    if (response.status() === 404) {
      try {
        const responseUrl = new URL(response.url());
        const origin = new URL(baseUrl).origin;
        if (responseUrl.origin === origin) sameOrigin404.push(response.url());
      } catch {}
    }
  });

  const viewportResult = {
    ...viewport,
    routes: {},
    portrait: null,
    journal: null,
    consoleErrors,
    pageErrors,
    sameOrigin404,
    failedRequests,
  };

  try {
    await page.goto(`${baseUrl}#/home`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('img[data-photo]', { timeout: 30000 });
    await page.waitForFunction(() => {
      const image = document.querySelector('img[data-photo]');
      return Boolean(image?.complete && image.naturalWidth > 0 && image.naturalHeight > 0);
    }, { timeout: 30000 });

    // The opening animation is intentionally present. Wait until it stops obscuring the page.
    await sleep(4500);

    viewportResult.portrait = await page.evaluate(async () => {
      const images = [...document.querySelectorAll('img[data-photo]')];
      const image = images[0];
      if (image?.decode) {
        try { await image.decode(); } catch {}
      }
      const visibleImages = images.filter(item => {
        const style = getComputedStyle(item);
        const rect = item.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
      });
      return {
        count: images.length,
        visibleCount: visibleImages.length,
        srcAttribute: image?.getAttribute('src') || '',
        currentSrc: image?.currentSrc || '',
        naturalWidth: image?.naturalWidth || 0,
        naturalHeight: image?.naturalHeight || 0,
        complete: Boolean(image?.complete),
        usesDataUrl: Boolean((image?.currentSrc || image?.getAttribute('src') || '').startsWith('data:')),
        usesRepositoryFile: /portrait\.jpg(?:\?|$)/.test(image?.currentSrc || image?.getAttribute('src') || ''),
      };
    });

    if (!viewportResult.portrait.complete || viewportResult.portrait.naturalWidth <= 0 || viewportResult.portrait.naturalHeight <= 0) {
      throw new Error(`${viewport.name}: portrait did not decode`);
    }
    if (viewportResult.portrait.usesDataUrl || !viewportResult.portrait.usesRepositoryFile) {
      throw new Error(`${viewport.name}: portrait is not loaded from portrait.jpg`);
    }
    if (viewportResult.portrait.visibleCount !== 1) {
      throw new Error(`${viewport.name}: expected one visible portrait, got ${viewportResult.portrait.visibleCount}`);
    }

    await page.screenshot({
      path: path.join(outputDir, `${outputPrefix}-${viewport.name}-home.png`),
      fullPage: true,
    });

    for (const route of routes) {
      await page.evaluate(target => { location.hash = `#/${target}`; }, route);
      await page.waitForFunction(target => {
        const targetPage = document.querySelector(`.app-page[data-page="${target}"]`);
        if (!targetPage) return false;
        const style = getComputedStyle(targetPage);
        return !targetPage.hidden && style.display !== 'none' && style.visibility !== 'hidden';
      }, route, { timeout: 15000 });
      await sleep(500);

      const routeState = await page.evaluate(target => {
        const targetPage = document.querySelector(`.app-page[data-page="${target}"]`);
        return {
          visible: Boolean(targetPage && !targetPage.hidden && getComputedStyle(targetPage).display !== 'none'),
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
          title: document.title,
        };
      }, route);
      viewportResult.routes[route] = routeState;
      if (!routeState.visible) throw new Error(`${viewport.name}: route ${route} is not visible`);
      if (routeState.horizontalOverflow) {
        throw new Error(`${viewport.name}: horizontal overflow on ${route} (${routeState.scrollWidth} > ${routeState.innerWidth})`);
      }
    }

    await page.evaluate(() => { location.hash = '#/journal'; });
    await page.waitForSelector('#journalList', { timeout: 15000 });
    await page.waitForFunction(() => document.querySelectorAll('#journalList .journal-entry').length > 0, { timeout: 30000 });

    const search = page.locator('#journalSearch');
    const sort = page.locator('#journalSort');
    if (await search.count() !== 1) throw new Error(`${viewport.name}: journal search is missing`);
    if (await sort.count() !== 1) throw new Error(`${viewport.name}: journal sort is missing`);

    const initialEntries = await page.locator('#journalList .journal-entry').count();
    await search.fill('テスト');
    await sleep(400);
    const searchedVisible = await page.locator('#journalList .journal-entry:visible').count();
    await search.fill('');
    await sort.selectOption('oldest');
    await sleep(400);
    const selectedSort = await sort.inputValue();
    await sort.selectOption('newest');

    const firstEntry = page.locator('#journalList .journal-entry:visible').first();
    await firstEntry.scrollIntoViewIfNeeded();
    await firstEntry.click();
    await page.waitForFunction(() => {
      const reader = document.querySelector('#v29JournalReader');
      return reader?.classList.contains('open') && reader.getAttribute('aria-hidden') === 'false';
    }, { timeout: 15000 });
    await page.waitForFunction(() => {
      const title = document.querySelector('#v29ReaderTitle')?.textContent?.trim();
      return Boolean(title && title !== '読み込んでいます');
    }, { timeout: 30000 });

    const readerBefore = await page.locator('#v29ReaderTitle').textContent();
    const copyButton = page.locator('#v29ReaderCopy');
    await copyButton.click();
    await sleep(500);
    const copyStatus = (await page.locator('#v29ReaderStatus').textContent())?.trim() || '';

    let navigationTested = false;
    let readerAfter = readerBefore;
    for (const selector of ['#v29ReaderNext', '#v29ReaderPrev']) {
      const button = page.locator(selector);
      if (await button.count() === 1 && await button.isEnabled()) {
        await button.click();
        await page.waitForFunction(previous => {
          const title = document.querySelector('#v29ReaderTitle')?.textContent?.trim();
          return Boolean(title && title !== previous && title !== '読み込んでいます');
        }, readerBefore?.trim() || '', { timeout: 30000 });
        readerAfter = await page.locator('#v29ReaderTitle').textContent();
        navigationTested = true;
        break;
      }
    }

    viewportResult.journal = {
      initialEntries,
      searchedVisible,
      selectedSort,
      readerOpened: true,
      readerTitleBefore: readerBefore?.trim() || '',
      readerTitleAfter: readerAfter?.trim() || '',
      navigationTested,
      copyStatus,
    };

    await page.screenshot({
      path: path.join(outputDir, `${outputPrefix}-${viewport.name}-journal.png`),
      fullPage: false,
    });

    await page.locator('.v29-reader-close').click();
    await page.waitForFunction(() => document.querySelector('#v29JournalReader')?.getAttribute('aria-hidden') === 'true', { timeout: 10000 });

    if (consoleErrors.length > 0) throw new Error(`${viewport.name}: console errors: ${consoleErrors.join(' | ')}`);
    if (pageErrors.length > 0) throw new Error(`${viewport.name}: page errors: ${pageErrors.join(' | ')}`);
    if (sameOrigin404.length > 0) throw new Error(`${viewport.name}: same-origin 404: ${sameOrigin404.join(' | ')}`);
  } catch (error) {
    const failure = String(error?.stack || error);
    report.failures.push({ viewport: viewport.name, failure });
    viewportResult.failure = failure;
    try {
      await page.screenshot({
        path: path.join(outputDir, `${outputPrefix}-${viewport.name}-failure.png`),
        fullPage: true,
      });
    } catch {}
  } finally {
    report.viewports.push(viewportResult);
    await browser.close();
  }
}

report.finishedAt = new Date().toISOString();
await fs.writeFile(
  path.join(outputDir, `${outputPrefix}-report.json`),
  JSON.stringify(report, null, 2),
  'utf8',
);

console.log(JSON.stringify(report, null, 2));
if (report.failures.length > 0) process.exit(1);
