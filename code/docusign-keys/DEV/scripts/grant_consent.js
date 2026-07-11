#!/usr/bin/env node
// Auto-grant consent via CDP-driven Chromium
const CDP = require('/home/wang/wk/code/docusign-keys/node_modules/chrome-remote-interface');
const fs = require('fs');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const targets = await CDP.List();
  const target = targets.find(t => t.type === 'page' && t.url.includes('docusign'));
  console.log('Tab:', target.url);
  const attached = await CDP({ target });
  const { Page, Runtime } = attached;
  await Page.enable(); await Runtime.enable();

  // First, ensure redirect URI is configured
  console.log('[1] Going to apps-and-keys...');
  await Page.navigate({ url: 'https://admindemo.docusign.com/admin/apps-and-keys' });
  await sleep(7000);

  // Edit app
  console.log('[2] Editing app...');
  await Runtime.evaluate({
    expression: `
      (function() {
        const rows = document.querySelectorAll('tr, [role="row"]');
        for (const row of rows) {
          if (row.textContent.includes('easy-hire-docusign-integration')) {
            const buttons = row.querySelectorAll('button, a, [role="button"]');
            for (const b of buttons) {
              if (/actions/i.test(b.textContent || '')) { b.click(); return; }
            }
            break;
          }
        }
      })();
    `
  });
  await sleep(1500);
  await Runtime.evaluate({
    expression: `
      (function() {
        const items = document.querySelectorAll('li, button, a, [role="menuitem"]');
        for (const i of items) {
          if (/^edit$/i.test((i.textContent || '').trim())) { i.click(); return; }
        }
      })();
    `
  });
  await sleep(5000);

  // Add redirect URI
  console.log('[3] Adding redirect URI...');
  const r1 = await Runtime.evaluate({
    expression: `
      (function() {
        const allBtns = Array.from(document.querySelectorAll('button, a, [role="button"]'));
        const addUri = allBtns.find(b => /add uri/i.test(b.textContent || ''));
        if (addUri) { addUri.click(); return true; }
        return false;
      })();
    `,
    returnByValue: true,
  });
  console.log('  Add URI clicked:', r1.result.value);
  await sleep(1500);

  // Fill redirect URI
  const r2 = await Runtime.evaluate({
    expression: `
      (function() {
        const inputs = Array.from(document.querySelectorAll('input[type="text"], input[type="url"], input:not([type])'));
        const visible = inputs.filter(i => i.offsetParent !== null && !i.disabled);
        if (visible.length === 0) return { count: 0 };
        // Find the most recently appeared input
        const last = visible[visible.length - 1];
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(last, 'http://localhost:5000/auth/callback');
        last.dispatchEvent(new Event('input', { bubbles: true }));
        last.dispatchEvent(new Event('change', { bubbles: true }));
        return { filled: true, placeholder: last.placeholder, name: last.name };
      })();
    `,
    returnByValue: true,
  });
  console.log('  URI filled:', JSON.stringify(r2.result.value));
  await sleep(1500);

  // Click Save at the bottom
  console.log('[4] Saving...');
  await Runtime.evaluate({
    expression: `
      (function() {
        const allBtns = Array.from(document.querySelectorAll('button, a, [role="button"]'));
        const save = allBtns.find(b => /^save$|update/i.test((b.textContent || '').trim()));
        if (save) { save.click(); return save.textContent.trim(); }
        return null;
      })();
    `,
    returnByValue: true,
  });
  await sleep(5000);

  // Now visit consent URL
  console.log('[5] Visiting consent URL...');
  const consentUrl = 'https://account-d.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=9addabe1-1ad2-4e78-8270-4f53c29fd98c&redirect_uri=http://localhost:5000/auth/callback';
  await Page.navigate({ url: consentUrl });
  await sleep(8000);

  // Get URL and check for consent form
  const url = await Runtime.evaluate({ expression: 'window.location.href', returnByValue: true });
  console.log('  URL after consent:', url.result.value);
  const title = await Runtime.evaluate({ expression: 'document.title', returnByValue: true });
  console.log('  Title:', title.result.value);

  // Find Accept button
  const r3 = await Runtime.evaluate({
    expression: `
      (function() {
        const allBtns = Array.from(document.querySelectorAll('button, a, [role="button"], input[type="submit"]'));
        return allBtns.map(b => (b.textContent || b.value || '').trim()).filter(t => t.length > 0).slice(0, 30);
      })();
    `,
    returnByValue: true,
  });
  console.log('  Buttons:', r3.result.value);

  // Click Accept / Allow
  const r4 = await Runtime.evaluate({
    expression: `
      (function() {
        const allBtns = Array.from(document.querySelectorAll('button, a, [role="button"], input[type="submit"]'));
        const accept = allBtns.find(b => /accept|allow|grant|agree|continue|authorize/i.test(b.textContent || b.value || ''));
        if (accept) { accept.click(); return accept.textContent.trim() || accept.value; }
        return null;
      })();
    `,
    returnByValue: true,
  });
  console.log('  Accept clicked:', r4.result.value);
  await sleep(6000);

  const url2 = await Runtime.evaluate({ expression: 'window.location.href', returnByValue: true });
  console.log('  Final URL:', url2.result.value);

  const ss = await Page.captureScreenshot({ format: 'png' });
  fs.writeFileSync('/tmp/ulw-docusign-consent.png', Buffer.from(ss.data, 'base64'));

  await attached.close();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
