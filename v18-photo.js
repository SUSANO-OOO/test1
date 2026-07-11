(()=>{
  const PORTRAIT='./portrait.jpg?v=20260711-4';
  window.PORTRAIT=PORTRAIT;
  window.PAOPAO_PORTRAIT=PORTRAIT;

  const apply=()=>{
    document.querySelectorAll('img[data-photo]').forEach(img=>{
      if(img.getAttribute('src')!==PORTRAIT)img.src=PORTRAIT;
      img.alt='パオパオのプロフィール画像';
      img.decoding='async';
      img.loading='eager';
    });
  };

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',apply,{once:true});
  }else{
    apply();
  }
})();
