#!/usr/bin/env python3
"""
DocuSign PRD Web Management Platform — Shared library version.

Refactored to use docusign_lib instead of local auth/config modules.

Usage:
    python -m webapp.app [--port 5000] [--host 0.0.0.0]
"""

from __future__ import annotations

import argparse
import csv
import io
import json
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

import hashlib
import flask

_SCRIPT_DIR = Path(__file__).resolve().parent
PRD_DIR = _SCRIPT_DIR.parent
sys.path.insert(0, str(PRD_DIR.parent))
sys.path.insert(0, str(PRD_DIR))  # for importing PRD scripts

from docusign_lib.auth import DocuSignAuth
from docusign_lib.config import get_tracking_db_path, build_env_config, load_env_file, get_templates_dir
from docusign_lib.tracking_db import TrackingDb

app = flask.Flask(__name__)
_env_vars = load_env_file(PRD_DIR / ".env") if (PRD_DIR / ".env").exists() else {}
app.secret_key = _env_vars.get("FLASK_SECRET_KEY")
if not app.secret_key:
    # 用 `.env` 内容 hash 作为 fallback key，保证同一台机器重启后 session 不失效
    fallback = hashlib.sha256((str(PRD_DIR) + str(PRD_DIR.stat().st_mtime)).encode()).hexdigest()
    app.secret_key = f"auto-{fallback}"

TEMPLATES_DIR = get_templates_dir("prd")


def _human_time(iso_str: str) -> str:
    if not iso_str:
        return ""
    try:
        dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
        return dt.strftime("%Y-%m-%d %H:%M")
    except Exception:
        return iso_str[:19]


def _make_auth(env: str = "prd") -> DocuSignAuth:
    guid = flask.session.get(f"{env}_account_guid", "")
    return DocuSignAuth(env, account_guid=guid)


# ---------------------------------------------------------------------------
# Dashboard / Usage helpers
# ---------------------------------------------------------------------------


def _get_env_summary(auth: DocuSignAuth, days: int = 30, account_name: str = "") -> dict:
    from_date = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")
    try:
        envelopes = auth.get_paginated("/envelopes", params={"from_date": f"{from_date}T00:00:00Z"})
    except Exception:
        envelopes = []
    result = {
        "total": len(envelopes),
        "by_status": {},
        "recent": [],
        "account_name": account_name or auth.account_id,
    }
    for e in envelopes:
        s = e.get("status", "unknown")
        result["by_status"][s] = result["by_status"].get(s, 0) + 1
        sender = e.get("sender", {})
        result["recent"].append({
            "id": e.get("envelopeId", "")[:12] + "...",
            "subject": (e.get("emailSubject", "") or "")[:40],
            "sender": sender.get("userName", sender.get("email", "")) if isinstance(sender, dict) else "",
            "status": e.get("status", ""),
            "created": _human_time(e.get("createdDateTime", "")),
        })
    result["recent"] = sorted(result["recent"], key=lambda x: x["created"], reverse=True)[:20]
    return result


