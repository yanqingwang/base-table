const CDP = require('/home/wang/wk/code/docusign-keys/node_modules/chrome-remote-interface');
const fs = require('fs');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const targets = await CDP.List();
  const target = targets.find(t => t.type === 'page' && t.url.includes('docusign'));
  const att = await CDP({ target });
  const { Runtime, Page } = att;
  await Page.enable(); await Runtime.enable();
  await sleep(1500);

  // Click Actions on easy-hire row
  console.log('[1] Click Actions on easy-hire...');
  await Runtime.evaluate({
    expression: `
      (() => {
        const rows = document.querySelectorAll('tr, [role="row"]');
        for (const row of rows) {
          if (row.textContent.includes('easy-hire-docusign-integration-v2') && row.textContent.length < 600) {
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
  await sleep(6000);

  const url = await Runtime.evaluate({ expression: 'window.location.href', returnByValue: true });
  console.log('[2] URL:', url.result.value);

  // Now we're on app edit page. Find Generate RSA button
  const ss1 = await Page.captureScreenshot({ format: 'png' });
  fs.writeFileSync('/tmp/ulw-v3-edit.png', Buffer.from(ss1.data, 'base64'));
  console.log('  Edit page screenshot: /tmp/ulw-v3-edit.png');

  // Scroll to RSA section
  console.log('[3] Scroll to Authentication/RSA...');
  await Runtime.evaluate({
    expression: `
      (() => {
        const els = Array.from(document.querySelectorAll('h2, h3, h4, div, span, button'));
        for (const e of els) {
          if (b.offsetParent && /service integration|authentication|additional settings/i.test((e.textContent || ''))) {
            if (e.textContent.length < 50) { e.scrollIntoView({block: 'center'}); return e.textContent.trim(); }
          }
        }
        window.scrollTo(0, 800);
        return 'scrolled-800';
      })();
    `,
    returnByValue: true,
  });
  await sleep(2000);

  // Find and click Generate RSA
  console.log('[4] Click Generate RSA...');
  await Runtime.evaluate({
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button, a, [role="button"]'));
        for (const b of btns) {
          if (b.offsetParent && /^generate rsa/i.test((b.textContent || '').trim())) {
            b.scrollIntoView({block: 'center'}); b.click(); return b.textContent.trim();
          }
        }
        // Try text match
        for (const b of btns) {
          if (b.offsetParent && /generate rsa/i.test((b.textContent || ''))) {
            b.click(); return b.textContent.trim();
          }
        }
        return { tried: btns.map(b => b.textContent.trim()).filter(t => t && t.length < 30).slice(0, 20) };
      })();
    `,
    returnByValue: true,
  });
  await sleep(5000);

  const ss2 = await Page.captureScreenshot({ format: 'png' });
  fs.writeFileSync('/tmp/ulw-v3-rsa-clicked.png', Buffer.from(ss2.data, 'base64'));
  console.log('  After RSA click: /tmp/ulw-v3-rsa-clicked.png');

  // After click, look for the key in a textarea
  console.log('[5] Look for generated key in textareas...');
  const keysRes = await Runtime.evaluate({
    expression: `
      (() => {
        const tas = Array.from(document.querySelectorAll('textarea, pre, code, .key-display, [class*="key" i]'));
        const all = tas.map(t => ({ tag: t.tagName, text: (t.textContent || t.value || '').slice(0, 80) }));
        let pub = '', priv = '';
        for (const t of tas) {
          const txt = (t.textContent || t.value || '').trim();
          if (txt.startsWith('-----BEGIN PUBLIC KEY-----')) pub = txt;
          if (txt.startsWith('-----BEGIN RSA PRIVATE KEY-----') || txt.startsWith('-----BEGIN PRIVATE KEY-----')) priv = txt;
        }
        return { pubLen: pub.length, privLen: priv.length, count: tas.length, all: all.slice(0, 20) };
      })();
    `,
    returnByValue: true,
  });
  console.log('  Captured:', JSON.stringify(keysRes.result.value, null, 2));

  // If no keys found, the click may have opened a modal. Click again or look for new buttons
  if (keysRes.result.value.pubLen === 0) {
    console.log('[6] No keys found. Check if modal/confirm is showing...');
    // Look for "Confirm", "Yes, Generate" etc
    await Runtime.evaluate({
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll('button'));
          for (const b of btns) {
            if (b.offsetParent && /^(confirm|yes|generate|ok)$/i.test((b.textContent || '').trim())) {
              b.click(); return b.textContent.trim();
            }
          }
        })();
      `,
      returnByValue: true,
    });
    await sleep(6000);
    // Re-capture
    const rekeys = await Runtime.evaluate({
      expression: `
        (() => {
          const tas = Array.from(document.querySelectorAll('textarea, pre, code'));
          let pub = '', priv = '';
          for (const t of tas) {
            const txt = (t.textContent || t.value || '').trim();
            if (txt.startsWith('-----BEGIN PUBLIC KEY-----')) pub = txt;
            if (txt.startsWith('-----BEGIN RSA PRIVATE KEY-----') || txt.startsWith('-----BEGIN PRIVATE KEY-----')) priv = txt;
          }
          return { pubLen: pub.length, privLen: priv.length };
        })();
      `,
      returnByValue: true,
    });
    console.log('  Re-captured:', JSON.stringify(rekeys.result.value));
    if (rekeys.result.value.priv) {
      const full = await Runtime.evaluate({
        expression: `
          (() => {
            const tas = Array.from(document.querySelectorAll('textarea, pre, code'));
            let pub = '', priv = '';
            for (const t of tas) {
              const txt = (t.textContent || t.value || '').trim();
              if (txt.startsWith('-----BEGIN PUBLIC KEY-----')) pub = txt;
              if (txt.startsWith('-----BEGIN RSA PRIVATE KEY-----') || txt.startsWith('-----BEGIN PRIVATE KEY-----')) priv = txt;
            }
            return { pub, priv };
          })();
        `,
        returnByValue: true,
      });
      fs.writeFileSync('/home/wang/wk/code/docusign-keys/docusign_private_v2.pem', full.result.value.priv);
      fs.writeFileSync('/home/wang/wk/code/docusign-keys/docusign_public_v2.pem', full.result.value.pub);
      console.log('  Saved DocuSign-generated keys');
    }
  } else {
    // Keys found in first attempt
    const full = await Runtime.evaluate({
      expression: `
        (() => {
          const tas = Array.from(document.querySelectorAll('textarea, pre, code'));
          let pub = '', priv = '';
          for (const t of tas) {
            const txt = (t.textContent || t.value || '').trim();
            if (txt.startsWith('-----BEGIN PUBLIC KEY-----')) pub = txt;
            if (txt.startsWith('-----BEGIN RSA PRIVATE KEY-----') || txt.startsWith('-----BEGIN PRIVATE KEY-----')) priv = txt;
          }
          return { pub, priv };
        })();
      `,
      returnByValue: true,
    });
    fs.writeFileSync('/home/wang/wk/code/docusign-keys/docusign_private_v2.pem', full.result.value.priv);
    fs.writeFileSync('/home/wang/wk/code/docusign-keys/docusign_public_v2.pem', full.result.value.pub);
    console.log('  Saved DocuSign-generated keys');
  }

  await att.close();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
