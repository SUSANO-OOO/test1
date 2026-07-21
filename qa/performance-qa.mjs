import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl=process.env.BASE_URL||'http://127.0.0.1:4173/index.html';
const outputDir=path.resolve('qa-artifacts');
const viewports=[
  {name:'desktop-1440',width:1440,height:900},
  {name:'tablet-1024',width:1024,height:768},
  {name:'mobile-390',width:390,height:844}
];
await fs.mkdir(outputDir,{recursive:true});
const report={baseUrl,startedAt:new Date().toISOString(),viewports:[],failures:[]};

for(const viewport of viewports){
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},deviceScaleFactor:1});
  const page=await context.newPage();
  const result={...viewport};
  try{
    await page.addInitScript(()=>{window.__LONG_TASKS__=[];try{new PerformanceObserver(list=>list.getEntries().forEach(e=>window.__LONG_TASKS__.push({start:e.startTime,duration:e.duration}))).observe({type:'longtask',buffered:true})}catch{}});
    const started=Date.now();
    await page.goto(baseUrl,{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('.hero h1');
    await page.waitForFunction(()=>['ready','fallback'].includes(document.documentElement.dataset.webgl),{timeout:30000});
    await page.waitForFunction(()=>{const i=document.querySelector('.portrait-frame img');return i?.complete&&i.naturalWidth>0},{timeout:30000});
    result.readyMs=Date.now()-started;
    await page.waitForTimeout(800);
    result.runtime=await page.evaluate(()=>{
      const resources=performance.getEntriesByType('resource');
      const scripts=[...document.scripts].map(s=>s.src).filter(Boolean);
      const styles=[...document.querySelectorAll('link[rel="stylesheet"]')].map(l=>l.href);
      return{
        scripts,styles,
        externalScripts:scripts.filter(s=>new URL(s,location.href).origin!==location.origin),
        duplicateScripts:scripts.filter((s,i)=>scripts.indexOf(s)!==i),
        resourceCount:resources.length,
        transferBytes:resources.reduce((n,r)=>n+(r.transferSize||0),0),
        encodedBytes:resources.reduce((n,r)=>n+(r.encodedBodySize||0),0),
        canvasCount:document.querySelectorAll('canvas').length,
        webgl:document.documentElement.dataset.webgl||'',
        longTasks:window.__LONG_TASKS__||[]
      }
    });
    result.framePacing=await page.evaluate(()=>new Promise(resolve=>{const gaps=[];let prev=performance.now(),start=prev;function tick(now){gaps.push(now-prev);prev=now;if(now-start>1800){const sorted=[...gaps].sort((a,b)=>a-b);resolve({p95:sorted[Math.min(sorted.length-1,Math.floor(sorted.length*.95))]||0,max:Math.max(0,...gaps),count:gaps.length,estimatedFps:gaps.length/((now-start)/1000)});return}requestAnimationFrame(tick)}requestAnimationFrame(tick)}));
    await page.evaluate(()=>document.querySelector('#showcase')?.scrollIntoView());
    const transitionStarted=Date.now();
    await page.locator('.demo-tab[data-tab="automation"]').click();
    await page.waitForFunction(()=>document.querySelector('.demo-panel[data-panel="automation"]')?.classList.contains('active'));
    result.demoSwitchMs=Date.now()-transitionStarted;
    if(result.readyMs>3000)throw new Error(`${viewport.name}: ready ${result.readyMs}ms`);
    if(result.runtime.externalScripts.length)throw new Error(`${viewport.name}: external scripts remain: ${result.runtime.externalScripts.join(',')}`);
    if(result.runtime.duplicateScripts.length)throw new Error(`${viewport.name}: duplicate scripts remain`);
    if(result.runtime.canvasCount!==1)throw new Error(`${viewport.name}: expected one canvas, got ${result.runtime.canvasCount}`);
    if(!['ready','fallback'].includes(result.runtime.webgl))throw new Error(`${viewport.name}: WebGL state missing`);
    if(result.framePacing.p95>125)throw new Error(`${viewport.name}: frame pacing p95 ${Math.round(result.framePacing.p95)}ms`);
    if(result.framePacing.max>260)throw new Error(`${viewport.name}: frame stall ${Math.round(result.framePacing.max)}ms`);
    if(result.demoSwitchMs>1000)throw new Error(`${viewport.name}: demo switch ${result.demoSwitchMs}ms`);
    if(result.runtime.longTasks.some(t=>t.duration>350))throw new Error(`${viewport.name}: long task over 350ms`);
  }catch(error){const failure=String(error?.stack||error);result.failure=failure;report.failures.push({viewport:viewport.name,failure})}
  finally{report.viewports.push(result);await browser.close()}
}
report.finishedAt=new Date().toISOString();
await fs.writeFile(path.join(outputDir,'performance-report.json'),JSON.stringify(report,null,2),'utf8');
console.log(JSON.stringify(report,null,2));
if(report.failures.length)process.exit(1);
