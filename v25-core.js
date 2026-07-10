(()=>{
document.body.classList.add('motion');
const q25=(s,r=document)=>r.querySelector(s),qa25=(s,r=document)=>[...r.querySelectorAll(s)];
const themes={cyan:['#78f4eb','120,244,235'],violet:['#9b83ff','155,131,255'],amber:['#ffc367','255,195,103'],green:['#68dda4','104,221,164'],coral:['#e84855','232,72,85']};
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;

addEventListener('pointermove',e=>{document.documentElement.style.setProperty('--mx',e.clientX+'px');document.documentElement.style.setProperty('--my',e.clientY+'px')},{passive:true});

const opening=q25('#opening'),skipIntro=new URLSearchParams(location.search).get('skipIntro')==='1';
function finishIntro(){document.body.classList.add('intro-complete');opening?.classList.add('done')}
if(reduced||skipIntro){finishIntro()}else{setTimeout(()=>document.body.classList.add('intro-complete'),1450);setTimeout(finishIntro,2520)}

const DPR=Math.min(devicePixelRatio||1,2);
function fit(canvas){const r=canvas.getBoundingClientRect();canvas.width=Math.round(r.width*DPR);canvas.height=Math.round(r.height*DPR);const c=canvas.getContext('2d');c.setTransform(DPR,0,0,DPR,0,0);return[c,r.width,r.height]}

const openingCanvas=q25('#openingCanvas');
if(openingCanvas&&!reduced&&!skipIntro){
  let octx,ow,oh,ot=0;
  const sparks=Array.from({length:innerWidth<700?52:110},()=>({a:(Math.random()-.5)*.5,s:2.1+Math.random()*5.9,l:18+Math.random()*58,d:.65+Math.random()*.35,p:Math.random(),side:Math.random()<.5?-1:1}));
  function resizeOpening(){[octx,ow,oh]=fit(openingCanvas)}
  function drawOpening(){ot+=.018;octx.clearRect(0,0,ow,oh);const active=Math.max(0,1-Math.abs(ot-1.05)/.78);octx.save();octx.translate(ow*.5,oh*.5);octx.rotate(.244);octx.globalCompositeOperation='lighter';sparks.forEach((sp,i)=>{const travel=Math.max(0,(ot-.68)*sp.s*56),x=Math.cos(sp.a)*travel*sp.side,y=Math.sin(sp.a)*travel+(sp.p-.5)*42,alpha=active*(1-Math.min(1,travel/(Math.max(ow,oh)*.86)))*sp.d;octx.strokeStyle=i%3===0?`rgba(232,72,85,${alpha*.58})`:`rgba(120,244,235,${alpha*.72})`;octx.lineWidth=i%8===0?1.5:.7;octx.beginPath();octx.moveTo(x,y);octx.lineTo(x-Math.cos(sp.a)*sp.l*sp.side,y-Math.sin(sp.a)*sp.l);octx.stroke()});octx.restore();if(ot<2.5)requestAnimationFrame(drawOpening)}
  resizeOpening();addEventListener('resize',resizeOpening,{passive:true});drawOpening()
}

const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');revealObserver.unobserve(entry.target)}}),{threshold:.1});
qa25('.reveal').forEach(el=>revealObserver.observe(el));

const railIndex=q25('#railIndex'),railLabel=q25('#railLabel'),navLinks=qa25('nav a');
const sceneObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting&&entry.intersectionRatio>.3){const [c,rgb]=themes[entry.target.dataset.theme]||themes.cyan;document.documentElement.style.setProperty('--accent',c);document.documentElement.style.setProperty('--accent-rgb',rgb);const [idx,label]=(entry.target.dataset.rail||'00|TOP').split('|');railIndex.textContent=idx;railLabel.textContent=label;navLinks.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+entry.target.id))}}),{threshold:[.3,.5]});
qa25('.scene').forEach(el=>sceneObserver.observe(el));

const progress=q25('#scrollProgress'),header=q25('#siteHeader');
function updateScroll(){const max=document.documentElement.scrollHeight-innerHeight;progress.style.width=(max?Math.min(1,scrollY/max)*100:0)+'%';header.classList.toggle('scrolled',scrollY>24)}
addEventListener('scroll',updateScroll,{passive:true});updateScroll();

const photo=window.PAOPAO_PORTRAIT||window.PORTRAIT||'';
if(photo)qa25('img[data-photo]').forEach(img=>img.src=photo);

const portrait=q25('#portraitStage');
if(portrait&&matchMedia('(pointer:fine)').matches){
  portrait.addEventListener('pointermove',e=>{const r=portrait.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;portrait.style.transform=`perspective(1100px) rotateX(${-y*2.2}deg) rotateY(${x*3}deg)`});
  portrait.addEventListener('pointerleave',()=>portrait.style.transform='')
}

