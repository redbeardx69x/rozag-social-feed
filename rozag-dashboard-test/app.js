(function(){"use strict";
const cfg=window.ROZAG_DASHBOARD_CONFIG||{};
const auth=cfg.AUTH_START_URL||"#";
const me=cfg.AUTH_ME_URL||"";
const login=document.getElementById("login"),dash=document.getElementById("dashboard"),user=document.getElementById("user"),servers=document.getElementById("servers");
document.getElementById("loginBtn").href=auth;
document.getElementById("logout").addEventListener("click",function(){
  if(!window.confirm("Are you sure you want to sign out of the RoZAG Dashboard?"))return;
  location.href=cfg.LOGOUT_URL||"./";
});
function discordAvatarUrl(u){
  if(!u||!u.id||!u.avatar)return null;
  return "https://cdn.discordapp.com/avatars/"+encodeURIComponent(u.id)+"/"+encodeURIComponent(u.avatar)+".png?size=128";
}
function renderAvatar(u){
  const box=document.getElementById("avatar"),url=discordAvatarUrl(u);
  if(!url){box.textContent=(u?.username||"D").slice(0,1).toUpperCase();return;}
  box.innerHTML="";
  const img=document.createElement("img");
  img.src=url;img.alt="Discord profile picture";img.referrerPolicy="no-referrer";
  img.onerror=function(){box.textContent=(u?.username||"D").slice(0,1).toUpperCase();};
  box.appendChild(img);
}
function guildIconUrl(g){
  if(!g||!g.id||!g.icon)return null;
  return "https://cdn.discordapp.com/icons/"+encodeURIComponent(g.id)+"/"+encodeURIComponent(g.icon)+".png?size=128";
}
function render(data){
  if(!data||!data.authenticated)return;
  login.classList.add("hidden");dash.classList.remove("hidden");user.classList.remove("hidden");
  document.getElementById("username").textContent=data.user?.global_name||data.user?.username||"Discord User";
  renderAvatar(data.user||{});
  const list=Array.isArray(data.servers)?data.servers:[];
  if(!list.length){servers.innerHTML='<div class="empty">No manageable RoZAG servers were found.</div>';return;}
  servers.innerHTML=list.map(g=>{
    const icon=guildIconUrl(g);
    const iconHtml=icon?'<img src="'+escapeHtml(icon)+'" alt="'+escapeHtml(g.name||"Server")+'">':"🏴‍☠️";
    return '<article class="server-card"><div class="server-head"><div class="guild-icon">'+iconHtml+'</div><div class="server-meta"><h3>'+escapeHtml(g.name||"Unnamed Server")+'</h3><span class="online">RoZAG access available</span></div></div><button class="btn primary manage" data-guild="'+escapeHtml(String(g.id||""))+'" type="button">Manage Server</button></article>';
  }).join("");
  document.querySelectorAll(".manage").forEach(b=>b.addEventListener("click",()=>alert("Server management is the next test phase.")));
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}
if(me){
  fetch(me,{credentials:"include",cache:"no-store"})
    .then(r=>r.ok?r.json():null)
    .then(render)
    .catch(err=>console.error("RoZAG dashboard session lookup failed:",err));
}
})();