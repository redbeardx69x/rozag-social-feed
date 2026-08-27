(() => {
  "use strict";

  const cfg = window.ROZAG_CONFIG || {};
  const $ = (selector) => document.querySelector(selector);

  const botEl = $("#bot-status");
  const serverEl = $("#server-count");
  const heartbeatEl = $("#heartbeat");
  const updatedEl = $("#status-updated");

  const platformEls = {
    youtube: $("#platform-youtube"),
    tiktok: $("#platform-tiktok"),
    twitch: $("#platform-twitch"),
    kick: $("#platform-kick")
  };

  const escapeHtml = (value) =>
    String(value ?? "").replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[c]));

  function renderState(el, state, label) {
    if (!el) return;
    const normalized = String(state || "").toLowerCase();

    let kind = "amber";
    let text = label || "Checking";

    if (normalized === "online" || normalized === "up" || normalized === "true") {
      kind = "green";
      text = "Online";
    } else if (normalized === "offline" || normalized === "down" || normalized === "false") {
      kind = "red";
      text = "Offline";
    } else if (normalized === "degraded") {
      kind = "amber";
      text = "Degraded";
    } else if (normalized === "unavailable") {
      kind = "red";
      text = "Unavailable";
    }

    el.innerHTML = `<i class="dot dot-${kind}"></i> ${escapeHtml(text)}`;
  }

  function boolState(value) {
    if (value === true || value === 1 || value === "true") return "online";
    if (value === false || value === 0 || value === "false") return "offline";
    return null;
  }

  function platformState(value, fallback) {
    if (value == null) return fallback;
    if (typeof value === "boolean" || typeof value === "number") return boolState(value) || fallback;

    if (typeof value === "string") {
      const s = value.toLowerCase();
      if (["online","offline","degraded","unavailable"].includes(s)) return s;
      return fallback;
    }

    if (typeof value === "object") {
      if ("online" in value) return boolState(value.online) || fallback;
      if ("status" in value) return platformState(value.status, fallback);
      if ("state" in value) return platformState(value.state, fallback);
    }

    return fallback;
  }

  function formatHeartbeat(value) {
    if (!value) return "—";

    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);

    const seconds = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));

    if (seconds < 10) return "just now";
    if (seconds < 60) return `${seconds}s ago`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    return `${Math.floor(hours / 24)}d ago`;
  }

  function setDiscordInstallLinks() {
    const clientId = String(cfg.DISCORD_CLIENT_ID || "").trim();

    document.querySelectorAll(".discord-install").forEach(link => {
      if (!clientId) {
        link.href = cfg.SUPPORT_URL || "#";
        link.dataset.installUnavailable = "true";
        link.title = "Discord installation link is being configured.";
        return;
      }

      const url =
        `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(clientId)}` +
        `&scope=bot%20applications.commands&permissions=0`;

      link.href = url;
      link.removeAttribute("data-install-unavailable");
      link.removeAttribute("title");
    });
  }

  async function refreshStatus() {
    if (!cfg.STATUS_ENDPOINT) {
      renderState(botEl, "degraded", "Not configured");
      serverEl.textContent = "—";
      heartbeatEl.textContent = "—";
      Object.values(platformEls).forEach(el => renderState(el, "degraded", "Not configured"));
      updatedEl.textContent = "Status endpoint not configured";
      return;
    }

    try {
      const response = await fetch(cfg.STATUS_ENDPOINT, {
        method: "GET",
        cache: "no-store",
        headers: { "Accept": "application/json" }
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      const botOnline =
        boolState(data.bot_online) ||
        boolState(data.online) ||
        (String(data.status || "").toLowerCase() === "online" ? "online" : null) ||
        "offline";

      renderState(botEl, botOnline);

      serverEl.textContent =
        data.server_count ??
        data.servers ??
        data.guilds ??
        "—";

      heartbeatEl.textContent =
        formatHeartbeat(
          data.last_seen ??
          data.last_heartbeat ??
          data.heartbeat ??
          data.lastHeartbeat
        );

      const platforms = data.platforms || {};

      /*
        The current gateway exposes platform health independently when available.
        If it doesn't, use the bot health as a safe fallback so the website
        doesn't incorrectly report every integration as unavailable.
      */
      for (const [name, el] of Object.entries(platformEls)) {
        const state = platformState(platforms[name], botOnline);
        renderState(el, state);
      }

      updatedEl.textContent = "Updated just now";
    } catch (error) {
      console.error("RoZAG status request failed:", error);

      renderState(botEl, "unavailable");
      serverEl.textContent = "—";
      heartbeatEl.textContent = "—";

      Object.values(platformEls).forEach(el => renderState(el, "unavailable"));
      updatedEl.textContent = "Status service unavailable";
    }
  }

  setDiscordInstallLinks();
  refreshStatus();
  setInterval(refreshStatus, 15000);

  document.querySelectorAll("[data-share-link]").forEach(el => {
    const siteUrl = encodeURIComponent(cfg.SITE_URL || window.location.href);
    const title = encodeURIComponent("RoZAG Social Hub — Social feeds, built for Discord.");

    const map = {
      x: `https://twitter.com/intent/tweet?url=${siteUrl}&text=${title}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${siteUrl}`,
      reddit: `https://www.reddit.com/submit?url=${siteUrl}&title=${title}`,
      whatsapp: `https://wa.me/?text=${title}%20${siteUrl}`
    };

    el.href = map[el.dataset.shareLink] || "#";
  });

  $('[data-share="copy"]')?.addEventListener("click", async () => {
    const message = $("#share-message");

    try {
      await navigator.clipboard.writeText(cfg.SITE_URL || window.location.href);
      if (message) message.textContent = "Link copied!";
    } catch {
      if (message) message.textContent = "Copy failed — select the address bar instead.";
    }
  });

  $('[data-share="native"]')?.addEventListener("click", async () => {
    const message = $("#share-message");
    const shareData = {
      title: "RoZAG Social Hub",
      text: "Social feeds, built for Discord.",
      url: cfg.SITE_URL || window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        if (message) message.textContent = "Share sheet opened.";
      } else {
        await navigator.clipboard.writeText(shareData.url);
        if (message) message.textContent = "Share isn't supported here — link copied instead.";
      }
    } catch (error) {
      if (error?.name !== "AbortError" && message) {
        message.textContent = "Share cancelled.";
      }
    }
  });

  document.addEventListener("click", event => {
    const link = event.target.closest('[data-install-unavailable="true"]');
    if (!link) return;

    event.preventDefault();
    const supportUrl = cfg.SUPPORT_URL;
    if (supportUrl) window.open(supportUrl, "_blank", "noopener,noreferrer");
  });
})();
