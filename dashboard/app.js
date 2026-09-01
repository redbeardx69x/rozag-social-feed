(function () {
  "use strict";


  // Public RoZAG service status, matching the main website's live status card.
  const STATUS_API = "https://rozag.coolvetspaces.com/api/status";

  function setStatusState(id, online, label) {
    const el = document.getElementById(id);
    if (!el) return;
    const cls = online ? "" : " off";
    el.innerHTML = '<span class="status-dot' + cls + '"></span>' + (label || (online ? "Online" : "Offline"));
  }

  async function loadDashboardStatus() {
    try {
      const response = await fetch(STATUS_API + "?t=" + Date.now(), {
        cache: "no-store",
        headers: { Accept: "application/json" }
      });
      if (!response.ok) throw new Error("HTTP " + response.status);
      const data = await response.json();

      const online = Boolean(
        data.bot_online !== undefined ? data.bot_online : data.online
      );
      setStatusState("status-bot", online);

      const serversEl = document.getElementById("status-servers");
      if (serversEl) {
        serversEl.textContent =
          data.server_count !== undefined
            ? data.server_count
            : (data.servers !== undefined ? data.servers : "—");
      }

      const seenEl = document.getElementById("status-seen");
      if (seenEl) {
        seenEl.textContent =
          data.last_seen_human ||
          data.last_heartbeat ||
          data.last_seen ||
          "—";
      }

      const platforms = data.platforms && typeof data.platforms === "object"
        ? data.platforms
        : data;

      for (const platform of ["youtube", "tiktok", "twitch", "kick"]) {
        const value = platforms[platform];
        const platformOnline =
          typeof value === "boolean"
            ? value
            : Boolean(value && (value.online !== undefined ? value.online : value.status === "online"));
        const platformLabel =
          value && typeof value === "object" && value.label
            ? value.label
            : (platformOnline ? "Online" : "Offline");
        setStatusState("status-" + platform, platformOnline, platformLabel);
      }

      const updated = document.getElementById("status-updated");
      if (updated) updated.textContent = "Updated just now";
    } catch (error) {
      console.error("RoZAG dashboard status lookup failed:", error);
      setStatusState("status-bot", false, "Unavailable");
      for (const platform of ["youtube", "tiktok", "twitch", "kick"]) {
        setStatusState("status-" + platform, false, "Unavailable");
      }
      const updated = document.getElementById("status-updated");
      if (updated) updated.textContent = "Status service unavailable";
    }
  }

  loadDashboardStatus();
  window.setInterval(loadDashboardStatus, 15000);


  /*
   * RoZAG Dashboard Phase 3
   *
   * IMPORTANT DATA RULE:
   *   Connected accounts come from /api/server/<guild_id>
   *   and the backend's guild_social_accounts -> social_accounts -> creators
   *   relationship.
   *
   *   guild_platforms is displayed only as feed-routing information.
   *   It is NOT used to decide whether Instagram/X/etc. are connected.
   */

  const cfg = window.ROZAG_DASHBOARD_CONFIG || {};
  const auth = cfg.AUTH_START_URL || "#";
  const me = cfg.AUTH_ME_URL || "";
  const serverApiBase =
    cfg.SERVER_API_BASE_URL ||
    (me
      ? me.replace(/\/api\/me\/?$/, "/api/server/")
      : "");

  const login = document.getElementById("login");
  const dash = document.getElementById("dashboard");
  const user = document.getElementById("user");
  const servers = document.getElementById("servers");

  const loginBtn = document.getElementById("loginBtn");
  const logout = document.getElementById("logout");

  if (loginBtn) {
    loginBtn.href = auth;
  }

  if (logout) {
    logout.addEventListener("click", function () {
      location.href = cfg.LOGOUT_URL || "./";
    });
  }

  const PLATFORM_META = {
    youtube: { icon: "🎬", name: "YouTube" },
    twitch: { icon: "🔴", name: "Twitch" },
    tiktok: { icon: "🎵", name: "TikTok" },
    kick: { icon: "🟢", name: "Kick" },
    instagram: { icon: "📸", name: "Instagram" },
    x: { icon: "𝕏", name: "X / Twitter" }
  };

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(
      /[&<>"']/g,
      function (c) {
        return {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;"
        }[c];
      }
    );
  }

  function platformMeta(platform) {
    return (
      PLATFORM_META[String(platform || "").toLowerCase()] || {
        icon: "📡",
        name: String(platform || "Unknown").toUpperCase()
      }
    );
  }

  function associationLabel(type) {
    return String(type || "").toLowerCase() === "watch"
      ? "Creator Watch"
      : "Member";
  }

  function ensureManagementModal() {
    if (document.getElementById("rozagManagementModal")) {
      return;
    }

    const style = document.createElement("style");
    style.textContent = `
      .rozag-modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 9999;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: rgba(0,0,0,.78);
        backdrop-filter: blur(8px);
      }

      .rozag-modal-backdrop.open {
        display: flex;
      }

      .rozag-modal {
        width: min(1040px, 96vw);
        max-height: 90vh;
        overflow: auto;
        background:
          linear-gradient(180deg, #171a22 0%, #0d1016 100%);
        border: 1px solid #3a404c;
        border-radius: 22px;
        box-shadow:
          0 30px 100px rgba(0,0,0,.75),
          0 0 0 1px rgba(226,29,46,.16);
        color: #f5f6f8;
      }

      .rozag-modal-head {
        position: sticky;
        top: 0;
        z-index: 2;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        padding: 22px 24px;
        background: rgba(13,16,22,.96);
        border-bottom: 1px solid #292e39;
        backdrop-filter: blur(12px);
      }

      .rozag-modal-title {
        margin: 0;
        font-size: 25px;
        line-height: 1.15;
      }

      .rozag-modal-subtitle {
        margin: 6px 0 0;
        color: #9fa5b0;
        font-size: 13px;
      }

      .rozag-modal-close {
        width: 40px;
        height: 40px;
        flex: 0 0 40px;
        border: 1px solid #414753;
        border-radius: 10px;
        background: #1a1e27;
        color: #fff;
        font-size: 22px;
        cursor: pointer;
      }

      .rozag-modal-body {
        padding: 24px;
      }

      .rozag-summary {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
        margin-bottom: 24px;
      }

      .rozag-summary-card {
        padding: 16px;
        background: #11141b;
        border: 1px solid #292e39;
        border-radius: 14px;
      }

      .rozag-summary-label {
        color: #8f96a2;
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: .08em;
      }

      .rozag-summary-value {
        margin-top: 6px;
        font-size: 24px;
        font-weight: 900;
      }

      .rozag-section-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin: 26px 0 12px;
      }

      .rozag-section-title h3 {
        margin: 0;
        font-size: 18px;
      }

      .rozag-section-title span {
        color: #8f96a2;
        font-size: 12px;
      }

      .rozag-accounts {
        display: grid;
        gap: 10px;
      }

      .rozag-account {
        display: grid;
        grid-template-columns: 48px minmax(0, 1fr) auto;
        align-items: center;
        gap: 14px;
        padding: 14px;
        background: #11141b;
        border: 1px solid #292e39;
        border-radius: 14px;
      }

      .rozag-account-icon {
        width: 48px;
        height: 48px;
        display: grid;
        place-items: center;
        border-radius: 12px;
        background: #1b1f28;
        font-size: 23px;
      }

      .rozag-account-name {
        margin: 0;
        font-size: 15px;
        font-weight: 900;
      }

      .rozag-account-user {
        margin: 4px 0 0;
        color: #a7adb7;
        font-size: 13px;
      }

      .rozag-account-meta {
        margin-top: 6px;
        color: #7f8793;
        font-size: 11px;
      }

      .rozag-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 9px;
        border-radius: 999px;
        background: #1a1e26;
        border: 1px solid #353b47;
        color: #c8ccd3;
        font-size: 11px;
        font-weight: 800;
        white-space: nowrap;
      }

      .rozag-badge.connected {
        border-color: rgba(59,217,139,.35);
        color: #70e7a7;
      }

      .rozag-badge.route {
        margin-top: 6px;
        border-color: rgba(226,29,46,.3);
        color: #ff777f;
      }

      .rozag-platform-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
      }

      .rozag-platform {
        padding: 16px;
        background: #11141b;
        border: 1px solid #292e39;
        border-radius: 14px;
      }

      .rozag-platform-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }

      .rozag-platform-name {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 900;
      }

      .rozag-platform-count {
        font-size: 22px;
        font-weight: 900;
      }

      .rozag-platform-state {
        margin-top: 9px;
        color: #969da8;
        font-size: 12px;
      }

      .rozag-platform.coming-soon {
        opacity: .72;
      }

      .rozag-routing {
        display: grid;
        gap: 9px;
      }

      .rozag-route-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        padding: 12px 14px;
        background: #11141b;
        border: 1px solid #292e39;
        border-radius: 12px;
      }

      .rozag-route-name {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 800;
      }

      .rozag-route-channel {
        color: #a8aeb8;
        font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
        font-size: 12px;
        text-align: right;
      }

      .rozag-empty {
        padding: 22px;
        color: #9299a5;
        text-align: center;
        background: #11141b;
        border: 1px dashed #343a46;
        border-radius: 14px;
      }

      .rozag-error {
        padding: 16px;
        color: #ff9aa0;
        background: rgba(226,29,46,.08);
        border: 1px solid rgba(226,29,46,.3);
        border-radius: 12px;
      }

      .rozag-loading {
        padding: 40px;
        color: #9fa5b0;
        text-align: center;
      }

      @media (max-width: 820px) {
        .rozag-summary,
        .rozag-platform-grid {
          grid-template-columns: 1fr 1fr;
        }

        .rozag-account {
          grid-template-columns: 42px minmax(0, 1fr);
        }

        .rozag-account > .rozag-badge {
          grid-column: 2;
          justify-self: start;
        }
      }

      @media (max-width: 560px) {
        .rozag-summary,
        .rozag-platform-grid {
          grid-template-columns: 1fr;
        }

        .rozag-modal-backdrop {
          padding: 8px;
        }

        .rozag-modal-body {
          padding: 16px;
        }
      }
    `;

    document.head.appendChild(style);

    const backdrop = document.createElement("div");
    backdrop.id = "rozagManagementModal";
    backdrop.className = "rozag-modal-backdrop";
    backdrop.innerHTML = `
      <div class="rozag-modal" role="dialog" aria-modal="true">
        <div class="rozag-modal-head">
          <div>
            <h2 class="rozag-modal-title" id="rozagModalTitle">
              Server Management
            </h2>
            <p class="rozag-modal-subtitle" id="rozagModalSubtitle">
              Loading RoZAG configuration…
            </p>
          </div>
          <button
            type="button"
            class="rozag-modal-close"
            id="rozagModalClose"
            aria-label="Close"
          >×</button>
        </div>
        <div class="rozag-modal-body" id="rozagModalBody">
          <div class="rozag-loading">Loading…</div>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    document
      .getElementById("rozagModalClose")
      .addEventListener("click", closeManagementModal);

    backdrop.addEventListener("click", function (event) {
      if (event.target === backdrop) {
        closeManagementModal();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeManagementModal();
      }
    });
  }

  function closeManagementModal() {
    const modal = document.getElementById("rozagManagementModal");
    if (modal) {
      modal.classList.remove("open");
    }
  }

  function openManagementModal(guildId, guildName) {
    ensureManagementModal();

    const modal = document.getElementById("rozagManagementModal");
    const title = document.getElementById("rozagModalTitle");
    const subtitle = document.getElementById("rozagModalSubtitle");
    const body = document.getElementById("rozagModalBody");

    title.textContent =
      "Manage " + (guildName || "Server");

    subtitle.textContent =
      "Connected accounts and feed routing";

    body.innerHTML =
      '<div class="rozag-loading">Loading RoZAG server data…</div>';

    modal.classList.add("open");

    if (!serverApiBase) {
      body.innerHTML =
        '<div class="rozag-error">The dashboard server API URL is not configured.</div>';
      return;
    }

    const url =
      serverApiBase.replace(/\/+$/, "") +
      "/" +
      encodeURIComponent(String(guildId));

    fetch(url, {
      credentials: "include",
      cache: "no-store"
    })
      .then(function (response) {
        return response.json().then(function (data) {
          if (!response.ok) {
            const error =
              data && data.error
                ? data.error
                : "server_lookup_failed";
            throw new Error(error);
          }
          return data;
        });
      })
      .then(renderServerManagement)
      .catch(function (error) {
        console.error(
          "RoZAG server management lookup failed:",
          error
        );

        body.innerHTML =
          '<div class="rozag-error">' +
          escapeHtml(
            "Could not load this server: " +
            error.message
          ) +
          "</div>";
      });
  }

  function renderServerManagement(data) {
    const body = document.getElementById("rozagModalBody");

    if (!data || !data.ok) {
      body.innerHTML =
        '<div class="rozag-error">No usable server data was returned.</div>';
      return;
    }

    const accounts = Array.isArray(data.accounts)
      ? data.accounts
      : [];

    const platforms = Array.isArray(data.platforms)
      ? data.platforms
      : [];

    const routing = Array.isArray(data.routing)
      ? data.routing
      : [];

    const counts = data.platform_counts || {};

    const connectedPlatformCount = platforms.filter(
      function (platform) {
        return platform.status === "connected";
      }
    ).length;

    const memberCount = accounts.filter(
      function (account) {
        return account.association_type !== "watch";
      }
    ).length;

    const watchCount = accounts.filter(
      function (account) {
        return account.association_type === "watch";
      }
    ).length;

    const accountCards = accounts.length
      ? accounts.map(function (account) {
          const meta = platformMeta(account.platform);

          const route = account.feed || {};

          return (
            '<article class="rozag-account">' +
              '<div class="rozag-account-icon">' +
                meta.icon +
              '</div>' +

              '<div>' +
                '<h4 class="rozag-account-name">' +
                  escapeHtml(account.creator_name) +
                '</h4>' +

                '<p class="rozag-account-user">' +
                  escapeHtml(
                    account.username
                      ? "@" + account.username.replace(/^@/, "")
                      : "No username recorded"
                  ) +
                '</p>' +

                '<div class="rozag-account-meta">' +
                  escapeHtml(meta.name) +
                  " · " +
                  escapeHtml(
                    associationLabel(
                      account.association_type
                    )
                  ) +
                '</div>' +
              '</div>' +

              '<div>' +
                '<span class="rozag-badge connected">● Connected</span>' +
                '<div>' +
                  (
                    route.channel_id
                      ? '<span class="rozag-badge route">' +
                        "Feed routed" +
                        "</span>"
                      : '<span class="rozag-badge">' +
                        "No feed route recorded" +
                        "</span>"
                  ) +
                '</div>' +
              '</div>' +
            '</article>'
          );
        }).join("")
      : '<div class="rozag-empty">' +
          "No connected creator accounts are registered for this server." +
        "</div>";

    const platformCards = platforms.map(
      function (platform) {
        const count =
          Number(counts[platform.platform] || 0);

        if (platform.status === "coming_soon") {
          return (
            '<article class="rozag-platform coming-soon">' +
              '<div class="rozag-platform-top">' +
                '<div class="rozag-platform-name">' +
                  platform.icon +
                  " " +
                  escapeHtml(platform.name) +
                "</div>" +
                '<div class="rozag-platform-count">—</div>' +
              "</div>" +
              '<div class="rozag-platform-state">' +
                "Coming Soon" +
              "</div>" +
            "</article>"
          );
        }

        return (
          '<article class="rozag-platform">' +
            '<div class="rozag-platform-top">' +
              '<div class="rozag-platform-name">' +
                platform.icon +
                " " +
                escapeHtml(platform.name) +
              "</div>" +
              '<div class="rozag-platform-count">' +
                count +
              "</div>" +
            "</div>" +
            '<div class="rozag-platform-state">' +
              (
                count > 0
                  ? "Connected creator account" +
                    (count === 1 ? "" : "s")
                  : "No connected accounts"
              ) +
            "</div>" +
          "</article>"
        );
      }
    ).join("");

    const routingRows = routing.length
      ? routing.map(function (route) {
          const meta = platformMeta(route.platform);

          return (
            '<div class="rozag-route-row">' +
              '<div class="rozag-route-name">' +
                meta.icon +
                " " +
                escapeHtml(meta.name) +
              "</div>" +
              '<div class="rozag-route-channel">' +
                (
                  route.channel_id
                    ? escapeHtml(
                        "Channel ID: " +
                        route.channel_id
                      )
                    : "No channel"
                ) +
                " · " +
                (
                  route.enabled
                    ? "Enabled"
                    : "Disabled"
                ) +
              "</div>" +
            "</div>"
          );
        }).join("")
      : '<div class="rozag-empty">' +
          "No platform routing records are stored for this server." +
        "</div>";

    body.innerHTML =
      '<div class="rozag-summary">' +

        '<div class="rozag-summary-card">' +
          '<div class="rozag-summary-label">Connected Accounts</div>' +
          '<div class="rozag-summary-value">' +
            accounts.length +
          "</div>" +
        "</div>" +

        '<div class="rozag-summary-card">' +
          '<div class="rozag-summary-label">Platforms Used</div>' +
          '<div class="rozag-summary-value">' +
            connectedPlatformCount +
          "</div>" +
        "</div>" +

        '<div class="rozag-summary-card">' +
          '<div class="rozag-summary-label">Members</div>' +
          '<div class="rozag-summary-value">' +
            memberCount +
          "</div>" +
        "</div>" +

        '<div class="rozag-summary-card">' +
          '<div class="rozag-summary-label">Creator Watch</div>' +
          '<div class="rozag-summary-value">' +
            watchCount +
          "</div>" +
        "</div>" +

      "</div>" +

      '<div class="rozag-section-title">' +
        "<h3>Connected Creator Accounts</h3>" +
        "<span>Actual account associations</span>" +
      "</div>" +

      '<div class="rozag-accounts">' +
        accountCards +
      "</div>" +

      '<div class="rozag-section-title">' +
        "<h3>Platform Connection Status</h3>" +
        "<span>Based on connected accounts — not channel slots</span>" +
      "</div>" +

      '<div class="rozag-platform-grid">' +
        platformCards +
      "</div>" +

      '<div class="rozag-section-title">' +
        "<h3>Feed Routing</h3>" +
        "<span>Discord destination channels only</span>" +
      "</div>" +

      '<div class="rozag-routing">' +
        routingRows +
      "</div>";
  }

  function render(data) {
    if (!data || !data.authenticated) {
      return;
    }

    if (login) {
      login.classList.add("hidden");
    }

    if (dash) {
      dash.classList.remove("hidden");
    }

    if (user) {
      user.classList.remove("hidden");
    }

    const usernameEl =
      document.getElementById("username");

    if (usernameEl) {
      usernameEl.textContent =
        data.user?.global_name ||
        data.user?.username ||
        "Discord User";
    }

    const avatarEl =
      document.getElementById("avatar");

    if (avatarEl) {
      avatarEl.textContent =
        (data.user?.username || "D")
          .slice(0, 1)
          .toUpperCase();
    }

    const list = Array.isArray(data.servers)
      ? data.servers
      : [];

    if (!servers) {
      return;
    }

    if (!list.length) {
      servers.innerHTML =
        '<div class="empty">No manageable RoZAG servers were found.</div>';
      return;
    }

    servers.innerHTML = list.map(function (g) {
      const icon = g.icon
        ? '<img src="https://cdn.discordapp.com/icons/' +
          encodeURIComponent(String(g.id || "")) +
          "/" +
          encodeURIComponent(String(g.icon)) +
          '.png?size=128" alt="" style="width:100%;height:100%;border-radius:12px;object-fit:cover;">'
        : "🏴‍☠️";

      return (
        '<article class="server-card">' +
          '<div class="server-head">' +
            '<div class="guild-icon">' +
              icon +
            "</div>" +

            '<div class="server-meta">' +
              '<h3>' +
                escapeHtml(
                  g.name || "Unnamed Server"
                ) +
              "</h3>" +

              '<span class="online">RoZAG access available</span>' +
            "</div>" +
          "</div>" +

          '<button class="btn primary manage" data-guild="' +
            escapeHtml(String(g.id || "")) +
            '">' +
            "Manage Server" +
          "</button>" +
        "</article>"
      );
    }).join("");

    document
      .querySelectorAll(".manage")
      .forEach(function (button) {
        button.addEventListener(
          "click",
          function () {
            openManagementModal(
              button.getAttribute("data-guild"),
              button.closest(".server-card")
                ?.querySelector("h3")
                ?.textContent ||
                "Server"
            );
          }
        );
      });
  }

  if (me) {
    fetch(me, {
      credentials: "include",
      cache: "no-store"
    })
      .then(function (response) {
        if (!response.ok) {
          if (response.status === 401) {
            return null;
          }
          throw new Error(
            "HTTP " + response.status
          );
        }

        return response.json();
      })
      .then(render)
      .catch(function (error) {
        console.error(
          "RoZAG dashboard session lookup failed:",
          error
        );
      });
  }
})();
