window.PAOPAO_PORTRAIT='';
(function(){
  const style=document.createElement('style');
  style.id='paopao-v17-layout-fix';
  style.textContent=`
    html,body{overflow-x:clip!important;max-width:100%!important}
    main section{overflow:clip;isolation:isolate}
    main header.section-head{position:relative!important;inset:auto!important;top:auto!important;right:auto!important;bottom:auto!important;left:auto!important;z-index:2!important;width:auto!important;background:none!important;transform:none!important;filter:none!important;text-shadow:none!important;animation:none!important}
    main header.section-head *{text-shadow:none!important;animation:none!important}
    main header.section-head.reveal{opacity:1!important;transform:none!important;filter:none!important}
  `;
  document.head.appendChild(style);

  const selectors='img[data-photo],#portraitImage,#mobilePortraitImage,.portrait img,.portrait-card img,.mobile-id img,.mobile-identity img';
  let resolved='';

  function applyPortrait(src){
    if(!src)return;
    resolved=src;
    window.PAOPAO_PORTRAIT=src;
    document.querySelectorAll(selectors).forEach(img=>{
      if(img.src!==src){
        img.src=src;
        img.alt='パオパオのプロフィール写真';
      }
    });
  }

  async function loadPortrait(){
    const raw='https://raw.githubusercontent.com/SUSANO-OOO/test1/main/portrait.jpg?build=v17';
    applyPortrait(raw);
    try{
      const response=await fetch('https://api.github.com/repos/SUSANO-OOO/test1/contents/portrait.jpg?ref=main',{cache:'no-store',headers:{Accept:'application/vnd.github+json'}});
      if(!response.ok)throw new Error('HTTP '+response.status);
      const data=await response.json();
      if(data&&data.content){
        const base64=String(data.content).replace(/\s/g,'');
        applyPortrait('data:image/jpeg;base64,'+base64);
      }
    }catch(error){
      applyPortrait(raw);
    }
  }

  const observer=new MutationObserver(()=>{if(resolved)applyPortrait(resolved)});
  observer.observe(document.documentElement,{childList:true,subtree:true});
  addEventListener('DOMContentLoaded',()=>{if(resolved)applyPortrait(resolved)},{once:true});
  loadPortrait();
  setTimeout(()=>observer.disconnect(),12000);
})();