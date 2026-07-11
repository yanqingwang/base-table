const CDP = require('/home/wang/wk/code/docusign-keys/node_modules/chrome-remote-interface');
const fs = require('fs');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const targets = await CDP.List();
  const target = targets.find(t => t.type === 'page' && t.url.includes('docusign'));
  const att = await CDP({ target });
  const { Page, Runtime } = att;
  await Page.enable(); await Runtime.enable();

  // Click on TE-MY in the dropdown
  console.log('[1] Click TE-MY option...');
  await Runtime.evaluate({
    expression: `
      (() => {
        const items = Array.from(document.querySelectorAll('li, a, button, div, [role="option"]'));
        for (const i of items) {
          const t = (i.textContent || '').trim();
          if (i.offsetParent && /TE-MY/i.test(t) && t.includes('45444181') && t.length < 80) {
            i.click();
            return { clicked: t };
          }
        }
        return { not_found: items.filter(x => x.offsetParent).map(x => (x.textContent || '').trim()).filter(t => t && t.length < 30).slice(0, 20) };
      })();
    `,
    returnByValue: true,
  });
  await sleep(2000);

  // Click Apply
  console.log('[2] Click Apply...');
  await Runtime.evaluate({
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button, a, [role="button"]'));
        for (const b of btns) {
          if (b.offsetParent && /^apply$|^switch$|^confirm$/i.test((b.textContent || '').trim())) {
            b.click(); return { clicked: b.textContent.trim() };
          }
        }
        return { not_found: btns.filter(x => x.offsetParent).map(x => (x.textContent || '').trim()).filter(t => t && t.length < 30) };
      })();
    `,
    returnByValue: true,
  });
  await sleep(8000);

  // Verify we're on TE-MY now
  const acct = await Runtime.evaluate({
    expression: `document.body.innerText.match(/Account ID:\\s*(\\d+)/)?.[1] || 'unknown'`,
    returnByValue: true,
  });
  console.log('  Account after Apply:', acct.result.value);

  // Now navigate to apps-and-keys for TE-MY
  await Page.navigate({ url: 'https://apps-d.docusign.com/admin/apps-and-keys' });
  await sleep(10000);
  for (let i = 0; i < 20; i++) {
    const ready = await Runtime.evaluate({
      expression: `document.body.innerText.includes('Add App') && document.body.innerText.match(/Account ID:\\s*(\\d+)/)`,
      returnByValue: true,
    });
    if (ready.result.value) break;
    await sleep(2000);
  }
  await sleep(3000);

  const acct2 = await Runtime.evaluate({
    expression: `document.body.innerText.match(/Account ID:\\s*(\\d+)/)?.[1] || 'unknown'`,
    returnByValue: true,
  });
  console.log('  Apps page account:', acct2.result.value);

  // List existing apps
  const apps = await Runtime.evaluate({
    expression: `
      (() => {
        const rows = document.querySelectorAll('tr, [role="row"]');
        const out = [];
        for (const row of rows) {
          if ((row.textContent.includes('easy-hire') || row.textContent.includes('Quickstart')) && row.textContent.length < 500) {
            out.push(row.textContent.replace(/\\s+/g, ' ').trim().slice(0, 200));
          }
        }
        return out;
      })();
    `,
    returnByValue: true,
  });
  console.log('  Apps in TE-MY:', JSON.stringify(apps.result.value, null, 2));

  // Screenshot
  const ss = await Page.captureScreenshot({ format: 'png' });
  fs.writeFileSync('/tmp/ulw-te-my-after-switch.png', Buffer.from(ss.data, 'base64'));

  await att.close();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
