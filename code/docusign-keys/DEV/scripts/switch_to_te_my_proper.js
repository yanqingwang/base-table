const CDP = require('/home/wang/wk/code/docusign-keys/node_modules/chrome-remote-interface');
const fs = require('fs');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const targets = await CDP.List();
  const target = targets.find(t => t.type === 'page' && t.url.includes('docusign'));
  const att = await CDP({ target });
  const { Page, Runtime } = att;
  await Page.enable(); await Runtime.enable();

  // We're still on apps-and-keys. Open the account selector
  console.log('[1] Click account selector...');
  await Runtime.evaluate({
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        for (const b of btns) {
          if (b.offsetParent && b.textContent.trim() === 'TE (45445035)' && b.tagName === 'BUTTON') {
            b.click(); return { clicked: true };
          }
        }
        return { not_found: 'no account selector button' };
      })();
    `,
    returnByValue: true,
  });
  await sleep(2500);

  // Click TE-MY radio (id 'a96b8210cf' from earlier inspection)
  console.log('[2] Click TE-MY radio...');
  await Runtime.evaluate({
    expression: `
      (() => {
        const radios = document.querySelectorAll('input[type="radio"]');
        for (const r of radios) {
          if (r.id === 'a96b8210cf' || r.value === 'a96b8210cf') { r.click(); return { clicked: r.id }; }
        }
        // Fallback: find radio near TE-MY label
        const labels = document.querySelectorAll('label[for]');
        for (const l of labels) {
          if (/TE-MY/i.test(l.textContent || '')) { l.click(); return { clicked: l.htmlFor }; }
        }
        return { not_found: 'no TE-MY radio' };
      })();
    `,
    returnByValue: true,
  });
  await sleep(2000);

  // Click Apply
  console.log('[3] Click Apply...');
  await Runtime.evaluate({
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        for (const b of btns) {
          if (b.offsetParent && /^apply$/i.test((b.textContent || '').trim())) { b.click(); return { clicked: 'apply' }; }
        }
        return { not_found: 'no apply btn' };
      })();
    `,
    returnByValue: true,
  });
  await sleep(8000);

  // Verify account switched
  const acct = await Runtime.evaluate({
    expression: `document.body.innerText.match(/Account ID:\\s*(\\d+)/)?.[1] || 'unknown'`,
    returnByValue: true,
  });
  console.log('  After Apply, current account:', acct.result.value);

  // Now go to apps-and-keys
  await Page.navigate({ url: 'https://apps-d.docusign.com/admin/apps-and-keys' });
  await sleep(10000);
  for (let i = 0; i < 15; i++) {
    const ready = await Runtime.evaluate({
      expression: `document.body.innerText.includes('Add App') && document.body.innerText.match(/Account ID:\\s*(\\d+)/)?.[1]`,
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
  console.log('  Apps-and-keys account:', acct2.result.value);

  // List existing apps in TE-MY
  const apps = await Runtime.evaluate({
    expression: `
      (() => {
        const rows = document.querySelectorAll('tr, [role="row"]');
        const out = [];
        for (const row of rows) {
          const t = (row.textContent || '').trim();
          if ((t.includes('easy-hire') || t.includes('Quickstart') || t.includes('App')) && t.length < 600 && t.length > 30) {
            out.push(t.replace(/\\s+/g, ' ').slice(0, 200));
          }
        }
        return out;
      })();
    `,
    returnByValue: true,
  });
  console.log('  Apps in current account:', JSON.stringify(apps.result.value, null, 2));

  const ss = await Page.captureScreenshot({ format: 'png' });
  fs.writeFileSync('/tmp/ulw-te-my-confirmed.png', Buffer.from(ss.data, 'base64'));

  await att.close();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
