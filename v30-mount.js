(()=>{
  document.documentElement.lang='ja';
  document.title='PAOPAO | ホームページ制作と業務自動化';
  const setMeta=(name,value,property=false)=>{let el=document.head.querySelector(`meta[${property?'property':'name'}="${name}"]`);if(!el){el=document.createElement('meta');el.setAttribute(property?'property':'name',name);document.head.append(el);}el.content=value;};
  setMeta('description','個人事業主・店舗・小規模事業者向けのホームページ制作と、小さな業務自動化。企画、文章、デザイン、実装、公開、運用整理までPAOPAOが対応します。');
  setMeta('og:title','PAOPAO | ホームページ制作と業務自動化',true);
  setMeta('og:description','伝わるホームページと、面倒な定型作業を減らす小さな業務ツールを制作します。',true);
  setMeta('og:image','https://susano-ooo.github.io/test1/portrait.webp',true);
  document.body.innerHTML=window.__PAOPAO_V30_HTML__||'';
  delete window.__PAOPAO_V30_HTML__;
})();
