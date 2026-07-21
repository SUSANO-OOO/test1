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
const sections=['problems','makeover','deliverables','discovery','case-zero','about','process','monitor','faq','contact'];
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
    await page.waitForFunction(()=>[...document.styleSheets].some(sheet=>sheet.href?.includes('v33-sales.css')),{timeout:15000});
    await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';window.scrollTo(0,0)});
    await page.waitForTimeout(500);

    result.initial=await page.evaluate(()=>{
      const image=document.querySelector('.portrait-frame img');
      const scene=document.querySelector('#architectureScene');
      const architectureWrap=document.querySelector('.architecture-wrap');
      const heroCopy=document.querySelector('.hero-copy');
      const h1=document.querySelector('.hero h1');
      const emphasis=document.querySelector('.hero-emphasis');
      const lead=document.querySelector('.hero-lead');
      const header=document.querySelector('.header-inner');
      const form=document.querySelector('.contact-form-card');
      return{
        title:document.title,
        canonical:document.querySelector('link[rel="canonical"]')?.href||'',
        scrollY:window.scrollY,
        viewportWidth:innerWidth,
        headerBottom:header?.getBoundingClientRect().bottom||0,
        heroCopyRect:heroCopy?.getBoundingClientRect().toJSON(),
        h1Rect:h1?.getBoundingClientRect().toJSON(),
        emphasisRect:emphasis?.getBoundingClientRect().toJSON(),
        h1Top:h1?.getBoundingClientRect().top||0,
        h1:h1?.innerText||'',
        h1Size:Number.parseFloat(getComputedStyle(h1).fontSize),
        leadSize:Number.parseFloat(getComputedStyle(lead).fontSize),
        makeoverHeading:document.querySelector('#makeover h2')?.innerText||'',
        offerHeading:document.querySelector('#deliverables h2')?.innerText||'',
        discoveryHeading:document.querySelector('#discovery h2')?.innerText||'',
        monitorHeading:document.querySelector('#monitor h2')?.innerText||'',
        contactHeading:document.querySelector('#contact h2')?.innerText||'',
        demoHeadline:document.querySelector('.after-hero h3')?.innerText||'',
        siteLayers:document.querySelectorAll('.site-layer').length,
        problemRows:document.querySelectorAll('.problem-row').length,
        pagePlans:document.querySelectorAll('.page-plan-grid article').length,
        includedItems:document.querySelectorAll('.included-grid article').length,
        discoveryItems:document.querySelectorAll('.discovery-points article').length,
        strengths:document.querySelectorAll('.strength-item').length,
        processSteps:document.querySelectorAll('.process-timeline article').length,
        monitorItems:document.querySelectorAll('.monitor-conditions article').length,
        faqItems:document.querySelectorAll('.faq-item').length,
        comparisonRows:document.querySelectorAll('.comparison-table>div').length,
        formAction:form?.action||'',
        requiredFields:form?.querySelectorAll('input[required],select[required],textarea[required]').length||0,
        formNext:form?.querySelector('input[name="_next"]')?.value||'',
        directEmail:document.querySelector('#contact a[href^="mailto:"]')?.getAttribute('href')||'',
        canvasCount:document.querySelectorAll('canvas').length,
        portrait:{src:image?.getAttribute('src')||'',width:image?.naturalWidth||0,height:image?.naturalHeight||0},
        sceneRect:scene?.getBoundingClientRect().toJSON(),
        architectureWrapRect:architectureWrap?.getBoundingClientRect().toJSON(),
        horizontalOverflow:document.documentElement.scrollWidth>innerWidth+1,
        mobileDock:getComputedStyle(document.querySelector('.mobile-dock')).display,
        instagramHref:document.querySelector('#contact a[href*="instagram.com"]')?.href||''
      };
    });

    if(result.initial.scrollY!==0)throw new Error(`${viewport.name}: initial page did not start at the top`);
    if(result.initial.h1Top<result.initial.headerBottom+8)throw new Error(`${viewport.name}: hero heading is hidden under the header`);
    if(!result.initial.h1.includes('ホームページは欲しい')||!result.initial.h1.includes('5ページ分'))throw new Error(`${viewport.name}: concrete five-page offer is missing from hero`);
    if(!result.initial.title.includes('5ページ')||!result.initial.canonical.endsWith('/test1/'))throw new Error(`${viewport.name}: title or canonical is incorrect`);
    if(!result.initial.makeoverHeading.includes('伝える内容')||!result.initial.offerHeading.includes('ここまで作ります'))throw new Error(`${viewport.name}: sales-led section copy is missing`);
    if(!result.initial.discoveryHeading.includes('AI')||!result.initial.monitorHeading.includes('無料の範囲'))throw new Error(`${viewport.name}: discovery or offer conditions are missing`);
    if(!result.initial.contactHeading.includes('フォーム'))throw new Error(`${viewport.name}: contact form promise is missing`);
    if(result.initial.h1Size<(viewport.mobile?30:38)||result.initial.leadSize<14)throw new Error(`${viewport.name}: hero typography is too small`);
    if(result.initial.h1Rect?.right>result.initial.heroCopyRect?.right+2||result.initial.emphasisRect?.right>result.initial.heroCopyRect?.right+2)throw new Error(`${viewport.name}: hero copy escapes its column`);
    if(result.initial.h1Rect?.left<result.initial.heroCopyRect?.left-2)throw new Error(`${viewport.name}: hero copy escapes left edge`);
    if(result.initial.architectureWrapRect?.width>result.initial.viewportWidth+1||result.initial.architectureWrapRect?.right>result.initial.viewportWidth+1)throw new Error(`${viewport.name}: architecture wrapper exceeds viewport`);
    if(!result.initial.demoHeadline.includes('週2回')||!result.initial.demoHeadline.includes('完全予約制'))throw new Error(`${viewport.name}: specific makeover offer is missing`);
    if(result.initial.siteLayers!==4)throw new Error(`${viewport.name}: expected four meaningful design layers`);
    if(result.initial.problemRows!==4)throw new Error(`${viewport.name}: expected four customer problems`);
    if(result.initial.pagePlans!==5)throw new Error(`${viewport.name}: expected five standard pages`);
    if(result.initial.includedItems!==6)throw new Error(`${viewport.name}: expected six included deliverables`);
    if(result.initial.discoveryItems!==4)throw new Error(`${viewport.name}: expected four search/AI foundations`);
    if(result.initial.strengths!==3||result.initial.processSteps!==4)throw new Error(`${viewport.name}: experience or process count is wrong`);
    if(result.initial.monitorItems!==6||result.initial.faqItems!==6)throw new Error(`${viewport.name}: conditions or FAQ count is wrong`);
    if(result.initial.comparisonRows!==6)throw new Error(`${viewport.name}: makeover comparison is incomplete`);
    if(!result.initial.formAction.includes('formsubmit.co/o.kite914@gmail.com'))throw new Error(`${viewport.name}: form destination is wrong`);
    if(result.initial.requiredFields<6)throw new Error(`${viewport.name}: contact form lacks required information`);
    if(!result.initial.formNext.endsWith('/test1/thanks.html'))throw new Error(`${viewport.name}: contact confirmation redirect is wrong`);
    if(result.initial.directEmail!=='mailto:o.kite914@gmail.com')throw new Error(`${viewport.name}: fallback email is wrong`);
    if(result.initial.canvasCount!==0)throw new Error(`${viewport.name}: meaningless canvas remains`);
    if(!/portrait\.webp/.test(result.initial.portrait.src)||result.initial.portrait.width<=0)throw new Error(`${viewport.name}: portrait invalid`);
    if(!result.initial.sceneRect?.width||!result.initial.sceneRect?.height)throw new Error(`${viewport.name}: architecture visual is missing`);
    if(result.initial.horizontalOverflow)throw new Error(`${viewport.name}: horizontal overflow`);
    if(viewport.mobile&&result.initial.mobileDock==='none')throw new Error(`${viewport.name}: mobile dock hidden`);
    if(!viewport.mobile&&result.initial.mobileDock!=='none')throw new Error(`${viewport.name}: mobile dock unexpectedly visible`);
    if(!result.initial.instagramHref.includes('/kite9njp'))throw new Error(`${viewport.name}: Instagram target is wrong`);

    const robotsResponse=await page.request.get(new URL('robots.txt',baseUrl).href);
    const sitemapResponse=await page.request.get(new URL('sitemap.xml',baseUrl).href);
    const privacyResponse=await page.request.get(new URL('privacy.html',baseUrl).href);
    const thanksResponse=await page.request.get(new URL('thanks.html',baseUrl).href);
    if(!robotsResponse.ok()||!(await robotsResponse.text()).includes('sitemap.xml'))throw new Error(`${viewport.name}: robots.txt is invalid`);
    if(!sitemapResponse.ok()||!(await sitemapResponse.text()).includes('/test1/'))throw new Error(`${viewport.name}: sitemap.xml is invalid`);
    if(!privacyResponse.ok()||!thanksResponse.ok())throw new Error(`${viewport.name}: privacy or thanks page is missing`);

    await page.screenshot({path:path.join(outputDir,`${outputPrefix}-${viewport.name}-top.png`),fullPage:false});

    const anchorSelector=viewport.mobile?'.mobile-dock a[href="#makeover"]':'.desktop-nav a[href="#makeover"]';
    await page.locator(anchorSelector).click();
    await page.waitForFunction(()=>{
      const header=document.querySelector('.header-inner')?.getBoundingClientRect();
      const target=document.querySelector('#makeover')?.getBoundingClientRect();
      if(!header||!target)return false;
      return target.top>=header.bottom+6&&target.top<=header.bottom+200;
    },{timeout:4000});

    await page.evaluate(()=>document.querySelector('#architectureScene')?.scrollIntoView({block:'center',behavior:'auto'}));
    await page.waitForTimeout(180);
    const layerBefore=await page.locator('.layer-message').evaluate(element=>getComputedStyle(element).transform);
    const sceneBox=await page.locator('#architectureScene').boundingBox();
    if(sceneBox){
      await page.mouse.move(sceneBox.x+sceneBox.width*.78,sceneBox.y+sceneBox.height*.28);
      await page.waitForTimeout(450);
      const layerAfter=await page.locator('.layer-message').evaluate(element=>getComputedStyle(element).transform);
      result.architectureInteraction={before:layerBefore,after:layerAfter,changed:layerBefore!==layerAfter};
      if(!viewport.mobile&&!result.architectureInteraction.changed)throw new Error(`${viewport.name}: architecture does not react`);
    }

    for(const id of sections){
      await page.evaluate(target=>document.getElementById(target)?.scrollIntoView({block:'start',behavior:'auto'}),id);
      await page.waitForTimeout(180);
      const state=await page.evaluate(target=>{
        const section=document.getElementById(target);
        const rect=section.getBoundingClientRect();
        const heading=section.querySelector('h2');
        const visibleText=[...section.querySelectorAll('h2,h3,p,li,button,a,label')].filter(element=>{
          const style=getComputedStyle(element);const box=element.getBoundingClientRect();
          return style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity)>.1&&box.width>0&&box.height>0;
        });
        return{rect:rect.toJSON(),headingRect:heading?.getBoundingClientRect().toJSON()||null,visibleTextCount:visibleText.length};
      },id);
      result.sections[id]=state;
      if(!state.rect.width||state.rect.height<120)throw new Error(`${viewport.name}: ${id} has no meaningful layout`);
      if(state.visibleTextCount<3)throw new Error(`${viewport.name}: ${id} has too little visible content`);
      if(state.headingRect&&state.headingRect.top<70)throw new Error(`${viewport.name}: ${id} heading is hidden under fixed header`);
    }

    await page.evaluate(()=>document.querySelector('#makeover')?.scrollIntoView({block:'start',behavior:'auto'}));
    await page.locator('.makeover-tab[data-view="after"]').click();
    await page.waitForTimeout(180);
    result.makeoverAfter=await page.evaluate(()=>({
      selected:document.querySelector('.makeover-tab[data-view="after"]')?.getAttribute('aria-selected'),
      afterHidden:document.querySelector('[data-makeover="after"]')?.hidden,
      beforeHidden:document.querySelector('[data-makeover="before"]')?.hidden,
      text:document.querySelector('[data-makeover="after"]')?.innerText||'',
      note:document.querySelector('[data-note="after"]')?.innerText||''
    }));
    if(result.makeoverAfter.selected!=='true'||result.makeoverAfter.afterHidden||!result.makeoverAfter.beforeHidden)throw new Error(`${viewport.name}: before/after interaction failed`);
    if(!result.makeoverAfter.text.includes('完全予約制')||!result.makeoverAfter.note.includes('地域'))throw new Error(`${viewport.name}: makeover does not demonstrate concrete changes`);

    await page.locator('.faq-item button').first().click();
    await page.waitForTimeout(100);
    result.faq=await page.evaluate(()=>({expanded:document.querySelector('.faq-item button')?.getAttribute('aria-expanded'),answerHidden:document.querySelector('.faq-answer')?.hidden,answerText:document.querySelector('.faq-answer')?.innerText||''}));
    if(result.faq.expanded!=='true'||result.faq.answerHidden||!result.faq.answerText.includes('Zoom'))throw new Error(`${viewport.name}: FAQ interaction failed`);

    await page.evaluate(()=>document.querySelector('#contact')?.scrollIntoView({block:'start',behavior:'auto'}));
    await page.locator('#copyBrief').click();
    await page.waitForTimeout(160);
    result.copyStatus=(await page.locator('#copyStatus').textContent())?.trim()||'';
    if(!result.copyStatus.includes('コピー'))throw new Error(`${viewport.name}: consultation copy feedback missing`);

    await page.evaluate(()=>document.querySelectorAll('.reveal').forEach(element=>element.classList.add('is-visible')));
    for(const target of ['makeover','deliverables','discovery','contact']){
      await page.evaluate(id=>document.querySelector(`#${id}`)?.scrollIntoView({block:'start',behavior:'auto'}),target);
      await page.waitForTimeout(80);
      await page.screenshot({path:path.join(outputDir,`${outputPrefix}-${viewport.name}-${target}.png`),fullPage:false});
    }
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.waitForTimeout(80);
    await page.screenshot({path:path.join(outputDir,`${outputPrefix}-${viewport.name}-full.png`),fullPage:true});

    if(consoleErrors.length)throw new Error(`${viewport.name}: console errors: ${consoleErrors.join(' | ')}`);
    if(pageErrors.length)throw new Error(`${viewport.name}: page errors: ${pageErrors.join(' | ')}`);
    if(sameOrigin404.length)throw new Error(`${viewport.name}: same-origin 404: ${sameOrigin404.join(' | ')}`);
    const localFailures=failedRequests.filter(item=>{try{return new URL(item.url).origin===new URL(baseUrl).origin}catch{return true}});
    if(localFailures.length)throw new Error(`${viewport.name}: failed local requests: ${JSON.stringify(localFailures)}`);
  }catch(error){
    const failure=String(error?.stack||error);result.failure=failure;report.failures.push({viewport:viewport.name,failure});
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
