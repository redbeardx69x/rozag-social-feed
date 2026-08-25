RoZAG Social Hub — reference-style website

This version intentionally restores the supplied reference image as the visual
baseline.

The large status card ONLY shows:
- Discord Bot
- Servers connected
- Last heartbeat

YouTube/TikTok/Twitch are represented in the Supported Platforms section below
the hero, so the hero remains visually clean like the reference.

Upload:
  index.html
  style.css
  app.js
  assets/

to:
  /home/coolvets/domains/rozag.coolvetspaces.com/public_html/website/

The page reads Discord bot status from:
  /api/status

The platform cards currently display the known states:
  YouTube: Active
  TikTok: Active
  Twitch: Error
  Kick/Instagram/X: Coming Soon

When the backend exposes live platform status, those cards can be wired to it
without changing the reference layout.
