const CDP = require('/home/wang/wk/code/docusign-keys/node_modules/chrome-remote-interface');
const fs = require('fs');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const targets = await CDP.List();
  const target = targets.find(t => t.type === 'page' && t.url.includes('admin/users'));
  const att = await CDP({ target });
  const { Page, Runtime } = att;
  await Page.enable(); await Runtime.enable();

  // Click "View all results for ross"
  console.log('[1] Clicking View all results...');
  await Runtime.evaluate({
    expression: `
      (function() {
        const allLinks = Array.from(document.querySelectorAll('a, button, div, span, li'));
        for (const el of allLinks) {
          const t = (el.textContent || '').trim();
          if (/view all results.*ross/i.test(t) && t.length < 60) {
            el.click();
            return { clicked: t };
          }
        }
        return null;
      })();
    `,
    returnByValue: true,
  });
  await sleep(3500);

  // Now find Ross Wang row
  console.log('[2] Looking for Ross Wang row...');
  const rowRes = await Runtime.evaluate({
    expression: `
      (function() {
        const rows = document.querySelectorAll('tr, [role="row"]');
        for (const row of rows) {
          if (row.textContent.includes('Ross Wang') && row.textContent.includes('ross.wang@te.com') && row.textContent.length < 600) {
            const buttons = Array.from(row.querySelectorAll('button, a, [role="button"]'));
            return { found: true, text: row.textContent.trim().slice(0, 200), buttons: buttons.map(b => b.textContent.trim()) };
          }
        }
        return { found: false };
      })();
    `,
    returnByValue: true,
  });
  console.log('  Row:', JSON.stringify(rowRes.result.value));

  if (!rowRes.result.value.found) {
    console.log('Row not found, dumping body:');
    const body = await Runtime.evaluate({ expression: 'document.body.innerText', returnByValue: true });
    console.log((body.result.value || '').slice(0, 2000));
    process.exit(1);
  }

  // Click Actions
  await Runtime.evaluate({
    expression: `
      (function() {
        const rows = document.querySelectorAll('tr, [role="row"]');
        for (const row of rows) {
          if (row.textContent.includes('Ross Wang') && row.textContent.includes('ross.wang@te.com') && row.textContent.length < 600) {
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

  const url = await Runtime.evaluate({ expression: 'window.location.href', returnByValue: true });
  console.log('[3] URL after Edit:', url.result.value);
  const guidMatch = url.result.value.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  const userId = guidMatch ? guidMatch[0] : '';
  console.log('  User ID:', userId);

  // Now go to apps-and-keys
  console.log('[4] Going to Apps and Keys...');
  await Page.navigate({ url: 'https://apps-d.docusign.com/admin/apps-and-keys' });
  await sleep(7000);

  // Click Add App
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

  // Fill name
  console.log('[6] Filling name easy-hire-docusign-integration-v2...');
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
            return { filled: true, ph, lbl };
          }
        }
        return { filled: false };
      })();
    `,
    returnByValue: true,
  });
  await sleep(2000);

  // Click Create App
  console.log('[7] Clicking Create App...');
  const saveRes = await Runtime.evaluate({
    expression: `
      (function() {
        const btns = Array.from(document.querySelectorAll('button, a, [role="button"]'));
        const create = btns.find(b => /^create app$|add app|^create$/i.test((b.textContent || '').trim()));
        if (create) { create.click(); return create.textContent.trim(); }
        // Last resort
        const btnsAll = btns.map(b => b.textContent.trim()).filter(t => t.length > 0 && t.length < 30);
        return { tried: btnsAll };
      })();
    `,
    returnByValue: true,
  });
  console.log('  Result:', JSON.stringify(saveRes.result.value));
  await sleep(6000);

  // Capture new Integration Key
  const keyRes = await Runtime.evaluate({
    expression: `
      (function() {
        const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
        const found = inputs.map(i => ({ id: i.id, value: i.value, visible: i.offsetParent !== null })).filter(i => i.visible && /[0-9a-f-]{36}/.test(i.value));
        const all = document.body.innerText;
        const guids = all.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi);
        return { inputs: found, guids: guids ? Array.from(new Set(guids)).slice(0, 5) : [] };
      })();
    `,
    returnByValue: true,
  });
  console.log('[8] Keys:', JSON.stringify(keyRes.result.value, null, 2));

  // Save info
  const output = {
    userId,
    accountId: '45445035',
    integrationKey: (keyRes.result.value.inputs[0] && keyRes.result.value.inputs[0].value) || (keyRes.result.value.guids && keyRes.result.value.guids[0]) || '',
    email: 'ross.wang@te.com',
    timestamp: new Date().toISOString()
  };
  fs.writeFileSync('/home/wang/wk/code/docusign-keys/new_account_info.json', JSON.stringify(output, null, 2));
  console.log('\n=== NEW ACCOUNT INFO ===');
  console.log(JSON.stringify(output, null, 2));

  const ss = await Page.captureScreenshot({ format: 'png' });
  fs.writeFileSync('/tmp/ulw-docusign-new-app.png', Buffer.from(ss.data, 'base64'));

  await att.close();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
