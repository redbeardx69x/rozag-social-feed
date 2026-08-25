const STATUS_URL="/api/status";

function heartbeatText(value){
  if(!value)return"—";
  if(typeof value==="string")return value;
  return"just now";
}

async function updateStatus(){
  try{
    const r=await fetch(STATUS_URL+"?_="+Date.now(),{cache:"no-store",headers:{Accept:"application/json"}});
    if(!r.ok)throw new Error("HTTP "+r.status);
    const d=await r.json();

    const online=Boolean(d.online??d.bot_online);
    document.getElementById("bot-state").textContent=online?"Online":"Offline";
    document.getElementById("server-count").textContent=d.servers??d.server_count??"—";
    document.getElementById("heartbeat").textContent=heartbeatText(d.last_seen_human??d.last_heartbeat);
    document.getElementById("updated").textContent="Updated just now";
  }catch(e){
    document.getElementById("bot-state").textContent="Offline";
    document.getElementById("server-count").textContent="—";
    document.getElementById("heartbeat").textContent="Unavailable";
    document.getElementById("updated").textContent="Status unavailable";
    console.warn("RoZAG status:",e);
  }
}

updateStatus();
setInterval(updateStatus,15000);
