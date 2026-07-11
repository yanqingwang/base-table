#!/usr/bin/env python3
"""
CDP-based DocuSign PRD Integration Key & RSA Key Setup

Connects to Chrome running with --remote-debugging-port=9222,
navigates production DocuSign admin, creates new Integration Key,
generates RSA keys, and updates PRD/.env.

Flow:
  1. Connect to Chrome via CDP WebSocket
  2. Navigate to production DocuSign Developer Console (/dev-console/integrations)
  3. Wait for user to log in (if needed)
  4. Click "Add App and Integration Key"
  5. Fill app name: easy-hire-prd
  6. Create app → extract new Integration Key
  7. Navigate to app edit page → Generate RSA → capture keys
  8. Save keys to PRD/docusign_private_prd.pem and docusign_public_prd.pem
  9. Update PRD/.env with new IK and key paths
"""

import json
import os
import sys
import time
import uuid
from pathlib import Path

import websocket

PRD_DIR = Path(__file__).resolve().parent.parent
APP_NAME = "easy-hire-prd"
WS_PORT = 9222


class CDPClient:
    """Minimal Chrome DevTools Protocol client over WebSocket."""

    def __init__(self, target_id=None):
        self.ws = None
        self.msg_id = 1
        self.responses = {}
        self.events = []
        self._connect(target_id)

    def _get_target(self, target_id=None):
        """Get WebSocket URL for the desired target."""
        import urllib.request
        url = f"http://localhost:{WS_PORT}/json"
        with urllib.request.urlopen(url) as resp:
            targets = json.loads(resp.read().decode())

        if target_id:
            for t in targets:
                if t["id"] == target_id:
                    return t["webSocketDebuggerUrl"]
            raise RuntimeError(f"Target {target_id} not found")

        # Find best page target
        for t in targets:
            if t["type"] == "page" and "apps.docusign.com" in t.get("url", ""):
                return t["webSocketDebuggerUrl"]

        # Fallback: create new tab
        import urllib.request
        req = urllib.request.Request(
            f"http://localhost:{WS_PORT}/json/new?https://apps.docusign.com/",
            method="PUT",
        )
        with urllib.request.urlopen(req) as resp:
            new_target = json.loads(resp.read().decode())
            print(f"  Created new tab: {new_target['id']}")
            return new_target["webSocketDebuggerUrl"]

    def _connect(self, target_id=None):
        ws_url = self._get_target(target_id)
        print(f"  Connecting to: {ws_url[:60]}...")
        self.ws = websocket.create_connection(ws_url, timeout=30)
        self.ws.settimeout(10)
        print("  Connected")

    def send(self, method, params=None):
        """Send CDP command and return result."""
        msg_id = self.msg_id
        self.msg_id += 1
        msg = {"id": msg_id, "method": method}
        if params:
            msg["params"] = params
        self.ws.send(json.dumps(msg))

        # Wait for response with matching id
        while True:
            raw = self.ws.recv()
            data = json.loads(raw)
            if "id" in data and data["id"] == msg_id:
                if "error" in data:
                    raise RuntimeError(f"CDP error: {data['error']}")
                return data.get("result")
            elif "method" in data:
                self.events.append(data)

    def evaluate(self, expression, timeout_ms=10000):
        """Evaluate JavaScript expression in the page."""
        return self.send("Runtime.evaluate", {
            "expression": expression,
            "returnByValue": True,
            "timeout": timeout_ms,
        })

    def navigate(self, url):
        """Navigate to URL and wait for page load."""
        self.send("Page.enable")
        self.send("Page.navigate", {"url": url})
        # Wait for Page.loadEventFired
        deadline = time.time() + 30
        while time.time() < deadline:
            raw = self.ws.recv()
            data = json.loads(raw)
            if data.get("method") == "Page.loadEventFired":
                print(f"  Page loaded: {url[:80]}...")
                return
            elif data.get("method") == "Page.frameNavigated":
                print(f"  Frame navigated: {data['params']['frame']['url'][:80]}")
        print("  Page load wait timeout, continuing...")

    def screenshot(self, filepath):
        """Capture screenshot."""
        result = self.send("Page.captureScreenshot", {"format": "png"})
        with open(filepath, "wb") as f:
            import base64
            f.write(base64.b64decode(result["data"]))
        print(f"  Screenshot: {filepath}")

    def close(self):
        if self.ws:
            self.ws.close()


