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
  await sleep(12000);

  const ss = await Page.captureScreenshot({ format: 'png' });
  fs.writeFileSync('/tmp/ulw-v3-reload.png', Buffer.from(ss.data, 'base64'));

  // Wait for "Loading..." to disappear, then dump
  for (let i = 0; i < 30; i++) {
    const loading = await Runtime.evaluate({
      expression: `document.body.innerText.includes('Loading')`,
      returnByValue: true,
    });
    if (!loading.result.value) break;
    await sleep(2000);
  }
  await sleep(2000);

  // Dump full body text
  const body = await Runtime.evaluate({ expression: 'document.body.innerText', returnByValue: true });
  console.log('=== BODY ===');
  console.log((body.result.value || '').slice(0, 3000));

  // Look for "RSA" or "Add RSA" or "Upload"
  const rsaInfo = await Runtime.evaluate({
    expression: `
      (() => {
        const buttons = Array.from(document.querySelectorAll('button')).filter(b => b.offsetParent);
        const rsaButtons = buttons.map(b => b.textContent.trim()).filter(t => /rsa|key|sign/i.test(t));
        const inputs = Array.from(document.querySelectorAll('textarea, input')).filter(i => i.offsetParent);
        const tas = inputs.map(i => ({ tag: i.tagName, len: (i.value || '').length, name: i.name, id: i.id }));
        return { rsaButtons, tas };
      })();
    `,
    returnByValue: true,
  });
  console.log('\n=== RSA INFO ===');
  console.log(JSON.stringify(rsaInfo.result.value, null, 2));

  const ss2 = await Page.captureScreenshot({ format: 'png' });
  fs.writeFileSync('/tmp/ulw-v3-loaded.png', Buffer.from(ss2.data, 'base64'));
  console.log('\nScreenshots: /tmp/ulw-v3-reload.png /tmp/ulw-v3-loaded.png');

  await att.close();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
