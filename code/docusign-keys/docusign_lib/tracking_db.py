"""SQLite tracking database for envelope state and incremental export.

All data (envelope metadata, form data) goes into SQLite.
Files (PDFs, attachments) are stored on disk with paths tracked in SQLite.
"""

from __future__ import annotations

import json
import sqlite3
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional


SCHEMA_VERSION = 3

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS schema_version (
    version     INTEGER PRIMARY KEY,
    applied_at  TEXT NOT NULL DEFAULT (datetime('now')),
    description TEXT
);

CREATE TABLE IF NOT EXISTS envelopes (
    envelope_id       TEXT PRIMARY KEY,
    account_id        TEXT NOT NULL DEFAULT '',
    employee_name     TEXT NOT NULL DEFAULT '',
    employee_email    TEXT NOT NULL DEFAULT '',
    template_id       TEXT NOT NULL DEFAULT '',
    template_name     TEXT DEFAULT '',
    status            TEXT DEFAULT 'created',
    email_subject     TEXT DEFAULT '',
    envelope_type     TEXT DEFAULT 'api',
    created_at        TEXT DEFAULT (datetime('now')),
    sent_at           TEXT,
    completed_at      TEXT,
    error_message     TEXT,
    form_data_json    TEXT,
    raw_recipients_json TEXT,
    bulk_list_id      TEXT,
    batch_id          TEXT,
    updated_at        TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS documents (
    doc_id        INTEGER PRIMARY KEY AUTOINCREMENT,
    envelope_id   TEXT NOT NULL REFERENCES envelopes(envelope_id),
    document_id   TEXT NOT NULL,
    name          TEXT NOT NULL,
    file_path     TEXT,
    file_size     INTEGER,
    file_hash     TEXT,
    downloaded_at TEXT,
    doc_type      TEXT DEFAULT 'attachment'
);

CREATE TABLE IF NOT EXISTS webhook_events (
    event_id        INTEGER PRIMARY KEY AUTOINCREMENT,
    envelope_id     TEXT,
    event_type      TEXT NOT NULL,
    event_timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    raw_payload     TEXT,
    verification    TEXT DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS export_tracking (
    tracking_id        INTEGER PRIMARY KEY AUTOINCREMENT,
    envelope_id        TEXT NOT NULL UNIQUE REFERENCES envelopes(envelope_id),
    export_batch       TEXT NOT NULL,
    exported_at        TEXT NOT NULL DEFAULT (datetime('now')),
    pdf_exported       INTEGER DEFAULT 0,
    form_data_exported INTEGER DEFAULT 0,
    attachments_count  INTEGER DEFAULT 0
);
"""

INDEXES_SQL = """
CREATE INDEX IF NOT EXISTS idx_envelopes_status   ON envelopes(status);
CREATE INDEX IF NOT EXISTS idx_envelopes_email    ON envelopes(employee_email);
CREATE INDEX IF NOT EXISTS idx_envelopes_account  ON envelopes(account_id);
CREATE INDEX IF NOT EXISTS idx_envelopes_template ON envelopes(template_id);
CREATE INDEX IF NOT EXISTS idx_envelopes_created  ON envelopes(created_at);
CREATE INDEX IF NOT EXISTS idx_documents_env      ON documents(envelope_id);
CREATE INDEX IF NOT EXISTS idx_webhook_env        ON webhook_events(envelope_id);
CREATE INDEX IF NOT EXISTS idx_export_env         ON export_tracking(envelope_id);
CREATE INDEX IF NOT EXISTS idx_export_batch       ON export_tracking(export_batch);
CREATE INDEX IF NOT EXISTS idx_envelopes_created_account ON envelopes(account_id, created_at);
CREATE INDEX IF NOT EXISTS idx_export_batch_exported ON export_tracking(export_batch, exported_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_documents_env_doc ON documents(envelope_id, document_id);
"""

MIGRATIONS: Dict[int, str] = {
    2: """ALTER TABLE envelopes ADD COLUMN updated_at TEXT DEFAULT (datetime('now'));""",
    3: """
ALTER TABLE envelopes ADD COLUMN email_subject TEXT DEFAULT '';
ALTER TABLE envelopes ADD COLUMN envelope_type TEXT DEFAULT 'api';
ALTER TABLE envelopes ADD COLUMN raw_recipients_json TEXT;
ALTER TABLE envelopes ADD COLUMN batch_id TEXT;
ALTER TABLE envelopes ADD COLUMN updated_at TEXT DEFAULT (datetime('now'));
CREATE INDEX IF NOT EXISTS idx_envelopes_created_account ON envelopes(account_id, created_at);
CREATE INDEX IF NOT EXISTS idx_export_batch_exported ON export_tracking(export_batch, exported_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_documents_env_doc ON documents(envelope_id, document_id);
""",
}


def _get_existing_columns(conn: sqlite3.Connection, table: str) -> set:
    """Return the set of column names for a table."""
    return {r[1] for r in conn.execute(f"PRAGMA table_info({table})").fetchall()}


class TrackingDb:
    """SQLite tracking database with versioned migrations.

    Args:
        db_path: Path to the SQLite database file.
    """

    def __init__(self, db_path: Path):
        self._db_path = Path(db_path)
        self._db_path.parent.mkdir(parents=True, exist_ok=True)
        self._conn: Optional[sqlite3.Connection] = None

    @property
    def conn(self) -> sqlite3.Connection:
        if self._conn is None:
            self._conn = sqlite3.connect(str(self._db_path))
            self._conn.row_factory = sqlite3.Row
            self._conn.execute("PRAGMA journal_mode=WAL")
            self._conn.execute("PRAGMA foreign_keys=ON")
        return self._conn

    def close(self) -> None:
        if self._conn is not None:
            self._conn.close()
            self._conn = None

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()

    def init_schema(self) -> None:
        """Create schema and apply any pending migrations."""
        c = self.conn
        c.executescript(SCHEMA_SQL)
        c.executescript(INDEXES_SQL)
        c.commit()

        current = 0
        try:
            row = c.execute("SELECT MAX(version) FROM schema_version").fetchone()
            if row and row[0]:
                current = row[0]
        except sqlite3.OperationalError:
            pass

        for version in sorted(MIGRATIONS.keys()):
            if version > current:
                sql = MIGRATIONS[version]
                # Run each statement individually so ALTER TABLE failures
                # (columns already exist from SCHEMA_SQL) don't block indexes
                existing_cols = _get_existing_columns(c, "envelopes")
                for stmt in (s.strip() for s in sql.split(";") if s.strip()):
                    try:
                        c.execute(stmt)
                    except sqlite3.OperationalError:
                        pass  # ignore ALTER TABLE on existing columns
                c.execute(
                    "INSERT OR IGNORE INTO schema_version (version, description) VALUES (?, ?)",
                    (version, f"Migration v{version}"),
                )
                c.commit()

    # ------------------------------------------------------------------
    # Envelope CRUD
    # ------------------------------------------------------------------

    def _now(self) -> str:
        return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    def upsert_envelope(self, data: Dict[str, Any]) -> None:
        """Insert or update an envelope record."""
        data["updated_at"] = self._now()
        cols = [
            "envelope_id", "account_id", "employee_name", "employee_email",
            "template_id", "template_name", "status", "email_subject",
            "envelope_type", "created_at", "sent_at", "completed_at",
            "error_message", "form_data_json", "raw_recipients_json",
            "bulk_list_id", "batch_id", "updated_at",
        ]
        placeholders = ", ".join(f":{c}" for c in cols)
        skip = {"envelope_id", "created_at"}
        update_set = ", ".join(f"{c} = excluded.{c}" for c in cols if c not in skip)
        sql = f"""
            INSERT INTO envelopes ({', '.join(cols)})
            VALUES ({placeholders})
            ON CONFLICT(envelope_id) DO UPDATE SET {update_set}
        """
        row = {c: data.get(c, None) for c in cols}
        self.conn.execute(sql, row)
        self.conn.commit()

    def get_envelope(self, envelope_id: str) -> Optional[Dict[str, Any]]:
        row = self.conn.execute(
            "SELECT * FROM envelopes WHERE envelope_id = ?", (envelope_id,)
        ).fetchone()
        return dict(row) if row else None

    def get_envelopes(
        self, status: Optional[str] = None, template_id: Optional[str] = None,
        account_id: Optional[str] = None, from_date: Optional[str] = None,
        to_date: Optional[str] = None, limit: int = 1000,
    ) -> List[Dict[str, Any]]:
        parts = ["SELECT * FROM envelopes WHERE 1=1"]
        params: list = []
        if status:
            parts.append("AND status = ?"); params.append(status)
        if template_id:
            parts.append("AND template_id = ?"); params.append(template_id)
        if account_id:
            parts.append("AND account_id = ?"); params.append(account_id)
        if from_date:
            parts.append("AND created_at >= ?"); params.append(from_date)
        if to_date:
            parts.append("AND created_at <= ?"); params.append(to_date)
        parts.append("ORDER BY created_at ASC LIMIT ?"); params.append(int(limit))
        return [dict(r) for r in self.conn.execute(" ".join(parts), params).fetchall()]

    def update_status(self, envelope_id: str, status: str, error_message: Optional[str] = None) -> None:
        now = self._now()
        fields = {"status": status, "updated_at": now}
        if error_message:
            fields["error_message"] = error_message
        if status in ("completed", "signed", "delivered"):
            fields["completed_at"] = now
        if status in ("sent", "delivered"):
            fields["sent_at"] = now
        set_clause = ", ".join(f"{k} = ?" for k in fields)
        self.conn.execute(
            f"UPDATE envelopes SET {set_clause} WHERE envelope_id = ?",
            list(fields.values()) + [envelope_id],
        )
        self.conn.commit()

    # ------------------------------------------------------------------
    # Incremental export tracking
    # ------------------------------------------------------------------

    def mark_exported(self, envelope_id: str, batch: str,
                      pdf_exported: bool = False, form_data_exported: bool = False,
                      attachments_count: int = 0) -> None:
        self.conn.execute(
            """INSERT INTO export_tracking
               (envelope_id, export_batch, pdf_exported, form_data_exported, attachments_count)
               VALUES (?, ?, ?, ?, ?)
               ON CONFLICT(envelope_id) DO UPDATE SET
                   export_batch=excluded.export_batch, pdf_exported=excluded.pdf_exported,
                   form_data_exported=excluded.form_data_exported,
                   attachments_count=excluded.attachments_count,
                   exported_at=datetime('now')
            """,
            (envelope_id, batch, int(pdf_exported), int(form_data_exported), attachments_count),
        )
        self.conn.commit()

    def is_exported(self, envelope_id: str) -> bool:
        row = self.conn.execute(
            "SELECT 1 FROM export_tracking WHERE envelope_id = ?", (envelope_id,)
        ).fetchone()
        return row is not None

    def get_unexported_envelopes(self, account_id: Optional[str] = None) -> List[Dict[str, Any]]:
        parts = [
            "SELECT e.* FROM envelopes e",
            "LEFT JOIN export_tracking et ON e.envelope_id = et.envelope_id",
            "WHERE et.envelope_id IS NULL",
        ]
        params: list = []
        if account_id:
            parts.append("AND e.account_id = ?"); params.append(account_id)
        parts.append("ORDER BY e.created_at ASC")
        return [dict(r) for r in self.conn.execute(" ".join(parts), params).fetchall()]

    def get_export_stats(self) -> Dict[str, int]:
        total = self.conn.execute("SELECT COUNT(*) FROM envelopes").fetchone()[0]
        exported = self.conn.execute("SELECT COUNT(*) FROM export_tracking").fetchone()[0]
        return {"total_envelopes": total, "exported": exported, "pending": total - exported}

    # ------------------------------------------------------------------
    # Document tracking
    # ------------------------------------------------------------------

    def record_document(self, envelope_id: str, document_id: str, name: str,
                        file_path: Optional[str] = None, file_size: Optional[int] = None,
                        file_hash: Optional[str] = None, doc_type: str = "attachment") -> None:
        now = self._now()
        self.conn.execute(
            """INSERT OR REPLACE INTO documents
               (envelope_id, document_id, name, file_path, file_size, file_hash, downloaded_at, doc_type)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (envelope_id, document_id, name, file_path, file_size, file_hash, now, doc_type),
        )
        self.conn.commit()

    def get_documents(self, envelope_id: str) -> List[Dict[str, Any]]:
        return [dict(r) for r in self.conn.execute(
            "SELECT * FROM documents WHERE envelope_id = ? ORDER BY doc_id", (envelope_id,)
        ).fetchall()]

    # ------------------------------------------------------------------
    # Form data
    # ------------------------------------------------------------------

    def store_form_data(self, envelope_id: str, form_data: Dict[str, str]) -> None:
        self.conn.execute(
            "UPDATE envelopes SET form_data_json = ?, updated_at = datetime('now') WHERE envelope_id = ?",
            (json.dumps(form_data, ensure_ascii=False), envelope_id),
        )
        self.conn.commit()

    def get_form_data(self, envelope_id: str) -> Optional[Dict[str, str]]:
        row = self.conn.execute(
            "SELECT form_data_json FROM envelopes WHERE envelope_id = ?", (envelope_id,)
        ).fetchone()
        return json.loads(row[0]) if row and row[0] else None

    # ------------------------------------------------------------------
    # Batch
    # ------------------------------------------------------------------

    def get_batch_id(self) -> str:
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        return f"{ts}_{int(time.time() * 1000) % 10000:04d}"
