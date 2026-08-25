(() => {
  const cfg = window.ROZAG_CONFIG || {};
  const endpoint = cfg.STATUS_ENDPOINT || "/api/status";
  const refreshMs = Number(cfg.REFRESH_MS || 15000);

  function norm(v){
    v=String(v??"").toLowerCase();
    if(["online","active","enabled","ok","healthy"].includes(v))return"online";
    if(["degraded","pending","starting","warning"].includes(v))return"warn";
    if(["error","failed","failure"].includes(v))return"error";
    if(["offline","disabled","down"].includes(v))return"offline";
    return"unknown";
  }
  function text(s){return({online:"Online",warn:"Degraded",error:"Error",offline:"Offline",unknown:"Checking…"})[s]||"Checking…"}
  function setRow(name, raw){
    const row=document.querySelector(`[data-service="${name}"]`);
    if(!row)return;
    const state=norm(raw?.status??raw);
    const stateEl=row.querySelector(".state");
    const dot=row.querySelector(".state i");
    stateEl.className=`state ${state}`;
    dot.className=state;
    stateEl.querySelector("span").textContent=text(state);
  }
  function heartbeat(v){
    if(!v)return"—";
    const d=new Date(v); if(Number.isNaN(d.getTime()))return String(v);
    const s=Math.max(0,Math.floor((Date.now()-d.getTime())/1000));
    if(s<10)return"just now"; if(s<60)return`${s}s ago`;
    const m=Math.floor(s/60); if(m<60)return`${m}m ago`;
    return`${Math.floor(m/60)}h ago`;
  }

  async function refresh(){
    try{
      const r=await fetch(endpoint,{cache:"no-store",headers:{Accept:"application/json"}});
      if(!r.ok)throw new Error(`HTTP ${r.status}`);
      const d=await r.json();

      const online=d.online===true||d.bot_online===true||d.status==="online";
      setRow("discord",{status:online?"online":"offline"});
      const services=d.services||{};
      ["youtube","tiktok","twitch"].forEach(n=>setRow(n,services[n]||"unknown"));

      document.querySelector("#servers").textContent=d.servers??d.server_count??"—";
      document.querySelector("#heartbeat").textContent=d.last_seen_human||heartbeat(d.last_heartbeat||d.last_seen);

      const kinds=["youtube","tiktok","twitch"].map(n=>norm(services[n]?.status||services[n]||"unknown"));
      let overall="unknown", msg="Checking services…";
      if(kinds.includes("error")){overall="error";msg="Attention required"}
      else if(kinds.includes("warn")){overall="warn";msg="Partially degraded"}
      else if(online){overall="online";msg="Operational"}
      else {overall="offline";msg="Discord bot offline"}
      const o=document.querySelector("#overall"); o.className=`overall ${overall}`; o.querySelector("span").textContent=msg;
      document.querySelector("#updated").textContent="Checked "+new Date().toLocaleTimeString();
    }catch(e){
      const o=document.querySelector("#overall");o.className="overall error";o.querySelector("span").textContent="Status API unavailable";
      document.querySelector("#updated").textContent="Could not reach status API";
      console.warn("RoZAG status:",e);
    }
  }
  refresh(); setInterval(refresh,refreshMs);
})();
