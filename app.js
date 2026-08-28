// RoZAG Social Hub website application logic
// Public status API client.
// Compatible with both the current gateway status payload and older
// object-based platform status payloads.

(function () {
  "use strict";

  const cfg = window.ROZAG_CONFIG || {};

  const API_BASE_URL = String(
    cfg.API_BASE_URL || "https://rozag.coolvetspaces.com"
  ).replace(/\/+$/, "");

  const STATUS_PATH = cfg.STATUS_PATH || "/api/status";

  const INSTALL_URL =
    cfg.INSTALL_URL ||
    "https://discord.com/oauth2/authorize?client_id=1537113386867761293";

  const SUPPORT_URL =
    cfg.SUPPORT_URL ||
    "https://discord.gg/rJFUWAGWHH";

  function byId(id) {
    return document.getElementById(id);
  }

  function normalisePlatform(value) {
    // New gateway format:
    //   youtube: true / false
    //
    // Older gateway format:
    //   youtube: { status, label, detail }
    //
    // Also accept:
    //   platforms: { youtube: true, ... }

    if (typeof value === "boolean") {
      return {
        status: value ? "online" : "offline",
        label: value ? "Online" : "Offline",
        detail: value
          ? "Service online"
          : "Service offline"
      };
    }

    if (value && typeof value === "object") {
      const status = String(value.status || "").toLowerCase();

      if (status === "online" || status === "degraded" || status === "offline") {
        return {
          status: status,
          label: value.label || (
            status === "online"
              ? "Online"
              : status === "degraded"
                ? "Degraded"
                : "Offline"
          ),
          detail: value.detail || "No status information reported."
        };
      }

      // Some payloads may use an online boolean inside the object.
      if (typeof value.online === "boolean") {
        return normalisePlatform(value.online);
      }
    }

    return {
      status: "offline",
      label: "Offline",
      detail: "No status information reported."
    };
  }

  function stateMarkup(item) {
    const status = item && item.status
      ? item.status
      : "offline";

    const label = item && item.label
      ? item.label
      : "Offline";

    let cls = "red";

    if (status === "online") {
      cls = "";
    } else if (status === "degraded") {
      cls = "warn";
    }

    return (
      '<span class="dot ' +
      cls +
      '"></span>' +
      label
    );
  }

  function setPlatform(prefix, item) {
    const state = byId(prefix + "-status");
    const detail = byId(prefix + "-detail");

    if (!state) return;

    state.innerHTML = stateMarkup(item);

    if (detail) {
      detail.textContent =
        (item && item.detail) ||
        "No status information reported.";
    }
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

    // Compatibility with the existing index.html buttons.
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
    const accounts = byId("accounts");

    if (bot) {
      bot.innerHTML =
        '<span class="dot red"></span>Unavailable';
    }

    if (servers) {
      servers.textContent = "—";
    }

    if (seen) {
      seen.textContent = "—";
    }

    if (accounts) {
      accounts.textContent = "—";
    }

    ["youtube", "tiktok", "twitch", "kick"].forEach(function (platform) {
      setPlatform(platform, {
        status: "offline",
        label: "Unavailable",
        detail: "Status API could not be reached."
      });
    });
  }

  function normalisePayload(data) {
    const platformSource =
      data && data.platforms && typeof data.platforms === "object"
        ? data.platforms
        : {};

    function platformValue(name) {
      if (Object.prototype.hasOwnProperty.call(platformSource, name)) {
        return normalisePlatform(platformSource[name]);
      }

      if (data && Object.prototype.hasOwnProperty.call(data, name)) {
        return normalisePlatform(data[name]);
      }

      return normalisePlatform(false);
    }

    const botOnline = Boolean(
      data && (
        data.bot_online !== undefined
          ? data.bot_online
          : data.online
      )
    );

    return {
      botOnline: botOnline,

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
            : data && data.last_seen
              ? data.last_seen
              : "—",

      accounts:
        data && data.accounts_followed !== undefined
          ? data.accounts_followed
          : data && data.account_count !== undefined
            ? data.account_count
            : data && data.accounts !== undefined
              ? data.accounts
              : data && data.followed_accounts !== undefined
                ? data.followed_accounts
                : "—",

      youtube: platformValue("youtube"),
      tiktok: platformValue("tiktok"),
      twitch: platformValue("twitch"),
      kick: platformValue("kick")
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
        headers: {
          Accept: "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(
          "Status API HTTP " + response.status
        );
      }

      const contentType =
        response.headers.get("content-type") || "";

      if (
        !contentType
          .toLowerCase()
          .includes("application/json")
      ) {
        throw new Error(
          "Status API did not return JSON"
        );
      }

      const raw = await response.json();
      const data = normalisePayload(raw);

      const bot = byId("bot");
      const servers = byId("servers");
      const seen = byId("seen");
      const accounts = byId("accounts");

      if (bot) {
        bot.innerHTML =
          '<span class="dot ' +
          (data.botOnline ? "" : "red") +
          '"></span>' +
          (data.botOnline ? "Online" : "Offline");
      }

      if (servers) {
        servers.textContent = data.servers;
      }

      if (seen) {
        seen.textContent = data.seen;
      }

      if (accounts) {
        accounts.textContent = data.accounts;
      }

      setPlatform("youtube", data.youtube);
      setPlatform("tiktok", data.tiktok);
      setPlatform("twitch", data.twitch);
      setPlatform("kick", data.kick);

      console.info(
        "[RoZAG] Status API OK:",
        API_BASE_URL + STATUS_PATH,
        raw
      );
    } catch (error) {
      console.error(
        "[RoZAG] Status API failed:",
        error
      );

      // Only show "Unavailable" when the API itself could not be read.
      // A successfully returned false/Offline value must remain Offline.
      setUnavailable();
    }
  }

  function start() {
    setExternalLinks();
    loadStatus();

    // Refresh every 15 seconds.
    window.setInterval(
      loadStatus,
      15000
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      start
    );
  } else {
    start();
  }
})();
