const Utils = {
  qs: (k, d=location.search) => new URLSearchParams(d).get(k),
  slugToTitle: (slug) => ({
    "short-vowel":"Short Vowel",
    "long-vowel":"Long Vowel",
    "special-long-vowel":"Special Long Vowel",
    "digraphs":"Digraphs",
    "special-sounds":"Special Sounds",
    "grammar":"Grammar"
  }[slug] || slug),

  // GitHub API helpers
  async ghPutFile({owner, repo, branch, token, path, contentBase64, message}){
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    // need sha if file exists
    let sha = undefined;
    const resHead = await fetch(url, { headers:{Authorization:`Bearer ${token}`}});
    if(resHead.ok){ const j = await resHead.json(); sha = j.sha; }
    const body = { message, content: contentBase64, branch };
    if(sha) body.sha = sha;
    const res = await fetch(url, {
      method:"PUT",
      headers:{ "Authorization":`Bearer ${token}`, "Content-Type":"application/json" },
      body: JSON.stringify(body)
    });
    if(!res.ok) throw new Error(`GitHub PUT failed: ${res.status}`);
    return res.json();
  },

  fileToBase64(file){
    return new Promise((resolve,reject)=>{
      const r = new FileReader();
      r.onload = () => resolve(btoa(r.result));
      r.onerror = reject;
      r.readAsBinaryString(file);
    });
  },

  async fetchJSON(path){
    const res = await fetch(path, {cache:"no-store"});
    if(!res.ok) return null;
    return res.json();
  },

  saveLocalJSON(key, obj){ localStorage.setItem(key, JSON.stringify(obj)); },
  loadLocalJSON(key, def){ try{ return JSON.parse(localStorage.getItem(key)||""); }catch(_){ return def; } }
};
