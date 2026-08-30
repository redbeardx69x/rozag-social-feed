import os
import secrets
from functools import wraps
from urllib.parse import urlencode

import requests
from flask import Flask, jsonify, redirect, request, session
from flask_cors import CORS

app = Flask(__name__)

# Dashboard test credentials: /dashboard/var/.VARIABLE_NAME
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
VAR_DIR = os.path.join(BASE_DIR, "var")


def read_var_file(name, default=""):
    try:
        with open(os.path.join(VAR_DIR, f".{name}"), "r", encoding="utf-8") as f:
            return f.read().strip()
    except (FileNotFoundError, OSError):
        return default


def setting(name, default=""):
    value = os.environ.get(name)
    return value.strip() if value else read_var_file(name, default)


app.secret_key = setting("DASHBOARD_SESSION_SECRET", secrets.token_urlsafe(64))

FRONTEND_URL = setting(
    "DASHBOARD_FRONTEND_URL",
    "https://redbeardx69x.github.io/rozag-social-feed/rozag-dashboard-test/",
).rstrip("/")

OAUTH_REDIRECT_URI = setting(
    "DISCORD_REDIRECT_URI",
    "https://rozag.coolvetspaces.com/dashboard/callback",
)

DISCORD_CLIENT_ID = setting("DISCORD_CLIENT_ID")
DISCORD_CLIENT_SECRET = setting("DISCORD_CLIENT_SECRET")

DISCORD_API = "https://discord.com/api/v10"
DISCORD_AUTHORIZE = f"{DISCORD_API}/oauth2/authorize"
DISCORD_TOKEN = f"{DISCORD_API}/oauth2/token"
DISCORD_ME = f"{DISCORD_API}/users/@me"
DISCORD_GUILDS = f"{DISCORD_API}/users/@me/guilds"

ADMINISTRATOR = 0x8
MANAGE_GUILD = 0x20

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": [FRONTEND_URL],
            "supports_credentials": True,
        }
    },
)

app.config.update(
    SESSION_COOKIE_NAME="rozag_dashboard_test",
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="None",
    SESSION_COOKIE_PATH="/",
)


def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not session.get("discord_user"):
            return jsonify(
                {"authenticated": False, "error": "not_authenticated"}
            ), 401
        return fn(*args, **kwargs)

    return wrapper


def discord_headers(token):
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }


def get_manageable_guilds(token):
    response = requests.get(
        DISCORD_GUILDS,
        headers=discord_headers(token),
        timeout=15,
    )

    if response.status_code == 401:
        return None, 401

    if not response.ok:
        return None, response.status_code

    manageable = []

    for guild in response.json():
        try:
            permissions = int(guild.get("permissions", "0"))
        except (TypeError, ValueError):
            permissions = 0

        admin = bool(permissions & ADMINISTRATOR)
        manage = bool(permissions & MANAGE_GUILD)

        if admin or manage:
            manageable.append(
                {
                    "id": guild.get("id"),
                    "name": guild.get("name"),
                    "icon": guild.get("icon"),
                    "owner": bool(guild.get("owner")),
                    "administrator": admin,
                    "manage_guild": manage,
                }
            )

    manageable.sort(key=lambda x: (x.get("name") or "").lower())
    return manageable, 200


@app.get("/")
def root():
    return "RoZAG Dashboard TEST backend is running."


@app.get("/health")
def health():
    return jsonify(
        {
            "ok": True,
            "service": "rozag-dashboard-test",
            "discord_oauth_configured": bool(
                DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET
            ),
        }
    )


@app.get("/login")
def login():
    if not DISCORD_CLIENT_ID or not DISCORD_CLIENT_SECRET:
        return jsonify(
            {"ok": False, "error": "discord_oauth_not_configured"}
        ), 500

    state = secrets.token_urlsafe(32)
    session["oauth_state"] = state

    params = {
        "client_id": DISCORD_CLIENT_ID,
        "response_type": "code",
        "redirect_uri": OAUTH_REDIRECT_URI,
        "scope": "identify guilds",
        "state": state,
        "prompt": "consent",
    }

    return redirect(f"{DISCORD_AUTHORIZE}?{urlencode(params)}")


