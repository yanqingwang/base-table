#!/usr/bin/env python3
"""
PRD Setup Finalizer

Run this AFTER manually creating the new Integration Key and RSA keys
in the production DocuSign Developer Console (apps.docusign.com/dev-console/integrations).

Steps:
  1. Enter the new Integration Key (GUID from DocuSign)
  2. Paste the RSA private key content (or provide the file path)
  3. This script updates PRD/.env with the new values
  4. Verifies auth works with the new configuration

Usage:
  python finalize_setup.py
"""

import json
import os
import re
import sys
import time
from pathlib import Path

PRD_DIR = Path(__file__).resolve().parent
ENV_PATH = PRD_DIR / ".env"
PRIV_KEY_PATH = PRD_DIR / "docusign_private_prd.pem"
PUB_KEY_PATH = PRD_DIR / "docusign_public_prd.pem"
STATE_PATH = PRD_DIR / "setup_state.json"

# ---- Known values (pre-filled) ----
USER_ID = "cce9485b-58dd-41d3-9f47-a7969a012fae"
ACCOUNT_ID = "694285719"
OAUTH_BASE = "https://account.docusign.com"
BASE_URL = "https://eu.docusign.net"


def read_env() -> dict:
    env = {}
    if ENV_PATH.exists():
        for line in ENV_PATH.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, _, v = line.partition("=")
            env[k.strip()] = v.strip().strip("\"'")
    return env


def write_env(updates: dict):
    content = ENV_PATH.read_text() if ENV_PATH.exists() else ""
    for key, value in updates.items():
        if re.search(f"^{key}=", content, re.MULTILINE):
            content = re.sub(f"^{key}=.*$", f'{key}="{value}"', content, flags=re.MULTILINE)
        else:
            content += f'{key}="{value}"\n'
    ENV_PATH.write_text(content)
    print(f"  Updated: {list(updates.keys())}")


def verify_auth():
    """Try to get an access token to verify the setup."""
    sys.path.insert(0, str(PRD_DIR))
    from docusign_auth import get_access_token, discover_base_uri
    try:
        print("\n  Verifying auth...")
        token = get_access_token(force=True)
        print(f"  ✓ Access token obtained: {token[:20]}...")
        base_uri = discover_base_uri(token)
        print(f"  ✓ Base URI: {base_uri}")
        return True
    except Exception as e:
        print(f"  ✗ Auth verification failed: {e}")
        print("  This is normal if consent hasn't been granted yet.")
        return False


