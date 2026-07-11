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

  console.log('[1] Selecting Private custom integration...');
  await Runtime.evaluate({
    expression: `
      (() => {
        const labels = Array.from(document.querySelectorAll('label'));
        for (const l of labels) {
          if (/private custom integration/i.test(l.textContent || '')) {
            const r = l.querySelector('input[type="radio"]') || document.getElementById(l.htmlFor);
            if (r) { r.click(); return { clicked: 'label-input' }; }
            l.click();
            return { clicked: 'label' };
          }
        }
        return false;
      })();
    `,
    returnByValue: true,
  });
  await sleep(1500);

  // Save (just the type selection first)
  console.log('[2] Clicking Save for type...');
  await Runtime.evaluate({
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        for (const b of btns) {
          if (b.offsetParent && /^(save|update)$/i.test((b.textContent || '').trim())) {
            b.scrollIntoView({block: 'center'}); b.click(); return b.textContent.trim();
          }
        }
        return null;
      })();
    `,
    returnByValue: true,
  });
  await sleep(4000);

  // Scroll to RSA section
  console.log('[3] Scrolling to RSA section...');
  await Runtime.evaluate({
    expression: `
      (() => {
        const sections = Array.from(document.querySelectorAll('h2, h3, div, span'));
        for (const s of sections) {
          if (/authentication|rsa|service integration/i.test(s.textContent || '') && s.textContent.length < 50) {
            s.scrollIntoView({block: 'center'});
            return s.textContent.trim();
          }
        }
      })();
    `,
    returnByValue: true,
  });
  await sleep(2000);

  // Click Generate RSA
  console.log('[4] Clicking Generate RSA...');
  await Runtime.evaluate({
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button, a, [role="button"]'));
        for (const b of btns) {
          if (b.offsetParent && /^generate rsa/i.test((b.textContent || '').trim())) {
            b.click(); return b.textContent.trim();
          }
        }
        return null;
      })();
    `,
    returnByValue: true,
  });
  await sleep(6000);

  // After generate, the key should appear in a textarea
  console.log('[5] Capturing generated key...');
  const keysRes = await Runtime.evaluate({
    expression: `
      (() => {
        const tas = Array.from(document.querySelectorAll('textarea, pre, code'));
        let pub = '', priv = '';
        for (const t of tas) {
          const txt = (t.textContent || t.value || '').trim();
          if (txt.startsWith('-----BEGIN PUBLIC KEY-----')) pub = txt;
          if (txt.startsWith('-----BEGIN RSA PRIVATE KEY-----') || txt.startsWith('-----BEGIN PRIVATE KEY-----')) priv = txt;
        }
        return { pubLen: pub.length, privLen: priv.length, pub: pub.slice(0, 100), priv: priv.slice(0, 100) };
      })();
    `,
    returnByValue: true,
  });
  console.log('  Captured:', JSON.stringify(keysRes.result.value, null, 2));

  if (keysRes.result.value.priv) {
    // Need to fetch the full keys
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
    console.log('  Saved DocuSign-generated keypair to v2 files');
  }

  // Look for Add URI button
  console.log('[6] Looking for Add URI...');
  const ss1 = await Page.captureScreenshot({ format: 'png' });
  fs.writeFileSync('/tmp/ulw-v3-after-rsa.png', Buffer.from(ss1.data, 'base64'));

  await Runtime.evaluate({
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button, a, [role="button"]'));
        for (const b of btns) {
          if (b.offsetParent && /add (a )?(redirect )?(uri|url)/i.test(b.textContent || '')) {
            b.scrollIntoView({block: 'center'}); b.click(); return b.textContent.trim();
          }
        }
        return null;
      })();
    `,
    returnByValue: true,
  });
  await sleep(2500);

  // Find any new empty URI input
  console.log('[7] Filling redirect URI input...');
  await Runtime.evaluate({
    expression: `
      (() => {
        const inputs = Array.from(document.querySelectorAll('input[type="text"], input[type="url"]'))
          .filter(i => i.offsetParent && !i.disabled);
        for (const i of inputs) {
          if (i.value === '') {
            let p = i.parentElement;
            for (let k = 0; k < 8 && p; k++) {
              if (/redirect/i.test(p.textContent || '')) {
                const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                setter.call(i, 'http://localhost:5000/auth/callback');
                i.dispatchEvent(new Event('input', { bubbles: true }));
                i.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
              }
              p = p.parentElement;
            }
          }
        }
        // Last resort
        for (const i of inputs) {
          if (i.value === '' && i.type !== 'checkbox' && i.type !== 'radio') {
            const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            setter.call(i, 'http://localhost:5000/auth/callback');
            i.dispatchEvent(new Event('input', { bubbles: true }));
            i.dispatchEvent(new Event('change', { bubbles: true }));
            return { fallback: true };
          }
        }
        return false;
      })();
    `,
    returnByValue: true,
  });
  await sleep(1500);

  // Save
  console.log('[8] Save changes...');
  await Runtime.evaluate({
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        for (const b of btns) {
          if (b.offsetParent && /^(save|update)$/i.test((b.textContent || '').trim())) {
            b.scrollIntoView({block: 'center'}); b.click(); return b.textContent.trim();
          }
        }
        return null;
      })();
    `,
    returnByValue: true,
  });
  await sleep(6000);

  // Update .env with NEW correct Integration Key
  const newIntegrationKey = 'f4b29c60-807b-43f3-9575-f6e26e1e5d12';
  const envContent = `# DocuSign Integration Key (NEW Demo environment - ross.wang@te.com)
# Updated: 2026-06-06
DOCUSIGN_INTEGRATION_KEY="${newIntegrationKey}"
DOCUSIGN_USER_ID="846a50f2-7b2f-44c0-bbdf-78e75bd4c990"
DOCUSIGN_ACCOUNT_ID="45445035"
DOCUSIGN_BASE_URL="https://demo.docusign.net/restapi"
DOCUSIGN_OAUTH_BASE="https://account-d.docusign.com"
DOCUSIGN_ADMIN_BASE="https://admindemo.docusign.com"
DOCUSIGN_PRIVATE_KEY_PATH="/home/wang/wk/code/docusign-keys/docusign_private_v2.pem"
DOCUSIGN_PUBLIC_KEY_PATH="/home/wang/wk/code/docusign-keys/docusign_public_v2.pem"
DOCUSIGN_WEBHOOK_HMAC_SECRET="REPLACE_WITH_HMAC_SECRET_AFTER_CONNECT_SETUP"
DOCUSIGN_REDIRECT_URI="http://localhost:5000/auth/callback"
DOCUSIGN_APP_NAME="easy-hire-docusign-integration-v2"
`;
  fs.writeFileSync('/home/wang/wk/code/docusign-keys/.env', envContent);
  console.log('\n=== .env UPDATED ===');
  console.log('  Integration Key:', newIntegrationKey);

  const ss2 = await Page.captureScreenshot({ format: 'png' });
  fs.writeFileSync('/tmp/ulw-v3-final.png', Buffer.from(ss2.data, 'base64'));
  console.log('  Screenshots: /tmp/ulw-v3-after-rsa.png + /tmp/ulw-v3-final.png');

  await att.close();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
