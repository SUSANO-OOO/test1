(()=>{
  const applyPortrait=()=>{
    const src=window.PAOPAO_PORTRAIT;
    if(!src)return;
    document.querySelectorAll('[data-photo]').forEach(img=>{
      img.src=src;
      img.decoding='async';
      img.loading='eager';
      img.alt='パオパオのプロフィール写真';
    });
  };

  if(window.PAOPAO_PORTRAIT){
    applyPortrait();
    return;
  }

  const script=document.createElement('script');
  script.src='./portrait-data.js?v=20260711-2';
  script.onload=applyPortrait;
  script.onerror=()=>console.error('[PAOPAO portrait] portrait-data.js could not be loaded');
  document.head.appendChild(script);
})();
