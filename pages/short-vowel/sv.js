const SV = (() => {
  const DATA_PATH = "data.json";

  async function init(){
    // اسم المعلم من إعداداتك (لو موجودة)، وإلا Aisha
    const t = (JSON.parse(localStorage.getItem("settings")||"{}").teacherName) || "Aisha";
    const el = document.getElementById("teacherName"); if (el) el.textContent = t;

    const data = await fetchJSON(DATA_PATH);

    // قفل خاص بالصفحة (اختياري)
    if (data.lockCode) await withLessonLock("short-vowel", data.lockCode);

    buildMouth(data.mouth);
    buildVowelButtons(data.vowels);
    buildYTs(data.youtube);
    buildDictation(data.dictation);
  }

  async function fetchJSON(path){
    try{ const r = await fetch(path, {cache:"no-store"}); if(!r.ok) throw 0; return r.json(); }
    catch(_){ return {}; }
  }

  async function withLessonLock(key, code){
    const LSKEY = `unlock:${key}`;
    if (localStorage.getItem(LSKEY) === String(code)) return;

    const overlay = document.createElement("div");
    overlay.className = "lock-overlay";
    overlay.innerHTML = `
      <div class="lock-card">
        <h3>الدرس مقفول</h3>
        <p class="muted">أدخلي رمز هذا الدرس لفتحه</p>
        <label class="field"><input id="lockInput" type="password" placeholder="••••"></label>
        <button id="lockBtn" class="primary" style="width:100%">دخول</button>
      </div>`;
    document.body.appendChild(overlay);

    await new Promise((resolve)=>{
      const ok = ()=>{
        const v = (document.getElementById("lockInput").value||"").trim();
        if (v===String(code)){ localStorage.setItem(LSKEY, v); overlay.remove(); resolve(); }
        else alert("رمز غير صحيح");
      };
      document.getElementById("lockBtn").onclick = ok;
      document.getElementById("lockInput").addEventListener("keydown", e=>{ if(e.key==="Enter") ok(); });
    });
  }

  /* Mouth row */
  function buildMouth(list){
    const host = document.getElementById("mouthTiles");
    const defaults = ["a","e","i","o","u"];
    (list && list.length ? list : defaults.map(v=>({v}))).forEach(m=>{
      const card = document.createElement("div"); card.className="sv-card";
      if (m.img){ const img = new Image(); img.src = m.img; card.appendChild(img); }
      const cap = document.createElement("div");
      cap.textContent = (m.v||"").toLowerCase(); cap.style.fontWeight="800"; cap.style.fontSize="18px";
      card.appendChild(cap);
      host.appendChild(card);
    });
  }

  /* Vowel sounds */
  function buildVowelButtons(vowels){
    const wrap = document.getElementById("vowelButtons");
    ["a","e","i","o","u"].forEach(v=>{
      const b = document.createElement("button"); b.textContent = v;
      b.onclick = ()=> playVowel(v, vowels);
      wrap.appendChild(b);
    });
  }

  async function playVowel(v, vowels){
    const p = document.getElementById("sectionPlayer");
    const candidates = [];
    if (vowels && vowels.short && vowels.short[v]) candidates.push(vowels.short[v]);
    candidates.push(`assets/audio/vowels/short/${v}.mp3`); // افتراضي داخل مجلد الصفحة
    let found = await firstExisting(candidates);
    if(!found){ alert(`لا يوجد صوت لـ ${v}. جرّبت:\n${candidates.join("\n")}`); return; }
    p.src = found; await p.play();
  }

  /* YouTube */
  function buildYTs(urls){
    const host = document.getElementById("ytWrap");
    if (!urls || !urls.length){
      const p = document.createElement("p"); p.className="muted"; p.textContent="لا توجد روابط بعد.";
      host.appendChild(p); return;
    }
    urls.forEach(u=>{
      const d = document.createElement("div"); d.className="sv-embed";
      d.innerHTML = `<iframe src="https://www.youtube.com/embed/${ytId(u)}" allowfullscreen loading="lazy"></iframe>`;
      host.appendChild(d);
    });
  }
  function ytId(u){ try{ const url = new URL(u); if(url.hostname.includes("youtu.be")) return url.pathname.slice(1); return new URLSearchParams(url.search).get("v"); }catch(_){ return u; } }

  /* Dictation */
  function buildDictation(dict){
    const chips = document.getElementById("vowelChips");
    const input = document.getElementById("dictInput");
    const answer = document.getElementById("dictAnswer");
    const btnPlay = document.getElementById("btnPlay");
    const btnShow = document.getElementById("btnShow");

    let current = "a"; let revealed = false;

    ["a","e","i","o","u"].forEach(v=>{
      const c = document.createElement("div"); c.className="chip"; c.textContent=v;
      if(v===current) c.classList.add("active");
      c.onclick = ()=>{ current=v; [...chips.children].forEach(x=>x.classList.remove("active")); c.classList.add("active"); hideAnswer(); };
      chips.appendChild(c);
    });

    btnPlay.onclick = async ()=>{
      hideAnswer();
      const list = (dict && dict[current]) || [];
      if(!list.length){ alert(`لا توجد كلمات إملاء لـ ${current}.`); return; }
      const pick = list[Math.floor(Math.random()*list.length)];
      const candidates = [];
      if (pick.src) candidates.push(pick.src);
      // افتراضي داخل مجلد الصفحة
      const name = (pick.w||pick.word||"").toLowerCase();
      candidates.push(`assets/audio/dictation/${current}/${name}.mp3`);
      const p = document.getElementById("sectionPlayer");
      const found = await firstExisting(candidates);
      if(!found){ alert(`لم أجد ملف صوت للكلمة "${name}".`); return; }
      answer.textContent = name || (pick.w||pick.word||"");
      p.src = found; await p.play();
    };

    btnShow.onclick = ()=>{
      revealed = !revealed;
      btnShow.textContent = revealed ? "Hide" : "Show the word";
      answer.style.visibility = revealed ? "visible" : "hidden";
    };

    function hideAnswer(){ answer.style.visibility="hidden"; btnShow.textContent="Show the word"; input.value=""; }
  }

  /* Helpers */
  async function firstExisting(paths){
    for(const p of paths){
      try{ const r = await fetch(p,{method:"HEAD",cache:"no-store"}); if(r.ok) return p; }catch(_){}
    }
    return null;
  }

  return { init };
})();
