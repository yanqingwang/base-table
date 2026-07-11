#!/usr/bin/env node
/**
 * Create a NEW Integration Key (app) in PRD DocuSign account.
 *
 * PREREQ: A Chrome tab must already be open on `apps.docusign.com/console/apps-and-keys`
 *         (run login_prd.js first if not already signed in)
 *
 * This script:
 *   1. Finds a tab on apps.docusign.com (production)
 *   2. Clicks "Add App and Integration Key"
 *   3. Fills app name (easy-hire-prd)
 *   4. Clicks Save/Create
 *   5. Extracts the new Integration Key GUID
 *   6. Saves new app info to PRD/new_app_info.json
 *
 * The app is created but will NOT have RSA keys yet — run setup_prd_rsa.js next.
 */

const CDP = require('/home/wang/wk/code/docusign-keys/PRD/node_modules/chrome-remote-interface');
const fs = require('fs');
const path = require('path');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const APP_NAME = 'easy-hire-prd';
const PRD_DIR = path.resolve(__dirname, '..');

(async () => {
  const targets = await CDP.List();
  const target = targets.find(t =>
    t.type === 'page' && t.url.includes('apps.docusign.com')
  );
  if (!target) {
    console.error('No apps.docusign.com tab found. Run login_prd.js first.');
    console.error('Available page URLs:', targets.filter(t => t.type === 'page').map(t => t.url.slice(0, 120)).join('\n  '));
    process.exit(1);
  }
  console.log('Tab:', target.url);

  const attached = await CDP({ target });
  const { Page, Runtime } = attached;
  await Page.enable();
  await Runtime.enable();
  await sleep(2000);

  // Step 1: Check URL — if not on apps-and-keys, navigate there
  let curUrl = await Runtime.evaluate({ expression: 'window.location.href', returnByValue: true });
  if (!(curUrl.result.value || '').includes('/apps-and-keys')) {
    console.log('[0] Not on Apps & Keys page. Navigating...');
    await Page.navigate({ url: 'https://apps.docusign.com/console/apps-and-keys' });
    await sleep(10000);
  } else {
    console.log('[0] Already on Apps & Keys page.');
  }

  // Step 2: Click "Add App and Integration Key"
  console.log('[1] Clicking "Add App and Integration Key"...');
  await Runtime.evaluate({
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button, a, [role="button"]'));
        for (const b of btns) {
          if (b.offsetParent && /add app and integration key/i.test((b.textContent || '').trim())) {
            b.scrollIntoView({block: 'center'});
            b.click();
            return b.textContent.trim();
          }
        }
        return null;
      })();
    `,
    returnByValue: true,
  });
  await sleep(3000);

  // Step 3: Take a screenshot to see what's on screen
  const ss1 = await Page.captureScreenshot({ format: 'png' });
  fs.writeFileSync('/tmp/prd-modal.png', Buffer.from(ss1.data, 'base64'));
  console.log('  Screenshot: /tmp/prd-modal.png');

  // Step 4: Find the app name input in the modal
  console.log('[2] Looking for app name input in modal...');
  const inputRes = await Runtime.evaluate({
    expression: `
      (() => {
        const inputs = Array.from(document.querySelectorAll('input[type="text"], input[type="search"], input:not([type])'))
          .filter(i => i.offsetParent !== null);
        return inputs.map(i => ({
          tag: i.tagName,
          type: i.type,
          name: i.name,
          id: i.id,
          placeholder: i.placeholder,
          value: i.value,
          visible: i.offsetParent !== null,
        }));
      })();
    `,
    returnByValue: true,
  });
  console.log('  Inputs:', JSON.stringify(inputRes.result.value, null, 2));

  // Step 5: Fill app name
  console.log('[3] Filling app name: ' + APP_NAME);
  const fillRes = await Runtime.evaluate({
    expression: `
      (() => {
        const inputs = Array.from(document.querySelectorAll('input[type="text"], input[type="search"], input:not([type])'));
        // Try to find input by placeholder/label
        for (const inp of inputs) {
          if (!inp.offsetParent) continue;
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
        // Fallback: first visible empty text input
        const visible = inputs.filter(i => i.offsetParent && i.value === '');
        if (visible.length > 0) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(visible[0], '${APP_NAME}');
          visible[0].dispatchEvent(new Event('input', { bubbles: true }));
          visible[0].dispatchEvent(new Event('change', { bubbles: true }));
          return { filled: 'fallback-first-visible', ph: visible[0].placeholder };
        }
        return { filled: false, count: inputs.length };
      })();
    `,
    returnByValue: true,
  });
  console.log('  Fill:', JSON.stringify(fillRes.result.value));
  await sleep(2000);

  // Step 6: Look for Create/Add/Save button on modal
  console.log('[4] Clicking Create App button...');
  const createRes = await Runtime.evaluate({
    expression: `
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
        // Try submit on form
        const forms = document.querySelectorAll('form');
        for (const f of forms) {
          const submit = f.querySelector('button[type="submit"], input[type="submit"]');
          if (submit && submit.offsetParent) {
            submit.click();
            return { clicked: 'form-submit', text: (submit.textContent || submit.value || '').trim() };
          }
        }
        return { clicked: false, all: btns.map(b => (b.textContent || '').trim()).filter(t => t && t.length < 30).slice(0, 15) };
      })();
    `,
    returnByValue: true,
  });
  console.log('  Create:', JSON.stringify(createRes.result.value));
  await sleep(8000);

  // Step 7: Check if redirect happened (new app created, back to list)
  const curUrl2 = await Runtime.evaluate({ expression: 'window.location.href', returnByValue: true });
  console.log('[5] URL after create:', curUrl2.result.value);

  const ss2 = await Page.captureScreenshot({ format: 'png' });
  fs.writeFileSync('/tmp/prd-created.png', Buffer.from(ss2.data, 'base64'));
  console.log('  Screenshot: /tmp/prd-created.png');

  // Step 8: Try to extract Integration Key from the page
  // After creating, DocuSign redirects to the edit page with the IK visible
  console.log('[6] Extracting Integration Key...');
  const keyRes = await Runtime.evaluate({
    expression: `
      (() => {
        // Look for GUIDs in the page
        const body = document.body.innerText;
        const guids = body.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi);
        // Look for hex strings (API user IDs)
        const hex32 = body.match(/[0-9a-f]{32,}/gi);
        // Look for inputs with GUID values
        const inputs = Array.from(document.querySelectorAll('input[type="text"]'))
          .filter(i => i.offsetParent && /[0-9a-f-]{36}/.test(i.value));
        return {
          inputKeys: inputs.map(i => ({ id: i.id, value: i.value })),
          guids: guids ? Array.from(new Set(guids)) : [],
          hex32: hex32 ? Array.from(new Set(hex32)) : [],
          bodySample: body.slice(0, 500).replace(/\\s+/g, ' '),
        };
      })();
    `,
    returnByValue: true,
  });
  console.log('  Keys:', JSON.stringify(keyRes.result.value, null, 2));

  // Step 9: Determine the new IK
  let newIK = '';
  if (keyRes.result.value.inputKeys && keyRes.result.value.inputKeys.length > 0) {
    newIK = keyRes.result.value.inputKeys[0].value;
  } else if (keyRes.result.value.guids && keyRes.result.value.guids.length > 0) {
    // Filter out known GUIDs (user ID, account GUID, etc.)
    const known = [
      'cce9485b-58dd-41d3-9f47-a7969a012fae', // PRD user ID
    ];
    newIK = keyRes.result.value.guids.find(g => !known.includes(g)) || keyRes.result.value.guids[0];
  }

  // If on the edit page, capture URL which contains the IK
  const editUrlMatch = (curUrl2.result.value || '').match(/\/apps-and-keys\/([a-f0-9-]+)/);
  if (editUrlMatch) {
    newIK = editUrlMatch[1];
    console.log(`  IK from URL: ${newIK}`);
  }

  if (!newIK) {
    console.error('Could not determine new Integration Key. Check screenshots.');
    process.exit(1);
  }

  console.log(`\n=== NEW INTEGRATION KEY: ${newIK} ===`);

  // Save to PRD directory
  const newAppInfo = {
    integrationKey: newIK,
    appName: APP_NAME,
    userId: 'cce9485b-58dd-41d3-9f47-a7969a012fae',
    accountId: '694285719',
    email: 'ross.wang@te.com',
    timestamp: new Date().toISOString(),
    env: 'PRD (production)',
  };
  fs.writeFileSync(path.join(PRD_DIR, 'new_app_info.json'), JSON.stringify(newAppInfo, null, 2));
  console.log('Saved: PRD/new_app_info.json');

  console.log('\n[✓] App created. Next step: run setup_prd_rsa.js to generate RSA keys.');

  await attached.close();
  process.exit(0);
})().catch(e => { console.error(e.message); console.error(e.stack); process.exit(1); });