def _get_usage_report(auth: DocuSignAuth, from_date: str, to_date: str,
                      include_recipients: bool = True, account_tag: str = "") -> list:
    params = {"from_date": f"{from_date}T00:00:00Z", "to_date": f"{to_date}T23:59:59Z"}
    try:
        envelopes = auth.get_paginated("/envelopes", params=params)
    except Exception:
        envelopes = []
    rows = []
    for env in envelopes:
        env_id = env.get("envelopeId", "")
        sender_obj = env.get("sender", {})
        sender_name = sender_obj.get("userName", "") if isinstance(sender_obj, dict) else ""
        sender_email = sender_obj.get("email", "") if isinstance(sender_obj, dict) else ""
        env_type = "Manual (PowerForm/Web)"
        try:
            templates = auth.get(f"/envelopes/{env_id}/templates")
            if templates.get("templates"):
                env_type = "API (Template)"
        except Exception:
            pass
        recipients_str = ""
        if include_recipients:
            try:
                recip = auth.get(f"/envelopes/{env_id}/recipients")
                parts = []
                for r in recip.get("signers", []):
                    n, e = r.get("name", ""), r.get("email", "")
                    if n and e:
                        parts.append(f"{n} <{e}>")
                    elif e:
                        parts.append(e)
                for r in recip.get("carbonCopies", []):
                    n, e = r.get("name", ""), r.get("email", "")
                    if n and e:
                        parts.append(f"{n} <{e}> (CC)")
                    elif e:
                        parts.append(f"{e} (CC)")
                recipients_str = "; ".join(parts)
            except Exception:
                recipients_str = "N/A"
        rows.append({
            "account": account_tag or auth.account_id,
            "sender": f"{sender_name} <{sender_email}>" if sender_name else sender_email,
            "recipient": recipients_str,
            "envelope_name": env.get("emailSubject", ""),
            "envelope_id": env_id,
            "envelope_type": env_type,
            "status": env.get("status", ""),
            "created_date": env.get("createdDateTime", ""),
        })
    return rows


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.route("/")
def dashboard():
    auth = _make_auth("prd")
    try:
        accts = auth.list_accounts()
        cur_name = ""
        for a in accts:
            if a["guid"] == auth.account_id:
                cur_name = a["name"]
                break
        summary = _get_env_summary(auth, days=30, account_name=cur_name)
    except Exception as e:
        return flask.render_template("error.html", error=str(e), env="prd")

    now = datetime.now(timezone.utc)
    return flask.render_template(
        "dashboard.html", summary=summary, env="prd", accounts=accts,
        from_date_default=(now - timedelta(days=30)).strftime("%Y-%m-%d"),
        to_date_default=now.strftime("%Y-%m-%d"),
    )


@app.route("/dev")
def dev_dashboard():
    auth = _make_auth("dev")
    try:
        accts = auth.list_accounts()
        cur_name = ""
        for a in accts:
            if a["guid"] == auth.account_id:
                cur_name = a["name"]
                break
        summary = _get_env_summary(auth, days=30, account_name=cur_name)
        now = datetime.now(timezone.utc)
        return flask.render_template(
            "dashboard.html", summary=summary, env="dev", accounts=accts,
            from_date_default=(now - timedelta(days=30)).strftime("%Y-%m-%d"),
            to_date_default=now.strftime("%Y-%m-%d"),
        )
    except Exception as e:
        return flask.render_template("error.html", error=str(e), env="dev")


# ---------------------------------------------------------------------------
# API endpoints
# ---------------------------------------------------------------------------


@app.route("/api/accounts/list")
def api_accounts_list():
    env = flask.request.args.get("env", "prd")
    try:
        accts = DocuSignAuth(env).list_accounts()
        return flask.jsonify({"accounts": accts})
    except Exception as e:
        return flask.jsonify({"error": str(e)}), 500


@app.route("/api/usage/export", methods=["POST"])
def usage_export():
    from_date = flask.request.form.get("from_date", "")
    to_date = flask.request.form.get("to_date", "")
    env = flask.request.form.get("env", "prd")
    auth = _make_auth(env)

    if not from_date:
        from_date = (datetime.now(timezone.utc) - timedelta(days=30)).strftime("%Y-%m-%d")
    if not to_date:
        to_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    rows = _get_usage_report(auth, from_date, to_date, include_recipients=True)

    if not rows:
        flask.flash("No envelopes found.", "warning")
        return flask.redirect("/usage")

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=[
        "account", "sender", "recipient", "envelope_name", "envelope_id",
        "envelope_type", "status", "created_date",
    ])
    writer.writeheader()
    writer.writerows(rows)
    csv_data = output.getvalue()
    output.close()

    resp = flask.Response(csv_data, mimetype="text/csv")
    resp.headers["Content-Disposition"] = f"attachment; filename=docusign_usage_{from_date}_to_{to_date}.csv"
    return resp


