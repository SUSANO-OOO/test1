import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const startUrl=process.env.BASE_URL||'http://127.0.0.1:4173/index.html';
const rootUrl=new URL('.',startUrl).href;
const outputPrefix=process.env.OUTPUT_PREFIX||'local';
const outputDir=path.resolve('qa-artifacts');
const viewports=[
  {name:'desktop-1440',width:1440,height:900},
  {name:'tablet-1024',width:1024,height:768},
  {name:'mobile-390',width:390,height:844}
];
const pages=[
  {file:'index.html',slug:'home',h1:'ホームページは欲しい',must:['基本5ページ','何を載せればいいのか分からない']},
  {file:'service.html',slug:'service',h1:'無料モニターで、何を作るのか',must:['基本の5ページ','検索・AIへの基礎対応']},
  {file:'works.html',slug:'works',h1:'見た目を変えるだけでは',must:['改善前','改善後','架空例']},
  {file:'about.html',slug:'about',h1:'話を聞き',must:['これまでの経験','現在の立ち位置']},
  {file:'contact.html',slug:'contact',h1:'内容が決まっていなくても',must:['無料モニターの主な条件','問い合わせフォーム']}
];
await fs.mkdir(outputDir,{recursive:true});
const report={rootUrl,startedAt:new Date().toISOString(),viewports:[],failures:[]};

for(const viewport of viewports){
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},deviceScaleFactor:1});
  const result={...viewport,pages:{}};
  try{
    for(const item of pages){
      const page=await context.newPage();
      const consoleErrors=[];const pageErrors=[];const failedRequests=[];const sameOrigin404=[];
      page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text())});
      page.on('pageerror',error=>pageErrors.push(String(error)));
      page.on('requestfailed',request=>failedRequests.push({url:request.url(),reason:request.failure()?.errorText||'unknown'}));
      page.on('response',response=>{if(response.status()===404&&new URL(response.url()).origin===new URL(rootUrl).origin)sameOrigin404.push(response.url())});

      const url=new URL(item.file,rootUrl).href;
      await page.goto(url,{waitUntil:'networkidle',timeout:60000});
      await page.waitForSelector('h1');
      await page.waitForTimeout(250);

      const state=await page.evaluate(()=>{
        const h1=document.querySelector('h1');
        const header=document.querySelector('.site-header');
        const nav=[...document.querySelectorAll('.main-nav a')].map(link=>({text:link.textContent?.trim()||'',href:link.getAttribute('href')||''}));
        const visibleText=[...document.querySelectorAll('h1,h2,h3,p,li,a,summary,label')].filter(element=>{
          const style=getComputedStyle(element);const rect=element.getBoundingClientRect();
          return style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity)>.1&&rect.width>0&&rect.height>0;
        });
        return{
          title:document.title,
          canonical:document.querySelector('link[rel="canonical"]')?.href||'',
          bodyText:document.body.innerText,
          h1:h1?.innerText||'',
          h1Size:Number.parseFloat(getComputedStyle(h1).fontSize),
          h1Rect:h1?.getBoundingClientRect().toJSON(),
          headerHeight:header?.getBoundingClientRect().height||0,
          nav,
          visibleTextCount:visibleText.length,
          horizontalOverflow:document.documentElement.scrollWidth>innerWidth+1,
          documentHeight:document.documentElement.scrollHeight,
          viewportHeight:innerHeight,
          stylesheet:[...document.styleSheets].some(sheet=>sheet.href?.includes('v34.css')),
          portrait:document.querySelector('img[src*="portrait.webp"]')?.getAttribute('src')||'',
          formAction:document.querySelector('form')?.action||'',
          requiredFields:document.querySelectorAll('form [required]').length
        };
      });

      if(!state.stylesheet)throw new Error(`${viewport.name}/${item.slug}: v34 stylesheet missing`);
      if(!state.h1.includes(item.h1))throw new Error(`${viewport.name}/${item.slug}: expected h1 copy missing`);
      for(const phrase of item.must){if(!state.bodyText.includes(phrase))throw new Error(`${viewport.name}/${item.slug}: required copy missing: ${phrase}`)}
      if(state.h1Size<(viewport.width<=390?36:42))throw new Error(`${viewport.name}/${item.slug}: h1 is too small`);
      if(state.h1Rect?.left<0||state.h1Rect?.right>viewport.width+1)throw new Error(`${viewport.name}/${item.slug}: h1 escapes viewport`);
      if(state.horizontalOverflow)throw new Error(`${viewport.name}/${item.slug}: horizontal overflow`);
      if(state.visibleTextCount<12)throw new Error(`${viewport.name}/${item.slug}: too little visible content`);
      if(state.nav.length!==5)throw new Error(`${viewport.name}/${item.slug}: navigation is incomplete`);
      if(consoleErrors.length||pageErrors.length||sameOrigin404.length)throw new Error(`${viewport.name}/${item.slug}: runtime error or 404`);
      const localFailures=failedRequests.filter(entry=>new URL(entry.url).origin===new URL(rootUrl).origin);
      if(localFailures.length)throw new Error(`${viewport.name}/${item.slug}: failed local request`);
      if(item.slug==='about'&&!state.portrait.includes('portrait.webp'))throw new Error(`${viewport.name}/about: portrait missing`);
      if(item.slug==='contact'){
        if(!state.formAction.includes('formsubmit.co/o.kite914@gmail.com'))throw new Error(`${viewport.name}/contact: form destination is wrong`);
        if(state.requiredFields<7)throw new Error(`${viewport.name}/contact: required form fields are incomplete`);
      }
      if(item.slug==='home'&&state.documentHeight>state.viewportHeight*8.5)throw new Error(`${viewport.name}/home: home page is still excessively long`);

      await page.screenshot({path:path.join(outputDir,`${outputPrefix}-${viewport.name}-${item.slug}.png`),fullPage:true});
      result.pages[item.slug]={url,...state,consoleErrors,pageErrors,failedRequests,sameOrigin404};
      await page.close();
    }

    const request=await context.request;
    for(const asset of ['robots.txt','sitemap.xml','privacy.html','thanks.html']){
      const response=await request.get(new URL(asset,rootUrl).href);
      if(!response.ok())throw new Error(`${viewport.name}: ${asset} missing`);
    }
    const sitemap=await (await request.get(new URL('sitemap.xml',rootUrl).href)).text();
    for(const item of pages){if(!sitemap.includes(item.file==='index.html'?'/test1/':`/test1/${item.file}`))throw new Error(`${viewport.name}: sitemap missing ${item.file}`)}
  }catch(error){
    const failure=String(error?.stack||error);result.failure=failure;report.failures.push({viewport:viewport.name,failure});
  }finally{
    report.viewports.push(result);await browser.close();
  }
}
report.finishedAt=new Date().toISOString();
await fs.writeFile(path.join(outputDir,`${outputPrefix}-report.json`),JSON.stringify(report,null,2),'utf8');
console.log(JSON.stringify(report,null,2));
if(report.failures.length)process.exit(1);
