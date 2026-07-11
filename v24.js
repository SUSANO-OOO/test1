(()=>{
  if(window.__PAOPAO_BOOTSTRAP__)return;
  window.__PAOPAO_BOOTSTRAP__=true;

  const addStyle=href=>{
    if(document.querySelector(`link[href="${href}"]`))return;
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href=href;
    document.head.appendChild(link);
  };

  const loadOnce=src=>{
    const absolute=new URL(src,location.href).href;
    const existing=[...document.scripts].find(script=>script.src===absolute);
    if(existing)return Promise.resolve();
    return new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src=src;
      script.async=false;
      script.addEventListener('load',()=>{
        script.dataset.loaded='true';
        resolve();
      },{once:true});
      script.addEventListener('error',()=>reject(new Error(`Failed to load ${src}`)),{once:true});
      document.head.appendChild(script);
    });
  };

  addStyle('./v28.css');
  addStyle('./v29.css');

  Promise.all([
    loadOnce('./v18-photo.js'),
    loadOnce('./v24-core.js'),
    loadOnce('./v28-bridge.js')
  ])
    .then(()=>loadOnce('./v26-journal-guide.js'))
    .then(()=>loadOnce('./v27-journal-fix.js'))
    .then(()=>loadOnce('./v28-runtime.js'))
    .then(()=>loadOnce('./v29.js'))
    .then(()=>document.documentElement.classList.add('paopao-ready'))
    .catch(error=>console.error('[PAOPAO runtime]',error));
})();