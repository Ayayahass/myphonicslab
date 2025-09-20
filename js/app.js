const App = (() => {
  function makeLetterButtons(){
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const caps = document.getElementById("caps");
    const smalls = document.getElementById("smalls");
    letters.forEach(L=>{
      const b = document.createElement("button");
      b.textContent = L;
      b.onclick = () => playLetter(L);
      caps.appendChild(b);

      const s = document.createElement("button");
      s.textContent = L.toLowerCase();
      s.onclick = () => playLetter(L);
      smalls.appendChild(s);
    });
  }

  async function playLetter(L){
    const player = document.getElementById("player");
    const src = `assets/audio/letters/${L}.mp3`;
    try{
      // حاول التأكد من وجود الملف قبل التشغيل
      const head = await fetch(src, {method:"HEAD"});
      if(!head.ok) throw 0;
      player.src = src;
      await player.play();
    }catch(_){
      alert(`لا يوجد ملف صوت للحرف ${L}. ارفعي ${L}.mp3 في assets/audio/letters/`);
    }
  }

  function initHome(){
    // اسم المعلم من الإعدادات (لو أحببتِ تغييره لاحقًا)
    const teacher = (JSON.parse(localStorage.getItem("settings")||"{}").teacherName) || Auth.DEFAULTS.teacherName;
    document.getElementById("teacherName").textContent = teacher;
    makeLetterButtons();
  }

  return { initHome };
})();
