RoZAG Social Hub website - corrected frontend
===============================================

Files:
  index.html
  style.css
  app.js

Deployment:
  Copy these files into:
    /home/coolvets/domains/rozag.coolvetspaces.com/public_html/website/

The frontend polls:
  /api/status
every 15 seconds.

Expected modern gateway payload:
{
  "online": true,
  "servers": 4,
  "last_seen_human": "just now",
  "services": {
    "youtube": {"status":"online"},
    "tiktok": {"status":"online"},
    "twitch": {"status":"error", "detail":"EventSub verification failed"}
  }
}

Compatibility:
If the current gateway does not yet expose services, the page uses the current
known state as a temporary fallback:
  YouTube = Active
  TikTok  = Active
  Twitch  = Error

Once the gateway exposes services, those live values take priority automatically.

This version intentionally keeps the service statuses OUT of the large hero
status card. The card only contains:
  Discord Bot
  Servers connected
  Last heartbeat

The supported-platform cards are where YouTube/TikTok/Twitch health is shown.
