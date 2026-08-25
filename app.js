(() => {
  const cfg=window.ROZAG_CONFIG||{};
  const endpoint=cfg.STATUS_ENDPOINT||"/api/status";
  const interval=Number(cfg.REFRESH_MS||15000);

  const normalise=v=>{
    v=String(v??"").toLowerCase();
    if(["online","active","enabled","ok","healthy"].includes(v))return"online";
    if(["degraded","pending","starting","warning"].includes(v))return"warn";
    if(["error","failed","failure"].includes(v))return"error";
    if(["offline","disabled","down"].includes(v))return"offline";
    return"unknown";
  };
  const label=k=>({online:"Online",warn:"Degraded",error:"Error",offline:"Offline",unknown:"Checking…"}[k]||"Checking…");

  function setRow(name,value){
    const row=document.querySelector(`[data-service="${name}"]`);
    if(!row)return;
    const state=row.querySelector(".service-state");
    const k=normalise(value?.status??value);
    state.className=`service-state ${k}`;
    state.querySelector("b").textContent=label(k);
  }

  function ago(v){
    if(!v)return"—";
    const d=new Date(v);
    if(Number.isNaN(d.getTime()))return String(v);
    const s=Math.max(0,Math.floor((Date.now()-d.getTime())/1000));
    if(s<10)return"just now";
    if(s<60)return`${s}s ago`;
    const m=Math.floor(s/60);
    if(m<60)return`${m}m ago`;
    return`${Math.floor(m/60)}h ago`;
  }

  async function refresh(){
    try{
      const r=await fetch(endpoint,{cache:"no-store",headers:{Accept:"application/json"}});
      if(!r.ok)throw new Error(`HTTP ${r.status}`);
      const d=await r.json();
      const bot=d.online===true||d.bot_online===true||d.status==="online";
      const s=d.services||{};
      setRow("discord",{status:bot?"online":"offline"});
      setRow("youtube",s.youtube||"unknown");
      setRow("tiktok",s.tiktok||"unknown");
      setRow("twitch",s.twitch||"unknown");
      document.querySelector("#servers").textContent=d.servers??d.server_count??"—";
      document.querySelector("#heartbeat").textContent=d.last_seen_human||ago(d.last_heartbeat||d.last_seen);
      document.querySelector("#updated").textContent="Updated just now";
    }catch(e){
      setRow("discord","offline");
      document.querySelector("#updated").textContent="Status API unavailable";
      console.warn("RoZAG status:",e);
    }
  }
  refresh();
  setInterval(refresh,interval);
})();
