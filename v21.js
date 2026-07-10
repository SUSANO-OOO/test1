document.body.classList.add('motion');
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const themes={cyan:['#78f4eb','120,244,235'],violet:['#9b83ff','155,131,255'],amber:['#ffc367','255,195,103'],green:['#68dda4','104,221,164'],coral:['#e84855','232,72,85']};
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;

addEventListener('pointermove',e=>{document.documentElement.style.setProperty('--mx',e.clientX+'px');document.documentElement.style.setProperty('--my',e.clientY+'px')},{passive:true});

const opening=$('#opening'),skipIntro=new URLSearchParams(location.search).get('skipIntro')==='1';
function finishIntro(){document.body.classList.add('intro-complete');opening?.classList.add('done')}
if(reduced||skipIntro){finishIntro()}else{setTimeout(()=>document.body.classList.add('intro-complete'),1450);setTimeout(finishIntro,2520)}

const DPR=Math.min(devicePixelRatio||1,2);
function fit(canvas){const r=canvas.getBoundingClientRect();canvas.width=Math.round(r.width*DPR);canvas.height=Math.round(r.height*DPR);const c=canvas.getContext('2d');c.setTransform(DPR,0,0,DPR,0,0);return[c,r.width,r.height]}

const openingCanvas=$('#openingCanvas');
if(openingCanvas&&!reduced&&!skipIntro){
  let octx,ow,oh,ot=0;
  const sparks=Array.from({length:innerWidth<700?52:110},()=>({a:(Math.random()-.5)*.5,s:2.1+Math.random()*5.9,l:18+Math.random()*58,d:.65+Math.random()*.35,p:Math.random(),side:Math.random()<.5?-1:1}));
  function resizeOpening(){[octx,ow,oh]=fit(openingCanvas)}
  function drawOpening(){ot+=.018;octx.clearRect(0,0,ow,oh);const active=Math.max(0,1-Math.abs(ot-1.05)/.78);octx.save();octx.translate(ow*.5,oh*.5);octx.rotate(.244);octx.globalCompositeOperation='lighter';sparks.forEach((sp,i)=>{const travel=Math.max(0,(ot-.68)*sp.s*56),x=Math.cos(sp.a)*travel*sp.side,y=Math.sin(sp.a)*travel+(sp.p-.5)*42,alpha=active*(1-Math.min(1,travel/(Math.max(ow,oh)*.86)))*sp.d;octx.strokeStyle=i%3===0?`rgba(232,72,85,${alpha*.58})`:`rgba(120,244,235,${alpha*.72})`;octx.lineWidth=i%8===0?1.5:.7;octx.beginPath();octx.moveTo(x,y);octx.lineTo(x-Math.cos(sp.a)*sp.l*sp.side,y-Math.sin(sp.a)*sp.l);octx.stroke()});octx.restore();if(ot<2.5)requestAnimationFrame(drawOpening)}
  resizeOpening();addEventListener('resize',resizeOpening,{passive:true});drawOpening()
}

const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');revealObserver.unobserve(entry.target)}}),{threshold:.1});
$$('.reveal').forEach(el=>revealObserver.observe(el));

const railIndex=$('#railIndex'),railLabel=$('#railLabel'),navLinks=$$('nav a');
const sceneObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting&&entry.intersectionRatio>.3){const [c,rgb]=themes[entry.target.dataset.theme]||themes.cyan;document.documentElement.style.setProperty('--accent',c);document.documentElement.style.setProperty('--accent-rgb',rgb);const [idx,label]=(entry.target.dataset.rail||'00|TOP').split('|');railIndex.textContent=idx;railLabel.textContent=label;navLinks.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+entry.target.id))}}),{threshold:[.3,.5]});
$$('.scene').forEach(el=>sceneObserver.observe(el));

const progress=$('#scrollProgress'),header=$('#siteHeader');
function updateScroll(){const max=document.documentElement.scrollHeight-innerHeight;progress.style.width=(max?Math.min(1,scrollY/max)*100:0)+'%';header.classList.toggle('scrolled',scrollY>24)}
addEventListener('scroll',updateScroll,{passive:true});updateScroll();

