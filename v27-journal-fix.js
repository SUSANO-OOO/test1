(()=>{
  const API_ROOT='https://api.github.com/repos/SUSANO-OOO/test1/issues';
  const nativeFetch=window.fetch.bind(window);
  let lastGitHubError=null;

  const normalizeLegacyIssue=(issue)=>{
    if(!issue||issue.pull_request||!/^\[JOURNAL\]\s*/.test(issue.title||'')) return null;
    const raw=String(issue.body||'');
    if(!raw.includes('<!-- PAOPAO_JOURNAL -->')) return issue;
    const date=(raw.match(/^DATE:\s*(.+)$/m)||[])[1]?.trim()||String(issue.created_at||'').slice(0,10);
    const category=(raw.match(/^CATEGORY:\s*(.+)$/m)||[])[1]?.trim()||'日記';
    const divider=raw.search(/^---\s*$/m);
    const body=divider>=0?raw.slice(divider).replace(/^---\s*$/m,'').trim():raw.replace(/<!--\s*PAOPAO_JOURNAL\s*-->/,'').replace(/^DATE:.*$/m,'').replace(/^CATEGORY:.*$/m,'').trim();
    const title=String(issue.title||'').replace(/^\[JOURNAL\]\s*/,'').replace(/^\d{4}-\d{2}-\d{2}\s*\|\s*/,'').trim();
    return {...issue,title:`[JOURNAL] ${title}`,body:`<!-- date:${date} -->\n<!-- category:${category} -->\n${body}`};
  };

  const rememberError=async(response)=>{
    try{
      const text=await response.clone().text();
      let message=text;
      try{message=JSON.parse(text).message||text}catch(_){ }
      lastGitHubError={status:response.status,message:String(message||'')};
    }catch(_){lastGitHubError={status:response.status,message:''}}
    return response;
  };

  window.fetch=async(input,init={})=>{
    const url=typeof input==='string'?input:input?.url||'';
    const method=String(init?.method||input?.method||'GET').toUpperCase();
    const isIssueApi=url.startsWith(API_ROOT);

    try{
      if(isIssueApi&&method==='GET'&&/([?&])labels=journal(?:&|$)/.test(url)){
        const u=new URL(url);
        u.searchParams.delete('labels');
        u.searchParams.set('per_page','100');
        const response=await nativeFetch(u.toString(),init);
        if(!response.ok) return rememberError(response);
        const data=await response.json();
        const journals=Array.isArray(data)?data.map(normalizeLegacyIssue).filter(Boolean):[];
        return new Response(JSON.stringify(journals),{status:200,statusText:'OK',headers:{'Content-Type':'application/json; charset=utf-8'}});
      }

      if(isIssueApi&&method==='POST'){
        let nextInit={...init};
        if(typeof init.body==='string'){
          try{
            const payload=JSON.parse(init.body);
            delete payload.labels;
            nextInit={...init,body:JSON.stringify(payload)};
          }catch(_){ }
        }
        const response=await nativeFetch(input,nextInit);
        if(!response.ok) return rememberError(response);
        lastGitHubError=null;
        return response;
      }

      if(isIssueApi&&(method==='PATCH'||method==='DELETE')){
        const response=await nativeFetch(input,init);
        if(!response.ok) return rememberError(response);
        lastGitHubError=null;
        return response;
      }

      return nativeFetch(input,init);
    }catch(error){
      lastGitHubError={status:0,message:error?.message||'NETWORK ERROR'};
      throw error;
    }
  };

  const explain=(error)=>{
    if(!error) return 'GitHubから詳細なエラーを取得できませんでした。いったん接続を解除し、専用キーを貼り直してください。';
    if(error.status===401) return '専用キーが無効か期限切れです。「接続解除」後、新しいキーを貼り直してください。';
    if(error.status===403) return '専用キーに書き込み権限がありません。GitHubで test1 を選び、Issues を Read and write に変更してください。';
    if(error.status===404) return '専用キーから test1 が見えていません。Repository access で test1 を選択し直してください。';
    if(error.status===422) return `GitHubが入力内容を受け付けませんでした。タイトルと本文を確認してください。${error.message?`（${error.message}）`:''}`;
    if(error.status===0) return 'GitHubとの通信に失敗しました。通信状態を確認して、もう一度保存してください。';
    return `GitHubエラー ${error.status}：${error.message||'設定を確認してください。'}`;
  };

  const attachStatusObserver=()=>{
    const status=document.querySelector('#saveStatus');
    if(!status) return;
    new MutationObserver(()=>{
      if(status.textContent.includes('保存できませんでした')) status.textContent=explain(lastGitHubError);
    }).observe(status,{childList:true,characterData:true,subtree:true});
  };

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',attachStatusObserver,{once:true});
  else attachStatusObserver();
})();
