const CDP = require('/home/wang/wk/code/docusign-keys/node_modules/chrome-remote-interface');
const fs = require('fs');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const PUBLIC_KEY = '/home/wang/wk/code/docusign-keys/docusign_public_v2.pem';

(async () => {
  const targets = await CDP.List();
  let target = targets.find(t => t.type === 'page' && t.url.includes('apps-and-keys'));
  const att = await CDP({ target });
  const { Page, Runtime, DOM } = att;
  await Page.enable(); await Runtime.enable();

  await Page.navigate({ url: 'https://apps-d.docusign.com/admin/apps-and-keys' });
  await sleep(7000);

  // Click Actions on new app row
  console.log('[1] Clicking Actions on easy-hire-docusign-integration-v2...');
  await Runtime.evaluate({
    expression: `
      (function() {
        const rows = document.querySelectorAll('tr, [role="row"]');
        for (const row of rows) {
          if (row.textContent.includes('easy-hire-docusign-integration-v2') && row.textContent.length < 600) {
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
  await sleep(5000);

  const url = await Runtime.evaluate({ expression: 'window.location.href', returnByValue: true });
  console.log('  URL:', url.result.value);

  // Click Generate RSA (easiest - DocuSign generates for us)
  console.log('[2] Clicking Generate RSA...');
  await Runtime.evaluate({
    expression: `
      (function() {
        const btns = Array.from(document.querySelectorAll('button, a, [role="button"]'));
        const gen = btns.find(b => /^generate rsa$|generate rsa keypair/i.test((b.textContent || '').trim()));
        if (gen) { gen.scrollIntoView({block: 'center'}); gen.click(); return true; }
        return false;
      })();
    `,
    returnByValue: true,
  });
  await sleep(4000);

  // Capture the keys from textareas
  console.log('[3] Capturing keys...');
  const keysRes = await Runtime.evaluate({
    expression: `
      (function() {
        const tas = document.querySelectorAll('textarea, pre, code');
        let pub = '', priv = '';
        for (const t of tas) {
          const text = (t.textContent || '').trim();
          if (text.startsWith('-----BEGIN PUBLIC KEY-----')) pub = text;
          if (text.startsWith('-----BEGIN RSA PRIVATE KEY-----') || text.startsWith('-----BEGIN PRIVATE KEY-----')) priv = text;
        }
        return { pub, priv, pubLen: pub.length, privLen: priv.length };
      })();
    `,
    returnByValue: true,
  });
  console.log('  Captured: pub=' + keysRes.result.value.pubLen + ' priv=' + keysRes.result.value.privLen);

  if (keysRes.result.value.priv) {
    // Save keys (overwrite v2 files with DocuSign-generated ones, which match the app)
    fs.writeFileSync('/home/wang/wk/code/docusign-keys/docusign_private_v2.pem', keysRes.result.value.priv);
    fs.writeFileSync('/home/wang/wk/code/docusign-keys/docusign_public_v2.pem', keysRes.result.value.pub);
    console.log('  Saved DocuSign-generated keys (matches app)');
  } else {
    console.log('  No keys found, will use locally-generated ones');
  }

  // Find and click Add URI
  console.log('[4] Adding redirect URI...');
  await Runtime.evaluate({
    expression: `
      (function() {
        const btns = Array.from(document.querySelectorAll('button, a, [role="button"]'));
        const addUri = btns.find(b => /add uri/i.test(b.textContent || ''));
        if (addUri) { addUri.scrollIntoView({block: 'center'}); addUri.click(); return true; }
        return false;
      })();
    `,
    returnByValue: true,
  });
  await sleep(2000);

  // Fill the URI in the Redirect URIs section
  await Runtime.evaluate({
    expression: `
      (function() {
        const all = Array.from(document.querySelectorAll('input'));
        for (const i of all) {
          if (!i.offsetParent || i.disabled) continue;
          let parent = i.parentElement;
          for (let p = 0; p < 6 && parent; p++) {
            if (/redirect uris/i.test(parent.textContent || '')) {
              const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
              setter.call(i, 'http://localhost:5000/auth/callback');
              i.dispatchEvent(new Event('input', { bubbles: true }));
              i.dispatchEvent(new Event('change', { bubbles: true }));
              return true;
            }
            parent = parent.parentElement;
          }
        }
        return false;
      })();
    `,
    returnByValue: true,
  });
  await sleep(1500);

  // Click Save
  console.log('[5] Saving...');
  await Runtime.evaluate({
    expression: `
      (function() {
        const btns = Array.from(document.querySelectorAll('button, a, [role="button"]'));
        const save = btns.find(b => /^save$|save app|update/i.test((b.textContent || '').trim()));
        if (save) { save.scrollIntoView({block: 'center'}); save.click(); return true; }
        return false;
      })();
    `,
    returnByValue: true,
  });
  await sleep(6000);

  const ss = await Page.captureScreenshot({ format: 'png' });
  fs.writeFileSync('/tmp/ulw-docusign-new-app-saved.png', Buffer.from(ss.data, 'base64'));
  console.log('  Screenshot: /tmp/ulw-docusign-new-app-saved.png');

  // 6. Grant consent
  console.log('[6] Granting consent...');
  const consentUrl = 'https://account-d.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=d894331e-2eb1-4551-aabb-c4da9092c6b6&redirect_uri=http://localhost:5000/auth/callback';
  await Page.navigate({ url: consentUrl });
  await sleep(8000);

  const url2 = await Runtime.evaluate({ expression: 'window.location.href', returnByValue: true });
  const body2 = await Runtime.evaluate({ expression: 'document.body.innerText', returnByValue: true });
  console.log('  URL:', url2.result.value);
  console.log('  Body:', (body2.result.value || '').slice(0, 500));

  // Click Accept if present
  const acceptRes = await Runtime.evaluate({
    expression: `
      (function() {
        const all = Array.from(document.querySelectorAll('button, a, [role="button"], input[type="submit"]'));
        const visible = all.filter(b => b.offsetParent !== null);
        const accept = visible.find(b => /accept|allow|grant|agree|continue|authorize/i.test(b.textContent || b.value || ''));
        if (accept) { accept.click(); return accept.textContent.trim() || accept.value; }
        return { visible: visible.map(b => (b.textContent || b.value || '').trim()).filter(t => t.length > 0).slice(0, 15) };
      })();
    `,
    returnByValue: true,
  });
  console.log('  Accept:', JSON.stringify(acceptRes.result.value));
  await sleep(5000);

  const finalUrl = await Runtime.evaluate({ expression: 'window.location.href', returnByValue: true });
  console.log('  Final URL:', finalUrl.result.value);

  await att.close();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
