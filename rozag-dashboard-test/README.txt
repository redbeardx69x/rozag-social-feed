ROZAG DASHBOARD - LOCKED WORKING PHASE 3

GitHub Pages:
  app.js
  config.js

Host Africa:
  app.py

IMPORTANT:
The frontend is hosted at:
  https://redbeardx69.github.io/rozag-social-feed/rozag-dashboard-test/

The browser Origin is:
  https://redbeardx69.github.io

The backend CORS configuration therefore uses the origin only.
Do not change it to the full GitHub Pages path.

The Discord OAuth callback remains:
  https://rozag.coolvetspaces.com/dashboard/callback

The backend keeps:
  - credentialed CORS
  - SameSite=None session cookie
  - stable DASHBOARD_SESSION_SECRET from the Host Africa var/env setting
  - Discord identify + guilds OAuth
  - /api/me manageable-server discovery
  - Phase 3 server data endpoint
  - connected-account lookup through guild_social_accounts -> social_accounts -> creators
  - guild_platforms only for feed routing
