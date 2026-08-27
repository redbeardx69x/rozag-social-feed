# RoZAG Social Hub website replacements

Replace these four files in the GitHub Pages repository:

- `index.html`
- `app.js`
- `config.js`
- `style.css`

Keep your existing:
- `favicon.ico`
- `assets/rozag-logo.png`
- `about.html`
- `contact.html`
- `privacy.html`
- `terms.html`
- TikTok verification file

## Important

`config.js` points the status page at:

`https://rozag.coolvetspaces.com/api/status`

The website does not need an `api.js` file.

The Discord install buttons require the Discord application's **Discord client/application ID**. The Kick client ID is NOT the Discord ID. Put the Discord ID in `DISCORD_CLIENT_ID` in `config.js`.

Until that is supplied, clicking Add to Discord opens the RoZAG support Discord instead of a broken placeholder URL.

The platform status row consumes the gateway's `platforms` object when present and falls back to the bot health so a healthy gateway does not incorrectly show every platform as unavailable.


## Notes for this revision

- The **Add to Discord** buttons now use the RoZAG Discord application client ID configured in `config.js`; they no longer fall back to the support server when the ID is present.
- The site logo references the root-level `rozag-logo.png` file, not `assets/rozag-logo.png`. Keep `rozag-logo.png` in the repository root.
- Keep `favicon.ico` in the repository root.
