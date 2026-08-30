(function () {
  "use strict";

  const cfg = window.ROZAG_DASHBOARD_CONFIG || {};
  const auth = cfg.AUTH_START_URL || "#";
  const me = cfg.AUTH_ME_URL || "";
  const logoutUrl = cfg.LOGOUT_URL || "./";

  const login = document.getElementById("login");
  const dash = document.getElementById("dashboard");
  const user = document.getElementById("user");
  const servers = document.getElementById("servers");

  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logout");

  if (loginBtn) loginBtn.href = auth;

  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      if (window.confirm("Are you sure you want to sign out of the RoZAG Dashboard?")) {
        window.location.href = logoutUrl;
      }
    });
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (c) {
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
    });
  }

  function guildIconUrl(guild) {
    if (!guild || !guild.id || !guild.icon) return "";
    return "https://cdn.discordapp.com/icons/" +
      encodeURIComponent(guild.id) + "/" +
      encodeURIComponent(guild.icon) + ".png?size=128";
  }

  function renderGuildIcon(guild) {
    const url = guildIconUrl(guild);
    return url
      ? '<img src="' + url + '" alt="" class="guild-icon-img">'
      : '<span class="guild-icon-fallback">⚓</span>';
  }

  function addStyles() {
    if (document.getElementById("rozag-phase2-styles")) return;
    const style = document.createElement("style");
    style.id = "rozag-phase2-styles";
    style.textContent = `
      .server-card .manage{transition:transform .16s ease,filter .16s ease}
      .server-card .manage:hover{transform:translateY(-1px);filter:brightness(1.08)}
      .guild-icon-img{width:100%;height:100%;object-fit:cover;border-radius:inherit;display:block}
      .guild-icon-fallback{font-size:24px}
      .server-modal-backdrop{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,.78);backdrop-filter:blur(8px)}
      .server-modal{width:min(900px,100%);max-height:min(820px,92vh);overflow:auto;background:linear-gradient(180deg,#151923,#0d1015);border:1px solid #343a47;border-radius:20px;box-shadow:0 30px 100px rgba(0,0,0,.65)}
      .server-modal-head{display:flex;align-items:center;gap:16px;padding:24px;border-bottom:1px solid #292e39}
      .server-modal-icon{width:64px;height:64px;flex:0 0 64px;border-radius:16px;overflow:hidden;display:grid;place-items:center;background:#202530;border:1px solid #3a404d;font-size:28px}
      .server-modal-title{flex:1}.server-modal-title h2{margin:0 0 5px;font-size:28px}.server-modal-title p{margin:0;color:#a7adb8}
      .server-modal-close{border:1px solid #474d59;background:#191c24;color:#f5f6f8;width:42px;height:42px;border-radius:10px;cursor:pointer;font-size:22px}
      .server-modal-body{padding:24px}
      .server-status-banner{display:flex;align-items:center;gap:10px;padding:14px 16px;border:1px solid #294536;border-radius:12px;background:rgba(59,217,139,.06);color:#bfe9d0;margin-bottom:20px}
      .server-status-dot{width:10px;height:10px;border-radius:50%;background:#3bd98b;box-shadow:0 0 14px rgba(59,217,139,.7)}
      .server-overview-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:22px}
      .server-stat{background:#11151c;border:1px solid #292e39;border-radius:14px;padding:16px}
      .server-stat-label{color:#8f96a3;font-size:12px;text-transform:uppercase;letter-spacing:.08em;font-weight:800;margin-bottom:7px}
      .server-stat-value{font-size:17px;font-weight:850}
      .server-section{border:1px solid #292e39;background:#10131a;border-radius:16px;padding:20px;margin-top:14px}
      .server-section h3{margin:0 0 6px;font-size:20px}.server-section p{margin:0;color:#a7adb8;line-height:1.6}
      .readonly-pill{display:inline-flex;margin-top:14px;padding:7px 10px;border-radius:999px;border:1px solid #604d20;color:#f2b63d;background:rgba(242,182,61,.06);font-size:12px;font-weight:850}
      .integration-list{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:16px}
      .integration-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 14px;border-radius:11px;background:#151923;border:1px solid #292e39}
      .integration-name{font-weight:800}.integration-state{color:#3bd98b;font-size:12px;font-weight:850}
      .integration-state.offline{color:#ff7373}.integration-state.live{color:#ff5b5b}.integration-state.muted{color:#8f96a3}
      .recent-content-list{display:grid;gap:10px}.recent-content-item{display:flex;justify-content:space-between;gap:14px;padding:13px 14px;border-radius:11px;background:#151923;border:1px solid #292e39}.recent-content-item a{color:#f0f2f5;text-decoration:none;font-weight:800}.recent-content-meta{color:#8f96a3;font-size:12px;margin-top:4px}
      @media(max-width:700px){.server-modal-backdrop{padding:10px;align-items:flex-start}.server-modal{max-height:96vh}.server-overview-grid,.integration-list{grid-template-columns:1fr}.server-modal-head,.server-modal-body{padding:18px}}
    `;
    document.head.appendChild(style);
  }

  function closeModal() {
    const modal = document.getElementById("server-management-modal");
    if (modal) modal.remove();
    document.body.style.overflow = "";
  }

  function openServerManagement(guild) {
    if (!guild) return;
    closeModal();

    const modal = document.createElement("div");
    modal.id = "server-management-modal";
    modal.className = "server-modal-backdrop";

    const access = guild.owner
      ? "Server Owner"
      : (guild.administrator ? "Administrator" : "Manage Server");

    modal.innerHTML = `
      <div class="server-modal" role="dialog" aria-modal="true">
        <div class="server-modal-head">
          <div class="server-modal-icon">${renderGuildIcon(guild)}</div>
          <div class="server-modal-title">
            <h2>${escapeHtml(guild.name || "Unnamed Server")}</h2>
            <p>RoZAG server management</p>
          </div>
          <button class="server-modal-close" type="button" aria-label="Close">×</button>
        </div>
        <div class="server-modal-body">
          <div class="server-status-banner">
            <span class="server-status-dot"></span>
            <strong>RoZAG access available</strong>
            <span>•</span><span>Read-only test phase</span>
          </div>

          <div class="server-overview-grid">
            <div class="server-stat">
              <div class="server-stat-label">Server access</div>
              <div class="server-stat-value">${escapeHtml(access)}</div>
            </div>
            <div class="server-stat">
              <div class="server-stat-label">Server ID</div>
              <div class="server-stat-value">${escapeHtml(guild.id || "Unknown")}</div>
            </div>
            <div class="server-stat">
              <div class="server-stat-label">RoZAG status</div>
              <div class="server-stat-value">Connected</div>
            </div>
          </div>

          <div class="server-section">
            <h3>Social Integrations</h3>
            <p>Live integration state from the RoZAG Social Hub.</p>
            <div id="phase3-integrations" class="integration-list">
              <div class="integration-row"><span class="integration-name">Loading…</span><span class="integration-state">Checking</span></div>
            </div>
            <span class="readonly-pill">READ-ONLY • NO SETTINGS CHANGED</span>
          </div>

          <div class="server-section">
            <h3>Social Hub</h3>
            <p id="phase3-hub-summary">Loading connected creator accounts and feed configuration…</p>
            <div id="phase3-creators" class="integration-list"></div>
          </div>

          <div class="server-section">
            <h3>Feed Configuration</h3>
            <div id="phase3-settings" class="integration-list">
              <div class="integration-row"><span class="integration-name">Loading…</span><span class="integration-state">Checking</span></div>
            </div>
          </div>

          <div class="server-section">
            <h3>Recent Deliveries</h3>
            <div id="phase3-content" class="recent-content-list">
              <div class="integration-row"><span class="integration-name">Loading…</span><span class="integration-state">Checking</span></div>
            </div>
          </div>

          <div class="server-section">
            <h3>Bot &amp; Health</h3>
            <p id="phase3-health-summary">Checking Social Hub services…</p>
            <span class="readonly-pill">PHASE 3 • READ-ONLY</span>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = "hidden";

    modal.querySelector(".server-modal-close").addEventListener("click", closeModal);
    modal.addEventListener("click", function (event) {
      if (event.target === modal) closeModal();
    });

    loadServerPhase3(guild.id);
  }

  async function loadServerPhase3(guildId) {
    if (!guildId) return;
    const base = (cfg.AUTH_ME_URL || "").replace(/\/api\/me\/?$/, "");
    const url = base + "/api/server/" + encodeURIComponent(guildId);
    try {
      const response = await fetch(url, {credentials:"include", cache:"no-store"});
      if (!response.ok) throw new Error("Server detail request failed: " + response.status);
      const data = await response.json();
      const hub = data.social_hub || {};
      const integrations = document.getElementById("phase3-integrations");
      const creators = document.getElementById("phase3-creators");
      const settings = document.getElementById("phase3-settings");
      const content = document.getElementById("phase3-content");
      const summary = document.getElementById("phase3-hub-summary");
      const health = document.getElementById("phase3-health-summary");
      const platforms = ["youtube","tiktok","twitch","kick"];
      const names = {youtube:"YouTube",tiktok:"TikTok",twitch:"Twitch",kick:"Kick"};
      const configured = hub.platforms || {};
      const creatorRows = Array.isArray(hub.creators) ? hub.creators : [];
      if (integrations) integrations.innerHTML = platforms.map(function(platform){
        const p=configured[platform]; const count=creatorRows.filter(x=>x.platform===platform).length;
        let state=p&&p.enabled?"Enabled":(count?"Connected":"Not configured"); let cls=p&&p.enabled?"":"muted";
        if(platform==="twitch"&&count){const live=creatorRows.some(x=>x.platform==="twitch"&&x.live);state=live?"LIVE":"Connected";cls=live?"live":"";}
        return '<div class="integration-row"><span class="integration-name">'+names[platform]+'</span><span class="integration-state '+cls+'">'+escapeHtml(state)+'</span></div>';
      }).join("");
      if(summary) summary.textContent=!hub.database_available ? "The Social Hub database is not available to the dashboard." : creatorRows.length ? creatorRows.length+" connected creator account"+(creatorRows.length===1?"":"s")+" found for this server." : "No creator accounts are currently linked to this server.";
      if(creators) creators.innerHTML=creatorRows.length ? creatorRows.map(function(row){
        const live=row.platform==="twitch"&&row.live; const label=row.username||row.creator||"Unknown creator"; const status=live?"LIVE":(row.association_type==="watch"?"Creator Watch":"Connected");
        return '<div class="integration-row"><span><span class="integration-name">'+escapeHtml(label)+'</span><div class="recent-content-meta">'+escapeHtml((row.platform||"").toUpperCase())+' • '+escapeHtml(row.creator||"")+'</div></span><span class="integration-state '+(live?"live":"")+'">'+escapeHtml(status)+'</span></div>';
      }).join("") : '<div class="integration-row"><span class="integration-name">No connected creators</span><span class="integration-state muted">None</span></div>';
      if(settings){const category=hub.settings&&hub.settings.category_channel_id;const management=hub.settings&&hub.settings.management_channel_id;settings.innerHTML='<div class="integration-row"><span class="integration-name">Social Hub category</span><span class="integration-state '+(category?"":"muted")+'">'+escapeHtml(category||"Not configured")+'</span></div><div class="integration-row"><span class="integration-name">Management channel</span><span class="integration-state '+(management?"":"muted")+'">'+escapeHtml(management||"Not configured")+'</span></div>';}
      if(content){const rows=Array.isArray(hub.recent_content)?hub.recent_content:[];content.innerHTML=rows.length?rows.map(function(row){const title=row.title||(row.username?row.username+" update":"Social content");const meta=(row.platform||"").toUpperCase()+" • "+(row.created_at||row.published_at||"");return '<div class="recent-content-item"><div><a href="'+escapeHtml(row.url||"#")+'" target="_blank" rel="noopener noreferrer">'+escapeHtml(title)+'</a><div class="recent-content-meta">'+escapeHtml(meta)+'</div></div><span class="integration-state">Posted</span></div>';}).join(""):'<div class="integration-row"><span class="integration-name">No recent deliveries</span><span class="integration-state muted">None</span></div>';}
      if(health){const twitch=hub.twitch_status||{};health.textContent=twitch.error?"Social Hub database is available. Twitch live-state check: "+twitch.error+".":"Social Hub database connected. Twitch live-state check completed. No dashboard settings were changed.";}
    } catch(error) { console.error("RoZAG Phase 3 server detail failed:",error); const health=document.getElementById("phase3-health-summary"); if(health) health.textContent="Unable to load live Social Hub details. Existing server access remains read-only."; }
  }

  function render(data) {
    if (!data || !data.authenticated) return;

    if (login) login.classList.add("hidden");
    if (dash) dash.classList.remove("hidden");
    if (user) user.classList.remove("hidden");

    const displayName = data.user?.global_name || data.user?.username || "Discord User";
    const username = document.getElementById("username");
    const avatar = document.getElementById("avatar");

    if (username) username.textContent = displayName;
    if (avatar) avatar.textContent = (data.user?.username || displayName || "D").slice(0, 1).toUpperCase();

    const list = Array.isArray(data.servers)
      ? data.servers
      : (Array.isArray(data.guilds) ? data.guilds : []);

    if (!servers) return;

    if (!list.length) {
      servers.innerHTML = '<div class="empty">No manageable RoZAG servers were found.</div>';
      return;
    }

    servers.innerHTML = list.map(function (guild) {
      return `
        <article class="server-card">
          <div class="server-head">
            <div class="guild-icon">${renderGuildIcon(guild)}</div>
            <div class="server-meta">
              <h3>${escapeHtml(guild.name || "Unnamed Server")}</h3>
              <span class="online">RoZAG access available</span>
            </div>
          </div>
          <button class="btn primary manage" type="button">Manage Server</button>
        </article>
      `;
    }).join("");

    servers.querySelectorAll(".manage").forEach(function (button, index) {
      button.addEventListener("click", function () {
        openServerManagement(list[index]);
      });
    });
  }

  addStyles();

  if (me) {
    fetch(me, {credentials:"include", cache:"no-store"})
      .then(function (response) { return response.ok ? response.json() : null; })
      .then(render)
      .catch(function (error) {
        console.error("RoZAG dashboard session check failed:", error);
      });
  }
})();
