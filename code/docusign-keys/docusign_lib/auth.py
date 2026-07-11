"""Unified DocuSign JWT OAuth authentication for PRD and DEV environments.

Provides token acquisition, caching (thread-safe), base URI auto-discovery,
and multi-account support. Uses ``requests`` library.

Usage::

    from docusign_lib.auth import DocuSignAuth

    auth = DocuSignAuth("prd")
    token = auth.get_access_token()
    accounts = auth.list_accounts()
"""

from __future__ import annotations

import json
import os
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

import jwt
import requests

from .config import build_env_config, EnvConfig, get_email_override, apply_email_override

TOKEN_LIFETIME_SECONDS: int = 3600
SCOPE: str = "signature impersonation"
_TOKEN_CACHE_FILENAME: str = "access_token.json"


class _TokenCache:
    """Thread-safe file-based token cache."""

    def __init__(self, cache_dir: Path):
        self._cache_path = cache_dir / _TOKEN_CACHE_FILENAME
        self._in_memory_token: Optional[str] = None
        self._in_memory_expires: float = 0

    def get(self) -> Optional[str]:
        if self._in_memory_token and time.time() < self._in_memory_expires - 60:
            return self._in_memory_token
        if not self._cache_path.exists():
            return None
        try:
            with open(self._cache_path, "r") as f:
                data = json.load(f)
            token = data.get("access_token")
            expires = data.get("expires_at", 0)
            if token and expires and time.time() < expires - 60:
                self._in_memory_token = token
                self._in_memory_expires = expires
                return token
        except (OSError, json.JSONDecodeError):
            pass
        return None

    def set(self, token_response: Dict[str, Any]) -> None:
        expires_in = token_response.get("expires_in", TOKEN_LIFETIME_SECONDS)
        self._in_memory_token = token_response.get("access_token", "")
        self._in_memory_expires = time.time() + expires_in
        data = dict(token_response)
        data["expires_at"] = self._in_memory_expires
        self._cache_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self._cache_path, "w") as f:
            json.dump(data, f, indent=2, default=str)
        self._cache_path.chmod(0o600)


