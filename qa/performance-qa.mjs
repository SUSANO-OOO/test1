import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const startUrl=process.env.BASE_URL||'http://127.0.0.1:4173/index.html';
const rootUrl=new URL('.',startUrl).href;
const outputDir=path.resolve('qa-artifacts');
const pages=['index.html','service.html','works.html','about.html','contact.html'];
const viewports=[
  {name:'desktop-1440',width:1440,height:900},
  {name:'tablet-1024',width:1024,height:768},
  {name:'mobile-390',width:390,height:844}
];
await fs.mkdir(outputDir,{recursive:true});
const report={rootUrl,startedAt:new Date().toISOString(),viewports:[],failures:[]};

for(const viewport of viewports){
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},deviceScaleFactor:1});
  const result={...viewport,pages:{}};
  try{
    for(const file of pages){
      const page=await context.newPage();
      await page.addInitScript(()=>{
        window.__LONG_TASKS__=[];
        try{new PerformanceObserver(list=>list.getEntries().forEach(entry=>window.__LONG_TASKS__.push(entry.duration))).observe({type:'longtask',buffered:true})}catch{}
      });
      const started=Date.now();
      await page.goto(new URL(file,rootUrl).href,{waitUntil:'domcontentloaded',timeout:60000});
      await page.waitForSelector('h1');
      const readyMs=Date.now()-started;
      await page.waitForTimeout(450);
      const runtime=await page.evaluate(()=>{
        const resources=performance.getEntriesByType('resource');
        const scripts=[...document.scripts].map(script=>script.src).filter(Boolean);
        const styles=[...document.querySelectorAll('link[rel="stylesheet"]')].map(link=>link.href);
        return{
          resourceCount:resources.length,
          transferBytes:resources.reduce((sum,item)=>sum+(item.transferSize||0),0),
          scripts,
          styles,
          externalScripts:scripts.filter(source=>new URL(source,location.href).origin!==location.origin),
          canvasCount:document.querySelectorAll('canvas').length,
          animationCount:document.getAnimations().length,
          longTasks:window.__LONG_TASKS__||[]
        };
      });
      const framePacing=await page.evaluate(()=>new Promise(resolve=>{
        const gaps=[];let previous=performance.now();const start=previous;
        const tick=now=>{gaps.push(now-previous);previous=now;if(now-start>=900){const sorted=[...gaps].sort((a,b)=>a-b);resolve({p95:sorted[Math.min(sorted.length-1,Math.floor(sorted.length*.95))]||0,max:Math.max(0,...gaps)});return}requestAnimationFrame(tick)};
        requestAnimationFrame(tick);
      }));

      if(readyMs>2200)throw new Error(`${viewport.name}/${file}: ready ${readyMs}ms`);
      if(runtime.externalScripts.length)throw new Error(`${viewport.name}/${file}: external JavaScript remains`);
      if(runtime.canvasCount!==0)throw new Error(`${viewport.name}/${file}: unnecessary canvas remains`);
      if(runtime.resourceCount>12)throw new Error(`${viewport.name}/${file}: excessive resource count ${runtime.resourceCount}`);
      if(framePacing.p95>90||framePacing.max>220)throw new Error(`${viewport.name}/${file}: frame pacing failed`);
      if(runtime.longTasks.some(duration=>duration>250))throw new Error(`${viewport.name}/${file}: long task over 250ms`);
      result.pages[file]={readyMs,runtime,framePacing};
      await page.close();
    }
  }catch(error){
    const failure=String(error?.stack||error);result.failure=failure;report.failures.push({viewport:viewport.name,failure});
  }finally{report.viewports.push(result);await browser.close()}
}
report.finishedAt=new Date().toISOString();
await fs.writeFile(path.join(outputDir,'performance-report.json'),JSON.stringify(report,null,2),'utf8');
console.log(JSON.stringify(report,null,2));
if(report.failures.length)process.exit(1);
