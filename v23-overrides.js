(()=>{
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
qa('.workflow-step').forEach(card=>card.addEventListener('pointermove',e=>{const r=card.getBoundingClientRect();card.style.setProperty('--px',((e.clientX-r.left)/r.width*100)+'%');card.style.setProperty('--py',((e.clientY-r.top)/r.height*100)+'%')}));
const floating=q('#floatingContact');
function updateFloating(){floating?.classList.toggle('visible',scrollY>innerHeight*.72)}
addEventListener('scroll',updateFloating,{passive:true});updateFloating();
})();
