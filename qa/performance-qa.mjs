import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl=process.env.BASE_URL||'http://127.0.0.1:4173/index.html';
const outputDir=path.resolve('qa-artifacts');
const viewports=[
  {name:'desktop-1440',width:1440,height:900,expectsSystemCanvas:true},
  {name:'tablet-1024',width:1024,height:768,expectsSystemCanvas:false},
  {name:'mobile-390',width:390,height:844,expectsSystemCanvas:false}
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
      window.__PAOPAO_LONG_TASKS__=[];
      try{
        new PerformanceObserver(list=>{
          for(const entry of list.getEntries())window.__PAOPAO_LONG_TASKS__.push({startTime:entry.startTime,duration:entry.duration});
        }).observe({type:'longtask',buffered:true});
      }catch(_){ }
    });

    await page.goto(`${baseUrl}#/home`,{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForFunction(()=>document.documentElement.dataset.siteVersion==='29',{timeout:10000});
    await page.waitForFunction(()=>{
      const image=document.querySelector('img[data-photo]');
      return Boolean(image?.complete&&image.naturalWidth>0&&image.naturalHeight>0);
    },{timeout:10000});

    result.readyMs=await page.evaluate(()=>performance.now());
    result.openingFrames=await page.evaluate(duration=>new Promise(resolve=>{
      const samples=[];
      const start=performance.now();
      let previous=start;
      const step=timestamp=>{
        samples.push(timestamp-previous);
        previous=timestamp;
        if(timestamp-start>=duration){
          const sorted=[...samples].sort((a,b)=>a-b);
          const sum=samples.reduce((total,value)=>total+value,0);
          resolve({
            count:samples.length,
            averageGapMs:samples.length?sum/samples.length:0,
            p95GapMs:sorted[Math.min(sorted.length-1,Math.floor(sorted.length*.95))]||0,
            maxGapMs:Math.max(0,...samples),
            estimatedFps:sum>0?samples.length/(sum/1000):0
          });
          return;
        }
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }),2000);

    await page.waitForTimeout(2600);
    const transitionStarted=Date.now();
    await page.evaluate(()=>{location.hash='#/work';});
    await page.waitForFunction(()=>document.body.dataset.route==='work'&&!document.querySelector('.route-transition')?.classList.contains('active'),{timeout:3000});
    result.routeTransitionMs=Date.now()-transitionStarted;

    result.runtime=await page.evaluate(()=>{
      const origin=location.origin;
      const scripts=[...document.scripts].map(script=>script.src).filter(Boolean);
      const styles=[...document.querySelectorAll('link[rel="stylesheet"]')].map(link=>link.href);
      const resources=performance.getEntriesByType('resource').map(entry=>({
        name:entry.name,
        initiatorType:entry.initiatorType,
        duration:entry.duration,
        transferSize:entry.transferSize||0,
        encodedBodySize:entry.encodedBodySize||0
      }));
      const scriptResources=resources.filter(entry=>entry.initiatorType==='script');
      return {
        scripts,
        styles,
        externalScripts:scripts.filter(source=>new URL(source,location.href).origin!==origin),
        rawGithackScripts:scripts.filter(source=>source.includes('raw.githack.com')),
        duplicateScripts:scripts.filter((source,index)=>scripts.indexOf(source)!==index),
        scriptResourceCount:scriptResources.length,
        scriptTransferBytes:scriptResources.reduce((total,entry)=>total+entry.transferSize,0),
        scriptEncodedBytes:scriptResources.reduce((total,entry)=>total+entry.encodedBodySize,0),
        openingCanvasCount:document.querySelectorAll('#openingCanvas').length,
        systemCanvasCount:document.querySelectorAll('#systemCanvas').length,
        canvasCount:document.querySelectorAll('canvas').length,
        longTasks:window.__PAOPAO_LONG_TASKS__||[],
        siteVersion:document.documentElement.dataset.siteVersion||'',
        readyClass:document.documentElement.classList.contains('paopao-ready')
      };
    });

    if(result.readyMs>3000)throw new Error(`${viewport.name}: V29 ready took ${Math.round(result.readyMs)}ms`);
    if(result.openingFrames.p95GapMs>200)throw new Error(`${viewport.name}: animation frame pacing p95 was ${Math.round(result.openingFrames.p95GapMs)}ms`);
    if(result.openingFrames.maxGapMs>250)throw new Error(`${viewport.name}: animation stalled for ${Math.round(result.openingFrames.maxGapMs)}ms`);
    if(result.routeTransitionMs>1200)throw new Error(`${viewport.name}: route transition took ${result.routeTransitionMs}ms`);
    if(result.runtime.externalScripts.length)throw new Error(`${viewport.name}: external scripts remain: ${result.runtime.externalScripts.join(', ')}`);
    if(result.runtime.rawGithackScripts.length)throw new Error(`${viewport.name}: raw.githack runtime remains`);
    if(result.runtime.duplicateScripts.length)throw new Error(`${viewport.name}: duplicate scripts: ${result.runtime.duplicateScripts.join(', ')}`);
    if(result.runtime.openingCanvasCount!==0)throw new Error(`${viewport.name}: unstable opening canvas remains`);
    if(result.runtime.systemCanvasCount!==(viewport.expectsSystemCanvas?1:0)){
      throw new Error(`${viewport.name}: unexpected system canvas count ${result.runtime.systemCanvasCount}`);
    }
    if(result.runtime.siteVersion!=='29'||!result.runtime.readyClass)throw new Error(`${viewport.name}: runtime did not finish cleanly`);
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