@app.route("/api/usage/preview", methods=["POST"])
def usage_preview():
    from_date = flask.request.form.get("from_date", "")
    to_date = flask.request.form.get("to_date", "")
    env = flask.request.form.get("env", "prd")
    auth = _make_auth(env)

    if not from_date:
        from_date = (datetime.now(timezone.utc) - timedelta(days=7)).strftime("%Y-%m-%d")
    if not to_date:
        to_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    try:
        data = auth.get("/envelopes", {"from_date": f"{from_date}T00:00:00Z", "count": "10"})
        total = int(data.get("totalSetSize", 0))
        return flask.jsonify({"total": total})
    except Exception as e:
        return flask.jsonify({"error": str(e)}), 500


@app.route("/api/api-usage/stats")
def api_usage_stats():
    auth = _make_auth("prd")
    try:
        now = datetime.now(timezone.utc)
        periods = {}
        for label, days in [("Last 7 days", 7), ("Last 30 days", 30), ("Last 90 days", 90)]:
            fd = (now - timedelta(days=days)).strftime("%Y-%m-%d")
            data = auth.get("/envelopes", {"from_date": f"{fd}T00:00:00Z", "count": "1"})
            periods[label] = int(data.get("totalSetSize", 0))
        today_str = now.strftime("%Y-%m-%d")
        data = auth.get("/envelopes", {"from_date": f"{today_str}T00:00:00Z", "count": "1"})
        return flask.jsonify({
            "periods": periods,
            "today": int(data.get("totalSetSize", 0)),
            "account_id": auth.account_id,
        })
    except Exception as e:
        return flask.jsonify({"error": str(e)}), 500


@app.route("/api/templates/list")
def templates_list():
    env = flask.request.args.get("env", "prd")
    try:
        auth = DocuSignAuth(env)
        search = flask.request.args.get("search", "")
        data = auth.get("/templates", {"search_text": search} if search else {})
        templates = [
            {"id": t.get("templateId", ""), "name": t.get("name", ""),
             "created": _human_time(t.get("createdDateTime", ""))}
            for t in data.get("envelopeTemplates", [])
        ]
        return flask.jsonify({"templates": templates})
    except Exception as e:
        return flask.jsonify({"error": str(e)}), 500


# ---------------------------------------------------------------------------
# Routes - static pages
# ---------------------------------------------------------------------------


@app.route("/usage")
def usage_page():
    try:
        accts = _make_auth("prd").list_accounts()
    except Exception:
        accts = []
    return flask.render_template("usage.html", env="prd", accounts=accts)


@app.route("/dev/usage")
def dev_usage():
    try:
        accts = _make_auth("dev").list_accounts()
    except Exception:
        accts = []
    return flask.render_template("usage.html", env="dev", accounts=accts)


@app.route("/api-usage")
def api_usage_page():
    return flask.render_template("api_usage.html", env="prd")


@app.route("/templates")
def templates_page():
    return flask.render_template("templates.html", env="prd")


@app.route("/templates/download")
def template_download_page():
    """Template download management page."""
    try:
        accts = DocuSignAuth("prd").list_accounts()
    except Exception:
        accts = []
    return flask.render_template("template_download.html", env="prd", accounts=accts)


@app.route("/export")
def export_management_page():
    """Export management and status page."""
    try:
        accts = DocuSignAuth("prd").list_accounts()
    except Exception:
        accts = []
    return flask.render_template("export_management.html", env="prd", accounts=accts)


@app.route("/bulk-send")
def bulk_send_page():
    return flask.render_template("bulk_send.html", env="prd")


@app.route("/api/templates/for-bulk")
def templates_for_bulk():
    auth = DocuSignAuth("prd")
    try:
        data = auth.get("/templates", {"count": "50"})
        templates = [
            {"id": t.get("templateId", ""), "name": t.get("name", "")}
            for t in data.get("envelopeTemplates", [])
        ]
        return flask.jsonify({"templates": templates})
    except Exception as e:
        return flask.jsonify({"error": str(e)}), 500


# ---------------------------------------------------------------------------
# Template Download API
# ---------------------------------------------------------------------------


