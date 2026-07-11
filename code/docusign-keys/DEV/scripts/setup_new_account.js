const CDP = require('/home/wang/wk/code/docusign-keys/node_modules/chrome-remote-interface');
const fs = require('fs');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const targets = await CDP.List();
  const target = targets.find(t => t.type === 'page' && t.url.includes('docusign'));
  const att = await CDP({ target });
  const { Page, Runtime } = att;
  await Page.enable(); await Runtime.enable();

  // 1. Go to Admin > Users to find Ross Wang and get his User GUID
  console.log('[1] Going to Admin > Users...');
  await Page.navigate({ url: 'https://apps-d.docusign.com/admin/users' });
  await sleep(7000);
  const url1 = await Runtime.evaluate({ expression: 'window.location.href', returnByValue: true });
  console.log('  URL:', url1.result.value);

  // 2. Find Ross Wang row, click Actions → Edit
  console.log('[2] Looking for Ross Wang row...');
  const rowRes = await Runtime.evaluate({
    expression: `
      (function() {
        const rows = document.querySelectorAll('tr, [role="row"]');
        for (const row of rows) {
          if (row.textContent.includes('Ross Wang') && row.textContent.length < 500) {
            const buttons = Array.from(row.querySelectorAll('button, a, [role="button"]'));
            return { found: true, buttons: buttons.map(b => b.textContent.trim()) };
          }
        }
        return { found: false };
      })();
    `,
    returnByValue: true,
  });
  console.log('  Row:', JSON.stringify(rowRes.result.value));
  if (!rowRes.result.value.found) {
    console.error('Ross Wang row not found');
    process.exit(1);
  }

  // Click Actions
  await Runtime.evaluate({
    expression: `
      (function() {
        const rows = document.querySelectorAll('tr, [role="row"]');
        for (const row of rows) {
          if (row.textContent.includes('Ross Wang') && row.textContent.length < 500) {
            const buttons = Array.from(row.querySelectorAll('button, a, [role="button"]'));
            for (const b of buttons) {
              if (b.textContent.trim().toLowerCase() === 'actions') { b.click(); return true; }
            }
          }
        }
      })();
    `
  });
  await sleep(1500);
  // Click Edit
  await Runtime.evaluate({
    expression: `
      (function() {
        const items = Array.from(document.querySelectorAll('li, button, a, [role="menuitem"]'));
        for (const i of items) {
          if (/^edit$/i.test((i.textContent || '').trim())) { i.click(); return true; }
        }
      })();
    `
  });
  await sleep(4000);

  const url2 = await Runtime.evaluate({ expression: 'window.location.href', returnByValue: true });
  console.log('[3] After Edit URL:', url2.result.value);

  // Extract user GUID from URL
  const guidMatch = url2.result.value.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  const userId = guidMatch ? guidMatch[0] : '';
  console.log('  User ID from URL:', userId);

  // 4. Go to Apps and Keys to create new app
  console.log('[4] Going to Apps and Keys...');
  await Page.navigate({ url: 'https://apps-d.docusign.com/admin/apps-and-keys' });
  await sleep(7000);

  // 5. Click Add App and Integration Key
  console.log('[5] Clicking Add App and Integration Key...');
  await Runtime.evaluate({
    expression: `
      (function() {
        const btns = Array.from(document.querySelectorAll('button, a, [role="button"]'));
        const add = btns.find(b => /add app and integration key/i.test(b.textContent || ''));
        if (add) { add.scrollIntoView({block: 'center'}); add.click(); return true; }
        return false;
      })();
    `,
    returnByValue: true,
  });
  await sleep(4000);

  // 6. Fill name
  console.log('[6] Filling name...');
  await Runtime.evaluate({
    expression: `
      (function() {
        const inputs = Array.from(document.querySelectorAll('input[type="text"], input:not([type])'));
        for (const inp of inputs) {
          if (!inp.offsetParent || inp.disabled) continue;
          const ph = (inp.placeholder || '').toLowerCase();
          const lbl = (inp.closest('label')?.textContent || inp.getAttribute('aria-label') || inp.name || inp.id || '').toLowerCase();
          if (ph.includes('name') || lbl.includes('name') || ph.includes('app') || lbl.includes('app') || ph.includes('integration')) {
            const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            setter.call(inp, 'easy-hire-docusign-integration-v2');
            inp.dispatchEvent(new Event('input', { bubbles: true }));
            inp.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
          }
        }
      })();
    `,
    returnByValue: true,
  });
  await sleep(2000);

  // 7. Click Create App
  console.log('[7] Clicking Create App...');
  const saveRes = await Runtime.evaluate({
    expression: `
      (function() {
        const btns = Array.from(document.querySelectorAll('button, a, [role="button"]'));
        const create = btns.find(b => /create app|^create$|add app/i.test((b.textContent || '').trim()));
        if (create) { create.click(); return create.textContent.trim(); }
        // Fallback
        const fb = btns.find(b => /^(save|add|create|done)$/i.test((b.textContent || '').trim()));
        if (fb) { fb.click(); return fb.textContent.trim(); }
        return null;
      })();
    `,
    returnByValue: true,
  });
  console.log('  Clicked:', saveRes.result.value);
  await sleep(6000);

  // 8. Capture Integration Key from page
  const keyRes = await Runtime.evaluate({
    expression: `
      (function() {
        const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
        const found = inputs.map(i => ({ id: i.id, value: i.value, visible: i.offsetParent !== null })).filter(i => i.visible && /[0-9a-f]/.test(i.value));
        const all = document.body.innerText;
        const guids = all.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi);
        return { inputs: found, guids: guids ? Array.from(new Set(guids)) : [] };
      })();
    `,
    returnByValue: true,
  });
  console.log('[8] Keys:', JSON.stringify(keyRes.result.value, null, 2));

  // Take screenshot
  const ss = await Page.captureScreenshot({ format: 'png' });
  fs.writeFileSync('/tmp/ulw-docusign-new-app.png', Buffer.from(ss.data, 'base64'));

  // Save all info to a JSON file
  const output = {
    userId,
    accountId: '45445035',
    integrationKey: keyRes.result.value.guids[0] || '',
    email: 'ross.wang@te.com',
    timestamp: new Date().toISOString()
  };
  fs.writeFileSync('/home/wang/wk/code/docusign-keys/new_account_info.json', JSON.stringify(output, null, 2));
  console.log('\nSaved to /home/wang/wk/code/docusign-keys/new_account_info.json');
  console.log(JSON.stringify(output, null, 2));

  await att.close();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
