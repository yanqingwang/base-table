const CDP = require('/home/wang/wk/code/docusign-keys/node_modules/chrome-remote-interface');
const fs = require('fs');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const targets = await CDP.List();
  const target = targets.find(t => t.type === 'page' && t.url.includes('docusign'));
  const att = await CDP({ target });
  const { Runtime, Page } = att;
  await Page.enable(); await Runtime.enable();

  // Go to list
  await Page.navigate({ url: 'https://apps-d.docusign.com/admin/apps-and-keys' });
  await sleep(8000);

  // Wait for loading gone
  for (let i = 0; i < 20; i++) {
    const loading = await Runtime.evaluate({
      expression: `document.body.innerText.includes('Loading') && !document.body.innerText.includes('Apps and Keys')`,
      returnByValue: true,
    });
    if (!loading.result.value) break;
    await sleep(2000);
  }
  await sleep(2000);

  const ss1 = await Page.captureScreenshot({ format: 'png' });
  fs.writeFileSync('/tmp/ulw-list-state.png', Buffer.from(ss1.data, 'base64'));

  // Find easy-hire row and Edit
  console.log('[1] Click Actions on easy-hire-v2...');
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
    `
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
    `
  });
  await sleep(10000);

  // Wait for app edit page
  for (let i = 0; i < 15; i++) {
    const hasAppName = await Runtime.evaluate({
      expression: `document.body.innerText.includes('easy-hire-docusign-integration-v2') && document.body.innerText.includes('Authentication')`,
      returnByValue: true,
    });
    if (hasAppName.result.value) break;
    await sleep(2000);
  }
  await sleep(2000);

  const ss2 = await Page.captureScreenshot({ format: 'png' });
  fs.writeFileSync('/tmp/ulw-edit-page.png', Buffer.from(ss2.data, 'base64'));

  // Dump body
  const body = await Runtime.evaluate({ expression: 'document.body.innerText', returnByValue: true });
  console.log('=== BODY ===');
  console.log((body.result.value || '').slice(0, 3000));

  // Find RSA section
  const rsaInfo = await Runtime.evaluate({
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button')).filter(b => b.offsetParent);
        const rsaButtons = btns.map(b => b.textContent.trim()).filter(t => /rsa|generate|upload/i.test(t));
        const tas = Array.from(document.querySelectorAll('textarea')).filter(t => t.offsetParent);
        const taInfo = tas.map(t => ({ len: (t.value || '').length, sample: (t.value || '').slice(0, 50) }));
        return { rsaButtons, taInfo };
      })();
    `,
    returnByValue: true,
  });
  console.log('\n=== RSA INFO ===');
  console.log(JSON.stringify(rsaInfo.result.value, null, 2));

  // Try clicking Generate RSA again if visible
  if (rsaInfo.result.value.rsaButtons.some(b => /generate rsa/i.test(b))) {
    console.log('\n[2] Generate RSA button found, clicking...');
    await Runtime.evaluate({
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll('button')).filter(b => b.offsetParent);
          for (const b of btns) {
            if (/^generate rsa$/i.test((b.textContent || '').trim())) { b.scrollIntoView({block: 'center'}); b.click(); return true; }
          }
        })();
      `,
      returnByValue: true,
    });
    await sleep(6000);

    // Capture new keys
    const newKeys = await Runtime.evaluate({
      expression: `
        (() => {
          const tas = Array.from(document.querySelectorAll('textarea, pre, code'));
          let pub = '', priv = '';
          for (const t of tas) {
            const txt = (t.textContent || t.value || '').trim();
            if (txt.startsWith('-----BEGIN PUBLIC KEY-----')) pub = txt;
            if (txt.startsWith('-----BEGIN RSA PRIVATE KEY-----') || txt.startsWith('-----BEGIN PRIVATE KEY-----')) priv = txt;
          }
          return { pubLen: pub.length, privLen: priv.length, pub: pub, priv: priv };
        })();
      `,
      returnByValue: true,
    });
    console.log('  New keys captured: pub=' + newKeys.result.value.pubLen + ' priv=' + newKeys.result.value.privLen);
    if (newKeys.result.value.priv) {
      fs.writeFileSync('/home/wang/wk/code/docusign-keys/docusign_private_v2.pem', newKeys.result.value.priv);
      fs.writeFileSync('/home/wang/wk/code/docusign-keys/docusign_public_v2.pem', newKeys.result.value.pub + '\n');
      console.log('  Saved');
    }

    // Click Save
    console.log('[3] Clicking Save...');
    await Runtime.evaluate({
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll('button')).filter(b => b.offsetParent);
          for (const b of btns) {
            if (/^(save|update|save changes)$/i.test((b.textContent || '').trim())) { b.click(); return true; }
          }
        })();
      `,
      returnByValue: true,
    });
    await sleep(6000);

    const ss3 = await Page.captureScreenshot({ format: 'png' });
    fs.writeFileSync('/tmp/ulw-rsa-saved.png', Buffer.from(ss3.data, 'base64'));
  }

  await att.close();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
