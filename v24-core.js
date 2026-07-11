(()=>{
  if(window.__PAOPAO_ROUTE_RUNTIME__)return;
  window.__PAOPAO_ROUTE_RUNTIME__=true;

  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const pages=$$('.app-page');
  const routeLinks=$$('[data-route]');
  const transition=$('.route-transition');
  const app=$('#app');
  const floating=$('#floatingContact');
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  const routes={
    home:{index:'00',label:'HOME',theme:['#78f4eb','120,244,235']},
    work:{index:'01',label:'WORK',theme:['#9b83ff','155,131,255']},
    experience:{index:'02',label:'EXPERIENCE',theme:['#ffc367','255,195,103']},
    process:{index:'03',label:'PROCESS',theme:['#68dda4','104,221,164']},
    current:{index:'04',label:'CURRENT',theme:['#e84855','232,72,85']},
    journal:{index:'05',label:'JOURNAL',theme:['#78f4eb','120,244,235']},
    contact:{index:'06',label:'CONTACT',theme:['#e84855','232,72,85']}
  };

  let current=null;
  let changing=false;
  let switchTimer=0;
  let transitionTimer=0;

  const routeFromHash=()=>{
    const route=location.hash.replace(/^#\/?/,'').split(/[?&]/)[0];
    return routes[route]?route:'home';
  };

  const setTheme=route=>{
    const [color,rgb]=routes[route].theme;
    document.documentElement.style.setProperty('--accent',color);
    document.documentElement.style.setProperty('--accent-rgb',rgb);
    const railIndex=$('#railIndex');
    const railLabel=$('#railLabel');
    if(railIndex)railIndex.textContent=routes[route].index;
    if(railLabel)railLabel.textContent=routes[route].label;
  };

  const finishSwitch=(route,initial=false)=>{
    clearTimeout(switchTimer);
    pages.forEach(page=>{
      const active=page.dataset.page===route;
      page.hidden=!active;
      page.classList.toggle('is-active',active);
      page.classList.remove('is-leaving');
      if(active){
        page.querySelectorAll('.reveal').forEach(element=>element.classList.add('visible'));
        page.classList.remove('is-entering');
        void page.offsetWidth;
        page.classList.add('is-entering');
      }
    });
    routeLinks.forEach(link=>{
      const active=link.dataset.route===route;
      link.classList.toggle('active',active);
      if(active)link.setAttribute('aria-current','page');
      else link.removeAttribute('aria-current');
    });
    const page=$(`.app-page[data-page="${route}"]`);
    document.title=page?.dataset.title||'PAOPAO';
    document.body.dataset.route=route;
    setTheme(route);
    floating?.classList.toggle('visible',route!=='contact'&&route!=='home');
    if(!initial)scrollTo({top:0,behavior:'auto'});
    switchTimer=setTimeout(()=>page?.classList.remove('is-entering'),650);
    setTimeout(()=>app?.focus({preventScroll:true}),30);
    current=route;
    changing=false;
  };

  const showRoute=(route,initial=false)=>{
    if(changing||route===current)return;
    changing=true;
    clearTimeout(transitionTimer);
    if(initial||reducedMotion.matches){
      finishSwitch(route,initial);
      return;
    }
    transition?.classList.add('active');
    $('.app-page.is-active')?.classList.add('is-leaving');
    setTimeout(()=>finishSwitch(route),240);
    transitionTimer=setTimeout(()=>transition?.classList.remove('active'),520);
  };

  addEventListener('hashchange',()=>showRoute(routeFromHash()));
  routeLinks.forEach(link=>link.addEventListener('click',event=>{
    const route=link.dataset.route;
    if(!route)return;
    if(route===routeFromHash())event.preventDefault();
  }));
  $$('.flow-card').forEach(card=>card.addEventListener('pointermove',event=>{
    const rect=card.getBoundingClientRect();
    card.style.setProperty('--px',`${(event.clientX-rect.left)/rect.width*100}%`);
    card.style.setProperty('--py',`${(event.clientY-rect.top)/rect.height*100}%`);
  },{passive:true}));

  showRoute(routeFromHash(),true);
})();