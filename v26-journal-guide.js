(()=>{
  if(window.__PAOPAO_JOURNAL_GUIDE__)return;
  window.__PAOPAO_JOURNAL_GUIDE__=true;

  const TOKEN_KEY='paopao_admin_token_v22';
  const REMEMBER_KEY='paopao_admin_remember_v26';
  try{
    const saved=localStorage.getItem(TOKEN_KEY);
    if(saved)sessionStorage.setItem(TOKEN_KEY,saved);
  }catch(_){ }

  const panel=document.querySelector('#connectPanel');
  if(!panel||panel.querySelector('.token-guide'))return;

  const field=panel.querySelector('.field');
  const button=panel.querySelector('#connectButton');
  const status=panel.querySelector('#connectStatus');
  const guide=document.createElement('div');
  guide.className='token-guide';
  guide.innerHTML='<div class="token-guide-title"><span>最初の1回だけ</span><h3>ここには、GitHubで作る専用キーを貼り付けます。</h3></div><p><strong>GitHubのログインパスワードではありません。</strong><code>github_pat_</code>で始まる文字列を、一度だけ作成して貼り付けます。</p><ol class="token-steps"><li><b>下のボタンからGitHubを開く</b><span>GitHubへログインした状態で開いてください。</span></li><li><b>次の3項目だけ設定する</b><span>名前：<code>PAOPAO Journal</code><br>Repository access：<code>Only select repositories → test1</code><br>Permissions：<code>Issues → Read and write</code></span></li><li><b>Generate tokenを押してコピー</b><span>表示された<code>github_pat_...</code>を、右側の入力欄へ貼り付けます。</span></li></ol><a class="token-create-link" href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener noreferrer"><span>① GitHubで専用キーを作る</span><b>開く ↗</b></a>';

  const paste=document.createElement('div');
  paste.className='token-paste-area';
  paste.innerHTML='<div class="token-mobile-help"><p><b>入力するもの：</b><code>github_pat_</code>で始まるGitHub専用キー</p><a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener noreferrer">専用キーを持っていないので作る ↗</a></div>';
  if(field){
    const label=field.querySelector('span');
    const input=field.querySelector('input');
    if(label)label.textContent='② 作成した専用キーを貼り付ける';
    if(input)input.placeholder='github_pat_xxxxxxxxxxxxxxxxx';
    paste.appendChild(field);
  }

  const remember=document.createElement('label');
  remember.className='remember-token';
  remember.innerHTML='<input id="rememberToken" type="checkbox"><span><b>この端末に保存する</b><small>次回から入力不要。共有端末ではチェックしないでください。</small></span>';
  paste.appendChild(remember);
  if(button){
    button.textContent='③ JOURNAL管理を開く';
    button.classList.add('connect-large');
    paste.appendChild(button);
  }
  if(status){
    status.textContent='接続後は、新規作成・編集・公開からの削除ができます。';
    paste.appendChild(status);
  }

  panel.className='token-connect-panel';
  panel.replaceChildren(guide,paste);

  const rememberBox=document.querySelector('#rememberToken');
  const tokenInput=document.querySelector('#tokenInput');
  const connectStatus=document.querySelector('#connectStatus');
  try{rememberBox.checked=localStorage.getItem(REMEMBER_KEY)==='1'}catch(_){ }

  button?.addEventListener('click',event=>{
    const value=tokenInput?.value.trim()||'';
    if(!value){
      event.stopImmediatePropagation();
      if(connectStatus)connectStatus.textContent='上の入力欄に、github_pat_で始まる専用キーを貼り付けてください。';
      tokenInput?.focus();
      return;
    }
    if(!value.startsWith('github_pat_')&&!value.startsWith('ghp_')){
      event.stopImmediatePropagation();
      if(connectStatus)connectStatus.textContent='GitHubのパスワードではなく、github_pat_で始まる専用キーを入力してください。';
      tokenInput?.focus();
    }
  },true);

  new MutationObserver(()=>{
    if(panel.style.display!=='none')return;
    try{
      const token=sessionStorage.getItem(TOKEN_KEY);
      if(token&&rememberBox.checked){
        localStorage.setItem(TOKEN_KEY,token);
        localStorage.setItem(REMEMBER_KEY,'1');
      }else{
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REMEMBER_KEY);
      }
    }catch(_){ }
  }).observe(panel,{attributes:true,attributeFilter:['style']});

  document.querySelector('#disconnectButton')?.addEventListener('click',()=>{
    try{
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REMEMBER_KEY);
    }catch(_){ }
  });
})();