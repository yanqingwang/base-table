#!/usr/bin/env python3
"""
Copy a DocuSign template from PRD (production, read-only) to DEV (demo).

PRD: account 694285719 · eu.docusign.net  (READ ONLY)
DEV: account 45444181  · demo.docusign.net (create template)
"""

import base64, copy, json, os, shutil, sys
from pathlib import Path

import requests

PRD_DIR = Path(__file__).resolve().parent
DEV_DIR = Path(__file__).resolve().parent.parent / "DEV"

PRD_ACCT = "694285719"
DEV_ACCT = "45444181"
PRD_V2 = "https://eu.docusign.net/restapi/v2.1"
DEV_V2 = "https://demo.docusign.net/restapi/v2.1"

def get_token_isolation(env_dir, oauth_base):
    """Get JWT token in complete env isolation."""
    saved = copy.deepcopy(os.environ)
    try:
        # Clear DocuSign-specific vars so _load_dotenv's setdefault works
        for k in list(os.environ):
            if k.startswith("DOCUSIGN_"):
                del os.environ[k]

        sys.path.insert(0, str(env_dir))
        import docusign_auth
        import importlib
        importlib.reload(docusign_auth)
        docusign_auth._load_dotenv(env_dir / ".env")
        token = docusign_auth.get_access_token(force=True)
        return token
    finally:
        os.environ.clear()
        os.environ.update(saved)

def main():
    if len(sys.argv) < 2:
        print("Usage: python docusign_copy_to_dev.py <TEMPLATE_NAME>")
        sys.exit(1)
    target_name = sys.argv[1]
    dry_run = "--dry-run" in sys.argv

    print("Getting PRD token...")
    p_tok = get_token_isolation(PRD_DIR, "https://account.docusign.com")
    print(f"  PRD token OK: {p_tok[:20]}...")

    print("Getting DEV token...")
    d_tok = get_token_isolation(DEV_DIR, "https://account-d.docusign.com")
    print(f"  DEV token OK: {d_tok[:20]}...")

    p_headers = {"Authorization": f"Bearer {p_tok}"}
    d_headers = {"Authorization": f"Bearer {d_tok}"}

    print(f"\nSearching PRD ({PRD_ACCT}) for '{target_name}'...")
    all_templates = []
    for start in range(0, 200, 100):
        r = requests.get(
            f"{PRD_V2}/accounts/{PRD_ACCT}/templates",
            params={"count": 100, "start_position": start},
            headers=p_headers, timeout=30
        )
        r.raise_for_status()
        all_templates.extend(r.json().get("envelopeTemplates", []))

    match = None
    for t in all_templates:
        if target_name.lower() in t.get("name", "").lower():
            match = t
            break

    if not match:
        print(f"Template '{target_name}' not found in PRD.")
        print("Available PRD templates:")
        for t in all_templates:
            print(f"  - '{t.get('name', '(no name)')}' (id={t.get('templateId','?')})")
        sys.exit(1)

    prd_tid = match["templateId"]
    name = match["name"]
    print(f"Found: '{name}' (templateId={prd_tid})")

    print(f"\nFetching template definition...")
    r = requests.get(
        f"{PRD_V2}/accounts/{PRD_ACCT}/templates/{prd_tid}",
        params={"include": "documents,recipients,tabs,notifications,custom_fields"},
        headers=p_headers, timeout=30
    )
    r.raise_for_status()
    definition = r.json()

    docs = definition.get("documents", [])
    recipients = definition.get("recipients", {})
    print(f"  Documents:  {len(docs)}")
    print(f"  Signers:     {len(recipients.get('signers', []))}")
    print(f"  CC:          {len(recipients.get('carbonCopies', []))}")

    if dry_run:
        print(f"\nDry-run -- no changes. PRD untouched.")
        return

    tmp = Path(f"/tmp/_copy_prd_{prd_tid[:8]}")
    if tmp.exists():
        shutil.rmtree(tmp)
    tmp.mkdir(parents=True)

    doc_contents = {}
    for doc in docs:
        did = doc.get("documentId")
        dname = doc.get("name", f"doc_{did}")
        print(f"\n  Downloading '{dname}' (id={did})...", end=" ")
        r = requests.get(
            f"{PRD_V2}/accounts/{PRD_ACCT}/templates/{prd_tid}/documents/{did}",
            headers=p_headers, timeout=60
        )
        if r.status_code == 200:
            content = r.content
            (tmp / f"doc_{did}.pdf").write_bytes(content)
            doc_contents[did] = base64.b64encode(content).decode()
            print(f"{len(content)/1024:.0f}KB")
        else:
            print(f"HTTP {r.status_code}")
            if "documentBase64" in doc:
                doc_contents[did] = doc["documentBase64"]

    old_doc_ids = [str(d.get("documentId")) for d in docs]
    doc_id_map = {old: str(i+1) for i, old in enumerate(old_doc_ids)}
    print(f"\n  Doc ID mapping: {doc_id_map}")

    import copy
    def remap_tabs(obj):
        if isinstance(obj, dict):
            if "documentId" in obj:
                old = str(obj["documentId"])
                if old in doc_id_map:
                    obj["documentId"] = doc_id_map[old]
            for v in obj.values():
                remap_tabs(v)
        elif isinstance(obj, list):
            for item in obj:
                remap_tabs(item)

    recipients_copy = copy.deepcopy(recipients)
    remap_tabs(recipients_copy)

    payload = {
        "name": name,
        "emailSubject": definition.get("emailSubject", "Please sign"),
        "emailBlurb": definition.get("emailBlurb", ""),
        "status": "created",
        "documents": [
            dict(
                {"documentId": doc_id_map[str(d.get("documentId"))],
                 "name": d.get("name", f"doc_{d.get('documentId')}"),
                 "fileExtension": d.get("fileExtension", "pdf"),
                 "documentBase64": doc_contents.get(d.get("documentId"), "")},
                **({"isDocGenDocument": True} if d.get("isDocGenDocument") else {}),
                **({"docGenFormFields": d["docGenFormFields"]} if d.get("docGenFormFields") else {}),
            )
            for i, d in enumerate(docs)
        ],
        "recipients": recipients_copy,
    }
    # Forward DocGen template flag
    if definition.get("isDocGenTemplate"):
        payload["isDocGenTemplate"] = True
    # Forward other template-level fields
    for field in ["notification", "customFields", "brandId", "brandLock",
                  "signingLocation", "enableWetSign", "allowMarkup", "allowReassign",
                  "enforceSignerVisibility", "emailSettings"]:
        if field in definition:
            payload[field] = definition[field]

    print(f"\nCreating template in DEV ({DEV_ACCT})...")
    resp = requests.post(
        f"{DEV_V2}/accounts/{DEV_ACCT}/templates",
        json=payload, headers={**d_headers, "Content-Type": "application/json"}, timeout=60
    )

    if resp.status_code in (200, 201):
        result = resp.json()
        new_id = result.get("templateId", "?")
        print(f"\nTemplate created in DEV!")
        print(f"    Name:        {name}")
        print(f"    TemplateId:  {new_id}")
        print(f"    DEV Account: {DEV_ACCT}")
        print(f"    Source:      PRD {PRD_ACCT} (read-only)")
    else:
        print(f"\nFailed: HTTP {resp.status_code}")
        print(f"    {resp.text[:1000]}")
        (tmp / "debug_payload.json").write_text(json.dumps(payload, indent=2))
        sys.exit(1)

    shutil.rmtree(tmp)
    print(f"\nDone. No changes made to PRD ({PRD_ACCT}).")

if __name__ == "__main__":
    main()
