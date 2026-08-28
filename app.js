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
  const username = document.getElementById("username");
  const avatar = document.getElementById("avatar");

  loginBtn.href = auth;

  /*
   * Discord profile picture
   *
   * The backend already returns:
   *   user.id
   *   user.avatar
   *
   * Discord's CDN can therefore be used directly by the browser.
   * We never expose the Discord OAuth access token here.
   */
  function discordAvatarUrl(userData) {
    if (!userData || !userData.id || !userData.avatar) {
      return null;
    }

    return "https://cdn.discordapp.com/avatars/" +
      encodeURIComponent(userData.id) + "/" +
      encodeURIComponent(userData.avatar) +
      ".png?size=128";
  }

  function renderAvatar(userData) {
    const imageUrl = discordAvatarUrl(userData);

    if (imageUrl) {
      avatar.innerHTML = "";

      const img = document.createElement("img");
      img.src = imageUrl;
      img.alt = "Discord profile picture";
      img.referrerPolicy = "no-referrer";

      img.onerror = function () {
        avatar.textContent =
          (userData && userData.username
            ? userData.username.charAt(0)
            : "D"
          ).toUpperCase();
      };

      avatar.appendChild(img);
      return;
    }

    avatar.textContent =
      (userData && userData.username
        ? userData.username.charAt(0)
        : "D"
      ).toUpperCase();
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[char];
    });
  }

  function guildIconUrl(guild) {
    if (!guild || !guild.id || !guild.icon) {
      return null;
    }

    return (
      "https://cdn.discordapp.com/icons/" +
      encodeURIComponent(guild.id) + "/" +
      encodeURIComponent(guild.icon) +
      ".png?size=128"
    );
  }

  function render(data) {
    if (!data || !data.authenticated) {
      return;
    }

    login.classList.add("hidden");
    dash.classList.remove("hidden");
    user.classList.remove("hidden");

    const currentUser = data.user || {};

    username.textContent =
      currentUser.global_name ||
      currentUser.username ||
      "Discord User";

    renderAvatar(currentUser);

    const list = Array.isArray(data.servers)
      ? data.servers
      : [];

    if (!list.length) {
      servers.innerHTML =
        '<div class="empty">No manageable RoZAG servers were found.</div>';
      return;
    }

    servers.innerHTML = list.map(function (guild) {
      const iconUrl = guildIconUrl(guild);

      const iconHtml = iconUrl
        ? '<img src="' + escapeHtml(iconUrl) +
          '" alt="' + escapeHtml(guild.name || "Server") + '">'
        : "🏴‍☠️";

      return (
        '<article class="server-card">' +
          '<div class="server-head">' +
            '<div class="guild-icon">' + iconHtml + '</div>' +
            '<div class="server-meta">' +
              '<h3>' + escapeHtml(guild.name || "Unnamed Server") + '</h3>' +
              '<span class="online">RoZAG access available</span>' +
            '</div>' +
          '</div>' +
          '<button class="btn primary manage" data-guild="' +
            escapeHtml(String(guild.id || "")) +
            '" type="button">Manage Server</button>' +
        '</article>'
      );
    }).join("");

    document.querySelectorAll(".manage").forEach(function (button) {
      button.addEventListener("click", function () {
        alert("Server management is the next test phase.");
      });
    });
  }

  /*
   * Logout now asks for confirmation so an accidental click
   * cannot immediately end the session.
   */
  logoutBtn.addEventListener("click", function () {
    const confirmed = window.confirm(
      "Are you sure you want to sign out of the RoZAG Dashboard?"
    );

    if (!confirmed) {
      return;
    }

    window.location.href = logoutUrl;
  });

  /*
   * Fetch the authenticated dashboard session.
   * credentials: include is required because the Flask session
   * cookie belongs to the dashboard backend.
   */
  if (me) {
    fetch(me, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers: {
        "Accept": "application/json"
      }
    })
      .then(function (response) {
        if (!response.ok) {
          return null;
        }
        return response.json();
      })
      .then(render)
      .catch(function (error) {
        console.error("RoZAG dashboard session lookup failed:", error);
      });
  }
})();
