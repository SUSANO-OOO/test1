import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl=process.env.BASE_URL||'http://127.0.0.1:4173/index.html';
const outputPrefix=process.env.OUTPUT_PREFIX||'local';
const outputDir=path.resolve('qa-artifacts');
const viewports=[
  {name:'desktop-1440',width:1440,height:900,mobile:false},
  {name:'tablet-1024',width:1024,height:768,mobile:false},
  {name:'mobile-390',width:390,height:844,mobile:true}
];
const sections=['showcase','services','experience','process','contact'];
await fs.mkdir(outputDir,{recursive:true});
const report={baseUrl,startedAt:new Date().toISOString(),viewports:[],failures:[]};

for(const viewport of viewports){
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},deviceScaleFactor:1,permissions:['clipboard-read','clipboard-write']});
  const page=await context.newPage();
  const consoleErrors=[];const pageErrors=[];const failedRequests=[];const sameOrigin404=[];
  page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
  page.on('pageerror',e=>pageErrors.push(String(e)));
  page.on('requestfailed',r=>failedRequests.push({url:r.url(),reason:r.failure()?.errorText||'unknown'}));
  page.on('response',r=>{if(r.status()===404&&new URL(r.url()).origin===new URL(baseUrl).origin)sameOrigin404.push(r.url())});
  const result={...viewport,consoleErrors,pageErrors,failedRequests,sameOrigin404,sections:{},tabs:{}};
  try{
    await page.goto(baseUrl,{waitUntil:'networkidle',timeout:60000});
    await page.waitForSelector('.hero h1');
    await page.waitForFunction(()=>['ready','fallback'].includes(document.documentElement.dataset.webgl),{timeout:30000});
    await page.waitForFunction(()=>{const i=document.querySelector('.portrait-frame img');return i?.complete&&i.naturalWidth>0&&i.naturalHeight>0},{timeout:30000});
    await page.waitForTimeout(1600);

    result.initial=await page.evaluate(()=>({
      title:document.title,
      h1:document.querySelector('h1')?.innerText||'',
      demoTabs:document.querySelectorAll('.demo-tab').length,
      serviceRows:document.querySelectorAll('.service-row').length,
      experienceItems:document.querySelectorAll('.experience-item').length,
      processSteps:document.querySelectorAll('.process-step').length,
      contactActions:document.querySelectorAll('#contact .contact-actions>*').length,
      canvasCount:document.querySelectorAll('canvas').length,
      webgl:document.documentElement.dataset.webgl||'',
      portrait:{src:document.querySelector('.portrait-frame img')?.getAttribute('src')||'',width:document.querySelector('.portrait-frame img')?.naturalWidth||0,height:document.querySelector('.portrait-frame img')?.naturalHeight||0},
      horizontalOverflow:document.documentElement.scrollWidth>innerWidth+1,
      mobileDock:getComputedStyle(document.querySelector('.mobile-dock')).display
    }));
    if(!result.initial.h1.includes('ホームページ')||!result.initial.h1.includes('最初の実績'))throw new Error(`${viewport.name}: hero promise missing`);
    if(result.initial.demoTabs!==3)throw new Error(`${viewport.name}: expected 3 demo tabs`);
    if(result.initial.serviceRows!==3)throw new Error(`${viewport.name}: expected 3 service rows`);
    if(result.initial.experienceItems!==3)throw new Error(`${viewport.name}: expected 3 experience items`);
    if(result.initial.processSteps!==4)throw new Error(`${viewport.name}: expected 4 process steps`);
    if(result.initial.contactActions<2)throw new Error(`${viewport.name}: contact actions missing`);
    if(result.initial.canvasCount!==1)throw new Error(`${viewport.name}: expected one showcase canvas`);
    if(!/portrait\.webp/.test(result.initial.portrait.src)||result.initial.portrait.width<=0)throw new Error(`${viewport.name}: portrait invalid`);
    if(result.initial.horizontalOverflow)throw new Error(`${viewport.name}: horizontal overflow`);
    if(viewport.mobile&&result.initial.mobileDock==='none')throw new Error(`${viewport.name}: mobile dock hidden`);
    if(!viewport.mobile&&result.initial.mobileDock!=='none')throw new Error(`${viewport.name}: mobile dock unexpectedly visible`);

    for(const id of sections){
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      await page.waitForTimeout(650);
      const state=await page.evaluate(target=>{const section=document.getElementById(target);const reveal=[...section.querySelectorAll('.reveal')];return{rect:section.getBoundingClientRect().toJSON(),reveals:reveal.map(el=>({opacity:Number(getComputedStyle(el).opacity),visibility:getComputedStyle(el).visibility,width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height}))}},id);
      result.sections[id]=state;
      if(!state.rect.width||!state.rect.height)throw new Error(`${viewport.name}: ${id} has no layout`);
      if(state.reveals.some(x=>x.opacity<.9||x.visibility==='hidden'||x.width<=0||x.height<=0))throw new Error(`${viewport.name}: hidden content remains in ${id}`);
    }

    await page.locator('#showcase').scrollIntoViewIfNeeded();
    for(const name of ['web','automation','operations']){
      await page.locator(`.demo-tab[data-tab="${name}"]`).click();
      await page.waitForTimeout(550);
      const tabState=await page.evaluate(target=>({selected:document.querySelector(`.demo-tab[data-tab="${target}"]`)?.getAttribute('aria-selected'),active:document.querySelector(`.demo-panel[data-panel="${target}"]`)?.classList.contains('active'),opacity:getComputedStyle(document.querySelector(`.demo-panel[data-panel="${target}"]`)).opacity}),name);
      result.tabs[name]=tabState;
      if(tabState.selected!=='true'||!tabState.active||Number(tabState.opacity)<.9)throw new Error(`${viewport.name}: demo tab ${name} failed`);
    }

    await page.locator('#contact').scrollIntoViewIfNeeded();
    await page.locator('#copyBrief').click();
    await page.waitForTimeout(300);
    result.copyStatus=(await page.locator('#copyStatus').textContent())?.trim()||'';
    if(!result.copyStatus)throw new Error(`${viewport.name}: consultation template copy feedback missing`);

    await page.evaluate(()=>document.querySelectorAll('.reveal').forEach(el=>el.classList.add('visible')));
    await page.screenshot({path:path.join(outputDir,`${outputPrefix}-${viewport.name}-home.png`),fullPage:true});
    if(consoleErrors.length)throw new Error(`${viewport.name}: console errors: ${consoleErrors.join(' | ')}`);
    if(pageErrors.length)throw new Error(`${viewport.name}: page errors: ${pageErrors.join(' | ')}`);
    if(sameOrigin404.length)throw new Error(`${viewport.name}: same-origin 404: ${sameOrigin404.join(' | ')}`);
    const localFailures=failedRequests.filter(item=>{try{return new URL(item.url).origin===new URL(baseUrl).origin}catch{return true}});
    if(localFailures.length)throw new Error(`${viewport.name}: failed local requests: ${JSON.stringify(localFailures)}`);
  }catch(error){
    const failure=String(error?.stack||error);result.failure=failure;report.failures.push({viewport:viewport.name,failure});
    try{await page.screenshot({path:path.join(outputDir,`${outputPrefix}-${viewport.name}-failure.png`),fullPage:true})}catch{}
  }finally{report.viewports.push(result);await browser.close()}
}
report.finishedAt=new Date().toISOString();
await fs.writeFile(path.join(outputDir,`${outputPrefix}-report.json`),JSON.stringify(report,null,2),'utf8');
console.log(JSON.stringify(report,null,2));
if(report.failures.length)process.exit(1);
