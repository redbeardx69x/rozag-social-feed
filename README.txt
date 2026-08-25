RoZAG Social Hub — EXACT STYLE RECREATION
=============================================

This version was recreated from the supplied RoZAG reference image.

It intentionally keeps the reference layout:
- 88px black navigation bar
- RoZAG logo at left
- centered navigation
- red Add to Discord button
- large two-line hero on the left
- red/orange eyebrow
- large dark rounded status card on the right
- RoZAG logo artwork inside the status card
- four service rows
- server count and heartbeat rows
- lower feature strip
- supported platform strip
- dark footer

The supplied reference logos are included in assets/.

Upload:
  index.html
  styles.css
  app.js
  config.js
  assets/

to:
  /home/coolvets/domains/rozag.coolvetspaces.com/public_html/website/

Status endpoint:
  https://rozag.coolvetspaces.com/api/status

The frontend does not fabricate YouTube/TikTok/Twitch status.
Those become live once the backend returns:
{
  "services": {
    "youtube": {"status":"online"},
    "tiktok": {"status":"online"},
    "twitch": {"status":"error"}
  }
}
