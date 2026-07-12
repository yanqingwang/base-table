import urllib.request
from pathlib import Path

import yaml


def load_openapi(source: str) -> dict:
    """Load an OpenAPI document from a local path or http(s) URL."""
    if source.startswith(("http://", "https://")):
        with urllib.request.urlopen(source) as resp:  # noqa: S310 - controlled input
            raw = resp.read().decode("utf-8")
    else:
        raw = Path(source).read_text(encoding="utf-8")
    return yaml.safe_load(raw)


def load_config(path: str) -> dict:
    return yaml.safe_load(Path(path).read_text(encoding="utf-8"))
