(function () {
  "use strict";

  /*
   * RoZAG Dashboard Phase 4
   *
   * The existing Social Hub bot remains the only Discord bot.
   * The dashboard talks to the Phase 4 backend.
   */

  const cfg = window.ROZAG_DASHBOARD_CONFIG || {};
  const auth = cfg.AUTH_START_URL || "#";
  const me = cfg.AUTH_ME_URL || "";
  const serverApiBase =
    cfg.SERVER_API_BASE_URL ||
    (me ? me.replace(/\/api\/me\/?$/, "/api/server/") : "");

  const login = document.getElementById("login");
  const dash = document.getElementById("dashboard");
  const user = document.getElementById("user");
  const servers = document.getElementById("servers");

  const loginBtn = document.getElementById("loginBtn");
  const logout = document.getElementById("logout");

  if (loginBtn) loginBtn.href = auth;

  if (logout) {
    logout.addEventListener("click", function () {
      location.href = cfg.LOGOUT_URL || "./";
    });
  }

  const PLATFORM_META = {
    youtube: { icon: "🎬", name: "YouTube" },
    twitch: { icon: "🔴", name: "Twitch" },
    tiktok: { icon: "🎵", name: "TikTok" },
    kick: { icon: "🟢", name: "Kick" }
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
    return PLATFORM_META[String(platform || "").toLowerCase()] || {
      icon: "📡",
      name: String(platform || "Unknown").toUpperCase()
    };
  }

  function addStyles() {
    if (document.getElementById("rozag-phase4-styles")) return;

    const style = document.createElement("style");
    style.id = "rozag-phase4-styles";
    style.textContent = `
      .rozag-p4-actions{
        display:flex;
        flex-wrap:wrap;
        gap:10px;
        margin:0 0 18px;
      }

      .rozag-p4-btn{
        appearance:none;
        border:1px solid #414753;
        border-radius:10px;
        padding:10px 14px;
        background:#1a1e27;
        color:#fff;
        cursor:pointer;
        font-weight:800;
      }

      .rozag-p4-btn.primary{
        border-color:#b91c2b;
        background:#e21d2e;
      }

      .rozag-p4-btn.danger{
        border-color:#6b2730;
        color:#ff9da5;
      }

      .rozag-p4-btn:disabled{
        opacity:.55;
        cursor:not-allowed;
      }

      .rozag-p4-form{
        display:grid;
        gap:14px;
        padding:18px;
        margin-bottom:18px;
        background:#0f1218;
        border:1px solid #292e39;
        border-radius:15px;
      }

      .rozag-p4-form label{
        display:grid;
        gap:7px;
        color:#b8bdc7;
        font-size:12px;
        font-weight:800;
      }

      .rozag-p4-form input,
      .rozag-p4-form select{
        width:100%;
        box-sizing:border-box;
        border:1px solid #3a404c;
        border-radius:10px;
        background:#171b23;
        color:#fff;
        padding:12px;
        outline:none;
      }

      .rozag-destination-wrap.hidden,
      .hidden{
        display:none !important;
      }

      .rozag-p4-form input:focus{
        border-color:#e21d2e;
      }

      .rozag-member-results{
        display:grid;
        gap:6px;
        max-height:220px;
        overflow:auto;
        margin-top:-5px;
      }

      .rozag-member{
        width:100%;
        text-align:left;
        border:1px solid #303641;
        border-radius:10px;
        background:#151923;
        color:#fff;
        padding:10px 12px;
        cursor:pointer;
      }

      .rozag-member:hover{
        border-color:#e21d2e;
      }

      .rozag-member strong{
        display:block;
      }

      .rozag-member small{
        display:block;
        margin-top:3px;
        color:#8f96a2;
      }

      .rozag-selected-member{
        padding:10px 12px;
        border-radius:10px;
        background:#141923;
        border:1px solid rgba(59,217,139,.35);
        color:#9de9bc;
      }

      .rozag-help{
        color:#8f96a2;
        font-size:12px;
        line-height:1.5;
      }

      .rozag-success{
        padding:14px;
        margin-bottom:14px;
        border-radius:12px;
        background:rgba(59,217,139,.08);
        border:1px solid rgba(59,217,139,.3);
        color:#a8edc3;
      }

      .rozag-account-actions{
        display:flex;
        gap:8px;
        flex-wrap:wrap;
        margin-top:9px;
      }

      .rozag-account{
        position:relative;
      }
    `;
    document.head.appendChild(style);
  }

  function ensureModal() {
    if (document.getElementById("rozagManagementModal")) return;

    const backdrop = document.createElement("div");
    backdrop.id = "rozagManagementModal";
    backdrop.className = "rozag-modal-backdrop";
    backdrop.innerHTML = `
      <div class="rozag-modal" role="dialog" aria-modal="true">
        <div class="rozag-modal-head">
          <div>
            <h2 class="rozag-modal-title" id="rozagModalTitle">Server Management</h2>
            <p class="rozag-modal-subtitle" id="rozagModalSubtitle">Loading…</p>
          </div>
          <button type="button" class="rozag-modal-close" id="rozagModalClose">×</button>
        </div>
        <div class="rozag-modal-body" id="rozagModalBody">
          <div class="rozag-loading">Loading…</div>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    document.getElementById("rozagModalClose").addEventListener(
      "click",
      closeModal
    );

    backdrop.addEventListener("click", function (event) {
      if (event.target === backdrop) closeModal();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeModal();
    });
  }

  function closeModal() {
    const modal = document.getElementById("rozagManagementModal");
    if (modal) modal.classList.remove("open");
  }

  function apiUrl(path) {
    return serverApiBase.replace(/\/+$/, "") + path;
  }

  function fetchJson(url, options) {
    return fetch(url, Object.assign({
      credentials: "include",
      cache: "no-store"
    }, options || {})).then(function (response) {
      return response.json().then(function (data) {
        if (!response.ok) {
          throw new Error(
            data && (data.message || data.error)
              ? (data.message || data.error)
              : "HTTP " + response.status
          );
        }
        return data;
      });
    });
  }

  function openManagementModal(guildId, guildName) {
    ensureModal();

    const modal = document.getElementById("rozagManagementModal");
    const title = document.getElementById("rozagModalTitle");
    const subtitle = document.getElementById("rozagModalSubtitle");
    const body = document.getElementById("rozagModalBody");

    window.__rozagCurrentGuildName = guildName || "Server";
    title.textContent = "Manage " + (guildName || "Server");
    subtitle.textContent = "Manage connected creator accounts and member links";
    body.innerHTML = '<div class="rozag-loading">Loading RoZAG server data…</div>';
    modal.classList.add("open");

    fetchJson(
      apiUrl("/" + encodeURIComponent(String(guildId)))
    ).then(function (data) {
      renderServerManagement(guildId, guildName, data);
    }).catch(function (error) {
      body.innerHTML =
        '<div class="rozag-error">' +
        escapeHtml("Could not load this server: " + error.message) +
        "</div>";
    });
  }

  function renderServerManagement(guildId, guildName, data) {
    const body = document.getElementById("rozagModalBody");

    const accounts = Array.isArray(data.accounts) ? data.accounts : [];
    const platforms = Array.isArray(data.platforms) ? data.platforms : [];
    const counts = data.platform_counts || {};

    const connectedPlatformCount = platforms.filter(function (p) {
      return p.status === "connected";
    }).length;

    const memberCount = accounts.filter(function (a) {
      return a.association_type !== "watch";
    }).length;

    const watchCount = accounts.filter(function (a) {
      return a.association_type === "watch";
    }).length;

    const accountCards = accounts.length
      ? accounts.map(function (account) {
          const meta = platformMeta(account.platform);
          const route = account.feed || {};

          return (
            '<article class="rozag-account">' +
              '<div class="rozag-account-icon">' + meta.icon + '</div>' +
              '<div>' +
                '<h4 class="rozag-account-name">' +
                  escapeHtml(account.creator_name) +
                '</h4>' +
                '<p class="rozag-account-user">' +
                  escapeHtml(
                    account.username
                      ? "@" + String(account.username).replace(/^@/, "")
                      : "No username recorded"
                  ) +
                '</p>' +
                '<div class="rozag-account-meta">' +
                  escapeHtml(meta.name) +
                  " · " +
                  escapeHtml(
                    account.association_type === "watch"
                      ? "Creator Watch"
                      : "Member"
                  ) +
                  (
                    account.discord_user_id
                      ? " · Discord member linked"
                      : ""
                  ) +
                '</div>' +
                '<div class="rozag-account-route">' +
                  (
                    route.custom
                      ? '📍 Custom destination: ' + escapeHtml(route.channel_id || "selected")
                      : '📡 RoZAG default platform feed'
                  ) +
                '</div>' +
                '<div class="rozag-account-actions">' +
                  '<button type="button" class="rozag-p4-btn danger" data-remove-account="' +
                    escapeHtml(String(account.social_account_id)) +
                  '">Remove</button>' +
                '</div>' +
              '</div>' +
              '<div>' +
                '<span class="rozag-badge connected">● Connected</span>' +
                '<div>' +
                  (
                    route.channel_id
                      ? '<span class="rozag-badge route">Feed routed</span>'
                      : '<span class="rozag-badge">No feed route</span>'
                  ) +
                '</div>' +
              '</div>' +
            '</article>'
          );
        }).join("")
      : '<div class="rozag-empty">No connected creator accounts are registered for this server.</div>';

    const platformCards = platforms.map(function (platform) {
      const count = Number(counts[platform.platform] || 0);

      if (platform.status === "coming_soon") {
        return (
          '<article class="rozag-platform coming-soon">' +
            '<div class="rozag-platform-top">' +
              '<div class="rozag-platform-name">' +
                platform.icon + " " + escapeHtml(platform.name) +
              '</div>' +
              '<div class="rozag-platform-count">—</div>' +
            '</div>' +
            '<div class="rozag-platform-state">Coming Soon</div>' +
          '</article>'
        );
      }

      return (
        '<article class="rozag-platform">' +
          '<div class="rozag-platform-top">' +
            '<div class="rozag-platform-name">' +
              platform.icon + " " + escapeHtml(platform.name) +
            '</div>' +
            '<div class="rozag-platform-count">' + count + '</div>' +
          '</div>' +
          '<div class="rozag-platform-state">' +
            (count > 0
              ? "Connected creator account" + (count === 1 ? "" : "s")
              : "No connected accounts") +
          '</div>' +
        '</article>'
      );
    }).join("");


    body.innerHTML =
      '<div class="rozag-p4-actions">' +
        '<button type="button" class="rozag-p4-btn primary" id="rozagAddAccount">＋ Add Social Account</button>' +
        '<button type="button" class="rozag-p4-btn" id="rozagRefresh">↻ Refresh</button>' +
      '</div>' +

      '<div id="rozagAddPanel"></div>' +

      '<div class="rozag-summary">' +
        '<div class="rozag-summary-card"><div class="rozag-summary-label">Connected Accounts</div><div class="rozag-summary-value">' +
          accounts.length +
        '</div></div>' +
        '<div class="rozag-summary-card"><div class="rozag-summary-label">Platforms Used</div><div class="rozag-summary-value">' +
          connectedPlatformCount +
        '</div></div>' +
        '<div class="rozag-summary-card"><div class="rozag-summary-label">Members</div><div class="rozag-summary-value">' +
          memberCount +
        '</div></div>' +
        '<div class="rozag-summary-card"><div class="rozag-summary-label">Creator Watch</div><div class="rozag-summary-value">' +
          watchCount +
        '</div></div>' +
      '</div>' +

      '<div class="rozag-section-title"><h3>Connected Creator Accounts</h3><span>Same account relationship used by /social add</span></div>' +
      '<div class="rozag-accounts">' + accountCards + '</div>' +

      '<div class="rozag-section-title"><h3>Platform Connection Status</h3><span>Actual connected accounts</span></div>' +
      '<div class="rozag-platform-grid">' + platformCards + '</div>';

    document.getElementById("rozagAddAccount").addEventListener(
      "click",
      function () {
        showAddPanel(guildId);
      }
    );

    document.getElementById("rozagRefresh").addEventListener(
      "click",
      function () {
        openManagementModal(guildId, guildName);
      }
    );

    body.querySelectorAll("[data-remove-account]").forEach(function (button) {
      button.addEventListener("click", function () {
        const accountId = button.getAttribute("data-remove-account");

        if (!confirm("Remove this social account from this server?")) {
          return;
        }

        button.disabled = true;

        fetchJson(
          apiUrl(
            "/" +
            encodeURIComponent(String(guildId)) +
            "/social/" +
            encodeURIComponent(String(accountId))
          ),
          { method: "DELETE" }
        ).then(function () {
          openManagementModal(guildId, guildName);
        }).catch(function (error) {
          button.disabled = false;
          alert("Remove failed: " + error.message);
        });
      });
    });
  }

  function showAddPanel(guildId) {
    const panel = document.getElementById("rozagAddPanel");
    if (!panel) return;

    panel.innerHTML = `
      <div class="rozag-p4-form">
        <label>
          Creator / Channel Profile URL
          <input id="rozagSocialUrl" type="url" placeholder="https://www.twitch.tv/creator">
        </label>

        <label>
          Discord Member
          <input id="rozagMemberSearch" type="text" autocomplete="off" placeholder="Type a member name…">
        </label>

        <div id="rozagSelectedMember"></div>
        <div id="rozagMemberResults" class="rozag-member-results"></div>

        <label>
          Feed Destination
          <select id="rozagDestinationMode">
            <option value="default">RoZAG default — platform feed</option>
            <option value="channel">Existing Discord channel</option>
            <option value="category">Discord category — create a dedicated creator feed channel</option>
          </select>
        </label>

        <label id="rozagDestinationChannelWrap" class="rozag-destination-wrap hidden">
          Existing Channel
          <select id="rozagDestinationChannel">
            <option value="">Loading channels…</option>
          </select>
        </label>

        <label id="rozagDestinationCategoryWrap" class="rozag-destination-wrap hidden">
          Existing Category
          <select id="rozagDestinationCategory">
            <option value="">Loading categories…</option>
          </select>
        </label>

        <div class="rozag-help">
          <strong>Default:</strong> use the normal RoZAG platform feed.<br>
          <strong>Channel:</strong> send this creator's posts only to the selected channel.<br>
          <strong>Category:</strong> RoZAG creates one dedicated feed channel for this creator inside the selected category.
        </div>

        <div class="rozag-help">
          This member is the Discord account that owns the social creator. TikTok and Kick authorization messages will be sent to this member by the existing RoZAG Social bot.
        </div>

        <div class="rozag-p4-actions">
          <button type="button" class="rozag-p4-btn primary" id="rozagSaveSocial">Add Account</button>
          <button type="button" class="rozag-p4-btn" id="rozagCancelAdd">Cancel</button>
        </div>

        <div id="rozagAddResult"></div>
      </div>
    `;

    let selectedMember = null;
    let searchTimer = null;

    const searchInput = document.getElementById("rozagMemberSearch");
    const results = document.getElementById("rozagMemberResults");
    const selected = document.getElementById("rozagSelectedMember");
    const save = document.getElementById("rozagSaveSocial");
    const cancel = document.getElementById("rozagCancelAdd");
    const urlInput = document.getElementById("rozagSocialUrl");
    const resultBox = document.getElementById("rozagAddResult");
    const destinationMode = document.getElementById("rozagDestinationMode");
    const destinationChannelWrap = document.getElementById("rozagDestinationChannelWrap");
    const destinationCategoryWrap = document.getElementById("rozagDestinationCategoryWrap");
    const destinationChannel = document.getElementById("rozagDestinationChannel");
    const destinationCategory = document.getElementById("rozagDestinationCategory");

    function setDestinationVisibility() {
      const mode = destinationMode.value;
      destinationChannelWrap.classList.toggle("hidden", mode !== "channel");
      destinationCategoryWrap.classList.toggle("hidden", mode !== "category");
    }

    destinationMode.addEventListener("change", setDestinationVisibility);
    setDestinationVisibility();

    fetchJson(
      apiUrl("/" + encodeURIComponent(String(guildId)) + "/channels")
    ).then(function (data) {
      const channels = Array.isArray(data.channels) ? data.channels : [];
      const categories = Array.isArray(data.categories) ? data.categories : [];

      const grouped = {};
      channels.forEach(function (channel) {
        const key = channel.parent_id || "__uncategorized__";
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(channel);
      });

      destinationChannel.innerHTML = '<option value="">Select a channel…</option>';
      categories.forEach(function (category) {
        const items = grouped[category.id] || [];
        if (!items.length) return;
        const optgroup = document.createElement("optgroup");
        optgroup.label = category.name;
        items.forEach(function (channel) {
          const option = document.createElement("option");
          option.value = String(channel.id);
          option.textContent = "# " + channel.name;
          optgroup.appendChild(option);
        });
        destinationChannel.appendChild(optgroup);
      });

      const uncategorized = grouped["__uncategorized__"] || [];
      if (uncategorized.length) {
        const optgroup = document.createElement("optgroup");
        optgroup.label = "Uncategorized";
        uncategorized.forEach(function (channel) {
          const option = document.createElement("option");
          option.value = String(channel.id);
          option.textContent = "# " + channel.name;
          optgroup.appendChild(option);
        });
        destinationChannel.appendChild(optgroup);
      }

      destinationCategory.innerHTML = '<option value="">Select a category…</option>';
      categories.forEach(function (category) {
        const option = document.createElement("option");
        option.value = String(category.id);
        option.textContent = category.name;
        destinationCategory.appendChild(option);
      });
    }).catch(function (error) {
      destinationChannel.innerHTML = '<option value="">Could not load channels</option>';
      destinationCategory.innerHTML = '<option value="">Could not load categories</option>';
      resultBox.innerHTML = '<div class="rozag-error">Channel list failed: ' + escapeHtml(error.message) + '</div>';
    });

    function setSelectedMember(member) {
      selectedMember = member;

      selected.innerHTML =
        '<div class="rozag-selected-member">' +
          '✓ Selected: <strong>' +
          escapeHtml(
            member.global_name ||
            member.nick ||
            member.username ||
            member.id
          ) +
          '</strong>' +
          '<small>' +
          escapeHtml(
            member.username
              ? "@" + member.username + " · " + member.id
              : member.id
          ) +
          '</small>' +
        '</div>';

      results.innerHTML = "";
      searchInput.value =
        member.global_name ||
        member.nick ||
        member.username ||
        "";
    }

    searchInput.addEventListener("input", function () {
      selectedMember = null;
      selected.innerHTML = "";

      const query = searchInput.value.trim();

      if (searchTimer) clearTimeout(searchTimer);

      if (query.length < 2) {
        results.innerHTML = "";
        return;
      }

      searchTimer = setTimeout(function () {
        results.innerHTML =
          '<div class="rozag-help">Searching Discord members…</div>';

        fetchJson(
          apiUrl(
            "/" +
            encodeURIComponent(String(guildId)) +
            "/members?query=" +
            encodeURIComponent(query)
          )
        ).then(function (data) {
          if (!data.members.length) {
            results.innerHTML =
              '<div class="rozag-help">No matching server members found.</div>';
            return;
          }

          results.innerHTML = data.members.map(function (member) {
            const display =
              member.global_name ||
              member.nick ||
              member.username ||
              member.id;

            return (
              '<button type="button" class="rozag-member" data-member-id="' +
                escapeHtml(member.id) +
              '">' +
                '<strong>' + escapeHtml(display) + '</strong>' +
                '<small>' +
                  escapeHtml(
                    member.username
                      ? "@" + member.username
                      : member.id
                  ) +
                '</small>' +
              '</button>'
            );
          }).join("");

          results.querySelectorAll("[data-member-id]").forEach(function (button) {
            button.addEventListener("click", function () {
              const id = button.getAttribute("data-member-id");
              const member = data.members.find(function (m) {
                return String(m.id) === String(id);
              });

              if (member) setSelectedMember(member);
            });
          });
        }).catch(function (error) {
          results.innerHTML =
            '<div class="rozag-error">' +
            escapeHtml("Member search failed: " + error.message) +
            "</div>";
        });
      }, 250);
    });

    cancel.addEventListener("click", function () {
      panel.innerHTML = "";
    });

    save.addEventListener("click", function () {
      const url = urlInput.value.trim();
      const mode = destinationMode.value;

      if (!url) {
        alert("Enter the creator/channel profile URL.");
        return;
      }

      if (!selectedMember) {
        alert("Select the Discord member who owns the creator account.");
        return;
      }

      if (mode === "channel" && !destinationChannel.value) {
        alert("Select the Discord channel for this creator.");
        return;
      }

      if (mode === "category" && !destinationCategory.value) {
        alert("Select the Discord category for this creator.");
        return;
      }

      save.disabled = true;
      resultBox.innerHTML =
        '<div class="rozag-help">Resolving the social profile, registering it and saving its feed destination…</div>';

      fetchJson(
        apiUrl(
          "/" +
          encodeURIComponent(String(guildId)) +
          "/social"
        ),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            url: url,
            member_id: selectedMember.id,
            destination_mode: mode,
            destination_channel_id: mode === "channel" ? destinationChannel.value : "",
            destination_category_id: mode === "category" ? destinationCategory.value : ""
          })
        }
      ).then(function (data) {
        let html =
          '<div class="rozag-success">' +
            '<strong>✓ Account added.</strong><br>' +
            escapeHtml(data.creator) +
            " · " +
            escapeHtml(data.platform) +
            "<br>" +
            "Feed destination: " +
            escapeHtml(data.feed_channel?.name || data.feed_channel?.id || "created") +
          '</div>';

        if (data.authorization_required) {
          html +=
            '<div class="rozag-help">' +
              (
                data.authorization_sent
                  ? "🔐 The existing RoZAG Social bot sent the authorization DM to the selected Discord member."
                  : "⚠️ The authorization DM could not be sent. Use the authorization link below."
              ) +
            '</div>';

          if (data.authorization_url) {
            html +=
              '<p><a target="_blank" rel="noopener" href="' +
                escapeHtml(data.authorization_url) +
              '">Open authorization link</a></p>';
          }
        }

        resultBox.innerHTML = html;

        setTimeout(function () {
          openManagementModal(guildId, window.__rozagCurrentGuildName || "Server");
        }, 900);
      }).catch(function (error) {
        save.disabled = false;
        resultBox.innerHTML =
          '<div class="rozag-error">' +
          escapeHtml("Add failed: " + error.message) +
          "</div>";
      });
    });

    urlInput.focus();
  }

  function render(data) {
    if (!data || !data.authenticated) return;

    if (login) login.classList.add("hidden");
    if (dash) dash.classList.remove("hidden");
    if (user) user.classList.remove("hidden");

    const usernameEl = document.getElementById("username");
    const avatarEl = document.getElementById("avatar");

    if (usernameEl) {
      usernameEl.textContent =
        data.user?.global_name ||
        data.user?.username ||
        "Discord User";
    }

    if (avatarEl) {
      const userId = data.user?.id;
      const avatarHash = data.user?.avatar;

      if (userId && avatarHash) {
        avatarEl.innerHTML =
          '<img src="https://cdn.discordapp.com/avatars/' +
          encodeURIComponent(String(userId)) + '/' +
          encodeURIComponent(String(avatarHash)) +
          '.png?size=128" alt="Discord profile avatar">';
      } else {
        avatarEl.textContent =
          (data.user?.username || "D").slice(0, 1).toUpperCase();
      }
    }

    if (!servers) return;

    const list = Array.isArray(data.servers) ? data.servers : [];

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
            '<div class="guild-icon">' + icon + '</div>' +
            '<div class="server-meta">' +
              '<h3>' + escapeHtml(g.name || "Unnamed Server") + '</h3>' +
              '<span class="online">RoZAG access available</span>' +
            '</div>' +
          '</div>' +
          '<button class="btn primary manage" data-guild="' +
            escapeHtml(String(g.id || "")) +
          '">Manage Server</button>' +
        '</article>'
      );
    }).join("");

    servers.querySelectorAll(".manage").forEach(function (button) {
      button.addEventListener("click", function () {
        openManagementModal(
          button.getAttribute("data-guild"),
          button.closest(".server-card")?.querySelector("h3")?.textContent ||
          "Server"
        );
      });
    });
  }

  addStyles();

  if (me) {
    fetch(me, {
      credentials: "include",
      cache: "no-store"
    })
      .then(function (response) {
        if (!response.ok) {
          if (response.status === 401) return null;
          throw new Error("HTTP " + response.status);
        }
        return response.json();
      })
      .then(render)
      .catch(function (error) {
        console.error("RoZAG dashboard session lookup failed:", error);
      });
  }
})();
