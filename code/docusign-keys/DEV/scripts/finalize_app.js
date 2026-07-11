const CDP = require('/home/wang/wk/code/docusign-keys/node_modules/chrome-remote-interface');
const fs = require('fs');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const targets = await CDP.List();
  const target = targets.find(t => t.type === 'page' && t.url.includes('docusign'));
  const att = await CDP({ target });
  const { Runtime, Page } = att;
  await Page.enable(); await Runtime.enable();

  // Hard reload
  await Page.reload({ ignoreCache: true });
  await sleep(10000);

  // Wait for loading
  for (let i = 0; i < 20; i++) {
    const loading = await Runtime.evaluate({
      expression: `document.body.innerText.match(/Loading.../g) && document.body.innerText.match(/Loading.../g).length > 0`,
      returnByValue: true,
    });
    if (!loading.result.value) break;
    await sleep(2000);
  }
  await sleep(2000);

  // Get URL
  const url = await Runtime.evaluate({ expression: 'window.location.href', returnByValue: true });
  console.log('URL:', url.result.value);

  // If on list page (not edit), click Actions > Edit
  if (url.result.value.endsWith('/apps-and-keys') || url.result.value.includes('/apps-and-keys?')) {
    console.log('[1] On list page, clicking Edit on v3 app...');
    await Runtime.evaluate({
      expression: `
        (() => {
          const rows = document.querySelectorAll('tr, [role="row"]');
          for (const row of rows) {
            if (row.textContent.includes('easy-hire-docusign-integration-v2') && row.textContent.length < 800) {
              const buttons = Array.from(row.querySelectorAll('button, a, [role="button"]'));
              for (const b of buttons) {
                if (/^actions$/i.test((b.textContent || '').trim())) { b.click(); return true; }
              }
            }
          }
        })();
      `,
    });
    await sleep(1500);
    await Runtime.evaluate({
      expression: `
        (() => {
          const items = Array.from(document.querySelectorAll('li, button, a, [role="menuitem"]'));
          for (const i of items) {
            if (/^edit$/i.test((i.textContent || '').trim())) { i.click(); return true; }
          }
        })();
      `,
    });
    await sleep(10000);
  }

  // Wait for app edit page
  for (let i = 0; i < 15; i++) {
    const hasAppName = await Runtime.evaluate({
      expression: `document.body.innerText.includes('Authentication') && document.body.innerText.includes('easy-hire-docusign-integration-v2')`,
      returnByValue: true,
    });
    if (hasAppName.result.value) break;
    await sleep(2000);
  }
  await sleep(3000);

  const editUrl = await Runtime.evaluate({ expression: 'window.location.href', returnByValue: true });
  console.log('Edit URL:', editUrl.result.value);

  // Scroll to bottom to find Save button and RSA section
  console.log('[2] Scrolling to find Save...');
  for (let y = 0; y < 5000; y += 500) {
    await Runtime.evaluate({ expression: `window.scrollTo(0, ${y});` });
    await sleep(300);
  }
  await sleep(2000);

  const ss1 = await Page.captureScreenshot({ format: 'png' });
  fs.writeFileSync('/tmp/ulw-v3-edited.png', Buffer.from(ss1.data, 'base64'));

  // Check for Save button and click it
  console.log('[3] Clicking Save...');
  const saveRes = await Runtime.evaluate({
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button')).filter(b => b.offsetParent);
        for (const b of btns) {
          const t = (b.textContent || '').trim();
          if (/^(save|update|save changes|update app)$/i.test(t)) { b.click(); return t; }
        }
        return { all: btns.map(b => b.textContent.trim()).filter(t => t && t.length < 30).slice(0, 20) };
      })();
    `,
    returnByValue: true,
  });
  console.log('  Save:', JSON.stringify(saveRes.result.value));
  await sleep(8000);

  const ss2 = await Page.captureScreenshot({ format: 'png' });
  fs.writeFileSync('/tmp/ulw-v3-saved.png', Buffer.from(ss2.data, 'base64'));

  // Check if redirected to list
  const finalUrl = await Runtime.evaluate({ expression: 'window.location.href', returnByValue: true });
  console.log('  Final URL:', finalUrl.result.value);

  await att.close();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
