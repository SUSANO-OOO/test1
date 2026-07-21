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
const sections=['problems','makeover','deliverables','case-zero','about','process','monitor','faq','contact'];
await fs.mkdir(outputDir,{recursive:true});
const report={baseUrl,startedAt:new Date().toISOString(),viewports:[],failures:[]};

for(const viewport of viewports){
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({
    viewport:{width:viewport.width,height:viewport.height},
    deviceScaleFactor:1,
    permissions:['clipboard-read','clipboard-write']
  });
  const page=await context.newPage();
  const consoleErrors=[];const pageErrors=[];const failedRequests=[];const sameOrigin404=[];
  page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text())});
  page.on('pageerror',error=>pageErrors.push(String(error)));
  page.on('requestfailed',request=>failedRequests.push({url:request.url(),reason:request.failure()?.errorText||'unknown'}));
  page.on('response',response=>{
    if(response.status()!==404)return;
    try{if(new URL(response.url()).origin===new URL(baseUrl).origin)sameOrigin404.push(response.url())}catch{}
  });
  const result={...viewport,consoleErrors,pageErrors,failedRequests,sameOrigin404,sections:{}};

  try{
    await page.goto(baseUrl,{waitUntil:'networkidle',timeout:60000});
    await page.waitForSelector('.hero h1');
    await page.waitForFunction(()=>document.documentElement.dataset.siteReady==='true',{timeout:15000});
    await page.waitForFunction(()=>{
      const image=document.querySelector('.portrait-frame img');
      return Boolean(image?.complete&&image.naturalWidth>0&&image.naturalHeight>0);
    },{timeout:30000});
    await page.waitForTimeout(900);

    result.initial=await page.evaluate(()=>{
      const image=document.querySelector('.portrait-frame img');
      const scene=document.querySelector('#architectureScene');
      const h1=document.querySelector('.hero h1');
      const lead=document.querySelector('.hero-lead');
      return{
        title:document.title,
        h1:h1?.innerText||'',
        h1Size:Number.parseFloat(getComputedStyle(h1).fontSize),
        leadSize:Number.parseFloat(getComputedStyle(lead).fontSize),
        siteLayers:document.querySelectorAll('.site-layer').length,
        problemRows:document.querySelectorAll('.problem-row').length,
        deliverables:document.querySelectorAll('.deliverable-map article').length,
        strengths:document.querySelectorAll('.strength-item').length,
        processSteps:document.querySelectorAll('.process-timeline article').length,
        faqItems:document.querySelectorAll('.faq-item').length,
        contactActions:document.querySelectorAll('#contact .contact-actions>*').length,
        canvasCount:document.querySelectorAll('canvas').length,
        portrait:{src:image?.getAttribute('src')||'',width:image?.naturalWidth||0,height:image?.naturalHeight||0},
        sceneRect:scene?.getBoundingClientRect().toJSON(),
        horizontalOverflow:document.documentElement.scrollWidth>innerWidth+1,
        mobileDock:getComputedStyle(document.querySelector('.mobile-dock')).display,
        instagramHref:document.querySelector('#contact a[href*="instagram.com"]')?.href||''
      };
    });

    if(!result.initial.h1.includes('相談につながる')||!result.initial.h1.includes('ホームページ'))throw new Error(`${viewport.name}: customer outcome is missing from hero`);
    if(result.initial.h1Size<40)throw new Error(`${viewport.name}: hero heading is too small`);
    if(result.initial.leadSize<14)throw new Error(`${viewport.name}: hero lead is too small`);
    if(result.initial.siteLayers!==4)throw new Error(`${viewport.name}: expected four meaningful site layers`);
    if(result.initial.problemRows!==4)throw new Error(`${viewport.name}: expected four customer problems`);
    if(result.initial.deliverables!==4)throw new Error(`${viewport.name}: expected four deliverables`);
    if(result.initial.strengths!==3)throw new Error(`${viewport.name}: expected three experience-backed strengths`);
    if(result.initial.processSteps!==4)throw new Error(`${viewport.name}: expected four process steps`);
    if(result.initial.faqItems!==5)throw new Error(`${viewport.name}: expected five FAQ items`);
    if(result.initial.contactActions<2)throw new Error(`${viewport.name}: contact actions missing`);
    if(result.initial.canvasCount!==0)throw new Error(`${viewport.name}: meaningless canvas remains`);
    if(!/portrait\.webp/.test(result.initial.portrait.src)||result.initial.portrait.width<=0)throw new Error(`${viewport.name}: portrait invalid`);
    if(!result.initial.sceneRect?.width||!result.initial.sceneRect?.height)throw new Error(`${viewport.name}: site architecture visual is missing`);
    if(result.initial.horizontalOverflow)throw new Error(`${viewport.name}: horizontal overflow`);
    if(viewport.mobile&&result.initial.mobileDock==='none')throw new Error(`${viewport.name}: mobile dock hidden`);
    if(!viewport.mobile&&result.initial.mobileDock!=='none')throw new Error(`${viewport.name}: mobile dock unexpectedly visible`);
    if(!result.initial.instagramHref.includes('/kite9njp'))throw new Error(`${viewport.name}: Instagram target is wrong`);

    const layerBefore=await page.locator('.layer-message').evaluate(element=>getComputedStyle(element).transform);
    const sceneBox=await page.locator('#architectureScene').boundingBox();
    if(sceneBox){
      await page.mouse.move(sceneBox.x+sceneBox.width*.82,sceneBox.y+sceneBox.height*.24);
      await page.waitForTimeout(450);
      const layerAfter=await page.locator('.layer-message').evaluate(element=>getComputedStyle(element).transform);
      result.architectureInteraction={before:layerBefore,after:layerAfter,changed:layerBefore!==layerAfter};
      if(!viewport.mobile&&!result.architectureInteraction.changed)throw new Error(`${viewport.name}: meaningful 3D architecture does not react`);
    }

    for(const id of sections){
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      await page.waitForTimeout(350);
      const state=await page.evaluate(target=>{
        const section=document.getElementById(target);
        const rect=section.getBoundingClientRect();
        const visibleText=[...section.querySelectorAll('h2,h3,p,li,button,a')].filter(element=>{
          const style=getComputedStyle(element);const box=element.getBoundingClientRect();
          return style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity)>.1&&box.width>0&&box.height>0;
        });
        const tinyText=visibleText.filter(element=>Number.parseFloat(getComputedStyle(element).fontSize)<11).map(element=>element.textContent?.trim().slice(0,70));
        return{rect:rect.toJSON(),visibleTextCount:visibleText.length,tinyText};
      },id);
      result.sections[id]=state;
      if(!state.rect.width||state.rect.height<120)throw new Error(`${viewport.name}: ${id} has no meaningful layout`);
      if(state.visibleTextCount<3)throw new Error(`${viewport.name}: ${id} has too little visible content`);
      if(state.tinyText.length>6)throw new Error(`${viewport.name}: ${id} contains excessive tiny text`);
    }

    await page.locator('#makeover').scrollIntoViewIfNeeded();
    await page.locator('.makeover-tab[data-view="after"]').click();
    await page.waitForTimeout(250);
    result.makeoverAfter=await page.evaluate(()=>({
      selected:document.querySelector('.makeover-tab[data-view="after"]')?.getAttribute('aria-selected'),
      afterHidden:document.querySelector('[data-makeover="after"]')?.hidden,
      beforeHidden:document.querySelector('[data-makeover="before"]')?.hidden,
      text:document.querySelector('[data-makeover="after"]')?.innerText||'',
      note:document.querySelector('[data-note="after"]')?.innerText||''
    }));
    if(result.makeoverAfter.selected!=='true'||result.makeoverAfter.afterHidden||!result.makeoverAfter.beforeHidden)throw new Error(`${viewport.name}: before/after interaction failed`);
    if(!result.makeoverAfter.text.includes('週2回')||!result.makeoverAfter.note.includes('対象者'))throw new Error(`${viewport.name}: makeover does not demonstrate a customer-facing change`);

    await page.locator('.faq-item button').first().click();
    await page.waitForTimeout(120);
    result.faq=await page.evaluate(()=>({
      expanded:document.querySelector('.faq-item button')?.getAttribute('aria-expanded'),
      answerHidden:document.querySelector('.faq-answer')?.hidden,
      answerText:document.querySelector('.faq-answer')?.innerText||''
    }));
    if(result.faq.expanded!=='true'||result.faq.answerHidden||!result.faq.answerText.includes('問題ありません'))throw new Error(`${viewport.name}: FAQ interaction failed`);

    await page.locator('#contact').scrollIntoViewIfNeeded();
    await page.locator('#copyBrief').click();
    await page.waitForTimeout(200);
    result.copyStatus=(await page.locator('#copyStatus').textContent())?.trim()||'';
    if(!result.copyStatus.includes('コピー'))throw new Error(`${viewport.name}: consultation template feedback missing`);

    await page.evaluate(()=>document.querySelectorAll('.reveal').forEach(element=>element.classList.add('is-visible')));
    await page.locator('#top').scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(outputDir,`${outputPrefix}-${viewport.name}-top.png`),fullPage:false});
    await page.locator('#makeover').scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(outputDir,`${outputPrefix}-${viewport.name}-makeover.png`),fullPage:false});
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(outputDir,`${outputPrefix}-${viewport.name}-contact.png`),fullPage:false});
    await page.screenshot({path:path.join(outputDir,`${outputPrefix}-${viewport.name}-full.png`),fullPage:true});

    if(consoleErrors.length)throw new Error(`${viewport.name}: console errors: ${consoleErrors.join(' | ')}`);
    if(pageErrors.length)throw new Error(`${viewport.name}: page errors: ${pageErrors.join(' | ')}`);
    if(sameOrigin404.length)throw new Error(`${viewport.name}: same-origin 404: ${sameOrigin404.join(' | ')}`);
    const localFailures=failedRequests.filter(item=>{try{return new URL(item.url).origin===new URL(baseUrl).origin}catch{return true}});
    if(localFailures.length)throw new Error(`${viewport.name}: failed local requests: ${JSON.stringify(localFailures)}`);
  }catch(error){
    const failure=String(error?.stack||error);
    result.failure=failure;
    report.failures.push({viewport:viewport.name,failure});
    try{await page.screenshot({path:path.join(outputDir,`${outputPrefix}-${viewport.name}-failure.png`),fullPage:true})}catch{}
  }finally{
    report.viewports.push(result);
    await browser.close();
  }
}

report.finishedAt=new Date().toISOString();
await fs.writeFile(path.join(outputDir,`${outputPrefix}-report.json`),JSON.stringify(report,null,2),'utf8');
console.log(JSON.stringify(report,null,2));
if(report.failures.length)process.exit(1);
