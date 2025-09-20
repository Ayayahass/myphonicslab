const App = (() => {
  function makeLetterButtons(){
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const caps = document.getElementById("caps");
    const smalls = document.getElementById("smalls");

    letters.forEach(L=>{
      // أزرار الكابيتال
      const b = document.createElement("button");
      b.textContent = L;
      b.onclick = () => playLetter(L, "cap");
      caps.appendChild(b);

      // أزرار السمول
      const s = document.createElement("button");
      s.textContent = L.toLowerCase();
      s.onclick = () => playLetter(L.toLowerCase(), "small");
      smalls.appendChild(s);
    });
  }

  async function playLetter(ch, variant){
    const player = document.getElementById("player");

    // مسارات محتملة (نجرب بالتسلسل)
    const paths = [];
    if (variant === "cap") {
      paths.push(`assets/audio/letters/caps/${ch.toUpperCase()}.mp3`);
    } else {
      paths.push(`assets/audio/letters/smalls/${ch.toLowerCase()}.mp3`);
    }
    // توافق للخلف: لو عندك ملف قديم مشترك مثل A.mp3 في الجذر
    paths.push(`assets/audio/letters/${ch.toUpperCase()}.mp3`);

    let found = null;
    for (const p of paths){
      try {
        const res = await fetch(p, { method: "HEAD" });
        if (res.ok) { found = p; break; }
      } catch(_) {}
    }

    if (!found) {
      alert(`لا يوجد ملف صوت للحرف (${variant==="cap"?"Capital":"Small"}) ${ch}.`);
      return;
    }
    player.src = found;
    await player.play();
  }

  function initHome(){
    const teacher = (JSON.parse(localStorage.getItem("settings")||"{}").teacherName) || "Aisha";
    const el = document.getElementById("teacherName");
    if (el) el.textContent = teacher;
    makeLetterButtons();
  }

  return { initHome };
})();
