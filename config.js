/*
  RoZAG Social Hub public-site configuration.

  STATUS_ENDPOINT must be the PUBLIC, read-only status endpoint exposed by
  the RoZAG backend. If your current backend uses a different path, change
  only this value.

  Do not put Discord tokens, API keys, OAuth secrets, or database credentials
  in this file.
*/
window.ROZAG_CONFIG = {
  STATUS_ENDPOINT: "https://rozag.coolvetspaces.com/api/status",
  SUPPORT_URL: "https://discord.gg/rJFUWAGWHH",
  DISCORD_INVITE_URL: "https://discord.com/oauth2/authorize?client_id=YOUR_DISCORD_CLIENT_ID&permissions=0&scope=bot%20applications.commands",
  SITE_URL: "https://redbeardx69x.github.io/rozag-social-feed/"
};
