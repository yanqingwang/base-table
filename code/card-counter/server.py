#!/usr/bin/env python3
"""Card Counter (次卡) — local HTTP server + JSON file storage.

Usage:
    python server.py            # start on port 8080
    python server.py --port 9090
"""

import json
import os
import uuid
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
CARDS_FILE = os.path.join(DATA_DIR, "cards.json")
PORT = 8080


# ── Data helpers ──────────────────────────────────────────────────────

def _ensure_data_dir():
    os.makedirs(DATA_DIR, exist_ok=True)


def _load_cards():
    _ensure_data_dir()
    if not os.path.exists(CARDS_FILE):
        return []
    with open(CARDS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def _save_cards(cards):
    _ensure_data_dir()
    with open(CARDS_FILE, "w", encoding="utf-8") as f:
        json.dump(cards, f, ensure_ascii=False, indent=2)


def _now():
    return datetime.now().isoformat(timespec="seconds")


def _today():
    return datetime.now().strftime("%Y-%m-%d")


# ── Card model helpers ────────────────────────────────────────────────

def _new_card(body):
    total = int(body.get("total_count", 1))
    return {
        "id": str(uuid.uuid4()),
        "merchant": body.get("merchant", "").strip(),
        "item": body.get("item", "").strip(),
        "amount": float(body.get("amount", 0)),
        "total_count": total,
        "remaining_count": int(body.get("remaining_count", total)),
        "expiration": body.get("expiration", "").strip(),
        "notes": body.get("notes", "").strip(),
        "preferences": {
            "days": body.get("preferences", {}).get("days", ["weekend"])
        },
        "checkins": [],
        "rating": None,
        "created_at": _now(),
        "updated_at": _now(),
    }


def _update_card(existing, body):
    for key in ("merchant", "item", "notes", "expiration"):
        if key in body:
            existing[key] = body[key].strip() if isinstance(body[key], str) else body[key]
    if "amount" in body:
        existing["amount"] = float(body["amount"])
    if "total_count" in body:
        existing["total_count"] = int(body["total_count"])
    if "remaining_count" in body:
        existing["remaining_count"] = int(body["remaining_count"])
    # ponytail: clamp remaining to [0, total_count] instead of rejecting
    tc = existing.get("total_count", 1)
    existing["remaining_count"] = max(0, min(existing.get("remaining_count", tc), tc))
    if "preferences" in body and "days" in body["preferences"]:
        existing["preferences"]["days"] = body["preferences"]["days"]
    existing["updated_at"] = _now()
    return existing


# ── Schedule suggestion ───────────────────────────────────────────────

def _suggest_schedule(card):
    """Expiration-aware schedule suggestion."""
    remaining = card["remaining_count"]
    if remaining <= 0:
        return "已用完，无需安排"

    exp = card.get("expiration", "")
    days_until_exp = None
    if exp:
        try:
            exp_date = datetime.strptime(exp, "%Y-%m-%d")
            days_until_exp = (exp_date - datetime.now()).days
        except ValueError:
            pass

    # Urgency: if expiring soon, calculate required rate
    if days_until_exp is not None and 0 <= days_until_exp <= 30 and remaining > 0:
        needed_per_week = max(1, (remaining + max(days_until_exp // 7, 1) - 1) // max(days_until_exp // 7, 1))
        if days_until_exp <= 7:
            return f"⚠️ 即将到期！建议在{days_until_exp}天内用完剩余{remaining}次（每天至少{max(1, (remaining+days_until_exp-1)//days_until_exp)}次）"
        return f"⚠️ 距到期还有{days_until_exp}天，建议每周至少使用{needed_per_week}次以用完剩余{remaining}次"

    if days_until_exp is not None and days_until_exp < 0:
        return f"❌ 已过期{abs(days_until_exp)}天，无法继续使用（剩余{remaining}次）"

    days = card["preferences"].get("days", [])
    day_labels = {"weekend": "周末", "weekday": "工作日", "holiday": "假期", "winter_summer": "寒暑假"}
    labels = [day_labels.get(d, d) for d in days]
    day_str = "、".join(labels) if labels else "任意时间"

    if remaining <= 3:
        return f"建议在最近{remaining}次{day_str}集中用完（剩余{remaining}次）"
    per_week = 2
    weeks = (remaining + per_week - 1) // per_week
    return f"建议每{day_str}使用{per_week}次，约{weeks}周用完（剩余{remaining}次）"


# ── HTTP handler ──────────────────────────────────────────────────────

class Handler(BaseHTTPRequestHandler):

    def _send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def _send_static(self, path):
        try:
            filepath = os.path.join(os.path.dirname(__file__), path.lstrip("/"))
            with open(filepath, "rb") as f:
                content = f.read()
            self.send_response(200)
            if path.endswith(".html"):
                self.send_header("Content-Type", "text/html; charset=utf-8")
            elif path.endswith(".css"):
                self.send_header("Content-Type", "text/css; charset=utf-8")
            elif path.endswith(".js"):
                self.send_header("Content-Type", "application/javascript; charset=utf-8")
            else:
                self.send_header("Content-Type", "application/octet-stream")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(content)
        except FileNotFoundError:
            self._send_json({"error": "Not found"}, 404)

    def _read_body(self):
        length = int(self.headers.get("Content-Length", 0))
        if length == 0:
            return {}
        raw = self.rfile.read(length)
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return None  # caller checks and returns 400

    def _parse_path(self):
        parsed = urlparse(self.path)
        parts = parsed.path.strip("/").split("/")
        qs = parse_qs(parsed.query)
        return parts, qs

    # ── Router ────────────────────────────────────────────────────

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        parts, qs = self._parse_path()

        # API: list cards (with schedule suggestion)
        if parts == ["api", "cards"]:
            cards = _load_cards()
            result = []
            for c in cards:
                item = dict(c)
                item["suggestion"] = _suggest_schedule(c)
                result.append(item)
            return self._send_json(result)

        # API: get single card with schedule suggestion
        if len(parts) == 3 and parts[:2] == ["api", "cards"]:
            card_id = parts[2]
            cards = _load_cards()
            card = next((c for c in cards if c["id"] == card_id), None)
            if not card:
                return self._send_json({"error": "Card not found"}, 404)
            result = dict(card)
            result["suggestion"] = _suggest_schedule(card)
            return self._send_json(result)

        # Static files
        path = parts[-1] if parts else "index.html"
        if not path or path == "api":
            path = "index.html"
        self._send_static(path)

    def do_POST(self):
        parts, _ = self._parse_path()
        body = self._read_body()
        if body is None:
            return self._send_json({"error": "Invalid JSON"}, 400)

        # POST /api/cards — create card
        if parts == ["api", "cards"]:
            card = _new_card(body)
            cards = _load_cards()
            cards.append(card)
            _save_cards(cards)
            return self._send_json(card, 201)

        # POST /api/cards/<id>/checkin — record consumption
        if len(parts) == 4 and parts[:2] == ["api", "cards"] and parts[3] == "checkin":
            card_id = parts[2]
            cards = _load_cards()
            idx = next((i for i, c in enumerate(cards) if c["id"] == card_id), None)
            if idx is None:
                return self._send_json({"error": "Card not found"}, 404)

            count = int(body.get("count", 1))
            if count <= 0:
                return self._send_json({"error": "Count must be positive"}, 400)

            card = cards[idx]
            if card.get("expiration") and card["expiration"] < _today():
                return self._send_json({"error": "该次卡已过期，无法签到"}, 400)
            if card["remaining_count"] < count:
                return self._send_json({"error": "剩余次数不足"}, 400)

            card["remaining_count"] -= count
            card["checkins"].append({
                "date": _now(),
                "count": count,
                "notes": body.get("notes", "").strip(),
            })
            card["updated_at"] = _now()
            _save_cards(cards)
            return self._send_json(card)

        # POST /api/cards/<id>/rate — rate merchant
        if len(parts) == 4 and parts[:2] == ["api", "cards"] and parts[3] == "rate":
            card_id = parts[2]
            cards = _load_cards()
            idx = next((i for i, c in enumerate(cards) if c["id"] == card_id), None)
            if idx is None:
                return self._send_json({"error": "Card not found"}, 404)
            rating = int(body.get("rating", 0))
            if rating < 1 or rating > 5:
                return self._send_json({"error": "Rating must be 1-5"}, 400)
            cards[idx]["rating"] = rating
            cards[idx]["updated_at"] = _now()
            _save_cards(cards)
            return self._send_json(cards[idx])

        return self._send_json({"error": "Not found"}, 404)

    def do_PUT(self):
        parts, _ = self._parse_path()
        body = self._read_body()
        if body is None:
            return self._send_json({"error": "Invalid JSON"}, 400)

        # PUT /api/cards/<id> — update card
        if len(parts) == 3 and parts[:2] == ["api", "cards"]:
            card_id = parts[2]
            cards = _load_cards()
            idx = next((i for i, c in enumerate(cards) if c["id"] == card_id), None)
            if idx is None:
                return self._send_json({"error": "Card not found"}, 404)
            cards[idx] = _update_card(cards[idx], body)
            _save_cards(cards)
            return self._send_json(cards[idx])

        return self._send_json({"error": "Not found"}, 404)

    def do_DELETE(self):
        parts, _ = self._parse_path()

        # DELETE /api/cards/<id> — delete card
        if len(parts) == 3 and parts[:2] == ["api", "cards"]:
            card_id = parts[2]
            cards = _load_cards()
            new_cards = [c for c in cards if c["id"] != card_id]
            if len(new_cards) == len(cards):
                return self._send_json({"error": "Card not found"}, 404)
            _save_cards(new_cards)
            return self._send_json({"ok": True})

        return self._send_json({"error": "Not found"}, 404)


# ── Entry point ───────────────────────────────────────────────────────

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Card Counter (次卡) server")
    parser.add_argument("--port", type=int, default=PORT, help=f"Port (default: {PORT})")
    args = parser.parse_args()

    server = HTTPServer(("127.0.0.1", args.port), Handler)
    print(f"✓ Card Counter server started at http://localhost:{args.port}")
    print(f"  Data directory: {DATA_DIR}")
    print("  Press Ctrl+C to stop")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
        server.server_close()


if __name__ == "__main__":
    main()
