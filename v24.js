(()=>{
  if(window.__PAOPAO_V30_BOOTSTRAP__)return;
  window.__PAOPAO_V30_BOOTSTRAP__=true;
  document.querySelectorAll('link[rel="stylesheet"]').forEach(link=>{link.disabled=true;});
  const stylesheet=document.createElement('link');
  stylesheet.rel='stylesheet';
  stylesheet.href='./v30.css?v=20260721-1';
  document.head.append(stylesheet);
  const load=src=>new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=src;script.onload=resolve;script.onerror=reject;document.body.append(script);});
  load('./v30-content.js?v=20260721-1').then(()=>load('./v30-runtime.js?v=20260721-1')).catch(error=>{console.error('PAOPAO v30 failed to load',error);});
})();