const photo=window.PAOPAO_PORTRAIT||window.PORTRAIT||'';
if(photo)$$('img[data-photo]').forEach(img=>img.src=photo);

const portrait=$('#portraitStage');
if(portrait&&matchMedia('(pointer:fine)').matches){
  portrait.addEventListener('pointermove',e=>{const r=portrait.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;portrait.style.transform=`perspective(1100px) rotateX(${-y*2.2}deg) rotateY(${x*3}deg)`});
  portrait.addEventListener('pointerleave',()=>portrait.style.transform='')
}

$$('.pdca-step').forEach(card=>card.addEventListener('pointermove',e=>{const r=card.getBoundingClientRect();card.style.setProperty('--px',((e.clientX-r.left)/r.width*100)+'%');card.style.setProperty('--py',((e.clientY-r.top)/r.height*100)+'%')}));

const ambient=$('#ambientCanvas');let actx,aw,ah,stars=[];
function resizeAmbient(){[actx,aw,ah]=fit(ambient);stars=Array.from({length:innerWidth<700?42:100},()=>({x:Math.random()*aw,y:Math.random()*ah,v:.07+Math.random()*.17,s:.4+Math.random()*1.1,p:Math.random()*Math.PI*2}))}
function drawAmbient(){actx.clearRect(0,0,aw,ah);stars.forEach(st=>{st.y-=st.v;st.p+=.012;if(st.y<-4){st.y=ah+4;st.x=Math.random()*aw}const a=.045+(Math.sin(st.p)+1)*.025;actx.fillStyle=`rgba(255,255,255,${a})`;actx.fillRect(st.x,st.y,st.s,st.s)});requestAnimationFrame(drawAmbient)}
resizeAmbient();addEventListener('resize',resizeAmbient,{passive:true});drawAmbient();

const cursor=$('#cursorCanvas');let cctx,cw,ch,trail=[];
function resizeCursor(){[cctx,cw,ch]=fit(cursor)}resizeCursor();addEventListener('resize',resizeCursor,{passive:true});
addEventListener('pointermove',e=>{trail.push({x:e.clientX,y:e.clientY,life:1});if(trail.length>48)trail.shift()},{passive:true});
function drawCursor(){cctx.clearRect(0,0,cw,ch);trail.forEach((p,i)=>{p.life*=.91;cctx.fillStyle=i%2?`rgba(120,244,235,${p.life*.15})`:`rgba(232,72,85,${p.life*.11})`;cctx.beginPath();cctx.arc(p.x,p.y,.8+p.life*2.1,0,Math.PI*2);cctx.fill()});trail=trail.filter(p=>p.life>.025);requestAnimationFrame(drawCursor)}
if(!reduced)drawCursor();

