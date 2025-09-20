// بسيط للحماية بالرمز عبر localStorage
const Auth = (() => {
  const DEFAULTS = { student: "1234", admin: "9999", teacherName: "Aisha" };

  function getCodes(){
    const saved = JSON.parse(localStorage.getItem("codes")||"{}");
    return { student: saved.student || DEFAULTS.student, admin: saved.admin || DEFAULTS.admin };
  }

  function guard(allowedRoles){
    const role = localStorage.getItem("role");
    if(!role || !allowedRoles.includes(role)){
      location.replace("login.html");
      return;
    }
  }

  function logout(){
    localStorage.removeItem("role");
    location.replace("login.html");
  }

  function initLogin(){
    // prefill defaults if missing (first run)
    if(!localStorage.getItem("codes")) localStorage.setItem("codes", JSON.stringify(getCodes()));
    let role = "student";
    const btnStudent = document.getElementById("btn-student");
    const btnAdmin = document.getElementById("btn-admin");
    btnStudent.onclick = () => { role="student"; btnStudent.classList.add("active"); btnAdmin.classList.remove("active"); }
    btnAdmin.onclick = () => { role="admin"; btnAdmin.classList.add("active"); btnStudent.classList.remove("active"); }

    document.getElementById("login").onclick = () => {
      const code = (document.getElementById("code").value||"").trim();
      const codes = getCodes();
      if((role==="student" && code===codes.student) || (role==="admin" && code===codes.admin)){
        localStorage.setItem("role", role);
        location.replace(role==="admin" ? "admin.html" : "index.html");
      }else{
        alert("الرمز غير صحيح");
      }
    };
  }

  return { guard, logout, initLogin, getCodes, DEFAULTS };
})();
