RoZAG Social Hub website package
==================================

Upload all files in this folder to the website root:

index.html
about.html
contact.html
terms.html
privacy.html
app.js
config.js
styles.css
favicon.ico
rozag-logo.png

The pages are linked to one another and all Discord install/support buttons
open in a new tab.

Configuration:
- API: https://rozag.coolvetspaces.com/api/status
- Discord install: production RoZAG application invite
- Support: https://discord.gg/DhbnqFHH

IMPORTANT BACKEND NOTE:
The public gateway must serve the website's static files (including
styles.css, app.js, config.js and favicon.ico) if the gateway is also the
web host. The gateway status endpoint must remain available at /api/status.
The current gateway code already exposes the richer status payload fields
used by this website.
