/************ إعداد الأكواد ************/
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

/************ أدوات جاهزية الصفحة ************/
function ready(fn){
  if (document.readyState !== "loading") fn();
  else document.addEventListener("DOMContentLoaded", fn);
}

/************ بناء الأحرف وتشغيل الصوت ************/
function initLetters(){
  const caps  = document.getElementById('capitalRow');
  const small = document.getElementById('smallRow');
  if (!caps || !small) return; // الصفحة ليست صفحة الطالب

  // امسح أي محتوى قديم ثم ابنِ الحروف
  caps.innerHTML = '';
  small.innerHTML = '';

  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
  for (const l of letters){
    // كبير
    const capBtn = document.createElement('button');
    capBtn.className = 'letter';
    capBtn.textContent = l.toUpperCase();
    capBtn.onclick = () => playSound(l, true);
    caps.appendChild(capBtn);

    // صغير
    const smBtn = document.createElement('button');
    smBtn.className = 'letter';
    smBtn.textContent = l;
    smBtn.onclick = () => playSound(l, false);
    small.appendChild(smBtn);
  }
}

/**
 * تشغيل الصوت
 * @param {string} letter
 * @param {boolean} isCapital
 */
function playSound(letter, isCapital = false){
  const fileName = isCapital ? `${letter.toUpperCase()}.mp3` : `${letter.toLowerCase()}.mp3`;
  const audio = new Audio(`sounds/${fileName}`);
  audio.onerror = () => alert(`الصوت غير موجود: sounds/${fileName}`);
  audio.play().catch(()=>{});
}

// اكشف الدوال للاستخدام من الـConsole إن احتجتِ
window.initLetters = initLetters;
window.playSound   = playSound;

/************ إعدادات GitHub (للأدمن) ************/
function saveGhConfig(){
  const cfg = {
    owner:  (document.getElementById('ghOwner')  || {}).value?.trim(),
    repo:   (document.getElementById('ghRepo')   || {}).value?.trim(),
    branch: (document.getElementById('ghBranch') || {}).value?.trim() || 'main',
    token:  (document.getElementById('ghToken')  || {}).value?.trim(),
    remember: (document.getElementById('rememberCfg') || {}).checked
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
    if (document.getElementById('ghOwner'))  document.getElementById('ghOwner').value  = cfg.owner  || '';
    if (document.getElementById('ghRepo'))   document.getElementById('ghRepo').value   = cfg.repo   || '';
    if (document.getElementById('ghBranch')) document.getElementById('ghBranch').value = cfg.branch || 'main';
    if (document.getElementById('ghToken'))  document.getElementById('ghToken').value  = cfg.token  || '';
    if (document.getElementById('rememberCfg')) document.getElementById('rememberCfg').checked = true;
  }catch{}
}

/************ رفع ملف إلى GitHub عبر API ************/
async function uploadToGithub(file, path, message){
  const owner  = (document.getElementById('ghOwner')  || {}).value?.trim();
  const repo   = (document.getElementById('ghRepo')   || {}).value?.trim();
  const branch = (document.getElementById('ghBranch') || {}).value?.trim() || 'main';
  const token  = (document.getElementById('ghToken')  || {}).value?.trim();
  if(!owner || !repo || !token){ alert('أكملي إعدادات GitHub أولًا.'); return; }

  const content = await fileToBase64(file);

  // احصل على sha إذا كان الملف موجودًا
  const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`;
  let sha;
  const getRes = await fetch(getUrl, { headers: {"Authorization": `Bearer ${token}`, "Accept":"application/vnd.github+json"}});
  if (getRes.ok){
    const data = await getRes.json();
    sha = data.sha;
  }

  const putUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;
  const body = { message: message || `Add ${path}`, content, branch };
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
    reader.onload = ()=> resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/************ تشغيل تلقائي بعد جاهزية الصفحة ************/
ready(()=>{
  // لو أنتِ في صفحة الطالب ووجدنا الحاويات، نبني الحروف مباشرة
  initLetters();
});

function logout(){
  localStorage.removeItem('role');
  location.replace('login.html');
}

/************ بناء الأحرف وتشغيل الصوت ************/
function initLetters(){
  const caps = document.getElementById('capitalRow');
  const small = document.getElementById('smallRow');
  if(!caps || !small) return;

  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');

  for (const l of letters){
    // زر الحرف الكبير
