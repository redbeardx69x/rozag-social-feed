FINAL SELF-CONTAINED RoZAG WEBSITE

This version deliberately puts ALL CSS and status JavaScript inside index.html.
That prevents a stale/missing style.css from producing the broken unstyled
feature/platform sections seen in the previous deployment.

Upload:
  index.html
  assets/rozag-logo.png

to:
  /home/coolvets/domains/rozag.coolvetspaces.com/public_html/website/

IMPORTANT:
Replace the old index.html completely. Do not combine it with previous CSS or
JS files.

The large status card contains only:
  Discord Bot
  Servers connected
  Last heartbeat

The platform cards are below the hero:
  YouTube Active
  TikTok Active
  Twitch Error
  Kick Coming Soon
  Instagram Coming Soon
  X Coming Soon

The status card polls /api/status every 15 seconds.
