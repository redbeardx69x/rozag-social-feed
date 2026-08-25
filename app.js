(() => {
  const cfg = window.ROZAG_CONFIG || {};
  const endpoint = cfg.STATUS_ENDPOINT || "/api/status";
  const refreshMs = Number(cfg.REFRESH_MS || 15000);

  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));

  const normalise = (value) => {
    const v = String(value || "").toLowerCase();
    if (["online","active","enabled","ok","healthy"].includes(v)) return "online";
    if (["degraded","pending","starting","warning"].includes(v)) return "degraded";
    if (["error","failed","failure"].includes(v)) return "error";
    if (["offline","disabled","down"].includes(v)) return "offline";
    return "unknown";
  };

  const label = (kind) => ({
    online: "Online",
    degraded: "Degraded",
    error: "Error",
    offline: "Offline",
    unknown: "Checking…"
  }[kind] || "Checking…");

  const setService = (name, raw) => {
    const kind = normalise(raw?.status ?? raw);
    const row = document.querySelector(`[data-service="${name}"]`);
    if (!row) return;

    const state = row.querySelector(".service-state");
    const detail = row.querySelector(".service-detail");
    const dot = row.querySelector(".service-dot");

    row.dataset.state = kind;
    if (state) state.textContent = label(kind);
    if (dot) dot.className = `service-dot ${kind}`;
    if (detail && raw?.detail) detail.textContent = raw.detail;
  };

  const formatHeartbeat = (value) => {
    if (!value) return "No heartbeat yet";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    const seconds = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
    if (seconds < 10) return "just now";
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const setTopStatus = (kind, text) => {
    const badge = document.querySelector("#overall-status");
    if (!badge) return;
    badge.className = `overall-status ${kind}`;
    badge.innerHTML = `<span class="service-dot ${kind}"></span>${esc(text)}`;
  };

  async function refresh() {
    try {
      const res = await fetch(endpoint, {
        cache: "no-store",
        headers: { "Accept": "application/json" }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      // Existing API compatibility: Discord bot heartbeat.
      const discordOnline =
        data.online === true ||
        data.bot_online === true ||
        data.status === "online";

      setService("discord", {
        status: discordOnline ? "online" : "offline",
        detail: `${data.servers ?? data.server_count ?? 0} server(s)`
      });

      const services = data.services || {};
      ["youtube", "tiktok", "twitch", "website"].forEach(name => {
        if (services[name]) {
          setService(name, services[name]);
        }
      });

      const serverEl = document.querySelector("#server-count");
      const heartbeatEl = document.querySelector("#heartbeat");
      const updatedEl = document.querySelector("#status-updated");

      if (serverEl) serverEl.textContent = data.servers ?? data.server_count ?? "—";
      if (heartbeatEl) heartbeatEl.textContent =
        data.last_seen_human || formatHeartbeat(data.last_heartbeat || data.last_seen);

      // Overall status is deliberately based on real service states when
      // the backend supplies them. Until then, only the Discord heartbeat
      // is considered authoritative.
      const kinds = ["youtube", "tiktok", "twitch"].map(n =>
        document.querySelector(`[data-service="${n}"]`)?.dataset.state || "unknown"
      );

      if (kinds.includes("error")) setTopStatus("error", "Attention required");
      else if (kinds.includes("degraded")) setTopStatus("degraded", "Partially degraded");
      else if (discordOnline) setTopStatus("online", "Operational");
      else setTopStatus("offline", "Discord bot offline");

      if (updatedEl) {
        updatedEl.textContent = `Checked ${new Date().toLocaleTimeString([], {
          hour: "2-digit", minute: "2-digit", second: "2-digit"
        })}`;
      }
    } catch (error) {
      setTopStatus("error", "Status API unavailable");
      document.querySelector("#status-updated")?.replaceChildren(
        document.createTextNode("Could not reach status API")
      );
      console.warn("RoZAG status request failed:", error);
    }
  }

  refresh();
  setInterval(refresh, refreshMs);

  // Sharing
  const siteUrl = cfg.SITE_URL || window.location.href;
  const title = "RoZAG Social Hub — Social feeds, built for Discord.";
  const encodedUrl = encodeURIComponent(siteUrl);
  const encodedTitle = encodeURIComponent(title);

  document.querySelectorAll("[data-share-link]").forEach(el => {
    const type = el.dataset.shareLink;
    const map = {
      x: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      reddit: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
      whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`
    };
    el.href = map[type] || "#";
  });

  document.querySelector('[data-share="copy"]')?.addEventListener("click", async () => {
    const msg = document.querySelector("#share-message");
    try {
      await navigator.clipboard.writeText(siteUrl);
      if (msg) msg.textContent = "Link copied!";
    } catch {
      if (msg) msg.textContent = "Copy failed — use the address bar.";
    }
  });
})();