class DocuSignAuth:
    """Unified authentication for DocuSign JWT OAuth.

    Args:
        env: ``"prd"`` or ``"dev"``.
        account_guid: Optional account GUID to switch to.
    """

    def __init__(self, env: str = "prd", account_guid: str = ""):
        self.env_name = env.lower()
        self.config: EnvConfig = build_env_config(self.env_name)

        cache_dir = self.config.dotenv_path.parent
        self._cache = _TokenCache(cache_dir)

        self._token: Optional[str] = None
        self._token_expires_at: float = 0
        self._accounts_cache: List[Dict[str, str]] = []
        self._base_uri_cache: str = ""
        self.selected_guid: str = account_guid

    # ------------------------------------------------------------------
    # Token
    # ------------------------------------------------------------------

    def get_access_token(self) -> str:
        """Get a valid OAuth bearer token (cached or fresh)."""
        now = time.time()
        if self._token and self._token_expires_at > now + 60:
            return self._token
        cached = self._cache.get()
        if cached:
            self._token = cached
            return cached

        assertion = self._build_jwt_assertion()
        token_url = f"{self.config.oauth_base.rstrip('/')}/oauth/token"
        resp = requests.post(
            token_url,
            data={
                "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
                "assertion": assertion,
            },
            timeout=30,
        )
        try:
            resp.raise_for_status()
        except requests.exceptions.HTTPError as exc:
            detail = resp.text[:500] if resp.text else str(exc)
            raise RuntimeError(
                f"OAuth token request failed [{resp.status_code}]: {detail}"
            ) from exc

        token_data = resp.json()
        access_token = token_data.get("access_token", "")
        if not access_token:
            raise RuntimeError(f"OAuth response missing access_token: {token_data}")

        expires_in = token_data.get("expires_in", TOKEN_LIFETIME_SECONDS)
        self._token = access_token
        self._token_expires_at = now + expires_in
        self._cache.set(token_data)
        return access_token

    def _build_jwt_assertion(self) -> str:
        private_key = self._load_private_key()
        now = int(time.time())
        payload = {
            "iss": self.config.integration_key,
            "sub": self.config.user_id,
            "aud": self.config.oauth_base.replace("https://", ""),
            "iat": now,
            "exp": now + TOKEN_LIFETIME_SECONDS,
            "scope": SCOPE,
        }
        return jwt.encode(payload, private_key, algorithm="RS256")

    def _load_private_key(self) -> str:
        p = Path(self.config.private_key_path).expanduser().resolve()
        if not p.exists():
            raise FileNotFoundError(
                f"Private key not found at {p}. "
                f"Set DOCUSIGN_PRIVATE_KEY_PATH in {self.config.dotenv_path}"
            )
        return p.read_text(encoding="utf-8")

    # ------------------------------------------------------------------
    # Account management
    # ------------------------------------------------------------------

    @property
    def account_id(self) -> str:
        """Return the selected account GUID, or the default from config."""
        if self.selected_guid:
            return self.selected_guid
        for a in self._accounts_cache:
            if a.get("is_default") == "true":
                return a["guid"]
        acct = self.config.account_id
        if acct in self.config.accounts:
            return self.config.accounts[acct].guid
        for info in self.config.accounts.values():
            if info.numeric_id == acct:
                return info.guid
        return acct

    @property
    def read_only(self) -> bool:
        return self.config.read_only

    def list_accounts(self) -> List[Dict[str, str]]:
        if self._accounts_cache:
            return self._accounts_cache
        token = self.get_access_token()
        url = f"{self.config.oauth_base.rstrip('/')}/oauth/userinfo"
        resp = requests.get(
            url,
            headers={"Authorization": f"Bearer {token}", "Accept": "application/json"},
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        seen_guids = set()
        accounts = []
        for acct in data.get("accounts", []):
            guid = acct.get("account_id", "")
            seen_guids.add(guid)
            accounts.append({
                "guid": guid,
                "name": acct.get("account_name", ""),
                "base_uri": acct.get("base_uri", "").rstrip("/"),
                "is_default": acct.get("is_default", "false"),
            })
        for info in self.config.accounts.values():
            if info.guid not in seen_guids:
                accounts.append({
                    "guid": info.guid,
                    "name": info.name,
                    "base_uri": "",
                    "numeric_id": info.numeric_id,
                    "is_default": "false",
                })
                seen_guids.add(info.guid)
        self._accounts_cache = accounts
        return accounts

    def get_base_uri(self) -> str:
        if self._base_uri_cache:
            return self._base_uri_cache
        if self.selected_guid:
            accts = self.list_accounts()
            for a in accts:
                if a["guid"] == self.selected_guid:
                    bu = a.get("base_uri", "")
                    if bu:
                        self._base_uri_cache = bu
                        return bu
                    break
        self._base_uri_cache = self.config.base_url.rstrip("/")
        return self._base_uri_cache

    # ------------------------------------------------------------------
    # API request helpers
    # ------------------------------------------------------------------

    def _api_url(self, path: str) -> str:
        base = self.get_base_uri()
        return f"{base}/restapi/v2.1/accounts/{self.account_id}{path}"

    def _headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.get_access_token()}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    def get(self, path: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        """GET request to the DocuSign REST API."""
        url = self._api_url(path)
        resp = requests.get(url, headers=self._headers(), params=params, timeout=60)
        try:
            resp.raise_for_status()
        except requests.exceptions.HTTPError as exc:
            detail = resp.text[:500] if resp.text else str(exc)
            raise RuntimeError(f"GET {url} failed [{resp.status_code}]: {detail}") from exc
        return resp.json()

    def get_raw(self, path: str, accept: str = "application/pdf") -> bytes:
        """GET request returning raw bytes (PDF download)."""
        headers = self._headers()
        headers["Accept"] = accept
        url = self._api_url(path)
        resp = requests.get(url, headers=headers, timeout=120)
        try:
            resp.raise_for_status()
        except requests.exceptions.HTTPError as exc:
            detail = resp.text[:500] if resp.text else str(exc)
            raise RuntimeError(f"GET {url} (raw) failed [{resp.status_code}]: {detail}") from exc
        return resp.content

    def get_paginated(
        self,
        path: str,
        params: Optional[Dict] = None,
        result_key: str = "envelopes",
        page_size: int = 100,
    ) -> list:
        """GET with automatic pagination through all pages."""
        params = dict(params or {})
        params.setdefault("count", str(page_size))
        params.setdefault("start_position", "0")
        all_items = []
        while True:
            data = self.get(path, params)
            items = data.get(result_key, [])
            all_items.extend(items)
            total = int(data.get("totalSetSize", str(len(items))) or len(items))
            pos = int(params["start_position"]) + len(items)
            if pos >= total or not items:
                break
            params["start_position"] = str(pos)
        return all_items

    def post(self, path: str, body: Dict) -> Dict[str, Any]:
        """POST request. Raises RuntimeError if env is read-only (PRD)."""
        if self.read_only:
            raise RuntimeError(
                f"Cannot POST to {path}: {self.env_name.upper()} is read-only"
            )
        # DEV: auto-apply email override for safe testing
        override = get_email_override(self.env_name)
        if override:
            body = apply_email_override(body, override)
        url = self._api_url(path)
        resp = requests.post(url, json=body, headers=self._headers(), timeout=60)
        try:
            resp.raise_for_status()
        except requests.exceptions.HTTPError as exc:
            detail = resp.text[:500] if resp.text else str(exc)
            raise RuntimeError(f"POST {url} failed [{resp.status_code}]: {detail}") from exc
        if resp.status_code == 201 and not resp.text.strip():
            return {"status": "created"}
        return resp.json()

    def put(self, path: str, body: Dict) -> Dict[str, Any]:
        """PUT request. Raises RuntimeError if env is read-only (PRD)."""
        if self.read_only:
            raise RuntimeError(
                f"Cannot PUT to {path}: {self.env_name.upper()} is read-only"
            )
        # DEV: auto-apply email override for safe testing
        override = get_email_override(self.env_name)
        if override:
            body = apply_email_override(body, override)
        url = self._api_url(path)
        resp = requests.put(url, json=body, headers=self._headers(), timeout=60)
        try:
            resp.raise_for_status()
        except requests.exceptions.HTTPError as exc:
            detail = resp.text[:500] if resp.text else str(exc)
            raise RuntimeError(f"PUT {url} failed [{resp.status_code}]: {detail}") from exc
        return resp.json()
