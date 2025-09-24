const Admin = (() => {
  let content = { pages:{
    "short-vowel":{ items:[] },
    "long-vowel":{ items:[] },
    "special-long-vowel":{ items:[] },
    "digraphs":{ items:[] },
    "special-sounds":{ items:[] },
    "grammar":{ items:[] }
  }};

  function init(){
    // عرض الأكواد الحالية
    const codes = Auth.getCodes();
    document.getElementById("studentCode").value = codes.student;
    document.getElementById("adminCode").value = codes.admin;

    // حاول تحميل content.json من الريبو
    loadContent();
  }

  async function loadContent(){
    const j = await Utils.fetchJSON("data/content.json");
    if(j) content = j;
    else {
      const local = Utils.loadLocalJSON("content.json");
      if(local) content = local;
    }
    renderPreview();
  }

  function renderPreview(){
    document.getElementById("contentPreview").textContent = JSON.stringify(content, null, 2);
  }

  function saveCodes(){
    const student = (document.getElementById("studentCode").value||"").trim();
    const admin = (document.getElementById("adminCode").value||"").trim();
    localStorage.setItem("codes", JSON.stringify({student, admin}));
    alert("تم حفظ الأكواد ✅");
  }

  function addYoutube(){
    const slug = document.getElementById("pageSlug").value;
    const url = (document.getElementById("ytUrl").value||"").trim();
    if(!url) return alert("أدخلي رابط يوتيوب");
    content.pages[slug] ||= {items:[]};
    content.pages[slug].items.push({type:"youtube", url});
    renderPreview();
    document.getElementById("ytUrl").value="";
  }

  function saveContentLocal(){
    Utils.saveLocalJSON("content.json", content);
    alert("تم الحفظ محليًا (LocalStorage). يمكنك دفعه للريبو لاحقًا.");
  }

  async function pushContentToGitHub(){
    try{
      const ctx = ghCtx();
      const bytes = new TextEncoder().encode(JSON.stringify(content, null, 2));
      const b64 = btoa([...bytes].map(b=>String.fromCharCode(b)).join(""));
      await Utils.ghPutFile({
        ...ctx, path:"data/content.json", contentBase64:b64,
        message:"Update data/content.json via Admin Panel"
      });
      alert("تم حفظ content.json على GitHub ✅");
    }catch(e){
      alert(e.message);
    }
  }

  function ghCtx(){
    const owner  = document.getElementById("ghOwner").value.trim();
    const repo   = document.getElementById("ghRepo").value.trim();
    const branch = document.getElementById("ghBranch").value.trim() || "main";
    const token  = document.getElementById("ghToken").value.trim();
    if(!owner||!repo||!branch||!token) throw new Error("أدخلي بيانات GitHub والتوكن.");
    return {owner, repo, branch, token};
  }

  async function uploadSelected(){
    const files = document.getElementById("fileInput").files;
    if(!files.length) return alert("اختاري ملفات للرفع");
    const log = document.getElementById("uploadLog");
    log.textContent = "جارٍ الرفع...\n";
    const ctx = ghCtx();

    for (const f of files){
      const ext = f.name.split(".").pop().toLowerCase();
      const folder = (ext==="mp3") ? "assets/uploads" : "assets/uploads";
      const path = `${folder}/${Date.now()}-${f.name}`;
      const base64 = await Utils.fileToBase64(f);
      try{
        await Utils.ghPutFile({
          ...ctx, path, contentBase64: base64,
          message: `Upload ${f.name} via Admin Panel`
        });
        log.textContent += `✓ رفع: ${path}\n`;
      }catch(e){
        log.textContent += `✗ فشل: ${f.name} — ${e.message}\n`;
      }
    }
    log.textContent += "\nانتهى.";
  }

  function scanLetters(){
    document.getElementById("lettersLog").textContent =
`تذكير: ارفعي ملفات الحروف في:
assets/audio/letters/A.mp3 .. Z.mp3

بعد الرفع ستعمل أزرار الحروف تلقائيًا.`;
  }

  return { init, saveCodes, addYoutube, saveContentLocal, pushContentToGitHub, uploadSelected, scanLetters };
})();

