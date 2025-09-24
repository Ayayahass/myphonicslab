// صفحة Short Vowel مستقلة
(() => {
  const base = "pages/short-vowel";           // مسار الصفحة
  const dataPath = `${base}/data.json`;       // بيانات
  const storeKey = "sv:data";                 // كاش بسيط بالمتصفح
  let DATA = null;
  let currentV = "a";

  // --- إظهار عناصر الأدمن إن كان الدور أدمن (يعتمد على auth.js إن وجد) ---
  try { if (localStorage.getItem("role") === "admin") {
    document.querySelectorAll(".admin-only").forEach(el => el.style.display="block");
  }} catch(_){}

  // --- تحميل البيانات (أو إنشاء قالب فارغ) ---
  async function loadData(){
    try{
      const r = await fetch(dataPath, {cache:"no-store"});
      if(!r.ok) throw 0;
      DATA = await r.json();
      localStorage.setItem(storeKey, JSON.stringify(DATA));
    }catch(_){
      DATA = JSON.parse(localStorage.getItem(storeKey)||"null") || {
        mouth:{a:"",e:"",i:"",o:"",u:""},
        vowels:{short:{}},
        cons:{}, // أصوات السواكن
        youtube:[null,null,null,null,null],
        dict:{a:[],e:[],i:[],o:[],u:[]}
      };
    }
    render();
  }

  // --- رندر الواجهة ---
  function render(){
    // صور الفم
    ["a","e","i","o","u"].forEach(v=>{
      const src = (DATA.mouth&&DATA.mouth[v]) || "";
      if(src) document.getElementById(`img-${v}`).src = src.startsWith("http") ? src : `${base}/${src}`;
    });

    // إعداد أزرار اليوتويب
    const pills = document.querySelectorAll(".yt-pill");
    pills.forEach((btn,i)=>{
      btn.onclick = () => {
        const url = DATA.youtube[i];
        if(!url){ alert("لا يوجد رابط لهذا الزر."); return; }
        const id = ytId(url);
        const host = document.getElementById("ytEmbed");
        host.hidden = false;
        host.innerHTML = `<iframe src="https://www.youtube.com/embed/${id}" allowfullscreen loading="lazy"></iframe>`;
        window.scrollTo({top: host.offsetTop-20, behavior:"smooth"});
      };
    });

    // اختيارات الدكتايشن
    document.querySelectorAll(".chip").forEach(b=>{
      if(b.dataset.pick===currentV) b.classList.add("active");
      b.onclick = () => {
        currentV = b.dataset.pick;
        document.querySelectorAll(".chip").forEach(x=>x.classList.remove("active"));
        b.classList.add("active");
        document.getElementById("answerBox").textContent = "";
        document.getElementById("answerBox").style.visibility="hidden";
      };
    });
  }

  // --- تشغيل صوت حرف مد قصير ---
  document.querySelectorAll(".v-btn").forEach(btn=>{
    btn.onclick = async ()=>{
      const v = btn.dataset.v;
      const paths = [];
      if (DATA.vowels?.short?.[v]) paths.push(DATA.vowels.short[v]);
      paths.push(`assets/audio/vowels/short/${v}.mp3`); // داخل مجلد الصفحة
      const found = await firstExisting(paths);
      if(!found) return alert(`لا يوجد صوت لـ ${v}`);
      play(found);
    };
  });

  // --- تشغيل صوت حرف ساكن ---
  document.querySelectorAll(".c-btn").forEach(btn=>{
    btn.onclick = async ()=>{
      const letter = btn.textContent.trim();
      const paths = [];
      if (DATA.cons?.[letter]) paths.push(DATA.cons[letter]);
      paths.push(`assets/audio/cons/${letter}.mp3`); // داخل مجلد الصفحة
      const found = await firstExisting(paths);
      if(!found) return alert(`لا يوجد صوت لهذا الحرف`);
      play(found);
    };
  });

  // --- الدكتايشن ---
  document.getElementById("playBtn").onclick = async ()=>{
    const list = (DATA.dict && DATA.dict[currentV]) || [];
    if(!list.length) return alert(`لا توجد كلمات لـ ${currentV}`);
    const pick = list[Math.floor(Math.random()*list.length)];
    const src = pick.src || `assets/audio/dict/${currentV}/${(pick.w||"").toLowerCase()}.mp3`;
    document.getElementById("answerBox").textContent = (pick.w||"").toLowerCase();
    document.getElementById("answerBox").style.visibility="hidden";
    play(src);
  };
  document.getElementById("revealBtn").onclick = ()=>{
    const b = document.getElementById("answerBox");
    b.style.visibility = (b.style.visibility==="hidden") ? "visible" : "hidden";
  };

  // --- إدراج روابط يوتيوب من الصفحة (أدمن) ---
  document.getElementById("saveYT").onclick = async ()=>{
    const i = +document.getElementById("ytWhich").value;
    const url = document.getElementById("ytInput").value.trim();
    if(!url) return alert("ضعي رابط يوتيوب");
    DATA.youtube[i] = url;
    await saveData("Update short-vowel youtube");
    alert("تم حفظ رابط يوتيوب");
  };

  // --- رفع الصور للأحرف (من نفس الصفحة للأدمن) ---
  document.querySelectorAll(".up-img").forEach(input=>{
    input.addEventListener("change", async ()=>{
      const f = input.files[0]; if(!f) return;
      const v = input.dataset["for"];
      const path = `${base}/assets/images/mouth-${v}.${ext(f.name)}`;
      try{
        await ghPutFile(path, f, `Upload mouth image ${v}`);
        DATA.mouth ||= {}; DATA.mouth[v] = `assets/images/mouth-${v}.${ext(f.name)}`;
        await saveData(`Link mouth image ${v}`);
        document.getElementById(`img-${v}`).src = `${base}/${DATA.mouth[v]}?t=${Date.now()}`;
      }catch(e){ alert(e.message); }
    });
  });

  // --- رفع أصوات من لوحة الأدمن الصغيرة ---
  document.getElementById("upVowelBtn").onclick = async ()=>{
    const f = document.getElementById("upVowel").files[0];
    const v = (document.getElementById("vWhich").value||"").trim().toLowerCase();
    if(!f||!v) return alert("اختاري ملف وحددي الحرف");
    const path = `${base}/assets/audio/vowels/short/${v}.mp3`;
    await ghPutFile(path, f, `Upload vowel short ${v}`);
    DATA.vowels ||= {short:{}}; DATA.vowels.short[v] = `assets/audio/vowels/short/${v}.mp3`;
    await saveData(`Link vowel short ${v}`);
    alert("تم رفع صوت الـ vowel");
  };
  document.getElementById("upConsBtn").onclick = async ()=>{
    const f = document.getElementById("upCons").files[0];
    const c = (document.getElementById("cWhich").value||"").trim().toLowerCase();
    if(!f||!c) return alert("اختاري ملف وحددي الحرف");
    const path = `${base}/assets/audio/cons/${c}.mp3`;
    await ghPutFile(path, f, `Upload consonant ${c}`);
    DATA.cons ||= {}; DATA.cons[c] = `assets/audio/cons/${c}.mp3`;
    await saveData(`Link consonant ${c}`);
    alert("تم رفع صوت الحرف");
  };

  // --- GitHub helpers (رفع الملف وكتابة data.json) ---
  function ghCtx(){
    const owner = document.getElementById("ghOwner").value.trim();
    const repo  = document.getElementById("ghRepo").value.trim();
    const branch= document.getElementById("ghBranch").value.trim()||"main";
    const token = document.getElementById("ghToken").value.trim();
    if(!owner||!repo||!token) throw new Error("أدخلي Owner/Repo/Token");
    return {owner,repo,branch,token};
  }
  async function ghPutFile(path, file, message){
    const {owner,repo,branch,token} = ghCtx();
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    // sha إن وجد
    let sha; const head = await fetch(url,{headers:{Authorization:`Bearer ${token}`}}); if(head.ok){ const j=await head.json(); sha=j.sha; }
    const buf = await file.arrayBuffer();
    const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
    const res = await fetch(url,{
      method:"PUT",
      headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},
      body: JSON.stringify({message, content:b64, branch, ...(sha?{sha}:{})})
    });
    if(!res.ok) throw new Error("فشل الرفع إلى GitHub");
    return res.json();
  }
  async function saveData(message){
    const {owner,repo,branch,token} = ghCtx();
    const path = `${base}/data.json`;
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    let sha; const h = await fetch(url,{headers:{Authorization:`Bearer ${token}`}}); if(h.ok){ const j=await h.json(); sha=j.sha; }
    const bytes = new TextEncoder().encode(JSON.stringify(DATA,null,2));
    const b64 = btoa(String.fromCharCode(...bytes));
    const r = await fetch(url,{
      method:"PUT",
      headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},
      body: JSON.stringify({message, content:b64, branch, ...(sha?{sha}:{})})
    });
    if(!r.ok) throw new Error("فشل حفظ data.json");
  }

  // --- Utils ---
  async function firstExisting(paths){
    for(const p of paths){
      try{ const r = await fetch(p,{method:"HEAD",cache:"no-store"}); if(r.ok) return p; }catch(_){}
    } return null;
  }
  function ytId(u){ try{ const x=new URL(u); if(x.hostname.includes("youtu.be")) return x.pathname.slice(1); return new URLSearchParams(x.search).get("v"); }catch(_){ return u; } }
  function ext(name){ const m = name.toLowerCase().match(/\.([a-z0-9]+)$/); return m?m[1]:"png"; }
  function play(src){ const p=document.getElementById("player"); p.src = src.startsWith("http")?src:`${base}/${src}`; p.play(); }

  loadData();
})();
