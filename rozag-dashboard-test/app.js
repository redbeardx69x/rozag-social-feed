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

  function discordAvatarUrl(user) {
    if (!user || !user.id || !user.avatar) return "";
    const extension = String(user.avatar).startsWith("a_") ? "gif" : "png";

    return (
      "https://cdn.discordapp.com/avatars/" +
      encodeURIComponent(user.id) +
      "/" +
      encodeURIComponent(user.avatar) +
      "." + extension +
      "?size=128"
    );
  }

  function renderAvatar(user) {
    const box = document.getElementById("avatar");
    if (!box) return;

    const url = discordAvatarUrl(user);

    if (!url) {
      box.textContent = (
        user?.username ||
        user?.global_name ||
        "D"
      ).slice(0, 1).toUpperCase();
      return;
    }

    box.innerHTML = "";

    const img = document.createElement("img");
    img.src = url;
    img.alt = "Discord profile picture";
    img.referrerPolicy = "no-referrer";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    img.style.borderRadius = "inherit";

    img.onerror = function () {
      box.textContent = (
        user?.username ||
        user?.global_name ||
        "D"
      ).slice(0, 1).toUpperCase();
    };

    box.appendChild(img);
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

      .social-hub-loading{margin-top:10px}
      .social-hub-data{margin-top:14px}
      .social-hub-error{color:#ff8f8f}
      .social-hub-empty{padding:14px;border:1px dashed #343a47;border-radius:12px;color:#a7adb8;background:#11151c}
      .creator-list{display:grid;gap:10px}
      .creator-card{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:14px;border:1px solid #292e39;background:#151923;border-radius:12px}
      .creator-card-main{min-width:0}
      .creator-name{font-weight:850;font-size:16px}
      .creator-platform{margin-top:4px;color:#8f96a3;font-size:11px;text-transform:uppercase;letter-spacing:.08em;font-weight:800}
      .creator-account{margin-top:4px;color:#c9ced8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .creator-profile{color:#f2b63d;text-decoration:none;font-size:12px;font-weight:850;white-space:nowrap}
      .creator-profile:hover{text-decoration:underline}
      .creator-summary{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
      .creator-summary-pill{padding:7px 10px;border-radius:999px;border:1px solid #343a47;background:#151923;color:#c9ced8;font-size:12px;font-weight:800}
      @media(max-width:700px){.server-modal-backdrop{padding:10px;align-items:flex-start}.server-modal{max-height:96vh}.server-overview-grid,.integration-list{grid-template-columns:1fr}.server-modal-head,.server-modal-body{padding:18px}}
    `;
    document.head.appendChild(style);
  }

  function closeModal() {
    const modal = document.getElementById("server-management-modal");
    if (modal) modal.remove();
    document.body.style.overflow = "";
  }


  async function loadSocialHub(guild, modal) {
    const loading = modal.querySelector(".social-hub-loading");
    const box = modal.querySelector(".social-hub-data");

    if (!box || !guild || !guild.id) return;

    try {
      const response = await fetch(
        "https://rozag.coolvetspaces.com/dashboard/api/server/" +
          encodeURIComponent(String(guild.id)) +
          "/social",
        {
          credentials: "include",
          cache: "no-store"
        }
      );

      const data = await response.json().catch(function () {
        return null;
      });

      if (!response.ok || !data || !data.authenticated) {
        throw new Error(
          data && data.message ? data.message : "Social Hub request failed"
        );
      }

      if (loading) loading.remove();

      const accounts = Array.isArray(data.accounts) ? data.accounts : [];

      if (!accounts.length) {
        box.innerHTML =
          '<div class="social-hub-empty">' +
          escapeHtml(
            data.message ||
            "No connected creator accounts are currently associated with this server."
          ) +
          "</div>";
        return;
      }

      const counts = {};
      accounts.forEach(function (account) {
        const key = String(account.platform || "Unknown");
        counts[key] = (counts[key] || 0) + 1;
      });

      const summary = Object.keys(counts).sort().map(function (platform) {
        return (
          '<span class="creator-summary-pill">' +
          escapeHtml(platform) +
          " · " +
          counts[platform] +
          "</span>"
        );
      }).join("");

      const cards = accounts.map(function (account) {
        const profile = account.profile_url
          ? '<a class="creator-profile" href="' +
            escapeHtml(account.profile_url) +
            '" target="_blank" rel="noopener noreferrer">View profile</a>'
          : "";

        return (
          '<div class="creator-card">' +
            '<div class="creator-card-main">' +
              '<div class="creator-name">' +
                escapeHtml(account.creator || "Unknown creator") +
              "</div>" +
              '<div class="creator-platform">' +
                escapeHtml(account.platform || "Unknown platform") +
              "</div>" +
              '<div class="creator-account">' +
                escapeHtml(
                  account.username ||
                  account.channel_id ||
                  "Connected account"
                ) +
              "</div>" +
            "</div>" +
            profile +
          "</div>"
        );
      }).join("");

      box.innerHTML =
        '<div class="creator-list">' + cards + "</div>" +
        '<div class="creator-summary">' + summary + "</div>";

    } catch (error) {
      console.error("RoZAG Social Hub Phase 3A failed:", error);
      if (loading) loading.remove();
      box.innerHTML =
        '<div class="social-hub-error">' +
        "Unable to load Social Hub data right now." +
        "</div>";
    }
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
            <p>Platform availability is displayed here only. No settings or accounts are changed in this phase.</p>
            <div class="integration-list">
              <div class="integration-row"><span class="integration-name">YouTube</span><span class="integration-state">Available</span></div>
              <div class="integration-row"><span class="integration-name">TikTok</span><span class="integration-state">Available</span></div>
              <div class="integration-row"><span class="integration-name">Twitch</span><span class="integration-state">Available</span></div>
              <div class="integration-row"><span class="integration-name">Kick</span><span class="integration-state">Available</span></div>
            </div>
            <span class="readonly-pill">READ-ONLY • NO SETTINGS CHANGED</span>
          </div>

          <div class="server-section">
            <h3>Social Hub</h3>
            <p class="social-hub-loading">Loading connected creator accounts…</p>
            <div class="social-hub-data"></div>
          </div>

          <div class="server-section">
            <h3>Bot &amp; Health</h3>
            <p>Connection and heartbeat controls will be added after the read-only server view is validated.</p>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = "hidden";

    loadSocialHub(guild, modal);

    modal.querySelector(".server-modal-close").addEventListener("click", closeModal);
    modal.addEventListener("click", function (event) {
      if (event.target === modal) closeModal();
    });
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
    if (avatar) {
      renderAvatar(data.user || {});
    }

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
