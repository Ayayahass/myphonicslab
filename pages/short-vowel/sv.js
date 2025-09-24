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
    const i = +docum