qa25('.pdca-step').forEach(card=>card.addEventListener('pointermove',e=>{const r=card.getBoundingClientRect();card.style.setProperty('--px',((e.clientX-r.left)/r.width*100)+'%');card.style.setProperty('--py',((e.clientY-r.top)/r.height*100)+'%')}));

const ambient=q25('#ambientCanvas');let actx,aw,ah,stars=[];
function resizeAmbient(){[actx,aw,ah]=fit(ambient);stars=Array.from({length:innerWidth<700?42:100},()=>({x:Math.random()*aw,y:Math.random()*ah,v:.07+Math.random()*.17,s:.4+Math.random()*1.1,p:Math.random()*Math.PI*2}))}
function drawAmbient(){actx.clearRect(0,0,aw,ah);stars.forEach(st=>{st.y-=st.v;st.p+=.012;if(st.y<-4){st.y=ah+4;st.x=Math.random()*aw}const a=.045+(Math.sin(st.p)+1)*.025;actx.fillStyle=`rgba(255,255,255,${a})`;actx.fillRect(st.x,st.y,st.s,st.s)});requestAnimationFrame(drawAmbient)}
resizeAmbient();addEventListener('resize',resizeAmbient,{passive:true});drawAmbient();

const cursor=q25('#cursorCanvas');let cctx,cw,ch,trail=[];
function resizeCursor(){[cctx,cw,ch]=fit(cursor)}resizeCursor();addEventListener('resize',resizeCursor,{passive:true});
addEventListener('pointermove',e=>{trail.push({x:e.clientX,y:e.clientY,life:1});if(trail.length>48)trail.shift()},{passive:true});
function drawCursor(){cctx.clearRect(0,0,cw,ch);trail.forEach((p,i)=>{p.life*=.91;cctx.fillStyle=i%2?`rgba(120,244,235,${p.life*.15})`:`rgba(232,72,85,${p.life*.11})`;cctx.beginPath();cctx.arc(p.x,p.y,.8+p.life*2.1,0,Math.PI*2);cctx.fill()});trail=trail.filter(p=>p.life>.025);requestAnimationFrame(drawCursor)}
if(!reduced)drawCursor();

