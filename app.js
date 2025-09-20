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
  const small = document.getElementById('smallRow');
  if(!caps || !small) return;

  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');

  for (const l of letters){
    // زر الحرف الكبير
