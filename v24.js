(()=>{
  const load=(src)=>new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.src=src;
    script.onload=resolve;
    script.onerror=()=>reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });

  load('https://raw.githack.com/SUSANO-OOO/test1/dc923dd3dc16d86fcbfc0cc23a2b88b108a43ae6/v24.js')
    .then(()=>load('./v27-journal-fix.js'))
    .catch(error=>console.error('[PAOPAO runtime]',error));
})();
