#!/usr/bin/env node
// Apply for DocuSign Integration Key via CDP-driven Chromium — full flow
const CDP = require('/home/wang/wk/code/docusign-keys/node_modules/chrome-remote-interface');
const fs = require('fs');

const PUBLIC_KEY_PATH = '/home/wang/wk/code/docusign-keys/docusign_public.pem';
const APP_NAME = 'easy-hire-docusign-integration';
const ENV_PATH = '/home/wang/wk/code/docusign-keys/.env';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function dumpPage(Runtime, Page, label) {
  const r1 = await Runtime.evaluate({ expression: 'document.body.innerText', returnByValue: true });
  console.log(`\n=== BODY (${label}) ===`);
  console.log((r1.result.value || '').slice(0, 4000));
  console.log('=== END ===\n');
  const ss = await Page.captureScreenshot({ format: 'png' });
  fs.writeFileSync(`/tmp/ulw-docusign-${label}.png`, Buffer.from(ss.data, 'base64'));
}

(async () => {
  try {
    const targets = await CDP.List();
    const pageTargets = targets.filter(t => t.type === 'page' && t.url.includes('apps-and-keys'));
    if (pageTargets.length === 0) {
      console.error('No Apps and Keys tab found');
      process.exit(1);
    }
    const target = pageTargets[0];
    console.log('Tab:', target.url);

    const attached = await CDP({ target });
    const { Page, Runtime, DOM } = attached;
    await Page.enable();
    await Runtime.enable();

    // Extract User ID and API Account ID from page
    console.log('[Step 1] Extracting User ID and Account ID from page...');
    const idRes = await Runtime.evaluate({
      expression: `
        (function() {
          // User ID is usually a long hex string
          const all = document.body.innerText;
          // Find all GUIDs
          const guids = all.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi);
          // Also look for hex strings (User ID is a 32-char hex)
          const hex32 = all.match(/[0-9a-f]{32,}/gi);
          return { guids: guids ? Array.from(new Set(guids)) : [], hex32: hex32 ? Array.from(new Set(hex32)) : [] };
        })();
      `,
      returnByValue: true,
    });
    console.log('  IDs found:', JSON.stringify(idRes.result.value, null, 2));
    const userId = idRes.result.value.hex32[0] || '';

    // Click "Add App and Integration Key"
    console.log('[Step 2] Clicking Add App and Integration Key...');
    await Runtime.evaluate({
      expression: `
        (function() {
          const btns = Array.from(document.querySelectorAll('button, a, [role="button"]'));
          const add = btns.find(b => /add app and integration key/i.test(b.textContent || ''));
          if (add) { add.scrollIntoView({block: 'center'}); add.click(); }
        })();
      `,
    });
    await sleep(3000);
    await dumpPage(Runtime, Page, 'modal');

    console.log('[Step 3] Looking for app name input in modal...');
    const inputRes = await Runtime.evaluate({
      expression: `
        (function() {
          const inputs = Array.from(document.querySelectorAll('input[type="text"], input[type="search"], input:not([type])'));
          return inputs.map(i => ({
            tag: i.tagName,
            type: i.type,
            name: i.name,
            id: i.id,
            placeholder: i.placeholder,
            visible: i.offsetParent !== null,
            value: i.value
          }));
        })();
      `,
      returnByValue: true,
    });
    console.log('  Inputs:', JSON.stringify(inputRes.result.value, null, 2));

    // Fill name
    console.log('[Step 4] Filling in app name...');
    await Runtime.evaluate({
      expression: `
        (function() {
          const inputs = Array.from(document.querySelectorAll('input[type="text"], input[type="search"], input:not([type])'));
          for (const inp of inputs) {
            const ph = (inp.placeholder || '').toLowerCase();
            const lbl = (inp.closest('label')?.textContent || inp.getAttribute('aria-label') || inp.name || inp.id || '').toLowerCase();
            if (ph.includes('name') || lbl.includes('name') || ph.includes('app') || lbl.includes('app') || ph.includes('integration')) {
              const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
              setter.call(inp, '${APP_NAME}');
              inp.dispatchEvent(new Event('input', { bubbles: true }));
              inp.dispatchEvent(new Event('change', { bubbles: true }));
              return { filled: true, ph, lbl };
            }
          }
          // Fallback: first visible text input
          for (const inp of inputs) {
            if (inp.offsetParent !== null && inp.type !== 'hidden') {
              const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
              setter.call(inp, '${APP_NAME}');
              inp.dispatchEvent(new Event('input', { bubbles: true }));
              inp.dispatchEvent(new Event('change', { bubbles: true }));
              return { filled: 'fallback-first-visible' };
            }
          }
          return { filled: false };
        })();
      `,
      returnByValue: true,
    });
    await sleep(2000);
    await dumpPage(Runtime, Page, 'name-filled');

    // Find file input (may be created after clicking "Add RSA Keypair" button)
    console.log('[Step 5] Looking for RSA keypair upload control...');
    const rsaRes = await Runtime.evaluate({
      expression: `
        (function() {
          const btns = Array.from(document.querySelectorAll('button, a, [role="button"], label'));
          const rsaBtn = btns.find(b => /rsa|public key|keypair|add.*key|upload.*key/i.test(b.textContent || ''));
          const fileInputs = Array.from(document.querySelectorAll('input[type="file"]'));
          return {
            rsaBtnText: rsaBtn ? rsaBtn.textContent.trim() : null,
            fileCount: fileInputs.length,
            fileInfo: fileInputs.map(f => ({ name: f.name, id: f.id, accept: f.accept, visible: f.offsetParent !== null }))
          };
        })();
      `,
      returnByValue: true,
    });
    console.log('  RSA state:', JSON.stringify(rsaRes.result.value, null, 2));

    // Click RSA add button if present
    if (rsaRes.result.value.rsaBtnText && rsaRes.result.value.fileCount === 0) {
      await Runtime.evaluate({
        expression: `
          (function() {
            const btns = Array.from(document.querySelectorAll('button, a, [role="button"], label'));
            const btn = btns.find(b => /rsa|public key|keypair|add.*key|upload.*key/i.test(b.textContent || ''));
            if (btn) btn.click();
          })();
        `,
      });
      await sleep(2500);
    }

    // Re-check file inputs
    const fileRes = await Runtime.evaluate({
      expression: `
        (function() {
          const inputs = Array.from(document.querySelectorAll('input[type="file"]'));
          if (inputs.length === 0) return null;
          inputs[0].setAttribute('data-ds-target', 'true');
          return { name: inputs[0].name, id: inputs[0].id, accept: inputs[0].accept };
        })();
      `,
      returnByValue: true,
    });
    console.log('  File check:', fileRes.result.value);

    if (fileRes.result.value) {
      const fileNode = await DOM.querySelector({ selector: 'input[type="file"][data-ds-target="true"]' });
      if (fileNode && fileNode.nodeId) {
        await DOM.setFileInputFiles({
          nodeId: fileNode.nodeId,
          files: [PUBLIC_KEY_PATH],
        });
        console.log('  ✓ Public key uploaded');
        await sleep(2500);
      } else {
        console.log('  ✗ File input node not found');
      }
    }
    await dumpPage(Runtime, Page, 'key-uploaded');

    // Click Save
    console.log('[Step 6] Clicking Save...');
    const saveRes = await Runtime.evaluate({
      expression: `
        (function() {
          const btns = Array.from(document.querySelectorAll('button, a, [role="button"]'));
          const save = btns.find(b => /^(save|add|create|done)$/i.test((b.textContent || '').trim()));
          if (save) { save.click(); return save.textContent.trim(); }
          // Fallback
          const fb = btns.find(b => /save|add app|create app/i.test((b.textContent || '').trim()));
          if (fb) { fb.click(); return fb.textContent.trim(); }
          return null;
        })();
      `,
      returnByValue: true,
    });
    console.log('  Clicked:', saveRes.result.value);
    await sleep(6000);
    await dumpPage(Runtime, Page, 'saved');

    // Extract integration key
    console.log('[Step 7] Extracting Integration Key from page...');
    const keyRes = await Runtime.evaluate({
      expression: `
        (function() {
          const all = document.body.innerText;
          const guids = all.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi);
          const hex = all.match(/[0-9a-f]{32,}/gi);
          return { guids: guids ? Array.from(new Set(guids)) : [], hex: hex ? Array.from(new Set(hex)) : [] };
        })();
      `,
      returnByValue: true,
    });
    console.log('  Keys found:', JSON.stringify(keyRes.result.value, null, 2));

    const integrationKey = keyRes.result.value.guids[0] || '';

    // Write .env
    const envContent = `# DocuSign Integration Key (Demo environment)
# Generated: ${new Date().toISOString()}
DOCUSIGN_INTEGRATION_KEY="${integrationKey}"
DOCUSIGN_USER_ID="${userId}"
DOCUSIGN_ACCOUNT_ID="44406721"
DOCUSIGN_ACCOUNT_GUID="9e0945e3-1711-4eff-8f42-31a00aba791e"
DOCUSIGN_BASE_URL="https://demo.docusign.net/restapi"
DOCUSIGN_OAUTH_BASE="https://account-d.docusign.com"
DOCUSIGN_ADMIN_BASE="https://admindemo.docusign.com"
DOCUSIGN_PRIVATE_KEY_PATH="/home/wang/wk/code/docusign-keys/docusign_private.pem"
DOCUSIGN_WEBHOOK_HMAC_SECRET="REPLACE_WITH_HMAC_SECRET"
DOCUSIGN_REDIRECT_URI="http://localhost:5000/auth/callback"
`;
    fs.writeFileSync(ENV_PATH, envContent);
    console.log('\nWrote .env to', ENV_PATH);

    console.log('\n========== SUMMARY ==========');
    console.log('User ID:', userId);
    console.log('Integration Key:', integrationKey);
    console.log('Public key file:', PUBLIC_KEY_PATH);
    console.log('.env file:', ENV_PATH);
    console.log('Screenshots: /tmp/ulw-docusign-*.png');
    console.log('============================');

    await attached.close();
    process.exit(0);
  } catch (e) {
    console.error('FATAL:', e.message);
    console.error(e.stack);
    process.exit(1);
  }
})();
