RoZAG Social Hub — Replicated Landing Page
==============================================

This package recreates the visual direction shown in the supplied RoZAG
reference: black/red gaming aesthetic, large two-line hero, right-side
service status card, feature strip, supported platform strip and footer.

Upload:
  index.html
  styles.css
  app.js
  config.js

to:
  /home/coolvets/domains/rozag.coolvetspaces.com/public_html/website/

Status API:
  https://rozag.coolvetspaces.com/api/status

The frontend will use the Discord bot heartbeat immediately. YouTube/TikTok/
Twitch status rows become authoritative when the backend returns:

{
  "services": {
    "youtube": {"status": "online"},
    "tiktok": {"status": "online"},
    "twitch": {"status": "error"}
  }
}

No platform status is fabricated by the frontend.
