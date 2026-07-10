(()=>{
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const pages=$$('.app-page'),routeLinks=$$('[data-route]'),transition=$('.route-transition'),app=$('#app'),floating=$('#floatingContact');
const routes={home:{index:'00',label:'HOME',theme:['#78f4eb','120,244,235']},work:{index:'01',label:'WORK',theme:['#9b83ff','155,131,255']},experience:{index:'02',label:'EXPERIENCE',theme:['#ffc367','255,195,103']},process:{index:'03',label:'PROCESS',theme:['#68dda4','104,221,164']},current:{index:'04',label:'CURRENT',theme:['#e84855','232,72,85']},journal:{index:'05',label:'JOURNAL',theme:['#78f4eb','120,244,235']},contact:{index:'06',label:'CONTACT',theme:['#e84855','232,72,85']}};
let current=null,changing=false;
function routeFromHash(){const r=location.hash.replace(/^#\/?/,'').split(/[?&]/)[0];return routes[r]?r:'home'}
function setTheme(route){const [c,rgb]=routes[route].theme;document.documentElement.style.setProperty('--accent',c);document.documentElement.style.setProperty('--accent-rgb',rgb);$('#railIndex').textContent=routes[route].index;$('#railLabel').textContent=routes[route].label}
function finishSwitch(route,initial=false){
  pages.forEach(p=>{const on=p.dataset.page===route;p.hidden=!on;p.classList.toggle('is-active',on);p.classList.remove('is-leaving');if(on){p.querySelectorAll('.reveal').forEach(x=>x.classList.add('visible'));p.classList.remove('is-entering');void p.offsetWidth;p.classList.add('is-entering')}});
  routeLinks.forEach(a=>{const active=a.dataset.route===route;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
  const page=$(`.app-page[data-page="${route}"]`);document.title=page?.dataset.title||'PAOPAO';document.body.dataset.route=route;setTheme(route);floating?.classList.toggle('visible',route!=='contact'&&route!=='home');
  if(!initial)scrollTo({top:0,behavior:'instant'});setTimeout(()=>page?.classList.remove('is-entering'),650);setTimeout(()=>app?.focus({preventScroll:true}),30);current=route;changing=false;
}
function showRoute(route,initial=false){if(changing||route===current){if(initial&&route===current)return;return}changing=true;if(initial||matchMedia('(prefers-reduced-motion: reduce)').matches){finishSwitch(route,initial);return}transition.classList.add('active');const old=$('.app-page.is-active');old?.classList.add('is-leaving');setTimeout(()=>finishSwitch(route),240);setTimeout(()=>transition.classList.remove('active'),520)}
addEventListener('hashchange',()=>showRoute(routeFromHash()));
routeLinks.forEach(a=>a.addEventListener('click',e=>{const route=a.dataset.route;if(!route)return;if(route===routeFromHash()){e.preventDefault();showRoute(route)}}));
showRoute(routeFromHash(),true);
$$('.flow-card').forEach(card=>card.addEventListener('pointermove',e=>{const r=card.getBoundingClientRect();card.style.setProperty('--px',((e.clientX-r.left)/r.width*100)+'%');card.style.setProperty('--py',((e.clientY-r.top)/r.height*100)+'%')}));
})();