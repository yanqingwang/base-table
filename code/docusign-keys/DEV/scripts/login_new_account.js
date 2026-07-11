const CDP = require('/home/wang/wk/code/docusign-keys/node_modules/chrome-remote-interface');
const fs = require('fs');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const NEW_EMAIL = 'ross.wang@te.com';
const NEW_PWD = process.env.DOCUSIGN_PASSWORD || '[SET_PASSWORD_VIA_ENV]';

(async () => {
  const targets = await CDP.List();
  // Use a clean tab - or pick the first page
  let target = targets.find(t => t.type === 'page' && !t.url.includes('docusign'));
  if (!target) {
    target = targets.find(t => t.type === 'page') || (await CDP.New({ host: 'localhost', port: 9222, url: 'about:blank' }));
  }
  console.log('Tab:', target.url || '(new)');

  const attached = await CDP({ target });
  const { Page, Runtime, Network } = attached;
  await Page.enable();
  await Runtime.enable();
  await Network.enable();

  // First clear all DocuSign cookies
  console.log('[1] Clearing docusign cookies...');
  await Network.clearBrowserCookies();
  await sleep(500);
  const cookies = await Network.getCookies();
  const ds = (cookies.cookies || []).filter(c => /docusign/.test(c.domain));
  console.log(`  Remaining docusign cookies: ${ds.length}`);

  // Navigate to docusign login
  console.log('[2] Navigating to apps-d.docusign.com...');
  await Page.navigate({ url: 'https://apps-d.docusign.com/' });
  await sleep(7000);

  let url = await Runtime.evaluate({ expression: 'window.location.href', returnByValue: true });
  console.log('  URL:', url.result.value);

  // Look for login form
  const body = await Runtime.evaluate({ expression: 'document.body.innerText.slice(0, 500)', returnByValue: true });
  console.log('  Body:', body.result.value.replace(/\s+/g, ' ').slice(0, 200));

  // Find email input
  console.log('[3] Filling email...');
  const emailRes = await Runtime.evaluate({
    expression: `
      (function() {
        const inputs = Array.from(document.querySelectorAll('input[type="email"], input[type="text"], input:not([type])'));
        const emailInp = inputs.find(i => /email|username|user/i.test(i.placeholder || i.name || i.id || ''));
        if (emailInp) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(emailInp, '${NEW_EMAIL}');
          emailInp.dispatchEvent(new Event('input', { bubbles: true }));
          emailInp.dispatchEvent(new Event('change', { bubbles: true }));
          return { filled: true, ph: emailInp.placeholder };
        }
        // Fallback: first visible text input
        const visible = inputs.filter(i => i.offsetParent !== null && i.type !== 'hidden');
        if (visible.length > 0) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(visible[0], '${NEW_EMAIL}');
          visible[0].dispatchEvent(new Event('input', { bubbles: true }));
          return { filled: 'fallback', count: visible.length };
        }
        return { filled: false };
      })();
    `,
    returnByValue: true,
  });
  console.log('  Email:', JSON.stringify(emailRes.result.value));
  await sleep(800);

  // Submit email (click Continue / Next)
  console.log('[4] Clicking Continue...');
  await Runtime.evaluate({
    expression: `
      (function() {
        const btns = Array.from(document.querySelectorAll('button, a, [role="button"], input[type="submit"]'));
        const next = btns.find(b => /continue|next|sign in|log in|proceed|submit/i.test(b.textContent || b.value || ''));
        if (next) { next.click(); return next.textContent.trim() || next.value; }
        return null;
      })();
    `,
    returnByValue: true,
  });
  await sleep(4000);

  url = await Runtime.evaluate({ expression: 'window.location.href', returnByValue: true });
  console.log('  URL after Continue:', url.result.value);

  // Find password input
  console.log('[5] Filling password...');
  const pwdRes = await Runtime.evaluate({
    expression: `
      (function() {
        const inputs = Array.from(document.querySelectorAll('input[type="password"]'));
        if (inputs.length === 0) {
          // Maybe email-only single-page
          return { count: 0 };
        }
        const pwdInp = inputs[0];
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(pwdInp, '${NEW_PWD}');
        pwdInp.dispatchEvent(new Event('input', { bubbles: true }));
        pwdInp.dispatchEvent(new Event('change', { bubbles: true }));
        return { filled: true, count: inputs.length };
      })();
    `,
    returnByValue: true,
  });
  console.log('  Password:', JSON.stringify(pwdRes.result.value));
  await sleep(800);

  // Submit
  console.log('[6] Submitting login...');
  await Runtime.evaluate({
    expression: `
      (function() {
        const btns = Array.from(document.querySelectorAll('button, a, [role="button"], input[type="submit"]'));
        const next = btns.find(b => /continue|next|sign in|log in|proceed|submit|verify|authenticate/i.test(b.textContent || b.value || ''));
        if (next) { next.click(); return next.textContent.trim() || next.value; }
        return null;
      })();
    `,
    returnByValue: true,
  });
  await sleep(7000);

  url = await Runtime.evaluate({ expression: 'window.location.href', returnByValue: true });
  const title = await Runtime.evaluate({ expression: 'document.title', returnByValue: true });
  console.log('  Final URL:', url.result.value);
  console.log('  Title:', title.result.value);

  // Check for errors
  const errRes = await Runtime.evaluate({
    expression: `
      (function() {
        const all = document.body.innerText;
        const lines = all.split('\\n');
        return lines.filter(l => /error|invalid|fail|incorrect|wrong|verify/i.test(l) && l.length < 200).slice(0, 5);
      })();
    `,
    returnByValue: true,
  });
  console.log('  Errors:', JSON.stringify(errRes.result.value));

  // Get account ID from page
  const accRes = await Runtime.evaluate({
    expression: `
      (function() {
        const all = document.body.innerText;
        // Account ID is usually visible on apps-d.docusign.com after login
        const match = all.match(/Account ID[\\s:]*\\s*(\\d+)/i);
        const guids = all.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi);
        return { accountId: match ? match[1] : null, guids: guids ? Array.from(new Set(guids)).slice(0, 5) : [] };
      })();
    `,
    returnByValue: true,
  });
  console.log('  Account:', JSON.stringify(accRes.result.value));

  const ss = await Page.captureScreenshot({ format: 'png' });
  fs.writeFileSync('/tmp/ulw-docusign-new-login.png', Buffer.from(ss.data, 'base64'));
  console.log('  Screenshot: /tmp/ulw-docusign-new-login.png');

  await attached.close();
  process.exit(0);
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
