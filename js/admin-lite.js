// لوحة أدمن مبسّطة
const AdminLite = (() => {
  const log = (m) => { const el = document.getElementById('log'); el.textContent = m; console.log(m); };
  const baseFor = () => document.getElementById('pagePath').value || 'pages/short-vowel';
  const dataPath = () => `${baseFor()}/data.json`;

  // --- helpers: GH API ---
  function ctx(){
    const owner  = document.getElementById('ghOwner').value.trim();
    const repo   = document.getElementById('ghRepo').value.trim();
    const branch = (document.getElementById('ghBranch').value.trim() || 'main');
    const token  = document.getElementById('ghToken').value.trim();
    if(!owner || !repo || !token) throw new Error('أدخلي Owner/Repo/Token');
    localStorage.setItem('ghCtx', JSON.stringify({owner,repo,branch,token}));
    return {owner,repo,branch,token};
  }
  async function ghGet(url){ const r = await fetch(url); if(!r.ok) throw new Error('GET failed'); return r.json(); }
  async function ghGetSha(path,{owner,repo,token}){
    const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`,{
      headers:{Authorization:`Bearer ${token}`}
    });
    if(!r.ok) return null;
    const j = await r.json(); return j.sha;
  }
  async function ghPutFile(path, bytes, message, ctxObj){
    const {owner,repo,branch,token} = ctxObj;
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const sha = await ghGetSha(path,ctxObj);
    const b64 = btoa(String.fromCharCode(...bytes));
    const r = await fetch(url,{
      method:'PUT',
      headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
      body: JSON.stringify({message, content:b64, branch, ...(sha?{sha}:{})})
    });
    if(!r.ok){ const t = await r.text(); throw new Error('PUT failed: '+t); }
    return r.json();
  }
  async function fileToBytes(file){ const buf = await file.arrayBuffer(); return new Uint8Array(buf); }

  // --- data.json ---
  async function loadData(){
    try{ return await ghGet(dataPath()); }
    catch(_){
      // هيكل افتراضي
      return { lockCode:"", mouth:{}, vowels:{short:{}}, cons:{}, youtube:[null,null,null,null,null], dict:{a:[],e:[],i:[],o:[],u:[]} };
    }
  }
  async function saveData(data, ctxObj){
    const bytes = new TextEncoder().encode(JSON.stringify(data,null,2));
    await ghPutFile(dataPath(), bytes, `Update ${dataPath()}`, ctxObj);
  }

  // --- الأكواد العامة (data/codes.json) ---
  async function saveCodes(){
    const admin = document.getElementById('adminCode').value.trim();
    const student = document.getElementById('studentCode').value.trim();
    const ctxObj = ctx();
    const bytes = new TextEncoder().encode(JSON.stringify({admin,student},null,2));
    await ghPutFile('data/codes.json', bytes, 'Update codes', ctxObj);
    alert('تم حفظ الأكواد ✅');
  }

  // --- حفظ رمز الصفحة ---
  async function savePageLock(){
    const ctxObj = ctx();
    const data = await loadData();
    data.lockCode = document.getElementById('pageLock').value.trim();
    await saveData(data, ctxObj);
    alert('تم حفظ Page Password ✅');
  }

  // --- عملية الرفع الشاملة ---
  async function uploadAll(){
    try{
      const ctxObj = ctx();
      let data = await loadData();

      // 1) رمز الصفحة
      const lock = document.getElementById('pageLock').value.trim();
      if(lock) data.lockCode = lock;

      // 2) MP3 (حرف)
      const mp3Letter = (document.getElementById('mp3Letter').value||'').trim().toLowerCase();
      const mp3Files = document.getElementById('mp3Input').files;
      if(mp3Letter && mp3Files.length){
        if('aeiou'.includes(mp3Letter)){
          const f = mp3Files[0]; // ملف واحد لهذا الحرف
          const bytes = await fileToBytes(f);
          const rel = `assets/audio/vowels/short/${mp3Letter}.mp3`;
          await ghPutFile(`${baseFor()}/${rel}`, bytes, `Upload vowel short ${mp3Letter}`, ctxObj);
          data.vowels ||= {short:{}}; data.vowels.short ||= {}; data.vowels.short[mp3Letter] = rel;
          log(`✔ تم رفع صوت vowel ${mp3Letter}`);
        }else{
          const f = mp3Files[0];
          const bytes = await fileToBytes(f);
          const rel = `assets/audio/cons/${mp3Letter}.mp3`;
          await ghPutFile(`${baseFor()}/${rel}`, bytes, `Upload consonant ${mp3Letter}`, ctxObj);
          data.cons ||= {}; data.cons[mp3Letter] = rel;
          log(`✔ تم رفع صوت الحرف ${mp3Letter}`);
        }
      }

      // 3) صورة mouth
      const imgVowel = (document.getElementById('imgVowel').value||'').trim().toLowerCase();
      const img = document.getElementById('imgInput').files[0];
      if(img && 'aeiou'.includes(imgVowel)){
        const ext = (img.name.split('.').pop()||'png').toLowerCase();
        const rel = `assets/images/mouth-${imgVowel}.${ext}`;
        const bytes = await fileToBytes(img);
        await ghPutFile(`${baseFor()}/${rel}`, bytes, `Upload mouth ${imgVowel}`, ctxObj);
        data.mouth ||= {}; data.mouth[imgVowel] = rel;
        log(`✔ تم رفع صورة mouth-${imgVowel}`);
      }

      // 4) رابط YouTube
      const ytUrl = (document.getElementById('ytUrl').value||'').trim();
      if(ytUrl){
        const slotSel = document.getElementById('ytSlot').value;
        data.youtube ||= [null,null,null,null,null];
        let idx = -1;
        if(slotSel === 'auto'){ idx = data.youtube.findIndex(x=>!x); if(idx===-1) idx = 0; }
        else idx = +slotSel;
        data.youtube[idx] = ytUrl;
        log(`✔ تم حفظ رابط YouTube في زر ${idx+1}`);
      }

      // 5) الإملاء الذاتي
      const sound = (document.getElementById('dictSound').value||'').trim().toLowerCase();
      if(sound && 'aeiou'.includes(sound)){
        data.dict ||= {a:[],e:[],i:[],o:[],u:[]};
        const words = (document.getElementById('dictWords').value||'')
          .split(/\n+/).map(s=>s.trim().toLowerCase()).filter(Boolean);
        words.forEach(w=>{ if(!data.dict[sound].some(x=>x.w===w)) data.dict[sound].push({w}); });

        const files = document.getElementById('dictFiles').files;
        for(const f of files){
          const name = f.name.replace(/\.[^.]+$/,'').toLowerCase();
          const rel = `assets/audio/dict/${sound}/${name}.mp3`;
          await ghPutFile(`${baseFor()}/${rel}`, await fileToBytes(f), `Upload dict ${sound}/${name}`, ctxObj);
          const ex = data.dict[sound].find(x=>x.w===name);
          if(ex) ex.src = rel; else data.dict[sound].push({w:name, src:rel});
        }
      }

      // 6) حفظ data.json
      await saveData(data, ctxObj);
      log('✅ كل شيء جاهز وتم الحفظ.');
      alert('تم الرفع والحفظ بنجاح ✅');
    }catch(e){
      console.error(e); alert('فشل: ' + e.message);
    }
  }

  // تحميل الإعدادات المحفوظة محليًا
  (function init(){
    try{
      const s = JSON.parse(localStorage.getItem('ghCtx')||'null');
      if(s){ ghOwner.value=s.owner||''; ghRepo.value=s.repo||''; ghBranch.value=s.branch||'main'; }
    }catch(_){}
  })();

  return { uploadAll, saveCodes, savePageLock };
})();
