RoZAG Social Hub website files
================================

Upload these files to:

/home/coolvets/domains/rozag.coolvetspaces.com/public_html/website/

Files:
- index.html
- styles.css
- app.js
- config.js

The existing RoZAG gateway already looks for website/index.html.

IMPORTANT STATUS NOTE
---------------------
The current /api/status endpoint in the deployed backend only exposes the
Discord bot heartbeat (online, servers, last_heartbeat). This website is
already prepared to display independent YouTube, TikTok, Twitch and Website
states when the API returns:

{
  "services": {
    "youtube": {"status":"online","detail":"..."},
    "tiktok":  {"status":"online","detail":"..."},
    "twitch":  {"status":"online","detail":"EventSub enabled"},
    "website": {"status":"online","detail":"..."}
  }
}

Until that backend status object is added, Discord will be authoritative and
the other platform rows will remain in a checking/unknown state rather than
falsely claiming that a platform is healthy.

Twitch deployment
-----------------
The useful hosting-panel feature in the screenshot is "Setup Python App".
The corrected Twitch gateway is a Python WSGI/Passenger application and the
dedicated files are:
- twitch_eventsub_gateway.py
- twitch_eventsub_wsgi.py

Twitch should only be shown as Online after EventSub verification succeeds.
The expected gateway log entries are:
- SIGNATURE VERIFIED
- VERIFICATION CHALLENGE RESPONSE

Do not change the Twitch callback URL:
https://rozag.coolvetspaces.com/twitch/callback
