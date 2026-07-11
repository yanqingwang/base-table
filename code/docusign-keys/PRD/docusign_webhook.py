#!/usr/bin/env python3
"""
DocuSign Connect Webhook Receiver — PRD.

Thin Flask wrapper that delegates HMAC verification and event parsing
to :mod:`docusign_lib.webhook_handler` and uses :class:`TrackingDb` for
all database operations.

Endpoints:
    GET  /                         — Health check
    GET  /auth/callback            — OAuth consent callback (HTML success page)
    POST /webhooks/docusign        — Connect event receiver
    POST /webhooks/docusign/verify — Connect configuration validation

Usage:
    python docusign_webhook.py
"""

from __future__ import annotations

import json
import logging
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

# ---------------------------------------------------------------------------
# Path bootstrap — make ``docusign-keys/`` importable
# ---------------------------------------------------------------------------

_SCRIPT_DIR: Path = Path(__file__).resolve().parent
_PROJECT_DIR: Path = _SCRIPT_DIR.parent
if str(_PROJECT_DIR) not in sys.path:
    sys.path.insert(0, str(_PROJECT_DIR))

# ---------------------------------------------------------------------------
# Environment bootstrap — load ``.env`` before anything else
# ---------------------------------------------------------------------------

from docusign_lib.config import load_env_file, get_tracking_db_path
from docusign_lib.tracking_db import TrackingDb
from docusign_lib.webhook_handler import (
    get_hmac_secret,
    parse_docusign_event,
    verify_hmac_signature,
)

_ENV_PATH: Path = _SCRIPT_DIR / ".env"
_env_vars: Dict[str, str] = load_env_file(_ENV_PATH)
for k, v in _env_vars.items():
    os.environ.setdefault(k, v)

# ---------------------------------------------------------------------------
# Flask & logging
# ---------------------------------------------------------------------------

import flask  # noqa: E402
from flask import Flask, Response, jsonify, request  # noqa: E402

app: Flask = Flask(__name__)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("docusign-webhook")

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------

_db: TrackingDb = TrackingDb(get_tracking_db_path("prd"))

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.route("/", methods=["GET"])
def health_check() -> Response:
    """Health check endpoint."""
    return jsonify(
        {
            "status": "ok",
            "service": "docusign-webhook",
            "timestamp": datetime.now(timezone.utc).strftime(
                "%Y-%m-%dT%H:%M:%SZ"
            ),
        }
    )


@app.route("/auth/callback", methods=["GET"])
def auth_callback() -> Response:
    """OAuth consent callback — renders a simple success page."""
    code: str = request.args.get("code", "")
    state: str = request.args.get("state", "")

    log.info(
        "OAuth callback: code=%s..., state=%s",
        code[:10] if code else "(none)",
        state[:20] if state else "(none)",
    )

    html: str = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>DocuSign Auth Callback</title>
    <style>
        body {{ font-family: -apple-system, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; }}
        .success {{ color: #2e7d32; }}
        .info {{ background: #f5f5f5; padding: 10px; border-radius: 4px; }}
    </style>
</head>
<body>
    <h1 class="success">&#10003; Authorization Successful</h1>
    <p>DocuSign OAuth consent received.</p>
    <div class="info">
        <p><strong>Code:</strong> {code[:20] + "..." if code else "None"}</p>
        <p><strong>State:</strong> {state[:30] if state else "None"}</p>
    </div>
    <p>You may close this window and return to the terminal.</p>
</body>
</html>"""
    return Response(html, mimetype="text/html")


@app.route("/webhooks/docusign", methods=["POST"])
def webhook_receiver() -> Response:
    """DocuSign Connect webhook receiver.

    Validates the HMAC SHA-256 signature, parses the event via the shared
    handler, and updates the tracking database.
    """
    raw_body: bytes = request.get_data()

    if not raw_body:
        log.warning("Empty webhook payload")
        return jsonify({"error": "Empty payload"}), 400

    # --- HMAC verification ---
    signature: Optional[str] = request.headers.get("X-DocuSign-Signature-1")

    if not signature:
        log.warning("Missing X-DocuSign-Signature-1 header")
        return jsonify({"error": "Invalid signature"}), 401

    try:
        secret: str = get_hmac_secret("prd")
    except EnvironmentError:
        log.warning("HMAC secret not configured — skipping validation")
        secret = ""

    if secret and not verify_hmac_signature(raw_body, secret, signature):
        log.warning("HMAC signature verification FAILED")
        return jsonify({"error": "Invalid signature"}), 401

    # --- Parse JSON ---
    try:
        payload: Dict[str, Any] = json.loads(raw_body.decode("utf-8"))
    except json.JSONDecodeError as exc:
        log.error("Invalid JSON payload: %s", exc)
        return jsonify({"error": f"Invalid JSON: {exc}"}), 400

    # --- Process event ---
    account_id: str = request.headers.get("X-DocuSign-Account-ID", "")

    try:
        parse_docusign_event(_db, payload, account_id=account_id)
    except Exception as exc:
        log.error("Event processing error: %s", exc)
        return jsonify({"status": "accepted", "error": str(exc)}), 200

    return jsonify({"status": "ok"}), 200


@app.route("/webhooks/docusign/verify", methods=["POST", "GET"])
def webhook_verify() -> Response:
    """Connect configuration validation endpoint.

    DocuSign sends a verification request when setting up a Connect
    configuration.  Returns the challenge string as plain text.
    """
    challenge: Optional[str] = None

    if request.method == "POST":
        try:
            data: Dict[str, Any] = request.get_json(force=True, silent=True) or {}
            challenge = data.get("challenge") or data.get("x-docusign-challenge")
        except Exception:
            pass

    if not challenge:
        challenge = request.headers.get("X-DocuSign-Challenge")
    if not challenge:
        challenge = request.args.get("challenge", "ok")

    log.info("Connect verification: challenge=%s", challenge)
    return Response(challenge, mimetype="text/plain")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main() -> None:
    """Initialise the database and start the Flask dev server."""
    _db.init_schema()
    log.info("Tracking database ready at %s", get_tracking_db_path("prd"))

    host: str = os.environ.get("WEBHOOK_HOST", "0.0.0.0")
    port: int = int(os.environ.get("WEBHOOK_PORT", "5000"))
    debug: bool = os.environ.get("WEBHOOK_DEBUG", "0") == "1"

    log.info(
        "Starting DocuSign webhook receiver on %s:%s (debug=%s)",
        host,
        port,
        debug,
    )
    app.run(host=host, port=port, debug=debug)


if __name__ == "__main__":
    main()