const REPO='SUSANO-OOO/test1',TOKEN_KEY='paopao_admin_token_v21';
let journalItems=[],activeFilter='ALL';
function esc(v=''){const m={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};return String(v).replace(/[&<>"']/g,c=>m[c])}
function renderJournal(){
  const target=$('#journalList'),filtered=activeFilter==='ALL'?journalItems:journalItems.filter(item=>item.category===activeFilter);
  $('#journalCount').textContent=`${filtered.length} ENTRIES`;
  if(!filtered.length){target.innerHTML='<div class="journal-empty"><div><small>BUILD LOG</small><b>このカテゴリーの公開記録はまだありません。</b></div></div>';return}
  target.innerHTML=filtered.map(item=>`<article class="journal-entry"><time>${esc(item.date)}</time><div><h3>${esc(item.title)}</h3><p>${esc(item.body).replace(/\n/g,'<br>')}</p></div><span class="category">${esc(item.category)}</span></article>`).join('')
}
async function loadJournal(){
  const target=$('#journalList');
  try{
    const res=await fetch(`https://api.github.com/repos/${REPO}/issues?state=open&labels=journal&per_page=30`,{headers:{Accept:'application/vnd.github+json'},cache:'no-store'});
    if(!res.ok)throw new Error(res.status);
    const issues=await res.json();
    journalItems=issues.map(issue=>{const raw=String(issue.body||''),date=(raw.match(/<!-- date:(.*?) -->/)||[])[1]||String(issue.created_at||'').slice(0,10),category=(raw.match(/<!-- category:(.*?) -->/)||[])[1]||'日記',body=raw.replace(/<!--.*?-->/gs,'').trim();return{date,category,title:issue.title.replace(/^\[JOURNAL\]\s*/,''),body}}).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
    renderJournal()
  }catch(e){$('#journalCount').textContent='OFFLINE';target.innerHTML='<div class="journal-empty"><div><small>SYNC ERROR</small><b>公開記録を取得できませんでした。</b></div></div>'}
}
$$('.journal-tab').forEach(btn=>btn.addEventListener('click',()=>{$$('.journal-tab').forEach(x=>x.classList.remove('active'));btn.classList.add('active');activeFilter=btn.dataset.filter;renderJournal()}));
loadJournal();

const modal=$('#adminModal'),form=$('#journalForm'),connectPanel=$('#connectPanel'),connectStatus=$('#connectStatus'),saveStatus=$('#saveStatus'),tokenInput=$('#tokenInput');
function token(){return sessionStorage.getItem(TOKEN_KEY)||''}function refreshAdmin(){const connected=!!token();connectPanel.style.display=connected?'none':'block';form.classList.toggle('active',connected)}
function openAdmin(){modal.classList.add('open');modal.setAttribute('aria-hidden','false');refreshAdmin()}function closeAdmin(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true')}
if(new URLSearchParams(location.search).get('admin')==='1')setTimeout(openAdmin,500);
$('#adminClose').addEventListener('click',closeAdmin);modal.addEventListener('click',e=>{if(e.target===modal)closeAdmin()});
$('#connectButton').addEventListener('click',async()=>{const value=tokenInput.value.trim();if(!value)return;connectStatus.textContent='接続確認中...';try{const res=await fetch(`https://api.github.com/repos/${REPO}`,{headers:{Authorization:`Bearer ${value}`,Accept:'application/vnd.github+json'}});if(!res.ok)throw new Error(res.status);sessionStorage.setItem(TOKEN_KEY,value);tokenInput.value='';refreshAdmin();saveStatus.textContent='CONNECTED / 保存ボタンだけでクラウドへ直接保存できます。'}catch(e){connectStatus.textContent='接続できませんでした。対象リポジトリとIssues権限を確認してください。'}});
$('#disconnectButton').addEventListener('click',()=>{sessionStorage.removeItem(TOKEN_KEY);refreshAdmin();connectStatus.textContent='接続を解除しました。'});
$('#entryDate').value=new Date().toISOString().slice(0,10);
form.addEventListener('submit',async e=>{e.preventDefault();const tk=token();if(!tk)return refreshAdmin();const date=$('#entryDate').value,category=$('#entryCategory').value,title=$('#entryTitle').value.trim(),body=$('#entryBody').value.trim();if(!date||!title||!body)return;saveStatus.textContent='クラウドへ保存中...';try{const res=await fetch(`https://api.github.com/repos/${REPO}/issues`,{method:'POST',headers:{Authorization:`Bearer ${tk}`,Accept:'application/vnd.github+json','Content-Type':'application/json'},body:JSON.stringify({title:`[JOURNAL] ${title}`,body:`<!-- date:${date} -->\n<!-- category:${category} -->\n${body}`,labels:['journal']})});if(!res.ok)throw new Error(await res.text());$('#entryTitle').value='';$('#entryBody').value='';saveStatus.textContent='保存しました。公開一覧へ自動反映します。';await loadJournal()}catch(err){saveStatus.textContent='保存できませんでした。トークン権限またはGitHub側の設定を確認してください。'}});