@app.route("/api/templates/download", methods=["POST"])
def api_template_download():
    """Trigger template download (GET-only)."""
    account = flask.request.form.get("account", "")
    search = flask.request.form.get("search", "")
    force = flask.request.form.get("force", "0") == "1"
    dry_run = flask.request.form.get("dry_run", "0") == "1"

    try:
        auth = DocuSignAuth("prd")
        db_path = get_tracking_db_path("prd")
        db = TrackingDb(db_path)
        db.init_schema()

        all_accts = auth.list_accounts()
        if account:
            targets = [a for a in all_accts if account.lower() in a["name"].lower()]
        else:
            targets = all_accts

        if not targets:
            db.close()
            return flask.jsonify({"error": "No accounts found"}), 400

        results = {"found": 0, "downloaded": 0, "errors": 0, "details": []}

        for acct in targets:
            acct_auth = DocuSignAuth("prd", account_guid=acct["guid"])
            templates = acct_auth.get_paginated(
                "/templates",
                params={"search_text": search} if search else {},
                result_key="envelopeTemplates",
                page_size=50,
            )

            for tpl in templates:
                tpl_id = tpl.get("templateId", "")
                tpl_name = tpl.get("name", "(unnamed)")
                if not tpl_id:
                    continue
                results["found"] += 1

                if not force:
                    existing = db.get_envelope(tpl_id)
                    if existing:
                        results["details"].append({
                            "name": tpl_name, "id": tpl_id, "status": "skipped",
                        })
                        continue

                if dry_run:
                    results["details"].append({
                        "name": tpl_name, "id": tpl_id, "status": "would_download",
                    })
                    continue

                try:
                    safe_name = "".join(c for c in tpl_name if c.isalnum() or c in "._- ").strip()
                    safe_name = "_".join(safe_name.split()) or "template"
                    tpl_dir = TEMPLATES_DIR / f"{safe_name}_{tpl_id[:8]}"
                    tpl_dir.mkdir(parents=True, exist_ok=True)

                    definition = acct_auth.get(tpl_id, {"include": "documents,recipients,tabs"})
                    json_path = tpl_dir / f"{safe_name}_{tpl_id[:8]}_definition.json"
                    with open(json_path, "w", encoding="utf-8") as f:
                        json.dump(definition, f, indent=2, ensure_ascii=False, default=str)

                    doc_count = 0
                    try:
                        docs_resp = acct_auth.get(f"/templates/{tpl_id}/documents")
                        docs_dir = tpl_dir / "documents"
                        docs_dir.mkdir(parents=True, exist_ok=True)
                        for doc in docs_resp.get("templateDocuments", []):
                            did = str(doc.get("documentId", ""))
                            dname = doc.get("name", f"doc_{did}")
                            if not did:
                                continue
                            try:
                                raw = acct_auth.get_raw(f"/templates/{tpl_id}/documents/{did}")
                                safe = "".join(c for c in dname if c.isalnum() or c in "._- ").strip() or f"attachment_{did}"
                                (docs_dir / safe).write_bytes(raw)
                                doc_count += 1
                            except Exception:
                                pass
                    except Exception:
                        pass

                    db.upsert_envelope({
                        "envelope_id": tpl_id,
                        "account_id": acct["guid"],
                        "employee_name": tpl_name,
                        "template_id": tpl_id,
                        "template_name": tpl_name,
                        "status": "template",
                        "envelope_type": "template_definition",
                        "created_at": tpl.get("createdDateTime", ""),
                    })
                    results["downloaded"] += 1
                    results["details"].append({
                        "name": tpl_name, "id": tpl_id, "status": "downloaded",
                        "documents": doc_count, "path": str(tpl_dir),
                    })
                except Exception as exc:
                    results["errors"] += 1
                    results["details"].append({
                        "name": tpl_name, "id": tpl_id, "status": "error", "error": str(exc),
                    })

        db.close()
        return flask.jsonify(results)

    except Exception as e:
        return flask.jsonify({"error": str(e)}), 500


