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

  // First, look for the current state. The keys should be in the textareas still.
  console.log('[1] Current state:');
  const stateRes = await Runtime.evaluate({
    expression: `
      (() => {
        const url = window.location.href;
        const tas = Array.from(document.querySelectorAll('textarea'));
        const taCount = tas.length;
        const allBtns = Array.from(document.querySelectorAll('button'))
          .filter(b => b.offsetParent)
          .map(b => b.textContent.trim())
          .filter(t => t && t.length < 30);
        return { url, taCount, btns: Array.from(new Set(allBtns)).slice(0, 20) };
      })();
    `,
    returnByValue: true,
  });
  console.log('  State:', JSON.stringify(stateRes.result.value));

  // Scroll to find Additional Settings / Redirect URIs section
  console.log('[2] Scrolling down to find Redirect URIs...');
  for (let y = 0; y < 4000; y += 600) {
    await Runtime.evaluate({ expression: `window.scrollTo(0, ${y});` });
    await sleep(300);
  }
  await sleep(1000);

  // Find the Add URI button
  console.log('[3] Click Add URI...');
  const addUriRes = await Runtime.evaluate({
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button, a, [role="button"]'));
        for (const b of btns) {
          if (b.offsetParent && /add (a )?(redirect )?(uri|url)/i.test((b.textContent || ''))) {
            b.scrollIntoView({block: 'center'}); b.click(); return b.textContent.trim();
          }
        }
        return null;
      })();
    `,
    returnByValue: true,
  });
  console.log('  Clicked:', addUriRes.result.value);
  await sleep(2500);

  // Find the URI input
  console.log('[4] Filling URI...');
  await Runtime.evaluate({
    expression: `
      (() => {
        const inputs = Array.from(document.querySelectorAll('input[type="text"], input[type="url"]'))
          .filter(i => i.offsetParent && !i.disabled && i.value === '');
        for (const i of inputs) {
          // Check if it's in Redirect URI section
          let p = i.parentElement;
          for (let k = 0; k < 8 && p; k++) {
            if (/redirect uri/i.test(p.textContent || '')) {
              const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
              setter.call(i, 'http://localhost:5000/auth/callback');
              i.dispatchEvent(new Event('input', { bubbles: true }));
              i.dispatchEvent(new Event('change', { bubbles: true }));
              return 'redirect';
            }
            p = p.parentElement;
          }
        }
        // Fallback: just fill any empty input
        if (inputs.length > 0) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(inputs[0], 'http://localhost:5000/auth/callback');
          inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
          inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
          return 'fallback';
        }
        return 'none';
      })();
    `,
    returnByValue: true,
  });
  await sleep(2000);

  // Save
  console.log('[5] Save...');
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

  const ss = await Page.captureScreenshot({ format: 'png' });
  fs.writeFileSync('/tmp/ulw-v3-uri-saved.png', Buffer.from(ss.data, 'base64'));

  // Verify redirect URI added
  const verifyRes = await Runtime.evaluate({
    expression: `
      (() => {
        const inputs = Array.from(document.querySelectorAll('input'))
          .filter(i => i.offsetParent && (i.value || '').includes('localhost:5000'));
        return { hasUri: inputs.length > 0, uris: inputs.map(i => i.value) };
      })();
    `,
    returnByValue: true,
  });
  console.log('  Verify URI saved:', JSON.stringify(verifyRes.result.value));

  // 6. Grant consent
  console.log('[6] Grant consent...');
  const consentUrl = 'https://account-d.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=f4b29c60-807b-43f3-9575-f6e26e1e5d12&redirect_uri=http://localhost:5000/auth/callback';
  await Page.navigate({ url: consentUrl });
  await sleep(8000);

  const cu = await Runtime.evaluate({ expression: 'window.location.href', returnByValue: true });
  const cb = await Runtime.evaluate({ expression: 'document.body.innerText', returnByValue: true });
  console.log('  URL:', cu.result.value);
  console.log('  Body:', (cb.result.value || '').slice(0, 500));

  // Click Accept
  const accRes = await Runtime.evaluate({
    expression: `
      (() => {
        const all = Array.from(document.querySelectorAll('button, a, [role="button"], input[type="submit"]'));
        const visible = all.filter(b => b.offsetParent);
        const accept = visible.find(b => /accept|allow|grant|agree|authorize/i.test(b.textContent || b.value || ''));
        if (accept) { accept.click(); return (accept.textContent || accept.value || '').trim(); }
        return { visible: visible.map(b => (b.textContent || b.value || '').trim()).filter(t => t.length > 0).slice(0, 10) };
      })();
    `,
    returnByValue: true,
  });
  console.log('  Accept:', JSON.stringify(accRes.result.value));
  await sleep(5000);

  const finalUrl = await Runtime.evaluate({ expression: 'window.location.href', returnByValue: true });
  console.log('  Final URL:', finalUrl.result.value);

  const ss2 = await Page.captureScreenshot({ format: 'png' });
  fs.writeFileSync('/tmp/ulw-v3-consent.png', Buffer.from(ss2.data, 'base64'));

  await att.close();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
