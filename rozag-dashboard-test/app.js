(function(){"use strict";
const cfg=window.ROZAG_DASHBOARD_CONFIG||{};
const auth=cfg.AUTH_START_URL||"#";
const me=cfg.AUTH_ME_URL||"";
const login=document.getElementById("login"),dash=document.getElementById("dashboard"),user=document.getElementById("user"),servers=document.getElementById("servers");
document.getElementById("loginBtn").href=auth;
document.getElementById("logout").addEventListener("click",function(){location.href=cfg.LOGOUT_URL||"./";});
function render(data){if(!data||!data.authenticated)return;login.classList.add("hidden");dash.classList.remove("hidden");user.classList.remove("hidden");document.getElementById("username").textContent=data.user?.global_name||data.user?.username||"Discord User";document.getElementById("avatar").textContent=(data.user?.username||"D").slice(0,1).toUpperCase();const list=Array.isArray(data.guilds)?data.guilds:[];if(!list.length){servers.innerHTML='<div class="empty">No manageable RoZAG servers were found.</div>';return;}servers.innerHTML=list.map(g=>'<article class="server-card"><div class="server-head"><div class="guild-icon">'+(g.icon_emoji||"🏴‍☠️")+'</div><div class="server-meta"><h3>'+escapeHtml(g.name||"Unnamed Server")+'</h3><span class="online">RoZAG installed</span></div></div><button class="btn primary manage" data-guild="'+escapeHtml(String(g.id||""))+'">Manage Server</button></article>').join("");document.querySelectorAll(".manage").forEach(b=>b.addEventListener("click",()=>alert("Server management is the next test phase.")));}
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}
if(me){fetch(me,{credentials:"include",cache:"no-store"}).then(r=>r.ok?r.json():null).then(render).catch(()=>{});}
})();