/* ===== إدارة صفحات داخل مجلد pages/* مثل pages/short-vowel/ ===== */
const Pages = (() => {
  let data = {};            // محتوى data.json المحمّل
  let base = "pages/short-vowel"; // مجلد الصفحة الحالي

  // قراءة حقول GitHub من نفس الحقول في لوحة الرفع
  function ghCtx(){
    const owner  = document.getElementById("ghOwner").value.trim();
    const repo   = document.getElementById("ghRepo").value.trim();
    const branch = (document.getElementById("ghBranch").value.trim() || "main");
    const token  = document.getElementById("ghToken").value.trim();
    if(!owner||!repo||!branch||!token) throw new Error("أدخلي بيانات GitHub والتوكن (قسم الرفع).");
    return {owner, repo, branch, token};
  }

  async function load(){
    base = document.getElementById("pgPath").value; // مثال: pages/short-vowel
    const url = `${base}/data.json`;
    try{
      const res = await fetch(url, {cache:"no-store"});
      if(!res.ok) throw 0;
      data = await res.json();
    }catch(_){
      data = {
        lockCode: "",
        mouth: [],
        vowels: { short: {} },
        youtube: [],
        dictation: { a:[], e:[], i:[], o:[], u:[] }
      };
    }
    renderSection();
    renderList();
    document.getElementById("contentPreview")?.scrollIntoView({behavior:"smooth"}); // اختياري
    alert(`تم تحميل ${url}`);
  }

  async function save(){
    const ctx = ghCtx();
    const path = `${base}/data.json`;
    const jsonStr = JSON.stringify(data, null, 2);
    const bytes = new TextEncoder().encode(jsonStr);
    const b64 = btoa([...bytes].map(b=>String.fromCharCode(b)).join(""));
    await Utils.ghPutFile({
      ...ctx, path, contentBase64: b64,
      message: `Update ${path} via Admin Panel`
    });
    alert("تم حفظ data.json على GitHub ✅");
  }

  // واجهة الإدخال حسب النوع المختار
  function renderSection(){
    const sec = document.getElementById("pgSection").value;
    const ed = document.getElementById("pgEditor");
    ed.innerHTML = "";

    if(sec==="mouth"){
      ed.innerHTML = `
        <div class="field"><span>Letter (a/e/i/o/u)</span><input id="m_v" placeholder="a"></div>
        <div class="field"><span>Image URL</span><input id="m_img" placeholder="${base}/assets/images/mouth-a.png"></div>
        <button onclick="Pages.addMouth()">+ إضافة</button>
        <p class="muted small">ارفعي صور الفم إلى: <code>${base}/assets/images/</code> ثم ضعي الرابط هنا.</p>
      `;
    } else if(sec==="vowels.short"){
      ed.innerHTML = `
        <div class="field"><span>Letter (a/e/i/o/u)</span><input id="vs_v" placeholder="a"></div>
        <div class="field"><span>Audio URL</span><input id="vs_src" placeholder="${base}/assets/audio/vowels/short/a.mp3"></div>
        <button onclick="Pages.addVowelShort()">+ إضافة/تحديث</button>
        <p class="muted small">ارفعي الأصوات إلى: <code>${base}/assets/audio/vowels/short/</code></p>
      `;
    } else if(sec==="youtube"){
      ed.innerHTML = `
        <div class="field"><span>YouTube URL</span><input id="yt_url" placeholder="https://www.youtube.com/watch?v=..."></div>
        <button onclick="Pages.addYT()">+ إضافة</button>
      `;
    } else if(sec.startsWith("dictation.")){
      const v = sec.split(".")[1]; // a/e/i/o/u
      ed.innerHTML = `
        <div class="field"><span>Vowel</span><input value="${v}" disabled></div>
        <div class="field"><span>Word</span><input id="d_word" placeholder="cat"></div>
        <div class="field"><span>Audio URL</span><input id="d_src" placeholder="${base}/assets/audio/dictation/${v}/cat.mp3"></div>
        <button onclick="Pages.addDict('${v}')">+ إضافة</button>
        <p class="muted small">ارفعي الصوت إلى: <code>${base}/assets/audio/dictation/${v}/</code></p>
      `;
    } else if(sec==="lock"){
      ed.innerHTML = `
        <div class="field"><span>رمز فتح الدرس</span><input id="lock_code" value="${data.lockCode||""}" placeholder="SV2025"></div>
        <button onclick="Pages.setLock()">حفظ الرمز</button>
      `;
    }
    renderList();
  }

  // إضافة عناصر
  function addMouth(){
    const v = (document.getElementById("m_v").value||"").trim().toLowerCase();
    const img = (document.getElementById("m_img").value||"").trim();
    if(!v||!img) return alert("أدخلي الحرف والرابط");
    data.mouth ||= [];
    data.mouth.push({v, img});
    renderList();
  }

  function addVowelShort(){
    const v = (document.getElementById("vs_v").value||"").trim().toLowerCase();
    const src = (document.getElementById("vs_src").value||"").trim();
    if(!v||!src) return alert("أدخلي الحرف والرابط");
    data.vowels ||= {}; data.vowels.short ||= {};
    data.vowels.short[v] = src; // تحديث/إضافة
    renderList();
  }

  function addYT(){
    const url = (document.getElementById("yt_url").value||"").trim();
    if(!url) return alert("أدخلي الرابط");
    data.youtube ||= [];
    data.youtube.push(url);
    renderList();
  }

  function addDict(v){
    const w = (document.getElementById("d_word").value||"").trim().toLowerCase();
    const src = (document.getElementById("d_src").value||"").trim();
    if(!w||!src) return alert("أدخلي الكلمة والرابط");
    data.dictation ||= {a:[],e:[],i:[],o:[],u:[]};
    data.dictation[v].push({ w, src });
    renderList();
  }

  function setLock(){
    data.lockCode = (document.getElementById("lock_code").value||"").trim();
    alert("تم حفظ الرمز في الذاكرة — اضغطي حفظ لكتابة data.json على GitHub");
  }

  // عرض القائمة + ترتيب/حذف
  function renderList(){
    const sec = document.getElementById("pgSection").value;
    const host = document.getElementById("pgList");
    host.innerHTML = "";

    const mkRow = (txt, idx, arrRef) => {
      const div = document.createElement("div");
      div.style.display="flex"; div.style.alignItems="center";
      div.style.justifyContent="space-between";
      div.style.borderBottom="1px dashed #eee"; div.style.padding="6px 0";
      const left = document.createElement("div"); left.textContent = txt;
      const right = document.createElement("div");
      const up = document.createElement("button"); up.textContent="↑"; up.onclick=()=>move(arrRef, idx, -1);
      const down = document.createElement("button"); down.textContent="↓"; down.onclick=()=>move(arrRef, idx, +1);
      const del = document.createElement("button"); del.textContent="✕"; del.onclick=()=>{ arrRef.splice(idx,1); renderList(); };
      [up,down,del].forEach(b=>{ b.style.marginLeft="6px"; b.className="secondary"; });
      right.append(up,down,del);
      div.append(left,right);
      host.appendChild(div);
    };

    if(sec==="mouth"){
      (data.mouth||[]).forEach((m,i)=> mkRow(`${m.v}  —  ${m.img}`, i, data.mouth));
    } else if(sec==="vowels.short"){
      const pairs = Object.entries((data.vowels&&data.vowels.short)||{});
      if(!pairs.length){ host.textContent="لا توجد عناصر بعد."; return; }
      pairs.forEach(([k,src],i)=>{
        // للتحريك في كائن: نحوله مؤقتًا إلى مصفوفة
        mkRow(`${k}  —  ${src}`, i, {
          splice:(idx, n)=>{ const arr = Object.entries(data.vowels.short); arr.splice(idx,n); data.vowels.short = Object.fromEntries(arr); },
          move:(from,to)=>{ const arr = Object.entries(data.vowels.short); const it=arr.splice(from,1)[0]; arr.splice(to,0,it); data.vowels.short = Object.fromEntries(arr); }
        });
      });
    } else if(sec==="youtube"){
      (data.youtube||[]).forEach((u,i)=> mkRow(u, i, data.youtube));
    } else if(sec.startsWith("dictation.")){
      const v = sec.split(".")[1];
      (data.dictation?.[v]||[]).forEach((d,i)=> mkRow(`${d.w}  —  ${d.src}`, i, data.dictation[v]));
    } else if(sec==="lock"){
      host.textContent = `الرمز الحالي: ${data.lockCode||"(لا يوجد)"}`;
    }
  }

  function move(arrRef, idx, dir){
    if(typeof arrRef.move === "function"){
      // حالة الكائن (vowels.short) حوّلناها لأداة move مخصصة
      const to = idx + dir; if(to<0) return; arrRef.move(idx,to); renderList(); return;
    }
    const to = idx + dir; if(to<0 || to>=arrRef.length) return;
    const item = arrRef.splice(idx,1)[0];
    arrRef.splice(to,0,item);
    renderList();
  }

  return { load, save, renderSection, addMouth, addVowelShort, addYT, addDict, setLock };
})();

