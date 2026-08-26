// RoZAG Social Hub website application logic
// Uses the public RoZAG gateway API and supports the current + legacy
// status field names returned by the gateway.

(function () {
  "use strict";

  const cfg = window.ROZAG_CONFIG || {};
  const API_BASE_URL = String(
    cfg.API_BASE_URL || window.location.origin
  ).replace(/\/+$/, "");
  const STATUS_PATH = cfg.STATUS_PATH || "/api/status";
  const INSTALL_URL =
    cfg.INSTALL_URL ||
    "https://discord.com/oauth2/authorize?client_id=1537113386867761293";
  const SUPPORT_URL =
    cfg.SUPPORT_URL || "https://discord.gg/DhbnqFHH";

  function byId(id) {
    return document.getElementById(id);
  }

  function stateMarkup(item) {
    const status = (item && item.status) || "offline";
    const label = (item && item.label) || "Offline";
    const cls =
      status === "online"
        ? ""
        : status === "degraded"
          ? "warn"
          : "red";

    return '<span class="dot ' + cls + '"></span>' + label;
  }

  function setPlatform(prefix, item) {
    const state = byId(prefix + "-status");
    const detail = byId(prefix + "-detail");
    if (!state || !detail) return;

    state.innerHTML = stateMarkup(item);
    detail.textContent =
      (item && item.detail) || "No status information reported.";
  }

  function setExternalLinks() {
    document.querySelectorAll("[data-install-link]").forEach(function (link) {
      link.href = INSTALL_URL;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    });

    document.querySelectorAll("[data-support-link]").forEach(function (link) {
      link.href = SUPPORT_URL;
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

    ["youtube", "tiktok", "twitch"].forEach(function (platform) {
      setPlatform(platform, {
        status: "offline",
        label: "Unavailable",
        detail: "Status API could not be reached."
      });
    });
  }

  function normalisePayload(data) {
    // Current gateway exposes both naming schemes, but this also keeps the
    // website compatible with the older gateway response.
    return {
      botOnline: Boolean(
        data && (data.bot_online !== undefined ? data.bot_online : data.online)
      ),
      servers:
        data && data.server_count !== undefined
          ? data.server_count
          : data && data.servers !== undefined
            ? data.servers
            : "—",
      seen:
        data && data.last_seen_human
          ? data.last_seen_human
          : data && data.last_heartbeat
            ? data.last_heartbeat
            : "—",
      youtube: data && data.youtube,
      tiktok: data && data.tiktok,
      twitch: data && data.twitch
    };
  }

  async function loadStatus() {
    const url =
      API_BASE_URL +
      STATUS_PATH +
      (STATUS_PATH.indexOf("?") >= 0 ? "&" : "?") +
      "t=" +
      Date.now();

    try {
      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" }
      });

      if (!response.ok) {
        throw new Error("Status API HTTP " + response.status);
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.toLowerCase().includes("application/json")) {
        throw new Error("Status API did not return JSON");
      }

      const data = normalisePayload(await response.json());

      const bot = byId("bot");
      const servers = byId("servers");
      const seen = byId("seen");

      if (bot) {
        bot.innerHTML =
          '<span class="dot ' +
          (data.botOnline ? "" : "red") +
          '"></span>' +
          (data.botOnline ? "Online" : "Offline");
      }

      if (servers) servers.textContent = data.servers;
      if (seen) seen.textContent = data.seen;

      setPlatform("youtube", data.youtube);
      setPlatform("tiktok", data.tiktok);
      setPlatform("twitch", data.twitch);
    } catch (error) {
      console.error("[RoZAG] Status API failed:", error);
      setUnavailable();
    }
  }

  function start() {
    setExternalLinks();
    loadStatus();

    // Refresh the public status without requiring a page reload.
    window.setInterval(loadStatus, 15000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
