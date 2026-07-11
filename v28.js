(()=>{
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.documentElement.dataset.siteVersion='28';

  const copy={
    homeDirectory:{
      title:'詳しい内容を項目別にまとめています。',
      body:'対応できる業務、実務経験、仕事の進め方、現在の活動をそれぞれ確認できます。'
    },
    work:{
      title:'対応できる業務',
      body:'これまでの実務経験をもとに、業務整理、情報整備、問い合わせ運営、コンテンツ構成とAI試作に対応します。',
      fit:'このような課題に対応します'
    },
    experience:{
      title:'これまでの実務経験',
      body:'問い合わせ窓口、店舗運営、PC技術支援の現場で、判断基準の整理、情報共有、手順化を担当してきました。'
    },
    process:{
      title:'仕事の進め方',
      body:'目的と完成条件を最初に確認し、早い段階で初稿や試作品を共有します。途中で確認と修正を重ね、大きな手戻りを防ぎます。',
      principle:'作り始める前に、完成の基準を揃える。'
    },
    current:{
      title:'現在の取り組み',
      body:'現在は、独立に向けたオンラインスクールで学びながら、男性向け減量コンテンツの設計、AIを活用した試作、独立志望者向けコミュニティの準備を進めています。'
    },
    journal:{
      title:'活動と制作の記録',
      body:'独立準備、コンテンツ設計、AI制作について、実施したこと、分かったこと、変更したことを記録しています。'
    }
  };

  const homeTitle=$('.home-directory-head h2');
  const homeBody=$('.home-directory-head p');
  if(homeTitle)homeTitle.textContent=copy.homeDirectory.title;
  if(homeBody)homeBody.textContent=copy.homeDirectory.body;

  const setHeading=(page,values)=>{
    const root=$(`.app-page[data-page="${page}"]`);
    if(!root)return;
    const title=$('.section-heading h2',root);
    const body=$('.section-heading>p',root);
    if(title)title.textContent=values.title;
    if(body)body.textContent=values.body;
  };
  ['work','experience','process','current','journal'].forEach(page=>setHeading(page,copy[page]));
  const fit=$('.fit-heading h3');
  if(fit)fit.textContent=copy.work.fit;
  const principle=$('.process-intro h3');
  if(principle)principle.textContent=copy.process.principle;

  const navLabels={
    home:'概要',work:'対応業務',experience:'実務経験',
    process:'進め方',current:'現在',journal:'記録'
  };
  $$('.site-header nav a[data-route]').forEach(a=>{
    const route=a.dataset.route;
    if(a.querySelector('small'))return;
    const english=a.textContent.trim();
    a.textContent='';
    const strong=document.createElement('span');strong.textContent=english;
    const small=document.createElement('small');small.textContent=navLabels[route]||'';
    a.append(strong,small);
  });

  const pageNames={
    home:'OVERVIEW',work:'CAPABILITIES',experience:'EVIDENCE',
    process:'WORKFLOW',current:'IN PROGRESS',journal:'BUILD LOG',contact:'CONTACT'
  };
  $$('.app-page').forEach(page=>page.dataset.watermark=pageNames[page.dataset.page]||'');

  const insertAfterHeading=(page,html)=>{
    const root=$(`.app-page[data-page="${page}"] .shell`);
    const heading=root?.querySelector('.section-heading');
    if(!root||!heading||root.querySelector('.v28-meaning-strip'))return;
    heading.insertAdjacentHTML('afterend',html);
  };

  insertAfterHeading('work',`
    <div class="v28-meaning-strip work-transform reveal" aria-label="業務改善の基本的な流れ">
      <div><small>01 / INPUT</small><b>課題と事実を集める</b></div>
      <i aria-hidden="true"></i>
      <div><small>02 / STRUCTURE</small><b>役割と判断基準を整理</b></div>
      <i aria-hidden="true"></i>
      <div><small>03 / DOCUMENT</small><b>手順と情報へ落とす</b></div>
      <i aria-hidden="true"></i>
      <div><small>04 / OPERATE</small><b>現場で使える状態にする</b></div>
    </div>`);

  insertAfterHeading('experience',`
    <div class="v28-meaning-strip experience-lane reveal" aria-label="経験領域">
      <div><span>01</span><b>問い合わせ窓口</b><small>運営・応答率・ナレッジ</small></div>
      <div><span>02</span><b>店舗責任者</b><small>売上・採用・育成・引き継ぎ</small></div>
      <div><span>03</span><b>PC技術支援</b><small>切り分け・手順化・社内展開</small></div>
    </div>`);

  insertAfterHeading('current',`
    <div class="v28-meaning-strip current-status reveal" aria-label="現在の活動段階">
      <div><span class="status-dot"></span><small>LEARNING</small><b>独立に必要な設計を学ぶ</b></div>
      <div><span class="status-dot"></span><small>BUILDING</small><b>コンテンツと試作品を作る</b></div>
      <div><span class="status-dot"></span><small>TESTING</small><b>発信と提供方法を検証する</b></div>
    </div>`);

  insertAfterHeading('journal',`
    <div class="v28-meaning-strip journal-cycle reveal" aria-label="記録の目的">
      <div><small>CAPTURE</small><b>実施内容を残す</b></div>
      <i aria-hidden="true"></i>
      <div><small>REVIEW</small><b>結果と気づきを確認</b></div>
      <i aria-hidden="true"></i>
      <div><small>UPDATE</small><b>次の行動へ反映</b></div>
    </div>`);

  const processIntro=$('.process-intro');
  if(processIntro&&!$('.process-loop-note')){
    processIntro.insertAdjacentHTML('afterend',`
      <div class="process-loop-note reveal" aria-label="改善の考え方">
        <span>確認</span><i></i><span>修正</span><i></i><span>更新</span>
        <p>PDCAは独立した説明項目ではなく、各工程の中で小さく繰り返します。</p>
      </div>`);
  }

  const hero=$('.app-page[data-page="home"] .hero-layout');
  if(hero&&!$('.hero-system-map')){
    hero.insertAdjacentHTML('beforeend',`
      <div class="hero-system-map" aria-hidden="true">
        <svg viewBox="0 0 420 250" preserveAspectRatio="none">
          <path d="M58 178 C128 88, 212 70, 354 105"/>
          <path d="M58 178 C188 222, 272 216, 354 105"/>
          <path d="M166 74 C214 126, 254 163, 312 208"/>
          <circle cx="58" cy="178" r="4"/>
          <circle cx="166" cy="74" r="4"/>
          <circle cx="354" cy="105" r="4"/>
          <circle cx="312" cy="208" r="4"/>
        </svg>
      </div>`);
  }

  const contactText=$('.contact-layout>div>p');
  if(contactText)contactText.textContent='業務フローや社内ナレッジの整理、問い合わせ運営、LP・発信内容の構成、AIを使った試作についてご相談いただけます。DMには、現在の状況、相談内容、希望時期をご記載ください。';

  const mediaCaption=$('.hero-media-caption');
  if(mediaCaption){
    mediaCaption.innerHTML='<span>SYSTEM VIEW</span><b>整理 → 共有 → 定着</b>';
  }

  const canvas=document.createElement('canvas');
  canvas.id='systemCanvas';
  canvas.setAttribute('aria-hidden','true');
  const ambient=$('#ambientCanvas');
  ambient?.after(canvas);
  const ctx=canvas.getContext('2d');
  let w=0,h=0,dpr=1,t=0,route='home';

  const routeLayouts={
    home:[[.10,.74],[.25,.20],[.50,.50],[.76,.18],[.90,.70]],
    work:[[.08,.26],[.28,.26],[.51,.48],[.73,.32],[.91,.55]],
    experience:[[.12,.20],[.32,.44],[.55,.25],[.77,.56],[.92,.34]],
    process:[[.12,.18],[.30,.38],[.49,.23],[.68,.49],[.88,.29]],
    current:[[.12,.66],[.34,.30],[.57,.56],[.78,.24],[.91,.64]],
    journal:[[.10,.32],[.31,.60],[.54,.34],[.76,.61],[.92,.37]],
    contact:[[.12,.58],[.36,.32],[.64,.52],[.88,.28]]
  };

  function resize(){
    dpr=Math.min(devicePixelRatio||1,2);
    w=innerWidth;h=innerHeight;
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
    canvas.style.width=w+'px';canvas.style.height=h+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  resize();addEventListener('resize',resize,{passive:true});

  const observer=new MutationObserver(()=>{route=document.body.dataset.route||'home'});
  observer.observe(document.body,{attributes:true,attributeFilter:['data-route']});
  route=document.body.dataset.route||'home';

  function draw(){
    ctx.clearRect(0,0,w,h);
    const pts=(routeLayouts[route]||routeLayouts.home).map(([x,y])=>[x*w,y*h]);
    const accent=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()||'#78f4eb';
    ctx.save();
    ctx.lineWidth=1;
    ctx.strokeStyle='rgba(255,255,255,.035)';
    for(let x=0;x<w;x+=Math.max(120,w/12)){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}
    for(let y=0;y<h;y+=Math.max(110,h/8)){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}

    ctx.strokeStyle=accent;ctx.globalAlpha=.12;
    ctx.beginPath();
    pts.forEach((p,i)=>{if(i===0)ctx.moveTo(...p);else ctx.lineTo(...p)});
    ctx.stroke();

    pts.forEach((p,i)=>{
      const pulse=.5+.5*Math.sin(t*.015+i*1.6);
      ctx.globalAlpha=.16+pulse*.12;
      ctx.fillStyle=accent;
      ctx.beginPath();ctx.arc(p[0],p[1],2+pulse*2,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=.10;
      ctx.strokeStyle=accent;
      ctx.beginPath();ctx.arc(p[0],p[1],10+pulse*8,0,Math.PI*2);ctx.stroke();
    });

    const seg=(t*.0015)%(pts.length-1);
    const i=Math.floor(seg),f=seg-i;
    if(pts[i]&&pts[i+1]){
      const x=pts[i][0]+(pts[i+1][0]-pts[i][0])*f;
      const y=pts[i][1]+(pts[i+1][1]-pts[i][1])*f;
      ctx.globalAlpha=.5;ctx.fillStyle=accent;
      ctx.beginPath();ctx.arc(x,y,2.2,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
    t++;
    if(!reduced)requestAnimationFrame(draw);
  }
  draw();

  const status=$('#connectStatus');
  if(status){
    new MutationObserver(()=>{
      if(!status.textContent.includes('接続できませんでした'))return;
      const e=window.PAOPAO_GITHUB_ERROR;
      if(e?.status===401)status.textContent='専用キーが無効か期限切れです。接続を解除し、新しいキーを貼り直してください。';
      else if(e?.status===403)status.textContent='専用キーに書き込み権限がありません。test1 の Issues を Read and write に設定してください。';
      else if(e?.status===404)status.textContent='専用キーの対象に test1 が含まれていません。Repository access を確認してください。';
    }).observe(status,{childList:true,subtree:true});
  }
})();