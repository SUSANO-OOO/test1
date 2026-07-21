(()=>{
  if(window.__PAOPAO_V30_BOOTSTRAP__)return;
  window.__PAOPAO_V30_BOOTSTRAP__=true;
  document.querySelectorAll('link[rel="stylesheet"]').forEach(link=>{link.disabled=true;});
  ['./v30-1.css?v=20260721-1','./v30-2.css?v=20260721-1','./v30-3.css?v=20260721-1','./v30-4.css?v=20260721-1'].forEach(href=>{
    const stylesheet=document.createElement('link');
    stylesheet.rel='stylesheet';
    stylesheet.href=href;
    document.head.append(stylesheet);
  });
  const load=src=>new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=src;script.onload=resolve;script.onerror=reject;document.body.append(script);});
  const scripts=['./v30-content-1.js?v=20260721-1','./v30-content-2.js?v=20260721-1','./v30-content-3.js?v=20260721-1','./v30-mount.js?v=20260721-1','./v30-runtime.js?v=20260721-1'];
  scripts.reduce((promise,src)=>promise.then(()=>load(src)),Promise.resolve()).catch(error=>{console.error('PAOPAO v30 failed to load',error);});
})();
