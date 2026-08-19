# RoZAG Social Hub — GitHub Pages website

This package is the polished RoZAG Social Hub public website designed for GitHub Pages.

## Upload

Replace the existing website files in the repository with the contents of this folder. Keep the TikTok verification file from the current repository if TikTok is still using it; this package does not overwrite that file.

## Important configuration

Edit `config.js` before publishing if your backend's public read-only status endpoint is not:

`https://rozag.coolvetspaces.com/api/status`

Also replace `YOUR_DISCORD_CLIENT_ID` in `index.html` with the actual Discord application client ID. Never put bot tokens, OAuth secrets, refresh tokens or database credentials in this repository.

## Support

The site uses the current RoZAG Social Hub support invite:

https://discord.gg/rJFUWAGWHH

## Share controls

The share panel includes Discord/native share, X/Twitter, Facebook, Reddit, WhatsApp and Copy Link. The native Discord button uses the browser/device share sheet when available.
