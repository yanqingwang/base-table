const CDP = require('/home/wang/wk/code/docusign-keys/node_modules/chrome-remote-interface');
const fs = require('fs');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const targets = await CDP.List();
  const target = targets.find(t => t.type === 'page' && t.url.includes('docusign'));
  const att = await CDP({ target });
  const { Page, Runtime } = att;
  await Page.enable(); await Runtime.enable();

  // Make sure we're in TE-MY. Use the account selector dropdown at top
  // Click on "TE" link in top nav
  console.log('[1] Check current account + navigate to apps-and-keys...');
  await Page.navigate({ url: 'https://apps-d.docusign.com/admin/apps-and-keys' });
  await sleep(8000);
  // Wait for loading
  for (let i = 0; i < 20; i++) {
    const ready = await Runtime.evaluate({
      expression: `document.body.innerText.includes('Account ID') || document.body.innerText.includes('App Name') || document.body.innerText.includes('Add App')`,
      returnByValue: true,
    });
    if (ready.result.value) break;
    await sleep(2000);
  }
  await sleep(2000);

  // Get current account
  const acct = await Runtime.evaluate({
    expression: `
      (() => {
        const body = document.body.innerText;
        const m = body.match(/Account ID:\\s*(\\d+)/);
        const navAcct = body.match(/(TE[\\w-]*)\\s*\\(?(\\d+)\\)?/);
        return { accountId: m ? m[1] : 'unknown', navLine: navAcct ? navAcct[0] : null };
      })();
    `,
    returnByValue: true,
  });
  console.log('  Account in page:', acct.result.value);

  // If still on TEDefault (45445035), need to switch via account selector
  if (acct.result.value.accountId === '45445035') {
    console.log('  Still on TEDefault, switching via account selector...');
    // Click the account selector (e.g., "TE" link in top nav)
    const switched = await Runtime.evaluate({
      expression: `
        (() => {
          // The account selector is usually a dropdown showing "TE (45445035)"
          // Click on the account name to open dropdown
          const links = Array.from(document.querySelectorAll('a, button, [role="button"]'));
          for (const l of links) {
            const t = (l.textContent || '').trim();
            if (/^TE\\b|TE-MY|45444181|45445035/i.test(t) && t.length < 30) { l.click(); return { clicked: t }; }
          }
          return { no_link: links.filter(l => l.offsetParent).map(l => l.textContent.trim()).filter(t => t && t.length < 30).slice(0, 20) };
        })();
      `,
      returnByValue: true,
    });
    console.log('  Click result:', JSON.stringify(switched.result.value));
    await sleep(2000);
    // Look for TE-MY option in dropdown
    await Runtime.evaluate({
      expression: `
        (() => {
          const items = Array.from(document.querySelectorAll('li, a, button, [role="option"], [role="menuitem"]'));
          for (const i of items) {
            const t = (i.textContent || '').trim();
            if (/TE-MY|45444181/i.test(t) && t.length < 30) { i.click(); return; }
          }
        })();
      `
    });
    await sleep(8000);
    // Re-check
    const acct2 = await Runtime.evaluate({
      expression: `document.body.innerText.match(/Account ID:\\s*(\\d+)/)?.[1] || 'unknown'`,
      returnByValue: true,
    });
    console.log('  Account after switch:', acct2.result.value);
  }

  // Dump apps
  const apps = await Runtime.evaluate({
    expression: `
      (() => {
        const rows = document.querySelectorAll('tr, [role="row"]');
        const out = [];
        for (const row of rows) {
          if (row.textContent.includes('easy-hire') || (row.textContent.includes('Quickstart') && row.textContent.length < 400)) {
            out.push(row.textContent.replace(/\\s+/g, ' ').trim().slice(0, 200));
          }
        }
        return out;
      })();
    `,
    returnByValue: true,
  });
  console.log('  Existing apps:', JSON.stringify(apps.result.value));

  // Get full body
  const body = await Runtime.evaluate({ expression: 'document.body.innerText', returnByValue: true });
  console.log('  Body snippet:', (body.result.value || '').slice(0, 1500));

  // Screenshot
  const ss = await Page.captureScreenshot({ format: 'png' });
  fs.writeFileSync('/tmp/ulw-te-my-apps.png', Buffer.from(ss.data, 'base64'));
  console.log('  Screenshot: /tmp/ulw-te-my-apps.png');

  await att.close();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
