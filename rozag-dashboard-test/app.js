(function () {
  "use strict";

  const cfg = window.ROZAG_DASHBOARD_CONFIG || {};
  const auth = cfg.AUTH_START_URL || "#";
  const me = cfg.AUTH_ME_URL || "";

  const login = document.getElementById("login");
  const dash = document.getElementById("dashboard");
  const user = document.getElementById("user");
  const servers = document.getElementById("servers");

  document.getElementById("loginBtn").href = auth;

  document.getElementById("logout").addEventListener("click", function () {
    location.href = cfg.LOGOUT_URL || "./";
  });

  function render(data) {
    if (!data || !data.authenticated) return;

    login.classList.add("hidden");
    dash.classList.remove("hidden");
    user.classList.remove("hidden");

    document.getElementById("username").textContent =
      data.user?.global_name ||
      data.user?.username ||
      "Discord User";

    document.getElementById("avatar").textContent =
      (data.user?.username || "D").slice(0, 1).toUpperCase();

    // The backend returns the manageable servers as "servers".
    // The previous frontend incorrectly looked for "guilds".
    const list = Array.isArray(data.servers) ? data.servers : [];

    if (!list.length) {
      servers.innerHTML =
        '<div class="empty">No manageable RoZAG servers were found.</div>';
      return;
    }

    servers.innerHTML = list.map(function (g) {
      const icon = g.icon
        ? '<img src="https://cdn.discordapp.com/icons/' +
          encodeURIComponent(String(g.id || "")) + '/' +
          encodeURIComponent(String(g.icon)) +
          '.png?size=128" alt="" style="width:100%;height:100%;border-radius:12px;object-fit:cover;">'
        : "🏴‍☠️";

      return '<article class="server-card">' +
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
      '</article>';
    }).join("");

    document.querySelectorAll(".manage").forEach(function (button) {
      button.addEventListener("click", function () {
        alert("Server management is the next test phase.");
      });
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[c];
    });
  }

  if (me) {
    fetch(me, {
      credentials: "include",
      cache: "no-store"
    })
      .then(function (response) {
        if (!response.ok) return null;
        return response.json();
      })
      .then(render)
      .catch(function (error) {
        console.error("RoZAG dashboard session lookup failed:", error);
      });
  }
})();
