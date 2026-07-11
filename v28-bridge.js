(()=>{
  const API_ROOT='https://api.github.com/repos/SUSANO-OOO/test1/issues';
  const originalFetch=window.fetch.bind(window);
  let latestError=null;

  const normalizeIssue=(issue)=>{
    if(!issue||issue.pull_request||!/^\[JOURNAL\]\s*/.test(String(issue.title||''))) return null;
    const raw=String(issue.body||'');
    if(raw.includes('<!-- PAOPAO_JOURNAL -->')){
      const date=(raw.match(/^DATE:\s*(.+)$/m)||[])[1]?.trim()||String(issue.created_at||'').slice(0,10);
      const category=(raw.match(/^CATEGORY:\s*(.+)$/m)||[])[1]?.trim()||'日記';
      const divider=raw.search(/^---\s*$/m);
      const cleanBody=(divider>=0?raw.slice(divider).replace(/^---\s*$/m,''):
        raw.replace(/<!--\s*PAOPAO_JOURNAL\s*-->/,'')
           .replace(/^DATE:.*$/m,'')
           .replace(/^CATEGORY:.*$/m,'')).trim();
      const cleanTitle=String(issue.title||'')
        .replace(/^\[JOURNAL\]\s*/,'')
        .replace(/^\d{4}-\d{2}-\d{2}\s*\|\s*/,'')
        .trim();
      return {...issue,title:`[JOURNAL] ${cleanTitle}`,body:`<!-- date:${date} -->\n<!-- category:${category} -->\n${cleanBody}`};
    }
    return issue;
  };

  const captureError=async(response)=>{
    try{
      const text=await response.clone().text();
      let message=text;
      try{message=JSON.parse(text).message||text}catch(_){}
      latestError={status:response.status,message:String(message||'')};
    }catch(_){latestError={status:response.status,message:''}}
    window.PAOPAO_GITHUB_ERROR=latestError;
    return response;
  };

  window.fetch=async(input,init={})=>{
    const url=typeof input==='string'?input:input?.url||'';
    const method=String(init?.method||input?.method||'GET').toUpperCase();
    const isIssueApi=url.startsWith(API_ROOT);

    try{
      if(isIssueApi&&method==='GET'&&!/\/issues\/\d+(?:\?|$)/.test(url)){
        const u=new URL(url);
        u.searchParams.delete('labels');
        u.searchParams.set('per_page','100');
        const response=await originalFetch(u.toString(),init);
        if(!response.ok)return captureError(response);
        const data=await response.json();
        const journals=Array.isArray(data)?data.map(normalizeIssue).filter(Boolean):[];
        latestError=null;window.PAOPAO_GITHUB_ERROR=null;
        return new Response(JSON.stringify(journals),{
          status:200,
          headers:{'Content-Type':'application/json; charset=utf-8'}
        });
      }

      if(isIssueApi&&method==='POST'&&typeof init.body==='string'){
        let nextInit={...init};
        try{
          const payload=JSON.parse(init.body);
          delete payload.labels;
          nextInit={...init,body:JSON.stringify(payload)};
        }catch(_){}
        const response=await originalFetch(input,nextInit);
        if(!response.ok)return captureError(response);
        latestError=null;window.PAOPAO_GITHUB_ERROR=null;
        return response;
      }

      if(isIssueApi&&(method==='PATCH'||method==='DELETE')){
        const response=await originalFetch(input,init);
        if(!response.ok)return captureError(response);
        latestError=null;window.PAOPAO_GITHUB_ERROR=null;
        return response;
      }

      return originalFetch(input,init);
    }catch(error){
      latestError={status:0,message:error?.message||'NETWORK ERROR'};
      window.PAOPAO_GITHUB_ERROR=latestError;
      throw error;
    }
  };
})();