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
    await page.addInitScript(()=>{
      window.__LONG_TASKS__=[];
      try{
        new PerformanceObserver(list=>{
          list.getEntries().forEach(entry=>window.__LONG_TASKS__.push({start:entry.startTime,duration:entry.duration}));
        }).observe({type:'longtask',buffered:true});
      }catch{}
    });

    const started=Date.now();
    await page.goto(baseUrl,{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('.hero h1');
    await page.waitForFunction(()=>document.documentElement.dataset.siteReady==='true',{timeout:15000});
    await page.waitForFunction(()=>{
      const image=document.querySelector('.portrait-frame img');
      return Boolean(image?.complete&&image.naturalWidth>0);
    },{timeout:30000});
    result.readyMs=Date.now()-started;
    await page.waitForTimeout(600);

    result.runtime=await page.evaluate(()=>{
      const resources=performance.getEntriesByType('resource');
      const scripts=[...document.scripts].map(script=>script.src).filter(Boolean);
      const styles=[...document.querySelectorAll('link[rel="stylesheet"]')].map(link=>link.href);
      return{
        scripts,
        styles,
        externalScripts:scripts.filter(source=>new URL(source,location.href).origin!==location.origin),
        duplicateScripts:scripts.filter((source,index)=>scripts.indexOf(source)!==index),
        resourceCount:resources.length,
        transferBytes:resources.reduce((total,item)=>total+(item.transferSize||0),0),
        encodedBytes:resources.reduce((total,item)=>total+(item.encodedBodySize||0),0),
        canvasCount:document.querySelectorAll('canvas').length,
        animationCount:document.getAnimations().length,
        longTasks:window.__LONG_TASKS__||[]
      };
    });

    result.framePacing=await page.evaluate(()=>new Promise(resolve=>{
      const gaps=[];let previous=performance.now();const start=previous;
      const tick=now=>{
        gaps.push(now-previous);previous=now;
        if(now-start>=1600){
          const sorted=[...gaps].sort((a,b)=>a-b);
          resolve({
            count:gaps.length,
            p95:sorted[Math.min(sorted.length-1,Math.floor(sorted.length*.95))]||0,
            max:Math.max(0,...gaps),
            estimatedFps:gaps.length/((now-start)/1000)
          });
          return;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }));

    await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';document.querySelector('#makeover')?.scrollIntoView({behavior:'auto',block:'start'})});
    await page.waitForTimeout(80);
    result.makeoverSwitchMs=await page.evaluate(()=>new Promise(resolve=>{
      const button=document.querySelector('.makeover-tab[data-view="after"]');
      const after=document.querySelector('[data-makeover="after"]');
      const start=performance.now();
      button?.click();
      const check=()=>{
        if(after&&!after.hidden){resolve(performance.now()-start);return}
        requestAnimationFrame(check);
      };
      requestAnimationFrame(check);
    }));

    if(result.readyMs>2500)throw new Error(`${viewport.name}: ready ${result.readyMs}ms`);
    if(result.runtime.externalScripts.length)throw new Error(`${viewport.name}: external scripts remain: ${result.runtime.externalScripts.join(',')}`);
    if(result.runtime.duplicateScripts.length)throw new Error(`${viewport.name}: duplicate scripts remain`);
    if(result.runtime.canvasCount!==0)throw new Error(`${viewport.name}: unnecessary canvas remains`);
    if(result.runtime.resourceCount>16)throw new Error(`${viewport.name}: excessive resource count ${result.runtime.resourceCount}`);
    if(result.framePacing.p95>95)throw new Error(`${viewport.name}: frame pacing p95 ${Math.round(result.framePacing.p95)}ms`);
    if(result.framePacing.max>220)throw new Error(`${viewport.name}: frame stall ${Math.round(result.framePacing.max)}ms`);
    if(result.makeoverSwitchMs>350)throw new Error(`${viewport.name}: makeover switch ${Math.round(result.makeoverSwitchMs)}ms`);
    if(result.runtime.longTasks.some(task=>task.duration>260))throw new Error(`${viewport.name}: long task over 260ms`);
  }catch(error){
    const failure=String(error?.stack||error);
    result.failure=failure;
    report.failures.push({viewport:viewport.name,failure});
  }finally{
    report.viewports.push(result);
    await browser.close();
  }
}

report.finishedAt=new Date().toISOString();
await fs.writeFile(path.join(outputDir,'performance-report.json'),JSON.stringify(report,null,2),'utf8');
console.log(JSON.stringify(report,null,2));
if(report.failures.length)process.exit(1);
