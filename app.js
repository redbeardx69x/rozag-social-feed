(() => {
  const cfg = window.ROZAG_CONFIG || {};
  const statusEl = document.querySelector("#bot-status");
  const serverEl = document.querySelector("#server-count");
  const heartbeatEl = document.querySelector("#heartbeat");
  const updatedEl = document.querySelector("#status-updated");
  const siteUrl = cfg.SITE_URL || window.location.href;

  const escapeHtml = s => String(s ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

  function setStatus(kind, label) {
    const dot = kind === "online" ? "dot-green" : kind === "offline" ? "dot-red" : "dot-amber";
    statusEl.innerHTML = `<i class="dot ${dot}"></i> ${escapeHtml(label)}`;
  }

  function formatHeartbeat(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    const seconds = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  async function refreshStatus() {
    if (!cfg.STATUS_ENDPOINT) {
      setStatus("amber", "Not configured");
      updatedEl.textContent = "Status endpoint not configured";
      return;
    }
    try {
      const res = await fetch(cfg.STATUS_ENDPOINT, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const online = data.online ?? data.bot_online ?? data.status === "online";
      setStatus(online ? "online" : "offline", online ? "Online" : "Offline");
      serverEl.textContent = data.servers ?? data.server_count ?? data.guilds ?? "—";
      heartbeatEl.textContent = formatHeartbeat(data.last_heartbeat ?? data.heartbeat ?? data.lastHeartbeat);
      updatedEl.textContent = "Updated just now";
    } catch (err) {
      setStatus("offline", "Unavailable");
      updatedEl.textContent = "Status service unavailable";
    }
  }

  refreshStatus();
  setInterval(refreshStatus, 15000);

  document.querySelectorAll("[data-share-link]").forEach(el => {
    const enc = encodeURIComponent(siteUrl);
    const title = encodeURIComponent("RoZAG Social Hub — Social feeds, built for Discord.");
    const map = {
      x: `https://twitter.com/intent/tweet?url=${enc}&text=${title}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${enc}`,
      reddit: `https://www.reddit.com/submit?url=${enc}&title=${title}`,
      whatsapp: `https://wa.me/?text=${title}%20${enc}`
    };
    el.href = map[el.dataset.shareLink] || "#";
  });

  document.querySelector('[data-share="copy"]')?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(siteUrl);
      document.querySelector("#share-message").textContent = "Link copied!";
    } catch {
      document.querySelector("#share-message").textContent = "Copy failed — select the address bar instead.";
    }
  });

  document.querySelector('[data-share="native"]')?.addEventListener("click", async () => {
    const shareData = {
      title: "RoZAG Social Hub",
      text: "Social feeds, built for Discord.",
      url: siteUrl
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        document.querySelector("#share-message").textContent = "Share sheet opened.";
      } else {
        await navigator.clipboard.writeText(siteUrl);
        document.querySelector("#share-message").textContent = "Share isn't supported here — link copied instead.";
      }
    } catch (err) {
      if (err?.name !== "AbortError") document.querySelector("#share-message").textContent = "Share cancelled.";
    }
  });
})();
