(()=>{
  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const esc=(value='')=>String(value).replace(/[&<>"']/g,char=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[char]);

  document.documentElement.dataset.siteVersion='29';

  const hero=$('.app-page[data-page="home"] .hero-copy');
  if(hero){
    const signal=$('.signal',hero);
    if(signal)signal.textContent='業務整理・ナレッジ設計・運用改善';
    const headline=$('h1',hero);
    if(headline)headline.innerHTML='<span>複雑な業務を、</span><span>誰でも動ける</span><span>仕組みに変える。</span>';
    const lead=$('.hero-lead',hero);
    if(lead){
      lead.innerHTML='パオパオです。BPOの問い合わせ窓口で約5年、バーの店舗責任者として1年半、その後はPC技術支援を経験しました。問い合わせ対応、窓口運営、採用・育成、FAQ・マニュアル・社内ナレッジの作成を通じて、<strong>現場の情報を整理し、判断と行動につながる形へ整える</strong>仕事をしてきました。';
      if(!$('.hero-definition',hero))lead.insertAdjacentHTML('beforebegin','<div class="hero-definition"><span>得意領域</span><strong>業務の整理、FAQ・マニュアル作成、問い合わせ運営の改善。複雑な情報を、現場で使える手順と判断基準へ変えます。</strong></div>');
    }
    const actions=$('.hero-actions',hero);
    if(actions&&!$('.v29-capability-spine')){
      actions.insertAdjacentHTML('afterend',`
        <section class="v29-capability-spine" aria-label="パオパオの専門領域">
          <div class="spine-lead"><small>CORE CAPABILITIES</small><b>現場で使える形まで、整理して定着させる。</b></div>
          <article data-index="01"><small>OPERATIONS</small><h3>業務と役割の整理</h3><p>担当、期限、優先順位、確認地点を明確にします。</p></article>
          <article data-index="02"><small>KNOWLEDGE</small><h3>情報のナレッジ化</h3><p>属人的な判断をFAQ・手順・マニュアルへ変えます。</p></article>
          <article data-index="03"><small>SUPPORT</small><h3>問い合わせ運営</h3><p>分類、優先度、引き継ぎ条件を整理して運用を安定させます。</p></article>
        </section>`);
    }
  }

  const currentRouteCard=$('.route-grid [data-route="current"] p');
  if(currentRouteCard)currentRouteCard.textContent='オンラインスクールでの学習、減量コンテンツ、Webサイトとダイエット管理ツールの制作。';

  const processRoot=$('.app-page[data-page="process"]');
  if(processRoot){
    const introSmall=$('.process-intro small',processRoot);
    const introTitle=$('.process-intro h3',processRoot);
    const introBody=$('.process-intro>p',processRoot);
    if(introSmall)introSmall.textContent='ITERATIVE WORKFLOW';
    if(introTitle)introTitle.textContent='計画して終わりではなく、確認結果を次の修正へ反映する。';
    if(introBody)introBody.innerHTML='目的と計画を定めて実行し、結果を確認し、次の改善へ反映します。進行の中では、<strong>計画・実行・確認・改善というPDCAの考え方</strong>を、成果物や運用の大きさに合わせて繰り返します。形式を見せることではなく、認識のずれと手戻りを早く減らすために使います。<span class="v29-cycle-label"><i></i>計画 → 実行 → 確認 → 改善</span>';
    const loop=$('.process-loop-note',processRoot);
    if(loop)loop.innerHTML='<span>計画</span><i></i><span>実行</span><i></i><span>確認</span><i></i><span>改善</span><p>各工程で必要な単位に分け、確認結果を次の行動へ戻します。</p>';
  }

  const current=$('.app-page[data-page="current"]');
  if(current){
    const headingBody=$('.section-heading>p',current);
    if(headingBody)headingBody.textContent='独立に向けたオンラインスクールで学びながら、男性向け減量コンテンツ、このポートフォリオサイト、食事・ダイエット管理ツールの制作と改善に取り組んでいます。';
    const sub=$('.current-sub',current);
    if(sub){
      sub.innerHTML=`
        <article data-project="01"><small>ONLINE SCHOOL</small><h3>独立に向けた学習と実践</h3><p>オンラインスクールで、事業設計やコンテンツ設計を学び、課題と実践を通じて内容を具体化しています。</p></article>
        <article data-project="02"><small>PORTFOLIO WEBSITE</small><h3>このサイトの制作・改善</h3><p>AIを制作支援として活用し、情報設計、文章、UI、実装、動作確認を繰り返しながら、このポートフォリオサイトを更新しています。</p></article>
        <article data-project="03"><small>DIET MANAGEMENT TOOL</small><h3>ダイエット管理ツールの開発</h3><p>AIを活用し、食事記録や栄養確認、減量管理を行うWebアプリを試作し、実際に使える形へ改善しています。</p></article>`;
    }
  }

  const contactHeading=$('.contact-layout h2');
  if(contactHeading)contactHeading.innerHTML='仕事のご相談は、<br>InstagramのDMへ。';
  const contactText=$('.contact-layout>div>p');
  if(contactText)contactText.textContent='業務フローやFAQ・マニュアルの整理、問い合わせ運営、LP・発信内容の構成、AIを活用した試作についてご相談いただけます。DMには、現在の状況、相談内容、希望時期をご記載ください。';

  const journal=$('.app-page[data-page="journal"]');
  const list=$('#journalList');
  if(journal&&list){
    const toolbar=$('.journal-toolbar',journal);
    if(toolbar&&!$('.v29-journal-tools',toolbar)){
      toolbar.insertAdjacentHTML('afterbegin',`
        <div class="v29-journal-tools">
          <label class="v29-journal-search" aria-label="記録を検索">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"></circle><path d="m16 16 4.5 4.5"></path></svg>
            <input id="journalSearch" type="search" placeholder="タイトル・本文・カテゴリーを検索">
          </label>
          <select class="v29-journal-sort" id="journalSort" aria-label="記録の並び順">
            <option value="newest">新しい順</option><option value="oldest">古い順</option>
          </select>
        </div>`);
    }
    const tabs=$('.journal-tabs',journal);
    if(tabs&&!$('[data-filter="日記"]',tabs))tabs.insertAdjacentHTML('beforeend','<button class="journal-tab" data-filter="日記" type="button">DIARY</button>');

    if(!$('#v29JournalReader'))document.body.insertAdjacentHTML('beforeend',`
      <aside class="v29-reader" id="v29JournalReader" aria-hidden="true" aria-label="記録の詳細">
        <button class="v29-reader-backdrop" type="button" aria-label="詳細を閉じる"></button>
        <article class="v29-reader-panel" role="dialog" aria-modal="true" aria-labelledby="v29ReaderTitle">
          <button class="v29-reader-close" type="button" aria-label="閉じる">×</button>
          <div class="v29-reader-meta"><time id="v29ReaderDate"></time><i></i><span id="v29ReaderCategory"></span></div>
          <h2 id="v29ReaderTitle"></h2>
          <div class="v29-reader-body" id="v29ReaderBody"></div>
          <div class="v29-reader-actions">
            <button id="v29ReaderPrev" type="button">← 前の記録</button>
            <button id="v29ReaderCopy" type="button">リンクをコピー</button>
            <button id="v29ReaderNext" type="button">次の記録 →</button>
          </div>
          <p class="v29-reader-status" id="v29ReaderStatus"></p>
        </article>
      </aside>`);

    const reader=$('#v29JournalReader');
    const panel=$('.v29-reader-panel',reader);
    const readerTitle=$('#v29ReaderTitle');
    const readerDate=$('#v29ReaderDate');
    const readerCategory=$('#v29ReaderCategory');
    const readerBody=$('#v29ReaderBody');
    const readerStatus=$('#v29ReaderStatus');
    const prevButton=$('#v29ReaderPrev');
    const nextButton=$('#v29ReaderNext');
    let currentIssue=0;

    const visibleEntries=()=>$$('.journal-entry',list).filter(entry=>entry.style.display!=='none');
    const parseIssueBody=issue=>{
      const raw=String(issue.body||'');
      return {
        number:Number(issue.number),
        title:String(issue.title||'').replace(/^\[JOURNAL\]\s*/,''),
        date:(raw.match(/<!--\s*date:(.*?)\s*-->/i)||raw.match(/^DATE:\s*(.+)$/m)||[])[1]?.trim()||String(issue.created_at||'').slice(0,10),
        category:(raw.match(/<!--\s*category:(.*?)\s*-->/i)||raw.match(/^CATEGORY:\s*(.+)$/m)||[])[1]?.trim()||'日記',
        body:raw.replace(/<!--.*?-->/gs,'').replace(/^DATE:.*$/m,'').replace(/^CATEGORY:.*$/m,'').replace(/^---\s*$/m,'').trim()
      };
    };
    const updateReaderNav=()=>{
      const entries=visibleEntries();
      const index=entries.findIndex(entry=>Number(entry.dataset.issue)===currentIssue);
      prevButton.disabled=index<=0;
      nextButton.disabled=index<0||index>=entries.length-1;
      prevButton.dataset.issue=index>0?entries[index-1].dataset.issue:'';
      nextButton.dataset.issue=index>=0&&index<entries.length-1?entries[index+1].dataset.issue:'';
    };
    const openReader=async number=>{
      if(!number)return;
      currentIssue=Number(number);
      reader.classList.add('open');reader.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';
      readerTitle.textContent='読み込んでいます';readerBody.textContent='';readerStatus.textContent='GitHubの公開記録から本文を取得しています。';
      readerDate.textContent='';readerCategory.textContent='';panel.scrollTop=0;
      try{
        const response=await fetch(`https://api.github.com/repos/SUSANO-OOO/test1/issues/${currentIssue}`,{headers:{Accept:'application/vnd.github+json'},cache:'no-store'});
        if(!response.ok)throw new Error(`GitHub ${response.status}`);
        const item=parseIssueBody(await response.json());
        readerTitle.textContent=item.title;readerDate.textContent=item.date;readerCategory.textContent=item.category;readerBody.textContent=item.body;readerStatus.textContent=`PUBLIC JOURNAL / #${item.number}`;
        try{history.replaceState(null,'',`${location.pathname}${location.search}#/journal?entry=${item.number}`)}catch(_){}
        updateReaderNav();
      }catch(error){
        const entry=$(`.journal-entry[data-issue="${currentIssue}"]`,list);
        readerTitle.textContent=$('h3',entry)?.textContent.trim()||'記録';readerDate.textContent=$('time',entry)?.textContent.trim()||'';readerCategory.textContent=$('.category',entry)?.textContent.trim()||'';readerBody.textContent=$('p',entry)?.innerText.trim()||'本文を取得できませんでした。';readerStatus.textContent='本文の取得に失敗したため、一覧の内容を表示しています。';
        updateReaderNav();
      }
    };
    const closeReader=()=>{
      reader.classList.remove('open');reader.setAttribute('aria-hidden','true');document.body.style.overflow='';currentIssue=0;
      try{history.replaceState(null,'',`${location.pathname}${location.search}#/journal`)}catch(_){}
    };
    $('.v29-reader-close',reader).addEventListener('click',closeReader);
    $('.v29-reader-backdrop',reader).addEventListener('click',closeReader);
    addEventListener('keydown',event=>{if(event.key==='Escape'&&reader.classList.contains('open'))closeReader()});
    prevButton.addEventListener('click',()=>openReader(Number(prevButton.dataset.issue)));
    nextButton.addEventListener('click',()=>openReader(Number(nextButton.dataset.issue)));
    $('#v29ReaderCopy').addEventListener('click',async()=>{
      try{await navigator.clipboard.writeText(location.href);readerStatus.textContent='この記録へのリンクをコピーしました。'}catch(_){readerStatus.textContent='リンクをコピーできませんでした。アドレスバーからコピーしてください。'}
    });
    list.addEventListener('click',event=>{
      if(event.target.closest('button,a'))return;
      const entry=event.target.closest('.journal-entry');if(entry)openReader(Number(entry.dataset.issue));
    });
    list.addEventListener('keydown',event=>{
      const entry=event.target.closest('.journal-entry');
      if(entry&&(event.key==='Enter'||event.key===' ')){event.preventDefault();openReader(Number(entry.dataset.issue))}
    });

    const applyJournalView=()=>{
      const query=($('#journalSearch')?.value||'').trim().toLocaleLowerCase('ja');
      const sort=$('#journalSort')?.value||'newest';
      const entries=$$('.journal-entry',list);
      entries.forEach(entry=>{
        entry.tabIndex=0;entry.setAttribute('role','button');entry.setAttribute('aria-label',`${$('h3',entry)?.textContent||'記録'}を読む`);
        entry.dataset.search=entry.innerText.toLocaleLowerCase('ja');
        entry.style.display=!query||entry.dataset.search.includes(query)?'grid':'none';
      });
      const sorted=[...entries].sort((a,b)=>{
        const ad=$('time',a)?.textContent.trim()||'',bd=$('time',b)?.textContent.trim()||'';
        return sort==='oldest'?ad.localeCompare(bd):bd.localeCompare(ad);
      });
      const currentOrder=$$('.journal-entry',list);
      if(sorted.some((entry,index)=>currentOrder[index]!==entry))sorted.forEach(entry=>list.appendChild(entry));
      let empty=$('.v29-journal-no-results',list);
      const visible=visibleEntries().length;
      if(!visible&&entries.length){
        if(!empty){empty=document.createElement('div');empty.className='v29-journal-no-results';empty.textContent='検索条件に一致する記録はありません。';list.appendChild(empty)}
      }else empty?.remove();
    };
    const observer=new MutationObserver(()=>applyJournalView());
    observer.observe(list,{childList:true,subtree:true});
    $('#journalSearch')?.addEventListener('input',applyJournalView);
    $('#journalSort')?.addEventListener('change',applyJournalView);
    applyJournalView();

    const requested=Number((location.hash.match(/[?&]entry=(\d+)/)||[])[1]);
    if(requested)setTimeout(()=>openReader(requested),650);
  }
})();
