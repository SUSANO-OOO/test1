window.PAOPAO_PORTRAIT='./portrait.jpg?build=v16-layout-fix-1';
(function(){
  const style=document.createElement('style');
  style.id='paopao-v16-layout-fix';
  style.textContent=`
    html,body{overflow-x:clip!important;max-width:100%!important}
    main section{overflow:clip;isolation:isolate}
    main header.section-head{
      position:relative!important;
      inset:auto!important;
      top:auto!important;
      right:auto!important;
      bottom:auto!important;
      left:auto!important;
      z-index:2!important;
      width:auto!important;
      background:none!important;
      transform:none!important;
      filter:none!important;
      text-shadow:none!important;
      animation:none!important;
    }
    main header.section-head *{
      text-shadow:none!important;
      animation:none!important;
    }
    main header.section-head.reveal{
      opacity:1!important;
      transform:none!important;
      filter:none!important;
    }
  `;
  document.head.appendChild(style);
})();
