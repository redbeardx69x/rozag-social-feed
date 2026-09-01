// RoZAG Social Feed — public website status client
(function () {
  "use strict";

  const cfg = window.ROZAG_CONFIG || {};
  const API_BASE_URL = String(cfg.API_BASE_URL || "https://rozag.coolvetspaces.com").replace(/\/+$/, "");
  const STATUS_PATH = cfg.STATUS_PATH || "/api/status";
  const INSTALL_URL = cfg.INSTALL_URL ||
    "https://discord.com/oauth2/authorize?client_id=1537113386867761293&scope=bot%20applications.commands&permissions=93200";
  const SUPPORT_URL = cfg.SUPPORT_URL || "https://discord.gg/rJFUWAGWHH";

  function byId(id) { return document.getElementById(id); }

  function platformState(value) {
    if (typeof value === "boolean") return value ? "Online" : "Offline";
    if (value && typeof value === "object") {
      const s = String(value.status || "").toLowerCase();
      if (s === "online") return "Online";
      if (s === "degraded") return "Degraded";
      if (s === "offline") return "Offline";
      if (typeof value.online === "boolean") return value.online ? "Online" : "Offline";
      if (value.label) return String(value.label);
    }
    return "Offline";
  }

  function statusMarkup(label) {
    const low = label.toLowerCase();
    const cls = low === "online" ? "" : (low === "degraded" ? " warn" : " red");
    return '<span class="dot' + cls + '"></span>' + label;
  }

  function setPlatform(name, value) {
    const el = byId(name + "-status");
    if (!el) return;
    el.innerHTML = statusMarkup(platformState(value));
  }

  function setUnavailable() {
    const bot = byId("bot"), servers = byId("servers"), seen = byId("seen");
    if (bot) bot.innerHTML = '<span class="dot red"></span>Unavailable';
    if (servers) servers.textContent = "—";
    if (seen) seen.textContent = "—";
    ["youtube", "tiktok", "twitch", "kick"].forEach(function (p) {
      setPlatform(p, { status: "offline", label: "Unavailable" });
    });
    const updated = byId("status-updated");
    if (updated) updated.textContent = "Status service unavailable";
  }

  async function loadStatus() {
    const url = API_BASE_URL + STATUS_PATH +
      (STATUS_PATH.indexOf("?") >= 0 ? "&" : "?") + "t=" + Date.now();

    try {
      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
        headers: { "Accept": "application/json" }
      });
      if (!response.ok) throw new Error("Status API HTTP " + response.status);

      const data = await response.json();

      const online = data.bot_online !== undefined ? Boolean(data.bot_online) : Boolean(data.online);
      const bot = byId("bot");
      if (bot) bot.innerHTML = online
        ? '<span class="dot"></span>Online'
        : '<span class="dot red"></span>Offline';

      const servers = byId("servers");
      if (servers) servers.textContent =
        data.server_count !== undefined ? data.server_count :
        data.servers !== undefined ? data.servers : "—";

      const seen = byId("seen");
      if (seen) seen.textContent =
        data.last_seen_human || data.last_heartbeat || data.last_seen || "—";

      const platforms = data.platforms && typeof data.platforms === "object" ? data.platforms : data;
      ["youtube", "tiktok", "twitch", "kick"].forEach(function (p) {
        setPlatform(p, platforms[p]);
      });

      const updated = byId("status-updated");
      if (updated) updated.textContent = "Updated just now";
      console.info("[RoZAG] Status API OK", data);
    } catch (err) {
      console.error("[RoZAG] Status API failed", err);
      setUnavailable();
    }
  }

  function start() {
    document.querySelectorAll("[data-install-link]").forEach(function (a) {
      a.href = INSTALL_URL; a.target = "_blank"; a.rel = "noopener noreferrer";
    });
    ["install", "install2"].forEach(function (id) {
      const a = byId(id);
      if (a) { a.href = INSTALL_URL; a.target = "_blank"; a.rel = "noopener noreferrer"; }
    });
    document.querySelectorAll("[data-support-link]").forEach(function (a) {
      a.href = SUPPORT_URL; a.target = "_blank"; a.rel = "noopener noreferrer";
    });

    loadStatus();
    window.setInterval(loadStatus, 15000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();