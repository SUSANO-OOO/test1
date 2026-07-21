(()=>{
  'use strict';

  const d=document;
  const root=d.documentElement;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;

  const polish=d.createElement('link');
  polish.rel='stylesheet';
  polish.href='./v32-round2-polish.css?v=20260721-2';
  d.head.appendChild(polish);

  const copyPatches=[
    ['#deliverables .section-heading h2','納品するのは、<br>ページ一枚では<br>ありません。'],
    ['#about .section-heading h2','現場を知っているから、<br>見た目だけで<br>終わらせません。'],
    ['.after-hero small','長崎 / 初心者向け・完全予約制'],
    ['.after-hero h3','運動が続かなかった男性へ。<br>週2回から始める<br>パーソナルジム。']
  ];
  copyPatches.forEach(([selector,html])=>{
    const element=d.querySelector(selector);
    if(element)element.innerHTML=html;
  });

  root.classList.add('js');
  const clamp=(min,value,max)=>Math.min(max,Math.max(min,value));

  const revealItems=[...d.querySelectorAll('.reveal')];
  if(!('IntersectionObserver' in window)||reduced){
    revealItems.forEach(item=>item.classList.add('is-visible'));
  }else{
    const revealObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },{rootMargin:'0px 0px -6% 0px',threshold:.04});
    revealItems.forEach(item=>revealObserver.observe(item));
  }

  const header=d.querySelector('#siteHeader');
  const updateHeader=()=>header?.classList.toggle('is-scrolled',scrollY>18);
  addEventListener('scroll',updateHeader,{passive:true});
  updateHeader();

  d.querySelectorAll('a[href^="#"]').forEach(anchor=>{
    anchor.addEventListener('click',event=>{
      const id=anchor.getAttribute('href');
      if(!id||id==='#')return;
      const target=d.querySelector(id);
      if(!target)return;
      event.preventDefault();
      target.scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'});
    });
  });

  const scene=d.querySelector('#architectureScene');
  if(scene&&!reduced){
    let targetX=0,targetY=0,currentX=0,currentY=0;
    let pressed=false;
    let raf=0;
    let pageVisible=true;
    let sceneVisible=true;

    const updateScene=()=>{
      raf=requestAnimationFrame(updateScene);
      if(!pageVisible||!sceneVisible)return;
      currentX+=(targetX-currentX)*.08;
      currentY+=(targetY-currentY)*.08;
      const scrollFactor=clamp(0,scrollY/Math.max(1,innerHeight*.9),1);
      scene.style.setProperty('--ry',`${11+currentX*7}deg`);
      scene.style.setProperty('--rx',`${-7-currentY*5}deg`);
      scene.style.setProperty('--spread',String(1+scrollFactor*.12));
    };

    const move=event=>{
      if(event.pointerType==='touch'&&!pressed)return;
      const rect=scene.getBoundingClientRect();
      targetX=clamp(-1,((event.clientX-rect.left)/rect.width)*2-1,1);
      targetY=clamp(-1,((event.clientY-rect.top)/rect.height)*2-1,1);
    };
    scene.addEventListener('pointerdown',event=>{
      pressed=true;
      scene.setPointerCapture?.(event.pointerId);
      move(event);
    });
    scene.addEventListener('pointermove',move);
    scene.addEventListener('pointerup',event=>{
      pressed=false;
      scene.releasePointerCapture?.(event.pointerId);
    });
    scene.addEventListener('pointercancel',()=>{pressed=false});
    scene.addEventListener('pointerleave',()=>{if(!pressed){targetX=0;targetY=0}});
    d.addEventListener('visibilitychange',()=>{pageVisible=!d.hidden});
    if('IntersectionObserver' in window){
      new IntersectionObserver(([entry])=>{sceneVisible=entry.isIntersecting},{rootMargin:'160px'}).observe(scene);
    }
    raf=requestAnimationFrame(updateScene);
    addEventListener('pagehide',()=>cancelAnimationFrame(raf),{once:true});
  }

  const makeoverTabs=[...d.querySelectorAll('.makeover-tab')];
  const makeoverScreens=[...d.querySelectorAll('[data-makeover]')];
  const makeoverNotes=[...d.querySelectorAll('[data-note]')];

  const showMakeover=view=>{
    makeoverTabs.forEach(tab=>{
      const active=tab.dataset.view===view;
      tab.setAttribute('aria-selected',String(active));
      tab.tabIndex=active?0:-1;
    });
    makeoverScreens.forEach(screen=>{screen.hidden=screen.dataset.makeover!==view});
    makeoverNotes.forEach(note=>{note.hidden=note.dataset.note!==view});
  };

  makeoverTabs.forEach((tab,index)=>{
    tab.tabIndex=index===0?0:-1;
    tab.addEventListener('click',()=>showMakeover(tab.dataset.view));
    tab.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight'].includes(event.key))return;
      event.preventDefault();
      const delta=event.key==='ArrowRight'?1:-1;
      const next=makeoverTabs[(index+delta+makeoverTabs.length)%makeoverTabs.length];
      showMakeover(next.dataset.view);
      next.focus();
    });
  });

  d.querySelectorAll('.faq-item button').forEach(button=>{
    button.addEventListener('click',()=>{
      const item=button.closest('.faq-item');
      const answer=item?.querySelector('.faq-answer');
      const willOpen=button.getAttribute('aria-expanded')!=='true';
      d.querySelectorAll('.faq-item button[aria-expanded="true"]').forEach(openButton=>{
        if(openButton===button)return;
        openButton.setAttribute('aria-expanded','false');
        const openAnswer=openButton.closest('.faq-item')?.querySelector('.faq-answer');
        if(openAnswer)openAnswer.hidden=true;
      });
      button.setAttribute('aria-expanded',String(willOpen));
      if(answer)answer.hidden=!willOpen;
    });
  });

  const copyButton=d.querySelector('#copyBrief');
  const copyStatus=d.querySelector('#copyStatus');
  if(copyButton){
    copyButton.addEventListener('click',async()=>{
      const template='【ホームページ制作の相談】\n1. 作りたいもの：\n2. 誰に見せたいか：\n3. 今困っていること：';
      try{
        await navigator.clipboard.writeText(template);
        if(copyStatus)copyStatus.textContent='相談テンプレートをコピーしました。InstagramのDMへ貼り付けてください。';
      }catch{
        if(copyStatus)copyStatus.textContent='コピーできませんでした。「作りたいもの・見せたい相手・今困っていること」の3点をDMで送ってください。';
      }
    });
  }

  const navLinks=[...d.querySelectorAll('.desktop-nav a,.mobile-dock a')];
  const sectionTargets=navLinks.map(link=>d.querySelector(link.getAttribute('href'))).filter(Boolean);
  if('IntersectionObserver' in window&&sectionTargets.length){
    const sectionObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting)return;
        navLinks.forEach(link=>link.classList.toggle('is-current',link.getAttribute('href')===`#${entry.target.id}`));
      });
    },{rootMargin:'-35% 0px -55% 0px',threshold:0});
    sectionTargets.forEach(section=>sectionObserver.observe(section));
  }

  root.dataset.siteReady='true';
})();