const REPO='SUSANO-OOO/test1',TOKEN_KEY='paopao_admin_token_v22';
const isAdminMode=new URLSearchParams(location.search).get('admin')==='1';
let journalItems=[],activeFilter='ALL';
function esc(v=''){const m={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};return String(v).replace(/[&<>"']/g,c=>m[c])}
function issueBody(item){return `<!-- date:${item.date} -->\n<!-- category:${item.category} -->\n${item.body}`}
function apiHeaders(withAuth=false){const h={Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};if(withAuth&&token())h.Authorization=`Bearer ${token()}`;return h}
async function githubFailure(res,action='処理'){
  let data=null,text='';
  try{data=await res.clone().json()}catch(e){try{text=await res.text()}catch(_){}}
  const raw=String(data?.message||text||'').trim();
  const details=Array.isArray(data?.errors)?data.errors.map(x=>typeof x==='string'?x:(x.message||x.code||'')).filter(Boolean).join(' / '):'';
  if(res.status===401)return '専用キーが無効、期限切れ、または入力が途中です。接続を解除し、新しいキーで接続し直してください。';
  if(res.status===403)return 'この専用キーには記事を保存する権限がありません。GitHubで test1 を選び、Issues を Read and write に変更してください。';
  if(res.status===404)return '専用キーの対象に test1 が含まれていません。Repository access で test1 を選択してください。';
  if(res.status===410)return 'GitHub側でIssuesが無効になっています。test1のSettingsからIssuesを有効にしてください。';
  if(res.status===422)return `入力内容をGitHubが受け付けませんでした。${details||raw||'タイトルと本文を確認してください。'}`;
  if(res.status===429)return 'GitHubへのアクセス回数が一時的に上限へ達しました。少し時間を置いて再実行してください。';
  return `${action}に失敗しました（GitHub: ${res.status}）。${details||raw||'通信状態を確認してください。'}`;
}
function renderJournal(){
  const target=q25('#journalList'),filtered=activeFilter==='ALL'?journalItems:journalItems.filter(item=>item.category===activeFilter);
  q25('#journalCount').textContent=`${filtered.length} ENTRIES`;
  if(!filtered.length){target.innerHTML='<div class="journal-empty"><div><small>BUILD LOG</small><b>このカテゴリーの公開記録はまだありません。</b></div></div>';return}
  target.innerHTML=filtered.map(item=>`<article class="journal-entry" data-issue="${item.number}"><time>${esc(item.date)}</time><div><h3>${esc(item.title)}</h3><p>${esc(item.body).replace(/\n/g,'<br>')}</p></div><div class="journal-entry-side"><span class="category">${esc(item.category)}</span>${isAdminMode?`<button class="journal-edit-shortcut" type="button" data-edit-issue="${item.number}">編集</button>`:''}</div></article>`).join('');
  if(isAdminMode)qa25('[data-edit-issue]',target).forEach(btn=>btn.addEventListener('click',()=>{openAdmin();editEntry(Number(btn.dataset.editIssue))}))
}
async function loadJournal(){
  const target=q25('#journalList');
  try{
    const res=await fetch(`https://api.github.com/repos/${REPO}/issues?state=open&per_page=100&sort=created&direction=desc`,{headers:apiHeaders(!!token()),cache:'no-store'});
    if(!res.ok)throw new Error(await githubFailure(res,'記事の取得'));
    const issues=await res.json();
    journalItems=issues.filter(x=>!x.pull_request&&/^\[JOURNAL\]\s*/.test(String(x.title||''))).map(issue=>{const raw=String(issue.body||''),date=(raw.match(/<!-- date:(.*?) -->/)||[])[1]||String(issue.created_at||'').slice(0,10),category=(raw.match(/<!-- category:(.*?) -->/)||[])[1]||'日記',body=raw.replace(/<!--.*?-->/gs,'').trim();return{number:issue.number,date,category,title:issue.title.replace(/^\[JOURNAL\]\s*/,''),body,url:issue.html_url}}).sort((a,b)=>String(b.date).localeCompare(String(a.date))||b.number-a.number);
    renderJournal();renderAdminList()
  }catch(e){q25('#journalCount').textContent='OFFLINE';target.innerHTML='<div class="journal-empty"><div><small>SYNC ERROR</small><b>公開記録を取得できませんでした。</b></div></div>';renderAdminList('記事を取得できませんでした。')}
}
qa25('.journal-tab').forEach(btn=>btn.addEventListener('click',()=>{qa25('.journal-tab').forEach(x=>x.classList.remove('active'));btn.classList.add('active');activeFilter=btn.dataset.filter;renderJournal()}));

const modal=q25('#adminModal'),form=q25('#journalForm'),connectPanel=q25('#connectPanel'),workspace=q25('#adminWorkspace'),connectStatus=q25('#connectStatus'),saveStatus=q25('#saveStatus'),tokenInput=q25('#tokenInput'),adminEntryList=q25('#adminEntryList');
const issueField=q25('#editingIssueNumber'),dateField=q25('#entryDate'),categoryField=q25('#entryCategory'),titleField=q25('#entryTitle'),bodyField=q25('#entryBody'),editorMode=q25('#editorMode'),editorHeading=q25('#editorHeading'),saveButton=q25('#saveEntryButton'),deleteButton=q25('#deleteEntryButton');
const adminMemoryStore=new Map();
function storageGet(key){try{return sessionStorage.getItem(key)||adminMemoryStore.get(key)||''}catch(e){return adminMemoryStore.get(key)||''}}
function storageSet(key,value){adminMemoryStore.set(key,value);try{sessionStorage.setItem(key,value)}catch(e){}}
function storageRemove(key){adminMemoryStore.delete(key);try{sessionStorage.removeItem(key)}catch(e){}}
function token(){return storageGet(TOKEN_KEY)}
function today(){return new Date().toISOString().slice(0,10)}
function resetEditor(message='新しい記事を作成できます。'){
  issueField.value='';dateField.value=today();categoryField.value='コンテンツ設計';titleField.value='';bodyField.value='';editorMode.textContent='CREATE';editorHeading.textContent='新規記事';saveButton.textContent='新規公開';deleteButton.hidden=true;saveStatus.textContent=message
}
function editEntry(number){
  const item=journalItems.find(x=>x.number===Number(number));if(!item)return;
  issueField.value=String(item.number);dateField.value=item.date;categoryField.value=item.category;titleField.value=item.title;bodyField.value=item.body;editorMode.textContent=`EDIT / #${item.number}`;editorHeading.textContent='記事を編集';saveButton.textContent='変更を保存';deleteButton.hidden=false;saveStatus.textContent='既存記事を編集中です。';
  qa25('.admin-entry-item').forEach(x=>x.classList.toggle('active',Number(x.dataset.issue)===item.number));
  titleField.focus({preventScroll:true})
}
function renderAdminList(error=''){
  if(!adminEntryList)return;
  if(error){adminEntryList.innerHTML=`<p class="admin-list-message">${esc(error)}</p>`;return}
  if(!journalItems.length){adminEntryList.innerHTML='<p class="admin-list-message">公開中の記事はありません。</p>';return}
  adminEntryList.innerHTML=journalItems.map(item=>`<button class="admin-entry-item" type="button" data-issue="${item.number}"><time>${esc(item.date)}</time><b>${esc(item.title)}</b><span>${esc(item.category)} / #${item.number}</span></button>`).join('');
  qa25('.admin-entry-item',adminEntryList).forEach(btn=>btn.addEventListener('click',()=>editEntry(Number(btn.dataset.issue))))
}
function refreshAdmin(){const connected=!!token();connectPanel.style.display=connected?'none':'block';workspace.classList.toggle('active',connected);form.classList.toggle('active',connected);if(connected)renderAdminList()}
function openAdmin(){modal.classList.add('open');modal.setAttribute('aria-hidden','false');refreshAdmin()}
function closeAdmin(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true')}
if(isAdminMode){document.body.classList.add('admin-mode');q25('#journalAdminLink')?.removeAttribute('hidden');setTimeout(()=>{openAdmin();loadJournal()},520)}
q25('#adminClose').addEventListener('click',closeAdmin);modal.addEventListener('click',e=>{if(e.target===modal)closeAdmin()});
q25('#connectButton').addEventListener('click',async()=>{const value=tokenInput.value.trim();if(!value)return;connectStatus.textContent='接続確認中...';try{const res=await fetch(`https://api.github.com/repos/${REPO}`,{headers:{Authorization:`Bearer ${value}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'}});if(!res.ok)throw new Error(await githubFailure(res,'接続'));storageSet(TOKEN_KEY,value);tokenInput.value='';refreshAdmin();resetEditor('接続しました。新規作成または左の記事を選択してください。');await loadJournal()}catch(e){connectStatus.textContent=e instanceof TypeError?'GitHubへ接続できませんでした。通信状態を確認してください。':String(e?.message||e)}});
q25('#disconnectButton').addEventListener('click',()=>{storageRemove(TOKEN_KEY);refreshAdmin();connectStatus.textContent='接続を解除しました。'});
q25('#newEntryButton').addEventListener('click',()=>{resetEditor();qa25('.admin-entry-item').forEach(x=>x.classList.remove('active'))});
q25('#cancelEditButton').addEventListener('click',()=>{resetEditor('入力内容をリセットしました。');qa25('.admin-entry-item').forEach(x=>x.classList.remove('active'))});
form.addEventListener('submit',async e=>{
  e.preventDefault();const tk=token();if(!tk)return refreshAdmin();const number=Number(issueField.value)||0,date=dateField.value,category=categoryField.value,title=titleField.value.trim(),body=bodyField.value.trim();if(!date||!title||!body)return;
  saveStatus.textContent=number?'変更を保存しています...':'クラウドへ公開しています...';
  try{
    const endpoint=number?`https://api.github.com/repos/${REPO}/issues/${number}`:`https://api.github.com/repos/${REPO}/issues`;
    const payload={title:`[JOURNAL] ${title}`,body:issueBody({date,category,body})};
    const res=await fetch(endpoint,{method:number?'PATCH':'POST',headers:{...apiHeaders(true),'Content-Type':'application/json'},body:JSON.stringify(payload)});
    if(!res.ok)throw new Error(await githubFailure(res,number?'記事の更新':'記事の公開'));
    await loadJournal();resetEditor(number?'変更を保存しました。':'記事を公開しました。')
  }catch(err){saveStatus.textContent=err instanceof TypeError?'GitHubへ接続できませんでした。通信状態を確認して、もう一度保存してください。':String(err?.message||err)}
});
deleteButton.addEventListener('click',async()=>{
  const number=Number(issueField.value);if(!number||!token())return;const item=journalItems.find(x=>x.number===number);if(!confirm(`「${item?.title||'この記事'}」を公開一覧から削除しますか？`))return;
  saveStatus.textContent='公開一覧から削除しています...';
  try{const res=await fetch(`https://api.github.com/repos/${REPO}/issues/${number}`,{method:'PATCH',headers:{...apiHeaders(true),'Content-Type':'application/json'},body:JSON.stringify({state:'closed'})});if(!res.ok)throw new Error(await githubFailure(res,'記事の削除'));await loadJournal();resetEditor('公開一覧から削除しました。GitHub上では閉じた記事として保持されます。')}catch(err){saveStatus.textContent=err instanceof TypeError?'GitHubへ接続できませんでした。通信状態を確認してください。':String(err?.message||err)}
});
resetEditor();loadJournal();

})();