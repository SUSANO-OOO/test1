(()=>{
  if(window.__PAOPAO_BOOTSTRAP__)return;
  window.__PAOPAO_BOOTSTRAP__=true;

  const installFrameBudget=()=>{
    if(window.__PAOPAO_FRAME_BUDGET__)return;
    window.__PAOPAO_FRAME_BUDGET__=true;
    const nativeRequest=window.requestAnimationFrame.bind(window);
    const nativeCancel=window.cancelAnimationFrame.bind(window);
    const tasks=new Map();
    let sequence=0;

    const intervalFor=callback=>{
      const name=callback?.name||'';
      if(name==='drawAmbient')return 50;
      if(name==='drawCursor')return 34;
      if(name==='drawOpening'&&innerWidth<=1100)return 34;
      return 0;
    };

    window.requestAnimationFrame=callback=>{
      const id=-(++sequence);
      const interval=intervalFor(callback);
      const state={cancelled:false,nativeId:0,last:0};
      const tick=timestamp=>{
        if(state.cancelled)return;
        if(interval&&state.last&&timestamp-state.last<interval){
          state.nativeId=nativeRequest(tick);
          return;
        }
        state.last=timestamp;
        tasks.delete(id);
        callback(timestamp);
      };
      state.nativeId=nativeRequest(tick);
      tasks.set(id,state);
      return id;
    };

    window.cancelAnimationFrame=id=>{
      const state=tasks.get(id);
      if(state){
        state.cancelled=true;
        nativeCancel(state.nativeId);
        tasks.delete(id);
        return;
      }
      nativeCancel(id);
    };
  };
  installFrameBudget();

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