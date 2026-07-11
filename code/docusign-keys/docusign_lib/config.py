"""Environment configuration for DocuSign PRD/DEV environments.

Provides env loading, account maps, and environment-specific constraints.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, Optional


@dataclass
class AccountInfo:
    """A single DocuSign account with both numeric and GUID identifiers."""
    numeric_id: str
    guid: str
    name: str
    base_uri: str = ""


@dataclass
class EnvConfig:
    """Configuration for one environment (PRD or DEV)."""
    name: str  # "prd" or "dev"
    dotenv_path: Path
    accounts: Dict[str, AccountInfo] = field(default_factory=dict)
    integration_key: str = ""
    user_id: str = ""
    oauth_base: str = ""
    base_url: str = ""
    private_key_path: str = ""
    account_id: str = ""
    read_only: bool = False


PRD_ACCOUNTS: Dict[str, AccountInfo] = {
    "694285719": AccountInfo(
        numeric_id="694285719",
        guid="93fa3147-90b2-4fcc-a3aa-dd851110d225",
        name="TE-Malaysia",
    ),
    "694285458": AccountInfo(
        numeric_id="694285458",
        guid="b09c75ff-932c-407f-8d5f-612bd858a859",
        name="TE-Korea",
    ),
}
PRD_ACCOUNTS["9a2421e3-bbb5-4d79-ac86-57f013a1f05e"] = AccountInfo(
    numeric_id="9a2421e3-bbb5-4d79-ac86-57f013a1f05e",
    guid="9a2421e3-bbb5-4d79-ac86-57f013a1f05e",
    name="TE Connectivity Corporation",
)

DEV_ACCOUNTS: Dict[str, AccountInfo] = {
    "45444181": AccountInfo(
        numeric_id="45444181",
        guid="5032c626-1057-408d-8d7f-b27fbb3c81d8",
        name="TE-MY",
    ),
    "45445035": AccountInfo(
        numeric_id="45445035",
        guid="70a3bf07-af69-4569-8401-b859bd782f6a",
        name="TE-KR",
    ),
    "93c4f271-0ea5-40da-bd21-53c346fcb8bc": AccountInfo(
        numeric_id="93c4f271-0ea5-40da-bd21-53c346fcb8bc",
        guid="93c4f271-0ea5-40da-bd21-53c346fcb8bc",
        name="TE-TH",
    ),
    "4ae423fa-1ebd-4326-93b7-a0c9e4726b9f": AccountInfo(
        numeric_id="4ae423fa-1ebd-4326-93b7-a0c9e4726b9f",
        guid="4ae423fa-1ebd-4326-93b7-a0c9e4726b9f",
        name="TE-PH",
    ),
}

DEV_EMAIL_OVERRIDE = "wangyantsing@qq.com"


def load_env_file(env_path: Path) -> Dict[str, str]:
    """Load key=value pairs from a .env file."""
    result: Dict[str, str] = {}
    if not env_path.exists():
        return result
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            result[key.strip()] = value.strip().strip("\"'")
    return result


def _get_project_root() -> Path:
    return Path(__file__).resolve().parent.parent


def build_env_config(env_name: str) -> EnvConfig:
    """Build an EnvConfig from the .env file for the given environment."""
    root = _get_project_root()
    env_dir = root / env_name.upper() if env_name.upper() in ("PRD", "DEV") else root / env_name
    env_path = env_dir / ".env"

    cfg = EnvConfig(
        name=env_name.lower(),
        dotenv_path=env_path,
        read_only=(env_name.lower() == "prd"),
    )

    raw = load_env_file(env_path)
    cfg.integration_key = raw.get("DOCUSIGN_INTEGRATION_KEY", "")
    cfg.user_id = raw.get("DOCUSIGN_USER_ID", "")
    cfg.account_id = raw.get("DOCUSIGN_ACCOUNT_ID", "")
    cfg.private_key_path = raw.get("DOCUSIGN_PRIVATE_KEY_PATH", "")

    if env_name.lower() == "dev":
        cfg.oauth_base = raw.get("DOCUSIGN_OAUTH_BASE", "https://account-d.docusign.com")
        cfg.base_url = raw.get("DOCUSIGN_BASE_URL", "https://demo.docusign.net")
        cfg.accounts = DEV_ACCOUNTS
    else:
        cfg.oauth_base = raw.get("DOCUSIGN_OAUTH_BASE", "https://account.docusign.com")
        cfg.base_url = raw.get("DOCUSIGN_BASE_URL", "https://eu.docusign.net")
        cfg.accounts = PRD_ACCOUNTS

    if cfg.private_key_path:
        p = Path(cfg.private_key_path)
        if not p.is_absolute():
            p = env_dir / p
        cfg.private_key_path = str(p.resolve())

    return cfg


def get_email_override(env_name: str) -> Optional[str]:
    """Return wangyantsing@qq.com for DEV, None for PRD."""
    return DEV_EMAIL_OVERRIDE if env_name.lower() == "dev" else None


def apply_email_override(data: dict, override_email: Optional[str]) -> dict:
    """Recursively replace all email values in nested dicts/lists."""
    if override_email is None:
        return data

    def _walk(obj):
        if isinstance(obj, dict):
            for k, v in list(obj.items()):
                if isinstance(v, str) and ("email" in k.lower() or k.lower() == "email"):
                    obj[k] = override_email
                else:
                    _walk(v)
        elif isinstance(obj, list):
            for item in obj:
                _walk(item)

    _walk(data)
    return data


def get_tracking_db_path(env_name: str) -> Path:
    """Return the path to the tracking SQLite database for the given environment."""
    return get_data_dir(env_name) / "tracking.db"


def get_data_dir(env_name: str) -> Path:
    """Return the unified data directory for the given environment."""
    root = _get_project_root()
    env_dir = root / env_name.upper() if env_name.upper() in ("PRD", "DEV") else root / env_name
    return env_dir / "data"


def get_exports_dir(env_name: str) -> Path:
    """Return the exports subdirectory under data/."""
    return get_data_dir(env_name) / "exports"


def get_templates_dir(env_name: str) -> Path:
    """Return the templates subdirectory under data/."""
    return get_data_dir(env_name) / "templates"
