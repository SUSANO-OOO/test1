(()=>{
  const addStyle=(href)=>{
    if(document.querySelector(`link[href="${href}"]`)) return;
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href=href;
    document.head.appendChild(link);
  };
  const load=(src)=>new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.src=src;
    script.async=false;
    script.onload=resolve;
    script.onerror=()=>reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });

  addStyle('./v28.css');
  addStyle('./v29.css');
  load('./v18-photo.js')
    .then(()=>load('./v28-bridge.js'))
    .then(()=>load('https://raw.githack.com/SUSANO-OOO/test1/dc923dd3dc16d86fcbfc0cc23a2b88b108a43ae6/v24.js'))
    .then(()=>load('./v27-journal-fix.js'))
    .then(()=>load('./v28.js'))
    .then(()=>load('./v29.js'))
    .catch(error=>console.error('[PAOPAO runtime]',error));
})();