@app.route("/api/templates/downloaded")
def api_templates_downloaded():
    """List locally downloaded templates."""
    try:
        db = TrackingDb(get_tracking_db_path("prd"))
        db.init_schema()
        rows = db.get_envelopes(status="template", limit=5000)

        downloaded = []
        templates_dir = TEMPLATES_DIR
        for r in rows:
            tpl_id = r.get("envelope_id", "")
            tpl_name = r.get("employee_name", "(unnamed)")
            safe_name = "_".join(c for c in (tpl_name or "") if c.isalnum() or c in "._- ").strip() or "template"
            tpl_dir = templates_dir / f"{safe_name}_{tpl_id[:8]}"

            doc_count = 0
            if tpl_dir.exists():
                docs_dir = tpl_dir / "documents"
                if docs_dir.exists():
                    doc_count = len(list(docs_dir.iterdir()))
                found_json = list(tpl_dir.glob("*_definition.json"))
                definition_path = str(found_json[0]) if found_json else ""

            downloaded.append({
                "name": tpl_name,
                "id": tpl_id,
                "created": _human_time(r.get("created_at", "")),
                "documents": doc_count,
                "path": str(tpl_dir) if tpl_dir.exists() else "",
                "definition": definition_path if tpl_dir.exists() else "",
            })

        db.close()
        return flask.jsonify({"templates": downloaded})
    except Exception as e:
        return flask.jsonify({"error": str(e)}), 500


# ---------------------------------------------------------------------------
# Export Management API
# ---------------------------------------------------------------------------


@app.route("/api/export/stats")
def api_export_stats():
    """Show export statistics from SQLite."""
    try:
        db = TrackingDb(get_tracking_db_path("prd"))
        db.init_schema()
        stats = db.get_export_stats()
        env = flask.request.args.get("env", "prd")

        # Recent batches
        batches = db.conn.execute(
            "SELECT export_batch, COUNT(*) as cnt, MIN(exported_at) as first, MAX(exported_at) as last "
            "FROM export_tracking GROUP BY export_batch ORDER BY first DESC LIMIT 10"
        ).fetchall()
        db.close()

        return flask.jsonify({
            "total_envelopes": stats["total_envelopes"],
            "exported": stats["exported"],
            "pending": stats["pending"],
            "batches": [
                {"batch": r["export_batch"], "count": r["cnt"],
                 "first": _human_time(r["first"]), "last": _human_time(r["last"])}
                for r in batches
            ],
        })
    except Exception as e:
        return flask.jsonify({"error": str(e)}), 500


@app.route("/api/export/run", methods=["POST"])
def api_export_run():
    """Trigger an incremental export run. GET-only."""
    from docusign_bulk_export import export_envelopes

    account = flask.request.form.get("account", "")
    from_date = flask.request.form.get("from_date", "")
    to_date = flask.request.form.get("to_date", "")
    force = flask.request.form.get("force", "0") == "1"
    dry_run = flask.request.form.get("dry_run", "0") == "1"

    try:
        result = export_envelopes(
            from_date=from_date, to_date=to_date,
            account_name=account,
            force=force, dry_run=dry_run,
        )
        return flask.jsonify(result)
    except Exception as e:
        return flask.jsonify({"error": str(e)}), 500


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main():
    parser = argparse.ArgumentParser(description="DocuSign Web Management Platform")
    parser.add_argument("--port", type=int, default=5000)
    parser.add_argument("--host", default="127.0.0.1")
    args = parser.parse_args()

    print(f"\n{'='*60}")
    print(f" DocuSign Web Management Platform")
    print(f"{'='*60}")
    print(f" Starting on http://{args.host}:{args.port}")
    print(f" Using shared library (docusign_lib)")
    print(f" PRD: read-only (GET only)")
    print(f"{'='*60}\n")

    from waitress import serve
    serve(app, host=args.host, port=args.port, threads=8, ident="docusign-webapp/2.0")


if __name__ == "__main__":
    main()
