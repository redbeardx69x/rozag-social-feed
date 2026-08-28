RoZAG Server Dashboard — TEST ONLY

This folder is intentionally separate from the production website.

Frontend:
- index.html
- app.js
- config.js
- rozag-logo.png

The frontend expects a future backend at:
https://rozag.coolvetspaces.com/dashboard-test/

The backend must implement Discord OAuth2 and return /dashboard-test/api/me as:
{
  "authenticated": true,
  "user": {"id":"...","username":"...","global_name":"..."},
  "guilds": [{"id":"...","name":"...","icon_emoji":"🏴‍☠️"}]
}

Do not put the Discord client secret in this folder or in GitHub Pages.
