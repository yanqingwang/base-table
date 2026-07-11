const CDP = require('/home/wang/wk/code/docusign-keys/node_modules/chrome-remote-interface');
const fs = require('fs');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const targets = await CDP.List();
  const target = targets.find(t => t.type === 'page' && t.url.includes('docusign'));
  const att = await CDP({ target });
  const { Runtime, Page } = att;
  await Page.enable(); await Runtime.enable();
  // The modal should still be open
  await sleep(1000);

  console.log('[1] Filling App Name in modal...');
  const fillRes = await Runtime.evaluate({
    expression: `
      (() => {
        // The modal is likely in a portal/shadow root. Find by placeholder text.
        const inputs = Array.from(document.querySelectorAll('input'));
        for (const i of inputs) {
          if (i.offsetParent && (i.placeholder || '').toLowerCase().includes('application')) {
            const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            setter.call(i, 'easy-hire-docusign-integration-v2');
            i.dispatchEvent(new Event('input', { bubbles: true }));
            i.dispatchEvent(new Event('change', { bubbles: true }));
            return { filled: true, ph: i.placeholder };
          }
        }
        // Fallback: any visible empty input
        const all = inputs.filter(i => i.offsetParent && !i.disabled && i.value === '' && (i.type === 'text' || !i.type));
        if (all.length > 0) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(all[0], 'easy-hire-docusign-integration-v2');
          all[0].dispatchEvent(new Event('input', { bubbles: true }));
          all[0].dispatchEvent(new Event('change', { bubbles: true }));
          return { filled: true, ph: all[0].placeholder, fallback: true };
        }
        return { filled: false, count: inputs.length };
      })();
    `,
    returnByValue: true,
  });
  console.log('  Fill:', JSON.stringify(fillRes.result.value));
  await sleep(1500);

  console.log('[2] Clicking Create App button...');
  const clickRes = await Runtime.evaluate({
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        // Look for "Create App" in any visible button
        const create = btns.find(b => {
          if (!b.offsetParent) return false;
          const t = (b.textContent || '').trim();
          return t === 'Create App' || t === 'Create';
        });
        if (create) { create.click(); return { found: true, text: create.textContent.trim() }; }
        const allBtns = btns.filter(b => b.offsetParent).map(b => b.textContent.trim()).filter(t => t.length > 0 && t.length < 30);
        return { found: false, all: allBtns };
      })();
    `,
    returnByValue: true,
  });
  console.log('  Click:', JSON.stringify(clickRes.result.value));
  await sleep(8000);

  const url = await Runtime.evaluate({ expression: 'window.location.href', returnByValue: true });
  console.log('[3] URL after Create:', url.result.value);

  // Capture the new Integration Key
  const keyRes = await Runtime.evaluate({
    expression: `
      (() => {
        const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
        const found = inputs.map(i => ({ id: i.id, value: i.value, visible: i.offsetParent !== null })).filter(i => i.visible && /[0-9a-f-]{36}/.test(i.value));
        const body = document.body.innerText;
        const guids = body.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi);
        return { inputs: found, guids: guids ? Array.from(new Set(guids)) : [] };
      })();
    `,
    returnByValue: true,
  });
  console.log('[4] Keys:', JSON.stringify(keyRes.result.value, null, 2));

  // Save info
  const newKey = (keyRes.result.value.inputs[0] && keyRes.result.value.inputs[0].value) || (keyRes.result.value.guids && keyRes.result.value.guids[0]) || '';
  const out = {
    userId: '846a50f2-7b2f-44c0-bbdf-78e75bd4c990',
    accountId: '45445035',
    apiAccountId: '70a3bf07-af69-4569-8401-b859bd782f6c',
    integrationKey: newKey,
    email: 'ross.wang@te.com',
    timestamp: new Date().toISOString()
  };
  fs.writeFileSync('/home/wang/wk/code/docusign-keys/new_account_info.json', JSON.stringify(out, null, 2));
  console.log('\n=== NEW ACCOUNT INFO ===');
  console.log(JSON.stringify(out, null, 2));

  const ss = await Page.captureScreenshot({ format: 'png' });
  fs.writeFileSync('/tmp/ulw-docusign-v3-app.png', Buffer.from(ss.data, 'base64'));
  console.log('Screenshot: /tmp/ulw-docusign-v3-app.png');

  await att.close();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
