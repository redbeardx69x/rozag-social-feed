# RoZAG Social Hub — GitHub Pages Website

The official RoZAG Social Hub public website for GitHub Pages.

## Repository

GitHub repository:

`https://github.com/redbeardx69x/rozag-social-feed`

Live website:

`https://redbeardx69x.github.io/rozag-social-feed/`

## Upload

Upload the complete contents of this package to the root of the
`rozag-social-feed` repository.

The package includes:

- `index.html`
- `about.html`
- `contact.html`
- `terms.html`
- `privacy.html`
- `app.js`
- `config.js`
- `styles.css`
- `favicon.ico`
- `rozag-logo.png`

Keep any existing TikTok verification file in the repository if TikTok
is using it for app verification.

## Website configuration

The public website is already configured to use the RoZAG backend:

`https://rozag.coolvetspaces.com/api/status`

The Discord installation URL and support Discord are also configured in
`config.js`.

Do not place any private credentials in this repository.

Never store:

- Discord bot tokens
- TikTok client secrets
- OAuth refresh tokens
- Twitch client secrets
- Database credentials
- Other private API credentials

## Discord

The website's Discord buttons open the RoZAG Social Hub installation
flow in a new browser tab.

Support is provided through the RoZAG Discord Support Group:

`https://discord.gg/DhbnqFHH`

The support link also opens in a new tab.

## Platform status

The website displays independent status information for:

- YouTube
- TikTok
- Twitch
- Discord Bot

Platform status is retrieved from the RoZAG backend rather than being
hard-coded into the website.

## GitHub Pages paths

This website is designed to run from the repository path:

`/rozag-social-feed/`

Website assets therefore use relative paths such as:

`./styles.css`

`./app.js`

`./config.js`

`./favicon.ico`

`./rozag-logo.png`

This is important because GitHub Pages project sites do not serve these
files from the domain root.

## Favicon

`favicon.ico` is included in the package and is referenced by the
website.

## Security

The GitHub Pages repository contains only public frontend configuration.

Never commit secrets or credentials to GitHub.
