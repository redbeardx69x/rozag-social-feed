RoZAG Social Hub — OLDER ROZAG STYLE
=======================================

This package restores the older black/deep-red RoZAG gaming aesthetic while
keeping the newer status functionality.

Files:
- index.html
- styles.css
- app.js
- config.js

Upload all four files to:
  /home/coolvets/domains/rozag.coolvetspaces.com/public_html/website/

Status endpoint:
  https://rozag.coolvetspaces.com/api/status

The page polls every 15 seconds.

IMPORTANT:
The current /api/status backend only exposes the Discord bot heartbeat unless
the backend has been extended with:
{
  "services": {
    "youtube": {"status":"online"},
    "tiktok": {"status":"online"},
    "twitch": {"status":"online"}
  }
}

Therefore this frontend will NOT invent platform health. YouTube/TikTok/Twitch
will remain "Checking…" until the backend supplies those states.

The visual direction is based on the earlier RoZAG Social Hub design:
black/deep-red gaming aesthetic, sharp typography, red accents, status card,
five-feature strip, and platform feature cards.
