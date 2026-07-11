import { chromium } from 'playwright';

const baseUrl=process.env.BASE_URL||'http://127.0.0.1:4173/index.html';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const consoleMessages=[];
const pageErrors=[];
page.on('console',message=>consoleMessages.push({type:message.type(),text:message.text()}));
page.on('pageerror',error=>pageErrors.push(String(error)));
await page.goto(`${baseUrl}#/home`,{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForTimeout(8000);
const state=await page.evaluate(()=>({
  siteVersion:document.documentElement.dataset.siteVersion||'',
  readyClass:document.documentElement.classList.contains('paopao-ready'),
  bootstrap:Boolean(window.__PAOPAO_BOOTSTRAP__),
  routeRuntime:Boolean(window.__PAOPAO_ROUTE_RUNTIME__),
  journalGuide:Boolean(window.__PAOPAO_JOURNAL_GUIDE__),
  v28Runtime:Boolean(window.__PAOPAO_V28_RUNTIME__),
  journalSearch:document.querySelectorAll('#journalSearch').length,
  journalList:document.querySelectorAll('#journalList').length,
  scripts:[...document.scripts].map(script=>({src:script.src,loaded:script.dataset.loaded||''})),
  styles:[...document.querySelectorAll('link[rel="stylesheet"]')].map(link=>link.href)
}));
console.log('PAOPAO_RUNTIME_DEBUG='+JSON.stringify({state,consoleMessages,pageErrors},null,2));
await browser.close();