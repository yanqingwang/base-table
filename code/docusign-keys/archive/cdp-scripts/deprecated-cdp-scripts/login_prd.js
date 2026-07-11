#!/usr/bin/env node
/**
 * Login to PRODUCTION DocuSign Admin (apps.docusign.com)
 *
 * PREREQ: Chrome running with --remote-debugging-port=9222
 *
 * Usage:
 *   DOCUSIGN_PASSWORD="..." node scripts/login_prd.js
 *
 * This script:
 *   1. Clears all docusign cookies (to ensure fresh login)
 *   2. Navigates to apps.docusign.com (production)
 *   3. Enters email (ross.wang@te.com) and password
 *   4. Waits for successful login
 *   5. Leaves a tab signed in
 */

const CDP = require('/home/wang/wk/code/docusign-keys/PRD/node_modules/chrome-remote-interface');
const fs = require('fs');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const PROD_EMAIL = 'ross.wang@te.com';
const PROD_PWD = process.env.DOCUSIGN_PASSWORD || '[SET_PASSWORD_VIA_ENV]';

(async () => {
  const targets = await CDP.List();
  // Use first available page tab, or create a new one
  let target = targets.find(t => t.type === 'page' && !t.url.includes('docusign'));
  if (!target) {
    target = targets.find(t => t.type === 'page') ||
             (await CDP.New({ url: 'about:blank' }));
  }
  console.log('Tab:', target.url || '(new)');

  const attached = await CDP({ target });
  const { Page, Runtime, Network } = attached;
  await Page.enable();
  await Runtime.enable();
  await Network.enable();

  // Step 1: Clear cookies
  console.log('[1] Clearing docusign cookies...');
  await Network.clearBrowserCookies();
  await sleep(500);

  // Step 2: Navigate to production DocuSign admin
  console.log('[2] Navigating to apps.docusign.com (production)...');
  await Page.navigate({ url: 'https://apps.docusign.com/' });
  await sleep(8000);

  let url = await Runtime.evaluate({ expression: 'window.location.href', returnByValue: true });
  console.log('  URL:', url.result.value);

  // Step 3: Check if we need to log in
  const body = await Runtime.evaluate({
    expression: 'document.body.innerText.slice(0, 1000)',
    returnByValue: true,
  });
  console.log('  Body:', (body.result.value || '').replace(/\s+/g, ' ').slice(0, 300));

  // If already logged in (no login form visible), we're done
  if ((body.result.value || '').toLowerCase().includes('apps and keys') ||
      (body.result.value || '').toLowerCase().includes('sign out') ||
      (url.result.value || '').includes('apps.docusign.com')) {
    const alreadyIn = (url.result.value || '').includes('/apps-and-keys');
    if (alreadyIn) {
      console.log('[✓] Already on Apps & Keys page. Login skipped.');
    } else {
      console.log('[✓] Already signed in. Navigating to Apps & Keys...');
      await Page.navigate({ url: 'https://apps.docusign.com/console/apps-and-keys' });
      await sleep(8000);
    }
    const finalUrl = await Runtime.evaluate({ expression: 'window.location.href', returnByValue: true });
    console.log('  Final URL:', finalUrl.result.value);

    const ss = await Page.captureScreenshot({ format: 'png' });
    fs.writeFileSync('/tmp/prd-logged-in.png', Buffer.from(ss.data, 'base64'));
    console.log('Screenshot: /tmp/prd-logged-in.png');

    await attached.close();
    process.exit(0);
  }

  // Step 4: Fill email
  console.log('[3] Filling email...');
  await sleep(3000);
  const emailRes = await Runtime.evaluate({
    expression: `
      (function() {
        const inputs = Array.from(document.querySelectorAll('input[type="email"], input[type="text"], input:not([type])'));
        const emailInp = inputs.find(i => /email|username|user/i.test(i.placeholder || i.name || i.id || ''));
        if (emailInp) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(emailInp, '${PROD_EMAIL}');
          emailInp.dispatchEvent(new Event('input', { bubbles: true }));
          emailInp.dispatchEvent(new Event('change', { bubbles: true }));
          return { found: true, ph: emailInp.placeholder };
        }
        // Fallback: first visible text input
        const visible = inputs.filter(i => i.offsetParent !== null && i.type !== 'hidden');
        if (visible.length > 0) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(visible[0], '${PROD_EMAIL}');
          visible[0].dispatchEvent(new Event('input', { bubbles: true }));
          visible[0].dispatchEvent(new Event('change', { bubbles: true }));
          return { found: 'fallback-visible' };
        }
        return { found: false, count: inputs.length };
      })();
    `,
    returnByValue: true,
  });
  console.log('  Email fill:', JSON.stringify(emailRes.result.value));
  await sleep(2000);

  // Step 5: Click Next/Submit
  console.log('[4] Clicking Next/Submit after email...');
  const nextRes = await Runtime.evaluate({
    expression: `
      (function() {
        const btns = Array.from(document.querySelectorAll('button, input[type="submit"], a[role="button"]'));
        const next = btns.find(b => /^(next|submit|continue|sign in|log in)$/i.test((b.textContent || b.value || '').trim()));
        if (next) { next.click(); return { clicked: true, text: (next.textContent || next.value || '').trim() }; }
        // Try form submit
        const forms = document.querySelectorAll('form');
        if (forms.length > 0) {
          forms[0].dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
          return { clicked: 'form-submit' };
        }
        return { clicked: false, buttons: btns.filter(b => b.offsetParent).map(b => (b.textContent || b.value || '').trim()).filter(t => t && t.length < 30).slice(0, 10) };
      })();
    `,
    returnByValue: true,
  });
  console.log('  Next:', JSON.stringify(nextRes.result.value));
  await sleep(5000);

  // Step 6: Fill password
  console.log('[5] Filling password...');
  const pwdRes = await Runtime.evaluate({
    expression: `
      (function() {
        const inputs = Array.from(document.querySelectorAll('input[type="password"]'));
        if (inputs.length > 0) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(inputs[0], '${PROD_PWD}');
          inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
          inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
          return { filled: true };
        }
        return { filled: false, count: inputs.length };
      })();
    `,
    returnByValue: true,
  });
  console.log('  Password fill:', JSON.stringify(pwdRes.result.value));
  await sleep(1500);

  // Step 7: Click Sign In
  console.log('[6] Clicking Sign In...');
  const signinRes = await Runtime.evaluate({
    expression: `
      (function() {
        const btns = Array.from(document.querySelectorAll('button, input[type="submit"], a[role="button"]'));
        const signin = btns.find(b => /^(sign in|log in|submit|signin)$/i.test((b.textContent || b.value || '').trim()));
        if (signin) { signin.click(); return { clicked: true, text: (signin.textContent || signin.value || '').trim() }; }
        const forms = document.querySelectorAll('form');
        if (forms.length > 0) {
          forms[0].dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
          return { clicked: 'form-submit' };
        }
        return { clicked: false };
      })();
    `,
    returnByValue: true,
  });
  console.log('  Sign In:', JSON.stringify(signinRes.result.value));
  await sleep(10000);

  // Step 8: Wait for redirect to apps.docusign.com
  for (let i = 0; i < 30; i++) {
    const curUrl = await Runtime.evaluate({ expression: 'window.location.href', returnByValue: true });
    console.log(`  [${i}] URL:`, (curUrl.result.value || '').slice(0, 100));
    if ((curUrl.result.value || '').includes('apps.docusign.com')) {
      break;
    }
    await sleep(2000);
  }

  // Step 9: Navigate to Apps & Keys
  console.log('[7] Navigating to Apps & Keys...');
  await Page.navigate({ url: 'https://apps.docusign.com/console/apps-and-keys' });
  await sleep(10000);

  const finalUrl = await Runtime.evaluate({ expression: 'window.location.href', returnByValue: true });
  console.log('  Final URL:', finalUrl.result.value);

  const ss = await Page.captureScreenshot({ format: 'png' });
  fs.writeFileSync('/tmp/prd-logged-in.png', Buffer.from(ss.data, 'base64'));
  console.log('Screenshot: /tmp/prd-logged-in.png');

  console.log('[✓] Login complete. PRD tab is ready.');
  await attached.close();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