def main():
    print("=" * 60)
    print("DocuSign PRD Setup Finalizer")
    print("=" * 60)

    env = read_env()

    # ---- Step 1: Integration Key ----
    current_ik = env.get("DOCUSIGN_INTEGRATION_KEY", "")
    print(f"\n[1] Integration Key (current: {current_ik[:20]}...)")
    new_ik = input("  Enter new Integration Key (GUID): ").strip()
    if not new_ik:
        print("  Skipped. Keeping existing key.")
    else:
        # Basic validation
        if not re.match(r"^[a-f0-9-]{36}$", new_ik.lower()):
            print("  Warning: Doesn't look like a standard GUID format.")

    # ---- Step 2: Private Key ----
    print(f"\n[2] RSA Private Key")
    print(f"  Target: {PRIV_KEY_PATH}")

    # Check if key file already exists
    if PRIV_KEY_PATH.exists():
        content = PRIV_KEY_PATH.read_text()
        if "BEGIN" in content:
            print(f"  ✓ Private key already exists ({len(content)} bytes)")
            use_existing = input("  Use existing key? [Y/n]: ").strip().lower()
            if use_existing == "n":
                PRIV_KEY_PATH.unlink()
            else:
                new_ik_val = new_ik or current_ik
                if new_ik_val:
                    # Save state and update env
                    state = {
                        "integrationKey": new_ik_val,
                        "appName": "easy-hire-prd",
                        "userId": USER_ID,
                        "accountId": ACCOUNT_ID,
                        "privateKeyPath": str(PRIV_KEY_PATH),
                        "publicKeyPath": str(PUB_KEY_PATH) if PUB_KEY_PATH.exists() else "",
                        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    }
                    STATE_PATH.write_text(json.dumps(state, indent=2))
                    print(f"  Saved: {STATE_PATH}")

                    updates = {
                        "DOCUSIGN_INTEGRATION_KEY": new_ik_val,
                        "DOCUSIGN_PRIVATE_KEY_PATH": str(PRIV_KEY_PATH),
                    }
                    if PUB_KEY_PATH.exists():
                        updates["DOCUSIGN_PUBLIC_KEY_PATH"] = str(PUB_KEY_PATH)
                    write_env(updates)

    if not PRIV_KEY_PATH.exists():
        print("\n  Option A: Paste the private key content (paste, then Ctrl+D / EOF)")
        print("  Option B: Copy the .pem file to:")
        print(f"    {PRIV_KEY_PATH}")
        choice = input("\n  Choose [A/paste | B/file]: ").strip().lower()

        if choice == "b" or choice == "file":
            src = input("  Enter path to private key .pem file: ").strip()
            if src and Path(src).exists():
                import shutil
                shutil.copy2(src, PRIV_KEY_PATH)
                print(f"  ✓ Copied to {PRIV_KEY_PATH}")
            else:
                print("  File not found.")
        else:
            print("  Paste private key (including BEGIN/END lines). Ctrl+D to finish:")
            try:
                lines = sys.stdin.read()
                if "BEGIN" in lines:
                    PRIV_KEY_PATH.write_text(lines)
                    print(f"  ✓ Saved to {PRIV_KEY_PATH}")
                else:
                    print("  No valid key content detected.")
            except KeyboardInterrupt:
                print("\n  Skipped.")

    # ---- Step 3: Update .env ----
    print(f"\n[3] Updating PRD/.env")

    ik_value = new_ik if new_ik else current_ik
    if ik_value:
        updates = {
            "DOCUSIGN_INTEGRATION_KEY": ik_value,
            "DOCUSIGN_USER_ID": USER_ID,
            "DOCUSIGN_ACCOUNT_ID": ACCOUNT_ID,
            "DOCUSIGN_OAUTH_BASE": OAUTH_BASE,
            "DOCUSIGN_BASE_URL": BASE_URL,
            "DOCUSIGN_PRIVATE_KEY_PATH": str(PRIV_KEY_PATH),
        }
        if PUB_KEY_PATH.exists():
            updates["DOCUSIGN_PUBLIC_KEY_PATH"] = str(PUB_KEY_PATH)

        write_env(updates)

        # Update the comment
        env_content = ENV_PATH.read_text()
        env_content = re.sub(
            r"^# IK reused.*$",
            "# PRD-specific Integration Key (separate from DEV)",
            env_content,
            flags=re.MULTILINE,
        )
        # Add comment if not already separated
        if "DOCUSIGN_INTEGRATION_KEY" in env_content and "# PRD-specific" not in env_content:
            env_content = re.sub(
                r"(DOCUSIGN_INTEGRATION_KEY)",
                r"# PRD-specific Integration Key (separate from DEV)\n\1",
                env_content,
            )
        ENV_PATH.write_text(env_content)

    # ---- Step 4: Verify ----
    print(f"\n[4] Verifying authentication...")
    verify_auth()

    # ---- Step 5: Consent URL ----
    print(f"\n[5] Consent (if needed)")
    ik = ik_value or current_ik
    if ik:
        consent_url = (
            f"https://account.docusign.com/oauth/auth"
            f"?response_type=code"
            f"&scope=signature%20impersonation"
            f"&client_id={ik}"
            f"&redirect_uri=http://localhost:5000/auth/callback"
        )
        print(f"  If auth verification failed, grant consent at:")
        print(f"  {consent_url}")

    print("\n" + "=" * 60)
    print("PRD Setup Summary")
    print("=" * 60)
    print(f"  .env:         {ENV_PATH}")
    print(f"  Private Key:  {PRIV_KEY_PATH if PRIV_KEY_PATH.exists() else 'NOT SET'}")
    print(f"  Public Key:   {PUB_KEY_PATH if PUB_KEY_PATH.exists() else 'NOT SET'}")
    print("=" * 60)
    print("\nTo verify:  cd PRD && python3 docusign_auth.py")


if __name__ == "__main__":
    main()