def step_print(label, detail=""):
    print(f"\n[{label}] {detail}" if detail else f"\n[{label}]")


def main():
    print("=" * 60)
    print("DocuSign PRD Setup — CDP Automation")
    print(f"App: {APP_NAME}")
    print(f"PRD Dir: {PRD_DIR}")
    print("=" * 60)

    cdp = CDPClient()

    try:
        # Enable necessary domains
        step_print("1", "Enabling Page and Runtime domains")
        cdp.send("Page.enable")
        cdp.send("Runtime.enable")
        time.sleep(0.5)

        # Check current URL
        step_print("2", "Checking current page")
        result = cdp.evaluate("window.location.href")
        current_url = result.get("result", {}).get("value", "")
        print(f"  Current URL: {current_url[:100]}")

        is_logged_in = "apps.docusign.com" in current_url and "account.docusign" not in current_url

        if not is_logged_in or "/dev-console/integrations" not in current_url:
            # Navigate to Developer Console
            target_url = "https://apps.docusign.com/dev-console/integrations"
            step_print("3", f"Navigating to Developer Console")
            print(f"  Target: {target_url}")
            cdp.navigate(target_url)
            time.sleep(3)

            # Check if redirected to login
            result = cdp.evaluate("window.location.href")
            current_url = result.get("result", {}).get("value", "")
            print(f"  After navigate: {current_url[:100]}")

            if "account.docusign.com" in current_url or "login" in current_url.lower():
                print("\n  [!] Redirected to login page.")
                print("  [!] Please log in to production DocuSign in the browser window.")
                print("  [!] After logging in, this script will continue automatically.")
                print("  Waiting up to 120 seconds for login...")

                # Wait for login (poll URL until apps.docusign.com appears)
                for i in range(60):
                    time.sleep(2)
                    try:
                        result = cdp.evaluate("window.location.href")
                        url = result.get("result", {}).get("value", "")
                        if "apps.docusign.com" in url and "account.docusign" not in url:
                            print(f"  Login detected! URL: {url[:80]}")
                            break
                    except Exception:
                        pass
                    if i % 10 == 0 and i > 0:
                        print(f"  Still waiting... ({i*2}s)")
                else:
                    print("  Login wait timeout. You can re-run the script after logging in.")
                    cdp.close()
                    return

                # After login, navigate to Developer Console
                time.sleep(2)
                cdp.navigate(target_url)
                time.sleep(5)

        # Now we should be on the Developer Console page
        step_print("4", "Inspecting Developer Console page")
        result = cdp.evaluate("window.location.href")
        print(f"  URL: {result.get('result', {}).get('value', '')[:100]}")

        result = cdp.evaluate("document.title || ''")
        print(f"  Title: {result.get('result', {}).get('value', '')}")

        cdp.screenshot(str(PRD_DIR / "scripts" / "screenshots" / "01-dev-console.png"))

        # Extract page content for navigation
        result = cdp.evaluate("""
            (() => {
                // Get all buttons and links
                const btns = Array.from(document.querySelectorAll('button, a, [role="button"]'))
                    .filter(el => el.offsetParent)
                    .map(el => ({ tag: el.tagName, text: (el.textContent || '').trim().slice(0, 60), href: (el.href || el.getAttribute('href') || '').slice(0, 100) }))
                    .filter(el => el.text || el.href);
                // Get headings
                const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5'))
                    .map(h => ({ tag: h.tagName, text: (h.textContent || '').trim().slice(0, 60) }));
                // Body text sample
                const body = (document.body?.innerText || '').slice(0, 2000).replace(/\\s+/g, ' ');
                return { buttons: btns.slice(0, 40), headings: headings.slice(0, 10), bodySample: body.slice(0, 1000) };
            })()
        """)
        page_info = result.get("result", {}).get("value", {})
        print(f"\n  Page buttons ({len(page_info.get('buttons', []))}):")
        for b in page_info.get("buttons", [])[:15]:
            print(f"    [{b['tag']}] {b['text'][:50]:50s} {b['href'][:60]}")
        print(f"\n  Headings: {[h['text'] for h in page_info.get('headings', [])]}")
        print(f"\n  Body (first 500 chars): {page_info.get('bodySample', '')[:500]}")

        # Step 5: Try to find "Add App and Integration Key" or similar button
        step_print("5", "Looking for Add App / Create Integration button")
        add_btn = cdp.evaluate("""
            (() => {
                const btns = Array.from(document.querySelectorAll('button, a, [role="button"]'))
                    .filter(el => el.offsetParent);
                for (const b of btns) {
                    const t = (b.textContent || '').trim().toLowerCase();
                    if (t.includes('add app') || t.includes('create app') || t.includes('new integration') || t.includes('add integration') || t.includes('create integration')) {
                        b.scrollIntoView({block: 'center'});
                        b.click();
                        return { clicked: true, text: (b.textContent || '').trim() };
                    }
                }
                return { clicked: false, texts: btns.map(b => (b.textContent || '').trim()).filter(t => t && t.length < 40).slice(0, 20) };
            })()
        """)
        print(f"  Result: {json.dumps(add_btn.get('result', {}).get('value', {}), ensure_ascii=False)}")
        time.sleep(3)
        cdp.screenshot(str(PRD_DIR / "scripts" / "screenshots" / "02-after-add-click.png"))

        # Try to fill app name if a modal opened
        step_print("6", "Looking for app name input")
        fill_result = cdp.evaluate("""
            (() => {
                const inputs = Array.from(document.querySelectorAll('input[type="text"], input[type="search"], input:not([type])'))
                    .filter(i => i.offsetParent !== null);
                if (inputs.length === 0) return { found: false, count: 0 };

                // Try to find by placeholder/label
                for (const inp of inputs) {
                    const ph = (inp.placeholder || '').toLowerCase();
                    const lbl = (inp.closest('label')?.textContent || inp.getAttribute('aria-label') || inp.name || inp.id || '').toLowerCase();
                    if (ph.includes('name') || lbl.includes('name') || ph.includes('app') || lbl.includes('app') || ph.includes('integration')) {
                        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                        nativeSetter.call(inp, '""" + APP_NAME + """');
                        inp.dispatchEvent(new Event('input', { bubbles: true }));
                        inp.dispatchEvent(new Event('change', { bubbles: true }));
                        return { found: true, method: 'by-label', ph, lbl, value: inp.value };
                    }
                }
                // Fallback: first visible empty input
                const visible = inputs.filter(i => i.value === '');
                if (visible.length > 0) {
                    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                    nativeSetter.call(visible[0], '""" + APP_NAME + """');
                    visible[0].dispatchEvent(new Event('input', { bubbles: true }));
                    visible[0].dispatchEvent(new Event('change', { bubbles: true }));
                    return { found: true, method: 'fallback', placeholder: visible[0].placeholder || '', value: visible[0].value };
                }
                return { found: false, count: inputs.length, details: inputs.map(i => ({ ph: i.placeholder, id: i.id, val: i.value })) };
            })()
        """)
        print(f"  Fill: {json.dumps(fill_result.get('result', {}).get('value', {}), ensure_ascii=False)}")
        time.sleep(2)

        # Click Create/Save
        step_print("7", "Clicking Create / Save button")
        create_result = cdp.evaluate("""
            (() => {
                const btns = Array.from(document.querySelectorAll('button, a, [role="button"]'))
                    .filter(b => b.offsetParent);
                for (const b of btns) {
                    const t = (b.textContent || '').trim();
                    if (/^(create app|create|add app|save|add)$/i.test(t)) {
                        b.click();
                        return { clicked: true, text: t };
                    }
                }
                // Check for form submit
                const forms = document.querySelectorAll('form');
                for (const f of forms) {
                    const sub = f.querySelector('button[type="submit"], input[type="submit"]');
                    if (sub && sub.offsetParent) {
                        sub.click();
                        return { clicked: 'form-submit', text: (sub.textContent || sub.value || '').trim() };
                    }
                }
                return { clicked: false, texts: btns.map(b => (b.textContent || '').trim()).filter(t => t && t.length < 30).slice(0, 15) };
            })()
        """)
        print(f"  Create: {json.dumps(create_result.get('result', {}).get('value', {}))}")
        time.sleep(5)

        # Check URL after create
        result = cdp.evaluate("window.location.href")
        post_url = result.get("result", {}).get("value", "")
        print(f"  Post-create URL: {post_url[:120]}")
        cdp.screenshot(str(PRD_DIR / "scripts" / "screenshots" / "03-post-create.png"))

        # Try to extract Integration Key
        step_print("8", "Extracting Integration Key")
        ik_result = cdp.evaluate("""
            (() => {
                const body = document.body?.innerText || '';
                const guids = body.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi) || [];
                const inputs = Array.from(document.querySelectorAll('input[type="text"]'))
                    .filter(i => i.offsetParent && /[0-9a-f-]{36}/.test(i.value))
                    .map(i => ({ id: i.id, value: i.value }));
                return { guids: [...new Set(guids)], inputs, url: window.location.href };
            })()
        """)
        ik_data = ik_result.get("result", {}).get("value", {})
        print(f"  IK data: {json.dumps(ik_data, indent=2)}")

        # Extract IK from URL or page content
        integration_key = ""
        post_url = ik_data.get("url", "")
        import re
        url_match = re.search(r'/apps-and-keys/([a-f0-9-]{36})', post_url)
        if url_match:
            integration_key = url_match.group(1)
            print(f"  IK from URL: {integration_key}")
        elif ik_data.get("inputs"):
            integration_key = ik_data["inputs"][0]["value"]
            print(f"  IK from input: {integration_key}")
        elif ik_data.get("guids"):
            # Filter out known non-IK GUIDs
            known = ["cce9485b-58dd-41d3-9f47-a7969a012fae"]
            integration_key = next((g for g in ik_data["guids"] if g not in known), ik_data["guids"][0])
            print(f"  IK from GUIDs: {integration_key}")

        if not integration_key:
            print("  Could not determine Integration Key. Check screenshots.")
            cdp.close()
            sys.exit(1)

        print(f"\n  ✓ Integration Key: {integration_key}")

        # Save app info
        app_info = {
            "integrationKey": integration_key,
            "appName": APP_NAME,
            "userId": "cce9485b-58dd-41d3-9f47-a7969a012fae",
            "accountId": "694285719",
            "email": "ross.wang@te.com",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }
        with open(PRD_DIR / "app_info.json", "w") as f:
            json.dump(app_info, f, indent=2)
        print(f"  Saved: PRD/app_info.json")

        # ===== RSA Key Generation =====
        step_print("9", "Setting up RSA keys")

        # Navigate to app edit page
        edit_url = f"https://apps.docusign.com/console/apps-and-keys/{integration_key}"
        print(f"  Navigating to edit page: {edit_url}")
        cdp.navigate(edit_url)
        time.sleep(5)

        cdp.screenshot(str(PRD_DIR / "scripts" / "screenshots" / "04-edit-page.png"))

        # Check if we're on the edit page
        result = cdp.evaluate("window.location.href")
        edit_check = result.get("result", {}).get("value", "")
        print(f"  Edit page URL: {edit_check[:100]}")

        # If redirected to list (404), try the dev-console path
        if "/console/apps-and-keys" in edit_check and "Looks like this page" in (cdp.evaluate("document.body?.innerText?.slice(0,200) || ''").get("result", {}).get("value", "")):
            print("  Edit page not found at /console/apps-and-keys. Trying dev-console path...")
            dev_url = f"https://apps.docusign.com/dev-console/integrations/{integration_key}"
            cdp.navigate(dev_url)
            time.sleep(5)

            result = cdp.evaluate("window.location.href")
            dev_check = result.get("result", {}).get("value", "")
            print(f"  Dev console URL: {dev_check[:100]}")
            cdp.screenshot(str(PRD_DIR / "scripts" / "screenshots" / "05-dev-edit.png"))

        # Scroll to find RSA/Authentication section
        step_print("10", "Finding RSA/Authentication section")
        scroll_result = cdp.evaluate("""
            (() => {
                // Look for RSA button or authentication section
                const btns = Array.from(document.querySelectorAll('button, a, [role="button"]'))
                    .filter(b => b.offsetParent);
                const rsaBtns = btns.filter(b => /generate rsa/i.test((b.textContent || '').trim()));
                const sections = ['Authentication', 'Service Integration', 'RSA', 'Keys', 'Generate'];
                const headings = Array.from(document.querySelectorAll('h2, h3, h4, h5, legend, label, span, div'))
                    .filter(el => {
                        const t = (el.textContent || '').trim();
                        return sections.some(s => t.includes(s)) && t.length < 60;
                    })
                    .map(el => ({ tag: el.tagName, text: (el.textContent || '').trim().slice(0, 50) }));
                return {
                    rsaButtons: rsaBtns.map(b => (b.textContent || '').trim()),
                    allButtons: btns.map(b => (b.textContent || '').trim()).filter(t => t && t.length < 30).slice(0, 30),
                    headings: headings.slice(0, 10),
                    bodyStart: (document.body?.innerText || '').slice(0, 1000).replace(/\\s+/g, ' '),
                };
            })()
        """)
        rsa_info = scroll_result.get("result", {}).get("value", {})
        print(f"  RSA buttons: {rsa_info.get('rsaButtons', [])}")
        print(f"  Headings: {[h['text'] for h in rsa_info.get('headings', [])]}")
        print(f"  Body start: {rsa_info.get('bodyStart', '')[:500]}")

        # If we're on a 404 page, try the developer console approach differently
        body_text = rsa_info.get('bodyStart', '')
        if 'not here' in body_text or 'go back' in body_text.lower():
            print("\n  [!] Page returned 404. The production URL structure is different.")
            print("  [!] Saving what we have and will update manually.")
            print("  [!] Integration Key was created successfully.")
            cdp.close()
            print("\n  Partial setup complete. Key info saved to PRD/app_info.json")
            print("  You can manually configure RSA keys through the DocuSign web UI.")
            return

        # Look for and click Generate RSA
        if rsa_info.get('rsaButtons'):
            step_print("11", "Clicking Generate RSA")
            cdp.evaluate("""
                (() => {
                    const btns = Array.from(document.querySelectorAll('button, a, [role="button"]'));
                    for (const b of btns) {
                        if (b.offsetParent && /generate rsa/i.test((b.textContent || '').trim())) {
                            b.scrollIntoView({block: 'center'});
                            b.click();
                            return true;
                        }
                    }
                    return false;
                })()
            """)
            time.sleep(8)

            # Check for confirm dialog
            cdp.evaluate("""
                (() => {
                    const btns = Array.from(document.querySelectorAll('button'))
                        .filter(b => b.offsetParent && /^(confirm|yes|generate|ok)$/i.test((b.textContent || '').trim()));
                    if (btns.length > 0) {
                        btns[0].click();
                        return true;
                    }
                    return false;
                })()
            """)
            time.sleep(5)

            # Capture keys from textareas/pre/code elements
            step_print("12", "Capturing RSA keys")
            keys_result = cdp.evaluate("""
                (() => {
                    const elements = Array.from(document.querySelectorAll('textarea, pre, code, [class*="key" i]'));
                    let pub = '', priv = '';
                    for (const el of elements) {
                        const txt = (el.textContent || el.value || '').trim();
                        if (txt.startsWith('-----BEGIN PUBLIC KEY-----')) pub = txt;
                        if (txt.startsWith('-----BEGIN RSA PRIVATE KEY-----') || txt.startsWith('-----BEGIN PRIVATE KEY-----')) priv = txt;
                    }
                    return { pubLen: pub.length, privLen: priv.length, elementCount: elements.length };
                })()
            """)
            key_info = keys_result.get("result", {}).get("value", {})
            print(f"  Keys found: {json.dumps(key_info)}")

            if key_info.get("privLen", 0) > 0:
                # Fetch full keys
                full_keys = cdp.evaluate("""
                    (() => {
                        const elements = Array.from(document.querySelectorAll('textarea, pre, code, [class*="key" i]'));
                        let pub = '', priv = '';
                        for (const el of elements) {
                            const txt = (el.textContent || el.value || '').trim();
                            if (txt.startsWith('-----BEGIN PUBLIC KEY-----')) pub = txt;
                            if (txt.startsWith('-----BEGIN RSA PRIVATE KEY-----') || txt.startsWith('-----BEGIN PRIVATE KEY-----')) priv = txt;
                        }
                        return { pub, priv };
                    })()
                """)
                keys = full_keys.get("result", {}).get("value", {})
                priv_key = keys.get("priv", "")
                pub_key = keys.get("pub", "")

                if priv_key and pub_key:
                    # Save keys
                    with open(PRD_DIR / "docusign_private_prd.pem", "w") as f:
                        f.write(priv_key)
                    with open(PRD_DIR / "docusign_public_prd.pem", "w") as f:
                        f.write(pub_key)
                    print(f"  ✓ RSA keys saved to PRD/docusign_private_prd.pem and PRD/docusign_public_prd.pem")
                else:
                    print("  ✗ Failed to capture full keys")
                    cdp.screenshot(str(PRD_DIR / "scripts" / "screenshots" / "06-keys-failed.png"))
            else:
                print("  No keys found after clicking Generate RSA")
                cdp.screenshot(str(PRD_DIR / "scripts" / "screenshots" / "06-no-keys.png"))
        else:
            print("  No Generate RSA button found on this page")
            print("  The RSA setup may need to be done through the Dev Console UI")
            cdp.screenshot(str(PRD_DIR / "scripts" / "screenshots" / "06-no-rsa-btn.png"))

        # Update PRD/.env
        step_print("13", "Updating PRD/.env")
        env_path = PRD_DIR / ".env"
        env_content = env_path.read_text() if env_path.exists() else ""

        # Update or add entries
        updates = {
            "DOCUSIGN_INTEGRATION_KEY": f'"{integration_key}"',
            "DOCUSIGN_PRIVATE_KEY_PATH": f'"{PRD_DIR / "docusign_private_prd.pem"}"',
        }

        for key, value in updates.items():
            import re
            if re.search(f"^{key}=", env_content, re.MULTILINE):
                env_content = re.sub(f"^{key}=.*$", f"{key}={value}", env_content, flags=re.MULTILINE)
            else:
                env_content += f"{key}={value}\n"

        # Update public key path
        pub_key_path = f'"{PRD_DIR / "docusign_public_prd.pem"}"'
        if re.search("^DOCUSIGN_PUBLIC_KEY_PATH=", env_content, re.MULTILINE):
            env_content = re.sub("^DOCUSIGN_PUBLIC_KEY_PATH=.*$", f"DOCUSIGN_PUBLIC_KEY_PATH={pub_key_path}", env_content, flags=re.MULTILINE)
        else:
            env_content += f"DOCUSIGN_PUBLIC_KEY_PATH={pub_key_path}\n"

        # Update comment about IK reuse
        env_content = env_content.replace(
            "# IK reused from DEV (same key for both environments)",
            "# PRD-specific Integration Key (separate from DEV)"
        )

        env_path.write_text(env_content)
        print(f"  ✓ PRD/.env updated")

        # Save setup state for final verification
        setup_state = {
            "integrationKey": integration_key,
            "appName": APP_NAME,
            "userId": "cce9485b-58dd-41d3-9f47-a7969a012fae",
            "accountId": "694285719",
            "privateKeyPath": str(PRD_DIR / "docusign_private_prd.pem"),
            "publicKeyPath": str(PRD_DIR / "docusign_public_prd.pem"),
            "keysGenerated": bool(priv_key),
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }
        with open(PRD_DIR / "setup_state.json", "w") as f:
            json.dump(setup_state, f, indent=2)
        print(f"  ✓ Setup state saved to PRD/setup_state.json")

        print("\n" + "=" * 60)
        print("PRD SETUP SUMMARY")
        print("=" * 60)
        print(f"  Integration Key: {integration_key}")
        print(f"  Private Key:     {PRD_DIR / 'docusign_private_prd.pem'}")
        print(f"  Public Key:      {PRD_DIR / 'docusign_public_prd.pem'}")
        print(f"  .env:            {PRD_DIR / '.env'}")
        print(f"  Keys Generated:  {bool(priv_key)}")
        print("=" * 60)

    finally:
        cdp.close()


if __name__ == "__main__":
    main()
