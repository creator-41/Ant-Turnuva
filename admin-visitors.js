(function(){
  const db=typeof sb!=="undefined"?sb:null;
  const root=document.getElementById("visitorPanel");
  if(!db||!root)return;
  const $=id=>document.getElementById(id);
  const escape=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const labels={home:"Ana sayfa","puan-durumu":"Puan durumu",fikstur:"Fikstür",istatistik:"İstatistik",kadrolar:"Kadrolar",siralama:"Sıralama",finaller:"Finaller",Fantezi:"Takım kur"};
  const dateKey=iso=>new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Istanbul",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(iso));
  const localStamp=iso=>new Intl.DateTimeFormat("tr-TR",{timeZone:"Europe/Istanbul",day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(iso));
  function startAt(days){
    const p=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Istanbul",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
    const v=Object.fromEntries(p.map(x=>[x.type,x.value]));
    return new Date(Date.UTC(Number(v.year),Number(v.month)-1,Number(v.day)-days+1,-3)).toISOString();
  }
  let range=7,busy=false;
  async function load(){
    if(busy||$("tab-visitors").classList.contains("hidden"))return;
    busy=true;root.textContent="Ziyaret verileri yükleniyor…";
    try{
      const rows=[],since=startAt(range);
      for(let page=0;page<10;page++){
        const {data,error}=await db.from("site_visits").select("created_at,visitor_id,session_id,section,device_label,source_label,app_mode").gte("created_at",since).order("created_at",{ascending:false}).range(page*1000,page*1000+999);
        if(error)throw error;
        rows.push(...(data||[]));
        if(!data||data.length<1000)break;
      }
      const people=new Set(rows.map(x=>x.visitor_id)).size;
      const sessions=new Set(rows.map(x=>x.session_id)).size;
      const groups=new Map(),devices=new Map(),sources=new Map(),sections=new Map();
      for(const row of rows){
        const when=range===1?localStamp(row.created_at).split(" ")[1].slice(0,2)+":00":dateKey(row.created_at);
        const g=groups.get(when)||{visitors:new Set(),views:0};g.views++;g.visitors.add(row.visitor_id);groups.set(when,g);
        const d=devices.get(row.device_label)||new Set();d.add(row.visitor_id);devices.set(row.device_label,d);
        const s=sources.get(row.source_label)||new Set();s.add(row.session_id);sources.set(row.source_label,s);
        const name=labels[row.section]||row.section,sec=sections.get(name)||{sessions:new Set(),views:0};sec.sessions.add(row.session_id);sec.views++;sections.set(name,sec);
      }
      const ordered=[...groups].sort((a,b)=>a[0].localeCompare(b[0])),max=Math.max(1,...ordered.map(([,g])=>g.views));
      const rowsHtml=ordered.length?ordered.map(([key,g])=>'<div class="d-grid align-items-center gap-2 mb-2" style="grid-template-columns:80px 1fr 80px"><span class="small">'+escape(key)+'</span><div class="progress" style="height:18px;background:#0f172a"><div class="progress-bar bg-info" style="width:'+g.views/max*100+'%"></div></div><span class="small text-end">'+g.visitors.size+' / '+g.views+'</span></div>').join(""):'<p class="text-secondary mb-0">Bu dönemde ziyaret kaydı yok.</p>';
      const list=(map,fmt)=>[...map].sort((a,b)=>b[1].size-a[1].size).map(([name,value])=>'<div class="d-flex justify-content-between gap-3 border-top border-secondary py-2 small"><span>'+escape(name)+'</span><strong class="text-info">'+fmt(value)+'</strong></div>').join("")||'<p class="text-secondary mb-0">Henüz veri yok.</p>';
      root.innerHTML='<div class="row g-3 mb-3"><div class="col-4"><div class="card p-3 text-center"><div class="stat">'+people+'</div><div class="muted small">Tekil cihaz</div></div></div><div class="col-4"><div class="card p-3 text-center"><div class="stat">'+sessions+'</div><div class="muted small">Oturum</div></div></div><div class="col-4"><div class="card p-3 text-center"><div class="stat">'+rows.length+(rows.length===10000?"+":"")+'</div><div class="muted small">Sayfa açılışı</div></div></div></div>'+
      '<div class="card p-3 mb-3"><h5>'+(range===1?"Saatlik":"Günlük")+' trafik</h5>'+rowsHtml+'<div class="muted small mt-2">Grafikte tekil cihaz / toplam sayfa açılışı gösterilir.</div></div>'+
      '<div class="row g-3 mb-3"><div class="col-md-6"><div class="card p-3 h-100"><h5>Trafik kaynağı</h5>'+list(sources,n=>n+" oturum")+'<div class="muted small mt-2">Kaynak, tarayıcının ilettiği site adına göre genel kategoriye ayrılır.</div></div></div><div class="col-md-6"><div class="card p-3 h-100"><h5>Cihaz türleri</h5>'+list(devices,n=>n+" cihaz")+'<div class="muted small mt-2">Cihaz türü genel kategoridir; tam model kaydedilmez.</div></div></div></div>'+
      '<div class="card p-3 mb-3"><h5>En çok açılan bölümler</h5>'+list(new Map([...sections].map(([n,g])=>[n,{size:g.sessions.size,views:g.views}])),v=>v.size+" oturum · "+v.views+" açılış")+'</div>'+
      '<div class="card p-3"><h5>Son ziyaretler</h5>'+(rows.slice(0,50).map(row=>'<div class="d-flex justify-content-between gap-3 border-top border-secondary py-2 small"><span>'+escape(localStamp(row.created_at))+' · '+escape(labels[row.section]||row.section)+' · '+escape(row.device_label)+(row.app_mode?' · Uygulama':'')+'</span><span class="text-info text-nowrap">Cihaz '+escape(row.visitor_id.slice(0,8))+'</span></div>').join("")||'<p class="text-secondary mb-0">Kayıt yok.</p>')+'</div>'+
      (rows.length===10000?'<p class="text-warning small mt-2">İlk 10.000 kayıt gösteriliyor.</p>':"");
    }catch(error){root.textContent="Ziyaret verileri yüklenemedi: "+(error?.message||error);}
    finally{busy=false;}
  }
  document.querySelectorAll("[data-visitor-range]").forEach(button=>button.addEventListener("click",()=>{
    range=Number(button.dataset.visitorRange);
    document.querySelectorAll("[data-visitor-range]").forEach(x=>x.setAttribute("aria-pressed",String(x===button)));
    load();
  }));
  document.querySelector('#tabs button[data-tab="visitors"]')?.addEventListener("click",()=>setTimeout(load,0));
  document.addEventListener("visibilitychange",()=>{if(!document.hidden&&!$("tab-visitors").classList.contains("hidden"))load();});
})();