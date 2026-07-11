"""DocuSign shared library — unified auth, API client, tracking DB, and config.

Usage::

    from docusign_lib.auth import DocuSignAuth
    from docusign_lib.tracking_db import TrackingDb
    from docusign_lib.config import build_env_config, get_email_override
"""

from .auth import DocuSignAuth
from .tracking_db import TrackingDb
from .config import (
    build_env_config,
    get_email_override,
    apply_email_override,
    get_tracking_db_path,
    AccountInfo,
    EnvConfig,
)

__all__ = [
    "DocuSignAuth",
    "TrackingDb",
    "build_env_config",
    "get_email_override",
    "apply_email_override",
    "get_tracking_db_path",
    "AccountInfo",
    "EnvConfig",
]
