(()=>{
  const PORTRAIT='./portrait.webp?v=20260712-1';
  window.PORTRAIT=PORTRAIT;
  window.PAOPAO_PORTRAIT=PORTRAIT;

  // The particle canvas advanced by rendered frame count and could fall out of
  // sync on slower machines. Keep the CSS opening sequence and remove only
  // this unstable supplementary layer before the animation runtime starts.
  document.querySelector('#openingCanvas')?.remove();

  const apply=()=>{
    document.querySelectorAll('img[data-photo]').forEach(img=>{
      if(img.getAttribute('src')!==PORTRAIT)img.src=PORTRAIT;
      img.alt='パオパオ塾のプロフィール画像';
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
