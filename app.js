// RoZAG Social Hub website application logic
// Uses the public RoZAG gateway API instead of assuming the website
// and API are hosted on the same origin.

(function () {
  "use strict";

  const cfg = window.ROZAG_CONFIG || {};
  const API_BASE_URL = String(cfg.API_BASE_URL || "https://rozag.coolvetspaces.com").replace(/\/+$/, "");
  const STATUS_PATH = cfg.STATUS_PATH || "/api/status";
  const INSTALL_URL = cfg.INSTALL_URL || "https://discord.com/oauth2/authorize?client_id=1537113386867761293";

  function byId(id) {
    return document.getElementById(id);
  }

  function stateMarkup(item) {
    const status = (item && item.status) || "offline";
    const label = (item && item.label) || "Offline";
    const cls = status === "online"
      ? ""
      : (status === "degraded" ? "warn" : "red");

    return '<span class="dot ' + cls.trim() + '"></span>' + label;
  }

  function setPlatform(prefix, item) {
    const state = byId(prefix + "-status");
    const detail = byId(prefix + "-detail");

    if (!state || !detail) return;

    state.innerHTML = stateMarkup(item);
    detail.textContent =
      (item && item.detail) || "No status information reported.";
  }

  function setInstallLinks() {
    ["install", "install2"].forEach(function (id) {
      const link = byId(id);
      if (!link) return;

      link.href = INSTALL_URL;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    });
  }

  function setUnavailable() {
    const bot = byId("bot");
    const servers = byId("servers");
    const seen = byId("seen");

    if (bot) {
      bot.innerHTML = '<span class="dot red"></span>Unavailable';
    }
    if (servers) servers.textContent = "—";
    if (seen) seen.textContent = "—";

    ["youtube", "tiktok", "twitch", "kick"].forEach(function (platform) {
      setPlatform(platform, {
        status: "offline",
        label: "Unavailable",
        detail: "Status API could not be reached."
      });
    });
  }

  async function loadStatus() {
    const url =
      API_BASE_URL +
      STATUS_PATH +
      (STATUS_PATH.indexOf("?") >= 0 ? "&" : "?") +
      "t=" + Date.now();

    try {
      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
        headers: {
          "Accept": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("Status API HTTP " + response.status);
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.toLowerCase().includes("application/json")) {
        throw new Error("Status API did not return JSON");
      }

      const data = await response.json();

      const botOnline = !!data.bot_online;
      const bot = byId("bot");
      const servers = byId("servers");
      const seen = byId("seen");

      if (bot) {
        bot.innerHTML =
          '<span class="dot ' + (botOnline ? "" : "red") + '"></span>' +
          (botOnline ? "Online" : "Offline");
      }

      if (servers) {
        servers.textContent =
          data.server_count ?? data.servers ?? "—";
      }

      if (seen) {
        seen.textContent =
          data.last_seen_human ||
          data.last_heartbeat ||
          "—";
      }

      setPlatform("youtube", data.youtube);
      setPlatform("tiktok", data.tiktok);
      setPlatform("twitch", data.twitch);
      setPlatform("kick", data.kick);

      console.info("[RoZAG] Status API OK:", API_BASE_URL + STATUS_PATH);
    } catch (error) {
      console.error("[RoZAG] Status API failed:", error);
      setUnavailable();
    }
  }

  function start() {
    setInstallLinks();
    loadStatus();

    // Keep the website status current without requiring a page refresh.
    window.setInterval(loadStatus, 15000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
