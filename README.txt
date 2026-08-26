ROZAG SOCIAL HUB — GITHUB PAGES DEPLOYMENT
===============================================

Repository:
  redbeardx69x.github.io/rozag-social-feed/

Upload ALL files in this package to the repository root.

Important fixes in this version:
- All website assets use relative paths (./styles.css, ./app.js, etc.).
- Internal page links use explicit .html files, which works on GitHub Pages.
- config.js now exports window.ROZAG_CONFIG correctly.
- The frontend status API points to:
    https://rozag.coolvetspaces.com/api/status
- Discord install and support links open in a new tab.
- favicon.ico and rozag-logo.png are included.

The GitHub Pages frontend does NOT contain platform credentials or secrets.
