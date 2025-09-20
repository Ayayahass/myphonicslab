const Section = (() => {
  const DATA_PATH = "data/content.json";

  async function init(){
    const slug = Utils.qs("slug") || "short-vowel";
    document.getElementById("title").textContent = Utils.slugToTitle(slug);

    // حاول قراءة من GitHub، وإن فشل استخدم نسخة محلية من localStorage
    let data = await Utils.fetchJSON(DATA_PATH);
    if(!data){
      data = Utils.loadLocalJSON("content.json", { pages:{} });
    }
    const page = (data.pages && data.pages[slug]) || { items: [] };

    render(page.items);
  }

  function render(items){
    const host = document.getElementById("content");
    host.innerHTML = "";
    if(!items.length){
      const p = document.createElement("p");
      p.className="muted";
      p.textContent="لا يوجد محتوى بعد. أضيفي عناصر من لوحة الإدارة.";
      host.appendChild(p);
      return;
    }
    items.forEach(it=>{
      if(it.type==="youtube"){
        const wrap = document.createElement("div");
        wrap.className="embed";
        const id = ytId(it.url);
        wrap.innerHTML = `<iframe src="https://www.youtube.com/embed/${id}" allowfullscreen></iframe>`;
        host.appendChild(wrap);
      } else if(it.type==="image"){
        const img = document.createElement("img");
        img.src = it.src;
        img.style.maxWidth="100%";
        img.style.borderRadius="16px";
        img.style.boxShadow="var(--shadow)";
        host.appendChild(img);
      } else if(it.type==="audio"){
        const ad = document.createElement("audio");
        ad.controls = true;
        ad.src = it.src;
        host.appendChild(ad);
      }
    });
  }

  function ytId(u){
    try{
      const url = new URL(u);
      if(url.hostname.includes("youtu.be")) return url.pathname.slice(1);
      return new URLSearchParams(url.search).get("v");
    }catch(_){ return u; }
  }

  return { init };
})();
