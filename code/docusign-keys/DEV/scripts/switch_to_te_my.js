const CDP = require('/home/wang/wk/code/docusign-keys/node_modules/chrome-remote-interface');
const fs = require('fs');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const targets = await CDP.List();
  const target = targets.find(t => t.type === 'page' && t.url.includes('docusign'));
  const att = await CDP({ target });
  const { Page, Runtime } = att;
  await Page.enable(); await Runtime.enable();

  // Click Actions on TE-MY (45444181) row
  console.log('[1] Click Actions on TE-MY...');
  await Runtime.evaluate({
    expression: `
      (() => {
        const rows = document.querySelectorAll('tr, [role="row"]');
        for (const row of rows) {
          if (row.textContent.includes('45444181') && row.textContent.includes('TE-MY') && row.textContent.length < 400) {
            const buttons = Array.from(row.querySelectorAll('button, a, [role="button"]'));
            for (const b of buttons) {
              if (/^actions$/i.test((b.textContent || '').trim())) { b.click(); return { clicked: b.textContent.trim() }; }
            }
            return { no_action_btn: row.outerHTML.slice(0, 300) };
          }
        }
        return 'TE-MY not found';
      })();
    `,
    returnByValue: true,
  });
  await sleep(2000);

  // Look for "Switch to this account" or "Act as Account Admin"
  console.log('[2] Look for switch option...');
  const switchRes = await Runtime.evaluate({
    expression: `
      (() => {
        const items = Array.from(document.querySelectorAll('li, button, a, [role="menuitem"]'));
        for (const i of items) {
          const t = (i.textContent || '').trim();
          if (/switch.*account|act as admin|go to account|open account/i.test(t)) { i.click(); return t; }
        }
        const allVisible = items.filter(x => x.offsetParent).map(x => (x.textContent || '').trim()).filter(t => t && t.length < 50);
        return { all: allVisible.slice(0, 20) };
      })();
    `,
    returnByValue: true,
  });
  console.log('  Switch result:', JSON.stringify(switchRes.result.value));
  await sleep(8000);

  // Now we should be on the TE-MY account admin page
  const url1 = await Runtime.evaluate({ expression: 'window.location.href', returnByValue: true });
  console.log('  URL after switch:', url1.result.value);

  // Navigate to apps-and-keys for TE-MY
  await Page.navigate({ url: 'https://apps-d.docusign.com/admin/apps-and-keys' });
  await sleep(8000);
  // Wait for loading
  for (let i = 0; i < 15; i++) {
    const loading = await Runtime.evaluate({
      expression: `document.body.innerText.includes('Loading') && !document.body.innerText.includes('Apps and Keys')`,
      returnByValue: true,
    });
    if (!loading.result.value) break;
    await sleep(2000);
  }
  await sleep(3000);

  // Check what account we're in
  const acctInfo = await Runtime.evaluate({
    expression: `
      (() => {
        const body = document.body.innerText;
        const m = body.match(/Account ID:\\s*(\\d+)/);
        return { accountId: m ? m[1] : 'unknown', snippet: body.slice(0, 500) };
      })();
    `,
    returnByValue: true,
  });
  console.log('  Apps-and-keys page account:', acctInfo.result.value.accountId);
  console.log('  Body snippet:', acctInfo.result.value.snippet);

  // Take screenshot
  const ss = await Page.captureScreenshot({ format: 'png' });
  fs.writeFileSync('/tmp/ulw-te-my-apps.png', Buffer.from(ss.data, 'base64'));

  // Now find the user ID (go to admin/users)
  console.log('[3] Getting user ID for ross.wang@te.com in TE-MY...');
  await Page.navigate({ url: 'https://apps-d.docusign.com/admin/users' });
  await sleep(10000);
  for (let i = 0; i < 15; i++) {
    const loading = await Runtime.evaluate({
      expression: `document.body.innerText.includes('Loading') && !document.body.innerText.includes('Users')`,
      returnByValue: true,
    });
    if (!loading.result.value) break;
    await sleep(2000);
  }
  await sleep(3000);

  // Search for ross.wang
  const search = await Runtime.evaluate({
    expression: `
      (() => {
        const inputs = Array.from(document.querySelectorAll('input[type="search"], input[placeholder*="search" i]'));
        const visible = inputs.filter(i => i.offsetParent);
        if (visible.length > 0) {
          const t = visible[0];
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(t, 'ross');
          t.dispatchEvent(new Event('input', { bubbles: true }));
          t.dispatchEvent(new Event('change', { bubbles: true }));
          return { searched: true };
        }
        return { no_input: true, all: inputs.map(i => ({ ph: i.placeholder, vis: i.offsetParent })) };
      })();
    `,
    returnByValue: true,
  });
  console.log('  Search:', JSON.stringify(search.result.value));
  await sleep(3000);

  // Click View all results
  await Runtime.evaluate({
    expression: `
      (() => {
        const all = Array.from(document.querySelectorAll('a, button, div, span, li'));
        for (const el of all) {
          const t = (el.textContent || '').trim();
          if (/view all results.*ross/i.test(t) && t.length < 60) { el.click(); return; }
        }
      })();
    `
  });
  await sleep(3000);

  // Click Actions on Ross Wang row
  await Runtime.evaluate({
    expression: `
      (() => {
        const rows = document.querySelectorAll('tr, [role="row"]');
        for (const row of rows) {
          if (row.textContent.includes('Ross Wang') && row.textContent.includes('ross.wang@te.com') && row.textContent.length < 600) {
            const buttons = Array.from(row.querySelectorAll('button, a, [role="button"]'));
            for (const b of buttons) {
              if (/^actions$/i.test((b.textContent || '').trim())) { b.click(); return; }
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
      (() => {
        const items = Array.from(document.querySelectorAll('li, button, a, [role="menuitem"]'));
        for (const i of items) {
          if (/^edit$/i.test((i.textContent || '').trim())) { i.click(); return; }
        }
      })();
    `
  });
  await sleep(6000);

  const userUrl = await Runtime.evaluate({ expression: 'window.location.href', returnByValue: true });
  const userIdMatch = userUrl.result.value.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  const userId = userIdMatch ? userIdMatch[0] : '';
  console.log('  TE-MY user URL:', userUrl.result.value);
  console.log('  TE-MY user ID:', userId);

  // Save
  const out = {
    accountId: '45444181',
    accountName: 'TE-MY',
    userId,
    timestamp: new Date().toISOString(),
  };
  fs.writeFileSync('/home/wang/wk/code/docusign-keys/te_my_account_info.json', JSON.stringify(out, null, 2));
  console.log('\\n=== TE-MY INFO ===');
  console.log(JSON.stringify(out, null, 2));

  await att.close();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
