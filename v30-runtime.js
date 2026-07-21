(()=>{
  'use strict';
  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const routes=['home','work','experience','process','current','journal','contact'];
  const pages=$$('.page');
  const routeLinks=$$('[data-route]');
  const curtain=$('#routeCurtain');
  const menuButton=$('#menuButton');
  const nav=$('#siteNav');
  const header=$('#siteHeader');
  let current='';
  let routing=false;

  document.documentElement.dataset.siteVersion='30';
  setTimeout(()=>document.documentElement.classList.add('site-ready'),reduced?0:550);

  const routeFromHash=()=>{
    const value=location.hash.replace(/^#\/?/,'').split(/[?&]/)[0];
    return routes.includes(value)?value:'home';
  };

  const setMenu=open=>{
    nav.classList.toggle('open',open);
    menuButton.setAttribute('aria-expanded',String(open));
    document.body.classList.toggle('menu-open',open);
  };
  menuButton?.addEventListener('click',()=>setMenu(!nav.classList.contains('open')));

  const revealPage=page=>{
    const items=$$('.reveal',page);
    if(reduced){items.forEach(item=>item.classList.add('visible'));return;}
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}
      });
    },{threshold:.08,rootMargin:'0px 0px -30px'});
    items.forEach(item=>observer.observe(item));
  };

  const completeRoute=route=>{
    pages.forEach(page=>{
      const active=page.dataset.page===route;
      page.hidden=!active;
      page.classList.toggle('is-active',active);
      if(active){
        page.classList.remove('is-active');
        void page.offsetWidth;
        page.classList.add('is-active');
        revealPage(page);
        document.title=page.dataset.title||'PAOPAO';
      }
    });
    routeLinks.forEach(link=>{
      const active=link.dataset.route===route;
      link.classList.toggle('active',active);
      active?link.setAttribute('aria-current','page'):link.removeAttribute('aria-current');
    });
    document.body.dataset.route=route;
    current=route;
    routing=false;
    setMenu(false);
    scrollTo({top:0,behavior:'auto'});
    $('#main')?.focus({preventScroll:true});
  };

  const showRoute=(route,initial=false)=>{
    if(routing||(!initial&&route===current))return;
    routing=true;
    if(initial||reduced){completeRoute(route);return;}
    curtain.classList.add('active');
    setTimeout(()=>completeRoute(route),270);
    setTimeout(()=>curtain.classList.remove('active'),500);
  };

  addEventListener('hashchange',()=>showRoute(routeFromHash()));
  routeLinks.forEach(link=>link.addEventListener('click',()=>setMenu(false)));
  showRoute(routeFromHash(),true);

  addEventListener('scroll',()=>{header?.classList.toggle('compact',scrollY>24);},{passive:true});

  const journalEntries=[
    {
      date:'2026.07.21',category:'WEBSITE',title:'業務整理中心のサイトを、Web制作の営業サイトへ変えた理由',summary:'経歴を並べるだけでは依頼内容が伝わらない。主語を「自分の過去」から「相手が得られる成果」へ変えた。',
      body:`<p>以前のサイトは、問い合わせ窓口や店舗運営の経歴を丁寧に並べていました。ただし、閲覧者からすると「それで何を頼めるのか」が最後まで明確ではありませんでした。</p><h3>変更したこと</h3><p>ホームページ制作を第一のサービスに置き、業務自動化と運用整備を第二・第三の提供価値として再構成しました。経歴は、単なる年表ではなく「制作にどう役立つか」を添えて掲載しています。</p><h3>判断基準</h3><p>数秒で提供内容が分かること。実績が依頼者の利益につながること。問い合わせまで迷わないこと。この三つを優先しました。</p>`
    },
    {
      date:'2026.07.18',category:'AUTOMATION',title:'Codexで減らせる定型作業と、引き受けない領域',summary:'何でも自動化できると装わず、CSV整形、報告下書き、分類、通知など小さく検証できる作業に絞る。',
      body:`<p>業務自動化は、規模が大きいほど価値が高いわけではありません。毎週30分かかる集計や、毎回同じ形式で作る報告など、小さいが繰り返される作業から着手する方が成果を確認しやすくなります。</p><h3>向いている作業</h3><p>フォーム回答の整理、CSVの表記統一、定例報告の下書き、問い合わせ分類、期限通知、ファイル名の整理、簡易管理画面などです。</p><h3>向いていない作業</h3><p>医療・会計・個人情報を扱う基幹システムや、停止できない大規模サービスは、現在の提供範囲外としています。</p>`
    },
    {
      date:'2026.07.12',category:'PROCESS',title:'5人の視点を使う、4段階レビューを制作工程へ組み込む',summary:'依頼者、コピー、デザイン、技術、運用の5視点で3回修正し、4回目で公開判定する。',
      body:`<p>制作者が一人で確認すると、自分が理解している前提を見落とします。そこで、役割の異なる5つの視点を固定し、同じ成果物を別の基準から確認します。</p><h3>3回の修正</h3><p>1回目は意味と構成、2回目は訴求とデザイン、3回目は実装と運用を中心に確認します。指摘を反映した後に次の確認へ進みます。</p><h3>最後の判定</h3><p>4回目は公開判定です。文章、スマホ表示、操作、速度、問い合わせ導線に未解決があれば、公開完了とは扱いません。</p>`
    }
  ];
  const list=$('#journalList');
  const search=$('#journalSearch');
  const sort=$('#journalSort');
  const modal=$('#journalModal');
  const modalMeta=$('#journalModalMeta');
  const modalTitle=$('#journalModalTitle');
  const modalBody=$('#journalModalBody');
  const prevButton=$('#journalPrev');
  const nextButton=$('#journalNext');
  let visibleEntries=[];
  let activeIndex=-1;

  const renderJournal=()=>{
    if(!list)return;
    const query=(search?.value||'').trim().toLowerCase();
    visibleEntries=journalEntries.filter(entry=>`${entry.title} ${entry.summary} ${entry.category}`.toLowerCase().includes(query));
    visibleEntries.sort((a,b)=>sort?.value==='oldest'?a.date.localeCompare(b.date):b.date.localeCompare(a.date));
    if(!visibleEntries.length){list.innerHTML='<p class="journal-empty">該当する記録はありません。</p>';return;}
    list.innerHTML=visibleEntries.map((entry,index)=>`<button class="journal-entry" type="button" data-index="${index}"><small>${entry.date}<br>${entry.category}</small><h2>${entry.title}</h2><span>${entry.summary}</span></button>`).join('');
    $$('.journal-entry',list).forEach(button=>button.addEventListener('click',()=>openJournal(Number(button.dataset.index))));
  };

  const openJournal=index=>{
    const entry=visibleEntries[index];
    if(!entry||!modal)return;
    activeIndex=index;
    modalMeta.textContent=`${entry.date} / ${entry.category}`;
    modalTitle.textContent=entry.title;
    modalBody.innerHTML=entry.body;
    prevButton.disabled=index<=0;
    nextButton.disabled=index>=visibleEntries.length-1;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
    $('.journal-close',modal)?.focus();
  };
  const closeJournal=()=>{
    if(!modal)return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
  };
  search?.addEventListener('input',renderJournal);
  sort?.addEventListener('change',renderJournal);
  $('.journal-close',modal)?.addEventListener('click',closeJournal);
  modal?.addEventListener('click',event=>{if(event.target===modal)closeJournal();});
  prevButton?.addEventListener('click',()=>openJournal(activeIndex-1));
  nextButton?.addEventListener('click',()=>openJournal(activeIndex+1));
  addEventListener('keydown',event=>{if(event.key==='Escape'&&modal?.classList.contains('open'))closeJournal();});
  renderJournal();
})();
