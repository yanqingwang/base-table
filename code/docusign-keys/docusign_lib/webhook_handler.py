"""Shared webhook handler for DocuSign Connect events.

Provides HMAC verification, event parsing, and webhook event tracking
for both PRD and DEV DocuSign Connect webhook receivers.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import logging
from pathlib import Path
from typing import Any, Dict, Optional

from .config import build_env_config, load_env_file
from .tracking_db import TrackingDb

log = logging.getLogger("docusign-webhook")


# ---------------------------------------------------------------------------
# HMAC secret & signature verification
# ---------------------------------------------------------------------------


def get_hmac_secret(env_name: str) -> str:
    """Read the HMAC secret from the environment's ``.env`` file.

    Args:
        env_name: Environment name (e.g. ``"prd"`` or ``"dev"``).

    Returns:
        The HMAC secret string.

    Raises:
        EnvironmentError: If ``DOCUSIGN_WEBHOOK_HMAC_SECRET`` is not
            configured in the environment's ``.env`` file.
    """
    cfg = build_env_config(env_name)
    env_vars = load_env_file(cfg.dotenv_path)
    secret: str = env_vars.get("DOCUSIGN_WEBHOOK_HMAC_SECRET", "")
    if secret and secret not in ("", "REPLACE_WITH_HMAC_SECRET"):
        return secret
    raise EnvironmentError(
        "DOCUSIGN_WEBHOOK_HMAC_SECRET is not configured. "
        "Set it in the .env file after DocuSign Connect setup."
    )


def verify_hmac_signature(raw_body: bytes, secret: str, signature: str) -> bool:
    """Verify an HMAC SHA-256 signature from a DocuSign Connect request.

    This function is stateless — it operates purely on the passed arguments
    and has no dependency on Flask or any web framework.

    Args:
        raw_body: Raw request body bytes.
        secret: HMAC secret key.
        signature: The signature string from the
            ``X-DocuSign-Signature-1`` header.

    Returns:
        ``True`` if the signature is valid, ``False`` otherwise.
    """
    if not signature or not secret:
        return False
    computed: bytes = hmac.new(
        secret.encode("utf-8"), raw_body, hashlib.sha256
    ).digest()
    computed_b64: str = base64.b64encode(computed).decode("utf-8")
    return hmac.compare_digest(computed_b64, signature)


# ---------------------------------------------------------------------------
# Webhook event DB helpers
# ---------------------------------------------------------------------------


def _ensure_webhook_table(db: TrackingDb) -> None:
    """Create the ``webhook_events`` table if it does not exist yet.

    Idempotent — safe to call repeatedly.
    """
    db.conn.execute("""
        CREATE TABLE IF NOT EXISTS webhook_events (
            event_id         INTEGER PRIMARY KEY AUTOINCREMENT,
            envelope_id      TEXT,
            event_type       TEXT NOT NULL,
            event_timestamp  TEXT NOT NULL DEFAULT (datetime('now')),
            raw_payload      TEXT,
            verification     TEXT
        )
    """)
    db.conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_webhook_events_env "
        "ON webhook_events(envelope_id)"
    )
    db.conn.commit()


def _record_webhook_event(
    db: TrackingDb,
    envelope_id: Optional[str],
    event_type: str,
    raw_payload: str,
    verification: str = "verified",
) -> None:
    """Insert a row into the ``webhook_events`` table.

    Args:
        db: ``TrackingDb`` instance.
        envelope_id: Related envelope ID (may be ``None``).
        event_type: DocuSign event type string.
        raw_payload: Original JSON payload.
        verification: Verification result label.
    """
    db.conn.execute(
        """
        INSERT INTO webhook_events
            (envelope_id, event_type, raw_payload, verification)
        VALUES (?, ?, ?, ?)
        """,
        (envelope_id, event_type, raw_payload, verification),
    )
    db.conn.commit()


# ---------------------------------------------------------------------------
# Event parsing
# ---------------------------------------------------------------------------


def parse_docusign_event(
    db: TrackingDb,
    payload: Dict[str, Any],
    account_id: str = "",
) -> Dict[str, Any]:
    """Parse a DocuSign Connect event and update the tracking database.

    Handles both the legacy XML-Callback format (via parsed JSON) and
    the 2026 Connect event format::

        {
            "event": "envelope-completed",
            "apiVersion": "v2.1",
            "data": {
                "envelopeId": "...",
                "envelopeSummary": {...}
            }
        }

    Args:
        db: ``TrackingDb`` instance for database operations.
        payload: Parsed JSON event payload.
        account_id: Optional account ID used for multi-account isolation.

    Returns:
        A dict ``{envelope_id, status, event_type}`` suitable for logging.
    """
    result: Dict[str, Any] = {
        "envelope_id": None,
        "status": None,
        "event_type": "unknown",
    }

    try:
        event_type: str = payload.get("event", "unknown")
        result["event_type"] = event_type

        # --- 2026 Connect event format ---
        data: Dict[str, Any] = payload.get("data", {})
        envelope_id: Optional[str] = data.get("envelopeId") or payload.get(
            "envelopeId"
        )
        result["envelope_id"] = envelope_id

        # Extract accountId from payload body if not provided via header
        if not account_id:
            account_id = data.get("accountId") or payload.get("accountId", "")

        summary: Optional[Dict[str, Any]] = data.get("envelopeSummary")
        status: Optional[str] = None
        if summary:
            status = summary.get("status")
            if not envelope_id:
                envelope_id = summary.get("envelopeId")
                result["envelope_id"] = envelope_id

        # --- Legacy format (envelopeSummary at top level) ---
        if not summary:
            summary = payload.get("envelopeSummary")
            if summary:
                status = summary.get("status")
                envelope_id = envelope_id or summary.get("envelopeId")
                result["envelope_id"] = envelope_id

        # --- Recipient-level events ---
        if not status:
            recipient_statuses: Optional[list] = data.get(
                "recipientStatuses"
            ) or (summary or {}).get("recipientSignatures")
            if recipient_statuses:
                statuses: set = {r.get("status") for r in recipient_statuses}
                if "completed" in statuses:
                    status = "completed"
                elif "delivered" in statuses:
                    status = "delivered"
                elif "signed" in statuses:
                    status = "signed"

        # Map DocuSign statuses to our canonical set
        status_map: Dict[str, str] = {
            "created": "created",
            "sent": "sent",
            "delivered": "delivered",
            "signed": "signed",
            "completed": "completed",
            "declined": "declined",
            "voided": "voided",
            "expired": "expired",
            "autoresponded": "autoresponded",
        }
        canonical_status: Optional[str] = (
            status_map.get(status) if status else None
        )
        result["status"] = canonical_status

        # Ensure the webhook_events table exists before writing
        _ensure_webhook_table(db)

        if envelope_id and canonical_status:
            db.update_status(envelope_id, canonical_status)
            log.info("Updated envelope %s → %s", envelope_id, canonical_status)
        elif envelope_id:
            log.info(
                "Received event for %s (type=%s, status=%s) — no status update",
                envelope_id,
                event_type,
                status,
            )
        else:
            log.warning(
                "Could not extract envelopeId from event: type=%s",
                event_type,
            )

        _record_webhook_event(
            db=db,
            envelope_id=envelope_id,
            event_type=event_type,
            raw_payload=json.dumps(payload, default=str),
            verification="verified" if canonical_status else "unrecognized",
        )

    except Exception as exc:
        log.error("Failed to process event: %s", exc)
        _ensure_webhook_table(db)
        _record_webhook_event(
            db=db,
            envelope_id=None,
            event_type="parse_error",
            raw_payload=json.dumps(payload, default=str),
            verification=f"error: {exc}",
        )
        raise

    return result
