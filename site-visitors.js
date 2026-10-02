(function(){
  try{
    const db=typeof supabaseClient!=="undefined"?supabaseClient:null;
    if(!db)return;
    const valid=new Set(["home","puan-durumu","fikstur","istatistik","kadrolar","siralama","finaller","Fantezi"]);
    const getId=(storage,key)=>{
      try{let id=storage.getItem(key);if(!id){id=crypto.randomUUID();storage.setItem(key,id);}return id;}
      catch{return crypto.randomUUID();}
    };
    const visitor=getId(localStorage,"ant_visitor_id"),session=getId(sessionStorage,"ant_visit_session");
    const ua=navigator.userAgent||"";
    const device=/iPhone/i.test(ua)?"iPhone":/iPad/i.test(ua)||(/Macintosh/i.test(ua)&&navigator.maxTouchPoints>1)?"iPad":/SamsungBrowser|SAMSUNG|\bSM-[A-Z0-9]+\b/i.test(ua)?"Samsung":/Android/i.test(ua)?"Android":/Windows/i.test(ua)?"Windows":/Macintosh|Mac OS X/i.test(ua)?"Mac":/Linux/i.test(ua)?"Linux":"Diğer";
    function source(){
      try{
        const host=new URL(document.referrer).hostname.toLowerCase();
        if(!host)return "Doğrudan";
        if(host==="antturnuva.com.tr"||host==="www.antturnuva.com.tr"||host.endsWith(".github.io"))return "Site içi";
        if(/instagram/.test(host))return "Instagram";
        if(/whatsapp|wa\.me/.test(host))return "WhatsApp";
        if(/google\./.test(host))return "Google";
        if(/facebook|fb\.me/.test(host))return "Facebook";
        if(/tiktok/.test(host))return "TikTok";
        if(/youtube|youtu\.be/.test(host))return "YouTube";
        return "Diğer site";
      }catch{return "Doğrudan";}
    }
    let sourceLabel;
    try{sourceLabel=sessionStorage.getItem("ant_visit_source");if(!sourceLabel){sourceLabel=source();sessionStorage.setItem("ant_visit_source",sourceLabel);}}
    catch{sourceLabel=source();}
    let lastSection="";
    function log(section){
      if(!valid.has(section)||section===lastSection)return;
      lastSection=section;
      db.from("site_visits").insert({visitor_id:visitor,session_id:session,section,device_label:device,source_label:sourceLabel,app_mode:matchMedia("(display-mode: standalone)").matches||navigator.standalone===true})
        .then(({error})=>{if(error)console.warn("Ziyaret kaydedilemedi:",error.message);});
    }
    const params=new URLSearchParams(location.search);
    const initial=params.has("haber")?"istatistik":document.querySelector(".nav-bottom-item.active")?.getAttribute("onclick")?.match(/showTab\('([^']+)'/)?.[1]||"Fantezi";
    log(valid.has(initial)?initial:"Fantezi");
    document.addEventListener("click",event=>{
      const item=event.target.closest?.(".nav-bottom-item[onclick*=\"showTab\"]");
      const tab=item?.getAttribute("onclick")?.match(/showTab\('([^']+)'/)?.[1];
      if(tab)setTimeout(()=>log(tab),0);
    });
  }catch(error){console.warn("Ziyaret ölçümü başlatılamadı:",error);}
})();