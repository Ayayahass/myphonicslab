/************ إعداد الأكواد ************/
// غيّري هذه الرموز كما تريدين
const STUDENT_CODE = "STUDENT123";
const ADMIN_CODE   = "ADMIN456";

/************ تسجيل الدخول/الخروج ************/
function handleLogin(code){
  if (code === ADMIN_CODE){
    localStorage.setItem('role','admin');
    location.replace('admin.html');
    return true;
  } else if (code === STUDENT_CODE){
    localStorage.setItem('role','student');
    location.replace('index.html');
    return true;
  }
  return false;
}
function logout(){
  localStorage.removeItem('role');
  location.replace('login.html');
}

/************ بناء الأحرف وتشغيل الصوت ************/
function initLetters(){
  const caps = document.getElementById('capitalRow');
  const small= document.getElementById('smallRow');
  if(!caps || !small) return;

  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
  for (const l of letters){
    const capBtn = document.createElement('button');
    capBtn.className = 'letter';
    capBtn.textContent = l.toUpperCase();
    capBtn.onclick = ()=> playSound(l);
    caps.appendChild(capBtn);

    const smBtn = document.createElement('button');
    smBtn.className = 'letter';
    smBtn.textContent = l;
    smBtn.onclick = ()=> playSound(l);
    small.appendChild(smBtn);
  }
}

function playSound(letter){
  const audio = new Audio(`sounds/${letter.toLowerCase()}.mp3`);
  // تنبيه لطيف إن لم يوجد الملف
  audio.onerror = ()=> alert(`ملف الصوت غير موجود: sounds/${letter}.mp3`);
  audio.play().catch(()=>{ /* في حال منع المتصفح التشغيل التلقائي */ });
}

/************ إعدادات GitHub (للأدمن) ************/
function saveGhConfig(){
  const cfg = {
    owner:  document.getElementById('ghOwner').value.trim(),
    repo:   document.getElementById('ghRepo').value.trim(),
    branch: document.getElementById('ghBranch').value.trim() || 'main',
    token:  document.getElementById('ghToken').value.trim(),
    remember: document.getElementById('rememberCfg').checked
  };
  if (cfg.remember){
    localStorage.setItem('gh_cfg', JSON.stringify({owner:cfg.owner, repo:cfg.repo, branch:cfg.branch, token:cfg.token}));
  } else {
    localStorage.removeItem('gh_cfg');
  }
  alert('Saved!');
}

function loadGhConfig(){
  const raw = localStorage.getItem('gh_cfg');
  if (!raw) return;
  try{
    const cfg = JSON.parse(raw);
    document.getElementById('ghOwner').value  = cfg.owner || '';
    document.getElementById('ghRepo').value   = cfg.repo || '';
    document.getElementById('ghBranch').value = cfg.branch || 'main';
    document.getElementById('ghToken').value  = cfg.token || '';
    document.getElementById('rememberCfg').checked = true;
  }catch{}
}

/************ رفع ملف إلى GitHub عبر API ************/
async function uploadToGithub(file, path, message){
  // قراءة الإعدادات
  const owner  = document.getElementById('ghOwner').value.trim();
  const repo   = document.getElementById('ghRepo').value.trim();
  const branch = (document.getElementById('ghBranch').value.trim() || 'main');
  const token  = document.getElementById('ghToken').value.trim();

  if(!owner || !repo || !token) { alert('أكملي إعدادات GitHub أولًا.'); return; }

  // قراءة الملف Base64
  const content = await fileToBase64(file);

  // هل الملف موجود؟ (للحصول على sha عند التحديث)
  const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`;
  let sha = undefined;
  const getRes = await fetch(getUrl, { headers: {"Authorization": `Bearer ${token}`, "Accept":"application/vnd.github+json"}});
  if (getRes.ok){
    const data = await getRes.json();
    sha = data.sha;
  }

  const putUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;
  const body = { message: message || `Add ${path}`, content: content, branch: branch };
  if (sha) body.sha = sha;

  const res = await fetch(putUrl, {
    method:'PUT',
    headers:{
      "Authorization": `Bearer ${token}`,
      "Accept":"application/vnd.github+json",
      "Content-Type":"application/json"
    },
    body: JSON.stringify(body)
  });

  if (!res.ok){
    const txt = await res.text();
    alert('فشل الرفع:\n' + txt);
  } else {
    alert('تم الرفع/التحديث بنجاح: ' + path);
  }
}

function fileToBase64(file){
  return new Promise((resolve,reject)=>{
    const reader = new FileReader();
    reader.onload = ()=> {
      const base64 = reader.result.split(',')[1]; // إزالة prefix
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
