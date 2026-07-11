(()=>{
  if(window.__PAOPAO_V28_RUNTIME__)return;
  window.__PAOPAO_V28_RUNTIME__=true;

  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
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

  const navLabels={home:'概要',work:'対応業務',experience:'実務経験',process:'進め方',current:'現在',journal:'記録'};
  $$('.site-header nav a[data-route]').forEach(link=>{
    const route=link.dataset.route;
    if(link.querySelector('small'))return;
    const english=link.textContent.trim();
    link.textContent='';
    const strong=document.createElement('span');
    strong.textContent=english;
    const small=document.createElement('small');
    small.textContent=navLabels[route]||'';
    link.append(strong,small);
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
      <div><small>01 / INPUT</small><b>課題と事実を集める</b></div><i aria-hidden="true"></i>
      <div><small>02 / STRUCTURE</small><b>役割と判断基準を整理</b></div><i aria-hidden="true"></i>
      <div><small>03 / DOCUMENT</small><b>手順と情報へ落とす</b></div><i aria-hidden="true"></i>
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
      <div><small>CAPTURE</small><b>実施内容を残す</b></div><i aria-hidden="true"></i>
      <div><small>REVIEW</small><b>結果と気づきを確認</b></div><i aria-hidden="true"></i>
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
          <circle cx="58" cy="178" r="4"/><circle cx="166" cy="74" r="4"/>
          <circle cx="354" cy="105" r="4"/><circle cx="312" cy="208" r="4"/>
        </svg>
      </div>`);
  }

  const contactText=$('.contact-layout>div>p');
  if(contactText)contactText.textContent='業務フローや社内ナレッジの整理、問い合わせ運営、LP・発信内容の構成、AIを使った試作についてご相談いただけます。DMには、現在の状況、相談内容、希望時期をご記載ください。';
  const mediaCaption=$('.hero-media-caption');
  if(mediaCaption)mediaCaption.innerHTML='<span>SYSTEM VIEW</span><b>整理 → 共有 → 定着</b>';

  const desktop=matchMedia('(min-width:1025px)');
  if(!reduced&&desktop.matches){
    const canvas=document.createElement('canvas');
    canvas.id='systemCanvas';
    canvas.setAttribute('aria-hidden','true');
    $('#ambientCanvas')?.after(canvas);
    const context=canvas.getContext('2d',{alpha:true});
    let width=0;
    let height=0;
    let dpr=1;
    let tick=0;
    let route=document.body.dataset.route||'home';
    let accent=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()||'#78f4eb';
    let timer=0;
    const layouts={
      home:[[.10,.74],[.25,.20],[.50,.50],[.76,.18],[.90,.70]],
      work:[[.08,.26],[.28,.26],[.51,.48],[.73,.32],[.91,.55]],
      experience:[[.12,.20],[.32,.44],[.55,.25],[.77,.56],[.92,.34]],
      process:[[.12,.18],[.30,.38],[.49,.23],[.68,.49],[.88,.29]],
      current:[[.12,.66],[.34,.30],[.57,.56],[.78,.24],[.91,.64]],
      journal:[[.10,.32],[.31,.60],[.54,.34],[.76,.61],[.92,.37]],
      contact:[[.12,.58],[.36,.32],[.64,.52],[.88,.28]]
    };

    const resize=()=>{
      dpr=Math.min(devicePixelRatio||1,1.35);
      width=innerWidth;
      height=innerHeight;
      canvas.width=Math.round(width*dpr);
      canvas.height=Math.round(height*dpr);
      canvas.style.width=`${width}px`;
      canvas.style.height=`${height}px`;
      context.setTransform(dpr,0,0,dpr,0,0);
    };
    resize();
    addEventListener('resize',resize,{passive:true});

    new MutationObserver(()=>{
      route=document.body.dataset.route||'home';
      accent=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()||'#78f4eb';
    }).observe(document.body,{attributes:true,attributeFilter:['data-route']});

    const draw=()=>{
      if(document.hidden||!desktop.matches){
        timer=setTimeout(draw,400);
        return;
      }
      context.clearRect(0,0,width,height);
      const points=(layouts[route]||layouts.home).map(([x,y])=>[x*width,y*height]);
      context.save();
      context.lineWidth=1;
      context.strokeStyle='rgba(255,255,255,.035)';
      for(let x=0;x<width;x+=Math.max(140,width/10)){
        context.beginPath();context.moveTo(x,0);context.lineTo(x,height);context.stroke();
      }
      for(let y=0;y<height;y+=Math.max(130,height/7)){
        context.beginPath();context.moveTo(0,y);context.lineTo(width,y);context.stroke();
      }
      context.strokeStyle=accent;
      context.globalAlpha=.11;
      context.beginPath();
      points.forEach((point,index)=>index===0?context.moveTo(...point):context.lineTo(...point));
      context.stroke();
      points.forEach((point,index)=>{
        const pulse=.5+.5*Math.sin(tick*.03+index*1.6);
        context.globalAlpha=.15+pulse*.1;
        context.fillStyle=accent;
        context.beginPath();context.arc(point[0],point[1],2+pulse*1.7,0,Math.PI*2);context.fill();
        context.globalAlpha=.08;
        context.strokeStyle=accent;
        context.beginPath();context.arc(point[0],point[1],9+pulse*7,0,Math.PI*2);context.stroke();
      });
      const segment=(tick*.003)%(points.length-1);
      const index=Math.floor(segment);
      const fraction=segment-index;
      if(points[index]&&points[index+1]){
        const x=points[index][0]+(points[index+1][0]-points[index][0])*fraction;
        const y=points[index][1]+(points[index+1][1]-points[index][1])*fraction;
        context.globalAlpha=.45;
        context.fillStyle=accent;
        context.beginPath();context.arc(x,y,2.1,0,Math.PI*2);context.fill();
      }
      context.restore();
      tick++;
      timer=setTimeout(draw,34);
    };
    const startCanvas=()=>{if(!timer)draw()};
    const opening=document.querySelector('#opening');
    if(!opening||opening.classList.contains('done'))startCanvas();
    else{
      const introObserver=new MutationObserver(()=>{
        if(!opening.classList.contains('done'))return;
        introObserver.disconnect();
        startCanvas();
      });
      introObserver.observe(opening,{attributes:true,attributeFilter:['class']});
      setTimeout(()=>{introObserver.disconnect();startCanvas()},2750);
    }
    addEventListener('pagehide',()=>clearTimeout(timer),{once:true});
  }

  const status=$('#connectStatus');
  if(status){
    new MutationObserver(()=>{
      if(!status.textContent.includes('接続できませんでした'))return;
      const error=window.PAOPAO_GITHUB_ERROR;
      if(error?.status===401)status.textContent='専用キーが無効か期限切れです。接続を解除し、新しいキーを貼り直してください。';
      else if(error?.status===403)status.textContent='専用キーに書き込み権限がありません。test1 の Issues を Read and write に設定してください。';
      else if(error?.status===404)status.textContent='専用キーの対象に test1 が含まれていません。Repository access を確認してください。';
    }).observe(status,{childList:true,subtree:true});
  }
})();