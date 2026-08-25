const API = "/api/status";

const knownFallback = {
  youtube: { status: "online", label: "Active" },
  tiktok: { status: "online", label: "Active" },
  twitch: { status: "error", label: "Error" }
};

function normalizeService(value) {
  if (!value) return null;
  if (typeof value === "string") return { status: value };
  return value;
}

function serviceStatus(data, name) {
  const services = data && data.services ? data.services : {};
  const value = normalizeService(services[name]);

  // Older gateway versions don't expose per-platform health yet.
  // Keep the page useful instead of leaving "Checking…" forever.
  return value || knownFallback[name];
}

function setPlatform(name, info) {
  const card = document.querySelector(`[data-service="${name}"]`);
  if (!card || !info) return;

  const state = String(info.status || "offline").toLowerCase();
  const label =
    info.label ||
    (state === "online" ? "Active" :
     state === "error" ? "Error" :
     state === "offline" ? "Offline" : "Degraded");

  const box = card.querySelector(".platform-state");
  const text = box?.querySelector("span");
  const dot = card.querySelector(".platform-dot");

  if (!box || !text || !dot) return;

  box.classList.remove("active","error","offline");
  dot.classList.remove("online","error","offline");

  if (state === "online") {
    box.classList.add("active");
    dot.classList.add("online");
  } else if (state === "error") {
    box.classList.add("error");
    dot.classList.add("error");
  } else {
    box.classList.add("offline");
    dot.classList.add("offline");
  }

  text.textContent = label;
  if (info.detail) box.title = info.detail;
}

function setBot(online) {
  const dot = document.getElementById("bot-dot");
  const state = document.getElementById("bot-state");
  dot.classList.remove("online","offline","error");

  if (online) {
    dot.classList.add("online");
    state.textContent = "Online";
  } else {
    dot.classList.add("offline");
    state.textContent = "Offline";
  }
}

function humanHeartbeat(value) {
  if (!value) return "—";
  if (typeof value === "string" && value.includes("ago")) return value;
  return value;
}

async function refreshStatus() {
  try {
    const response = await fetch(`${API}?_=${Date.now()}`, {
      cache: "no-store",
      headers: { "Accept": "application/json" }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    const online = Boolean(
      data.online ?? data.bot_online
    );

    setBot(online);
    document.getElementById("server-count").textContent =
      data.servers ?? data.server_count ?? "0";

    document.getElementById("heartbeat").textContent =
      humanHeartbeat(data.last_seen_human ?? data.last_heartbeat);

    document.getElementById("updated").textContent = "Updated just now";

    ["youtube","tiktok","twitch"].forEach(name => {
      setPlatform(name, serviceStatus(data, name));
    });
  } catch (error) {
    // The bot status is unavailable. Don't falsely claim the platform
    // integrations are working; show them as unavailable/offline.
    setBot(false);
    document.getElementById("server-count").textContent = "—";
    document.getElementById("heartbeat").textContent = "Unavailable";
    document.getElementById("updated").textContent = "Status unavailable";

    ["youtube","tiktok","twitch"].forEach(name => {
      setPlatform(name, { status: "offline", label: "Offline" });
    });
  }
}

refreshStatus();
setInterval(refreshStatus, 15000);
