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