@app.get("/callback")
def callback():
    if request.args.get("error"):
        return redirect(f"{FRONTEND_URL}/?oauth_error=discord_denied")

    code = request.args.get("code")
    state = request.args.get("state")
    expected = session.pop("oauth_state", None)

    if (
        not code
        or not state
        or not expected
        or not secrets.compare_digest(state, expected)
    ):
        return redirect(f"{FRONTEND_URL}/?oauth_error=invalid_oauth_state")

    response = requests.post(
        DISCORD_TOKEN,
        data={
            "client_id": DISCORD_CLIENT_ID,
            "client_secret": DISCORD_CLIENT_SECRET,
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": OAUTH_REDIRECT_URI,
        },
        headers={"Accept": "application/json"},
        timeout=15,
    )

    if not response.ok:
        app.logger.error(
            "Discord token exchange failed: HTTP %s",
            response.status_code,
        )
        return redirect(f"{FRONTEND_URL}/?oauth_error=token_exchange_failed")

    token = response.json().get("access_token")

    if not token:
        return redirect(f"{FRONTEND_URL}/?oauth_error=no_access_token")

    me = requests.get(
        DISCORD_ME,
        headers=discord_headers(token),
        timeout=15,
    )

    if not me.ok:
        return redirect(f"{FRONTEND_URL}/?oauth_error=user_lookup_failed")

    user = me.json()

    session["discord_user"] = {
        "id": user.get("id"),
        "username": user.get("username"),
        "global_name": user.get("global_name"),
        "avatar": user.get("avatar"),
    }

    session["discord_access_token"] = token

    return redirect(FRONTEND_URL + "/")


@app.get("/logout")
def logout():
    session.clear()
    return redirect(FRONTEND_URL + "/")


@app.get("/api/session")
def api_session():
    if not session.get("discord_user"):
        return jsonify({"authenticated": False})

    return jsonify(
        {
            "authenticated": True,
            "user": session["discord_user"],
        }
    )


@app.get("/api/me")
@login_required
def api_me():
    token = session.get("discord_access_token")

    if not token:
        session.clear()
        return jsonify({"authenticated": False}), 401

    manageable, status = get_manageable_guilds(token)

    if manageable is None:
        if status == 401:
            session.clear()
            return jsonify({"authenticated": False}), 401

        return jsonify(
            {"error": "discord_guild_lookup_failed"}
        ), status

    return jsonify(
        {
            "authenticated": True,
            "user": session["discord_user"],
            "servers": manageable,
            "server_count": len(manageable),
            "phase": 2,
            "read_only": True,
        }
    )


@app.get("/api/server/<guild_id>")
@login_required
def api_server(guild_id):
    """
    Phase 2 server-detail endpoint.

    This endpoint verifies that the logged-in Discord user can manage
    the requested server before returning its basic Discord metadata.

    It intentionally does NOT modify Discord or RoZAG configuration.
    """

    token = session.get("discord_access_token")

    if not token:
        session.clear()
        return jsonify({"authenticated": False}), 401

    manageable, status = get_manageable_guilds(token)

    if manageable is None:
        if status == 401:
            session.clear()
            return jsonify({"authenticated": False}), 401

        return jsonify(
            {"error": "discord_guild_lookup_failed"}
        ), status

    guild = next(
        (g for g in manageable if str(g.get("id")) == str(guild_id)),
        None,
    )

    if guild is None:
        return jsonify(
            {
                "error": "server_not_found",
                "message": "You do not have management access to this server.",
            }
        ), 403

    return jsonify(
        {
            "authenticated": True,
            "phase": 2,
            "read_only": True,
            "server": {
                "id": guild.get("id"),
                "name": guild.get("name"),
                "icon": guild.get("icon"),
                "owner": guild.get("owner"),
                "administrator": guild.get("administrator"),
                "manage_guild": guild.get("manage_guild"),
                "access": (
                    "Server Owner"
                    if guild.get("owner")
                    else (
                        "Administrator"
                        if guild.get("administrator")
                        else "Manage Server"
                    )
                ),
                "rozag_status": "Connected",
            },
            "social_integrations": {
                "youtube": {"available": True, "state": "Available"},
                "tiktok": {"available": True, "state": "Available"},
                "twitch": {"available": True, "state": "Available"},
                "kick": {"available": True, "state": "Available"},
            },
        }
    )


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=int(os.environ.get("PORT", "8080")),
    )
