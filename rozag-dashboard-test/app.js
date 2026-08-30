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
      @media(max-width:700px){.server-modal-backdrop{padding:10px;align-items:flex-start}.server-modal{max-height:96vh}.server-overview-grid,.integration-list{grid-template-columns:1fr}.server-modal-head,.server-modal-body{padding:18px}}
    `;
    document.head.appendChild(style);
  }

  function closeModal() {
    const modal = document.getElementById("server-management-modal");
    if (modal) modal.remove();
    document.body.style.overflow = "";
  }

  function apiBase() {
    const base =
      cfg.SERVER_API_BASE_URL ||
      "https://rozag.coolvetspaces.com/dashboard/api/server";
    return base.replace(/\/+$/, "");
  }

  function fetchJson(url, options) {
    return fetch(url, Object.assign({
      credentials: "include",
      cache: "no-store",
      headers: {}
    }, options || {})).then(function (response) {
      return response.text().then(function (text) {
        let data = {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch (error) {
          throw new Error(
            "Server returned non-JSON data (HTTP " +
            response.status +
            "). Check the dashboard backend route."
          );
        }

        if (!response.ok) {
          throw new Error(
            data.message || data.error || ("HTTP " + response.status)
          );
        }

        return data;
      });
    });
  }

  function openServerManagement(guild) {
    if (!guild || !guild.id) return;
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
            <span>•</span><span>Server management</span>
          </div>

          <div class="server-overview-grid">
            <div class="server-stat">
              <div class="server-stat-label">Server access</div>
              <div class="server-stat-value">${escapeHtml(access)}</div>
            </div>
            <div class="server-stat">
              <div class="server-stat-label">Server ID</div>
              <div class="server-stat-value">${escapeHtml(guild.id)}</div>
            </div>
            <div class="server-stat">
              <div class="server-stat-label">RoZAG status</div>
              <div class="server-stat-value">Loading…</div>
            </div>
          </div>

          <div id="server-management-content">
            <div class="server-section">
              <p>Loading connected creator accounts…</p>
            </div>
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

    loadServerManagement(guild, modal);
  }

  function loadServerManagement(guild, modal) {
    const content = modal.querySelector("#server-management-content");
    if (!content) return;

    fetchJson(
      apiBase() + "/" + encodeURIComponent(String(guild.id))
    ).then(function (data) {
      renderServerManagement(guild, modal, data);
    }).catch(function (error) {
      content.innerHTML =
        '<div class="server-section">' +
          '<p style="color:#ff8f98;">Could not load this server: ' +
          escapeHtml(error.message) +
          '</p>' +
        '</div>';
    });
  }

  function renderServerManagement(guild, modal, data) {
    const content = modal.querySelector("#server-management-content");
    if (!content) return;

    const accounts = Array.isArray(data.accounts) ? data.accounts : [];
    const routing = Array.isArray(data.routing) ? data.routing : [];
    const counts = data.platform_counts || {};
    const platforms = Array.isArray(data.platforms) ? data.platforms : [];

    const cards = accounts.length
      ? accounts.map(function (account) {
          const platform = String(account.platform || "").toLowerCase();
          const names = {
            youtube: "YouTube",
            tiktok: "TikTok",
            twitch: "Twitch",
            kick: "Kick"
          };
          const icons = {
            youtube: "🎬",
            tiktok: "🎵",
            twitch: "🟣",
            kick: "🟢"
          };

          return `
            <div class="server-section" style="margin-top:10px;">
              <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">
                <div>
                  <h3 style="margin-bottom:4px;">
                    ${icons[platform] || "📡"} ${escapeHtml(account.creator_name || "Unknown creator")}
                  </h3>
                  <p>
                    ${escapeHtml(names[platform] || platform)}
                    ${account.username ? " · @" + escapeHtml(String(account.username).replace(/^@/, "")) : ""}
                  </p>
                  <p style="margin-top:5px;font-size:12px;">
                    Discord member:
                    ${escapeHtml(account.discord_user_id || "Not linked")}
                  </p>
                </div>
                <div style="display:flex;gap:8px;">
                  <button type="button" class="btn primary rozag-edit-account"
                    data-account-id="${escapeHtml(account.social_account_id)}">Edit</button>
                  <button type="button" class="btn rozag-remove-account"
                    data-account-id="${escapeHtml(account.social_account_id)}">Remove</button>
                </div>
              </div>
            </div>
          `;
        }).join("")
      : `
        <div class="server-section">
          <h3>No connected creator accounts</h3>
          <p>Add the first creator account for this server below.</p>
        </div>
      `;

    const platformSummary = platforms
      .filter(function (p) {
        return ["youtube", "tiktok", "twitch", "kick"].includes(
          String(p.platform || "").toLowerCase()
        );
      })
      .map(function (p) {
        return `
          <div class="integration-row">
            <span class="integration-name">${escapeHtml(p.icon || "")} ${escapeHtml(p.name || p.platform)}</span>
            <span class="integration-state">
              ${Number(counts[p.platform] || 0)} connected
            </span>
          </div>
        `;
      }).join("");

    const routingSummary = routing.length
      ? routing.map(function (r) {
          return `
            <div class="integration-row">
              <span class="integration-name">${escapeHtml(r.icon || "")} ${escapeHtml(r.name || r.platform)}</span>
              <span class="integration-state">
                ${r.enabled ? "Enabled" : "Disabled"}
              </span>
            </div>
          `;
        }).join("")
      : '<p>No feed routing records are configured yet.</p>';

    content.innerHTML = `
      <div class="server-section">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
          <div>
            <h3>Social Accounts</h3>
            <p>Add, edit or remove the creator accounts associated with this server.</p>
          </div>
          <button type="button" class="btn primary" id="rozag-add-account">＋ Add</button>
        </div>
      </div>

      <div id="rozag-add-panel"></div>

      <div class="server-section">
        <h3>Connected Creator Accounts</h3>
        <div style="margin-top:14px;">${cards}</div>
      </div>

      <div class="server-section">
        <h3>Platform Status</h3>
        <div class="integration-list" style="margin-top:14px;">
          ${platformSummary}
        </div>
      </div>

      <div class="server-section">
        <h3>Feed Routing</h3>
        <div class="integration-list" style="margin-top:14px;">
          ${routingSummary}
        </div>
      </div>

      <div class="server-section">
        <span class="readonly-pill">DISCORD MEMBER + SOCIAL ACCOUNT CHANGES ARE PROTECTED BY SERVER MANAGEMENT ACCESS</span>
      </div>
    `;

    modal.querySelector("#rozag-add-account").addEventListener("click", function () {
      showSocialForm(guild, modal, null);
    });

    modal.querySelectorAll(".rozag-edit-account").forEach(function (button) {
      button.addEventListener("click", function () {
        const id = button.getAttribute("data-account-id");
        const account = accounts.find(function (a) {
          return String(a.social_account_id) === String(id);
        });
        showSocialForm(guild, modal, account || null);
      });
    });

    modal.querySelectorAll(".rozag-remove-account").forEach(function (button) {
      button.addEventListener("click", function () {
        const id = button.getAttribute("data-account-id");
        const account = accounts.find(function (a) {
          return String(a.social_account_id) === String(id);
        });

        if (!account) return;

        const label =
          (account.creator_name || "this account") +
          (account.username ? " (@" + account.username + ")" : "");

        if (!window.confirm(
          "Remove " + label + " from this server?\n\n" +
          "This removes only the server association. It does not delete the global creator account."
        )) {
          return;
        }

        button.disabled = true;

        fetchJson(
          apiBase() +
          "/" + encodeURIComponent(String(guild.id)) +
          "/social/" + encodeURIComponent(String(id)),
          { method: "DELETE" }
        ).then(function () {
          loadServerManagement(guild, modal);
        }).catch(function (error) {
          button.disabled = false;
          window.alert("Remove failed: " + error.message);
        });
      });
    });
  }

  function showSocialForm(guild, modal, existing) {
    const panel = modal.querySelector("#rozag-add-panel");
    if (!panel) return;

    const isEdit = !!existing;

    panel.innerHTML = `
      <div class="server-section" style="border-color:#454b58;">
        <h3>${isEdit ? "Edit Social Account" : "Add Social Account"}</h3>
        <p>
          ${isEdit
            ? "Edit the existing creator profile and Discord member association."
            : "This uses the same creator/member relationship as /social add."}
        </p>

        <div style="display:grid;gap:12px;margin-top:16px;">
          <label style="display:grid;gap:6px;color:#a7adb8;font-size:12px;font-weight:800;">
            Creator / Channel Profile URL
            <input id="rozag-social-url" type="url"
              value="${escapeHtml(existing ? (existing.profile_url || "") : "")}"
              placeholder="https://www.tiktok.com/@username"
              style="padding:12px;border-radius:10px;border:1px solid #3a404d;background:#171b23;color:#fff;">
          </label>

          <label style="display:grid;gap:6px;color:#a7adb8;font-size:12px;font-weight:800;">
            Discord Member
            <input id="rozag-member-search" type="text"
              value=""
              autocomplete="off"
              placeholder="${existing ? "Search to change member…" : "Search server members…"}"
              style="padding:12px;border-radius:10px;border:1px solid #3a404d;background:#171b23;color:#fff;">
          </label>

          <div id="rozag-selected-member"></div>
          <div id="rozag-member-results"></div>

          ${existing && existing.discord_user_id ? `
            <div style="font-size:12px;color:#8f96a3;">
              Current Discord member ID: ${escapeHtml(existing.discord_user_id)}
            </div>
          ` : ""}

          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button type="button" class="btn primary" id="rozag-save-social">
              ${isEdit ? "Save Changes" : "Add Account"}
            </button>
            <button type="button" class="btn" id="rozag-cancel-social">Cancel</button>
          </div>

          <div id="rozag-social-result"></div>
        </div>
      </div>
    `;

    let selectedMember = existing && existing.discord_user_id
      ? {
          id: String(existing.discord_user_id),
          username: "",
          global_name: "",
          nick: ""
        }
      : null;

    const search = panel.querySelector("#rozag-member-search");
    const selected = panel.querySelector("#rozag-selected-member");
    const results = panel.querySelector("#rozag-member-results");
    const url = panel.querySelector("#rozag-social-url");
    const save = panel.querySelector("#rozag-save-social");
    const cancel = panel.querySelector("#rozag-cancel-social");
    const result = panel.querySelector("#rozag-social-result");

    if (selectedMember) {
      selected.innerHTML =
        '<div class="server-status-banner" style="margin:0;">' +
          '<strong>Current member linked:</strong> ' +
          escapeHtml(existing.discord_user_id) +
        '</div>';
    }

    let timer = null;

    search.addEventListener("input", function () {
      selectedMember = null;
      selected.innerHTML = "";
      const q = search.value.trim();

      if (timer) clearTimeout(timer);

      if (q.length < 2) {
        results.innerHTML = "";
        return;
      }

      timer = setTimeout(function () {
        results.innerHTML =
          '<p style="color:#8f96a3;">Searching Discord members…</p>';

        fetchJson(
          apiBase() +
          "/" + encodeURIComponent(String(guild.id)) +
          "/members?query=" + encodeURIComponent(q)
        ).then(function (data) {
          const members = Array.isArray(data.members) ? data.members : [];

          if (!members.length) {
            results.innerHTML =
              '<p style="color:#8f96a3;">No matching server members found.</p>';
            return;
          }

          results.innerHTML = members.map(function (member) {
            const name =
              member.global_name ||
              member.nick ||
              member.username ||
              member.id;

            return `
              <button type="button" class="rozag-member-choice"
                data-member-id="${escapeHtml(member.id)}"
                style="display:block;width:100%;text-align:left;padding:10px;margin-top:6px;border:1px solid #303641;border-radius:9px;background:#151923;color:#fff;cursor:pointer;">
                <strong>${escapeHtml(name)}</strong>
                <span style="display:block;color:#8f96a3;font-size:12px;">
                  ${escapeHtml(member.username ? "@" + member.username : member.id)}
                </span>
              </button>
            `;
          }).join("");

          results.querySelectorAll(".rozag-member-choice").forEach(function (button) {
            button.addEventListener("click", function () {
              const member = members.find(function (m) {
                return String(m.id) === String(button.getAttribute("data-member-id"));
              });

              if (!member) return;

              selectedMember = member;
              selected.innerHTML =
                '<div class="server-status-banner" style="margin:0;">' +
                  '<strong>Selected:</strong> ' +
                  escapeHtml(
                    member.global_name ||
                    member.nick ||
                    member.username ||
                    member.id
                  ) +
                '</div>';
              results.innerHTML = "";
              search.value =
                member.global_name ||
                member.nick ||
                member.username ||
                "";
            });
          });
        }).catch(function (error) {
          results.innerHTML =
            '<p style="color:#ff8f98;">Member search failed: ' +
            escapeHtml(error.message) +
            '</p>';
        });
      }, 250);
    });

    cancel.addEventListener("click", function () {
      panel.innerHTML = "";
    });

    save.addEventListener("click", function () {
      if (!url.value.trim()) {
        window.alert("Enter the creator/channel profile URL.");
        return;
      }

      if (!selectedMember || !selectedMember.id) {
        window.alert("Select the Discord member who owns this creator account.");
        return;
      }

      save.disabled = true;
      result.innerHTML =
        '<p style="color:#8f96a3;">Saving…</p>';

      const request = isEdit
        ? fetchJson(
            apiBase() +
            "/" + encodeURIComponent(String(guild.id)) +
            "/social/" + encodeURIComponent(String(existing.social_account_id)),
            {
              method: "PUT",
              headers: {"Content-Type": "application/json"},
              body: JSON.stringify({
                url: url.value.trim(),
                member_id: selectedMember.id
              })
            }
          )
        : fetchJson(
            apiBase() +
            "/" + encodeURIComponent(String(guild.id)) +
            "/social",
            {
              method: "POST",
              headers: {"Content-Type": "application/json"},
              body: JSON.stringify({
                url: url.value.trim(),
                member_id: selectedMember.id
              })
            }
          );

      request.then(function (data) {
        let message =
          '<div class="server-status-banner">' +
            '<strong>✓ ' +
            (isEdit ? "Changes saved." : "Account added.") +
            '</strong>' +
          '</div>';

        if (data.authorization_required) {
          message +=
            '<p style="color:#a7adb8;">' +
            (
              data.authorization_sent
                ? "The existing RoZAG Social bot sent the authorization DM."
                : "Authorization DM could not be sent."
            ) +
            '</p>';

          if (data.authorization_url) {
            message +=
              '<p><a href="' +
              escapeHtml(data.authorization_url) +
              '" target="_blank" rel="noopener">Open authorization</a></p>';
          }
        }

        result.innerHTML = message;

        setTimeout(function () {
          loadServerManagement(guild, modal);
        }, 700);
      }).catch(function (error) {
        save.disabled = false;
        result.innerHTML =
          '<p style="color:#ff8f98;">Save failed: ' +
          escapeHtml(error.message) +
          '</p>';
      });
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
