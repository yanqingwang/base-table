const CDP = require('/home/wang/wk/code/docusign-keys/node_modules/chrome-remote-interface');
const fs = require('fs');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  let targets = await CDP.List();
  let target = targets.find(t => t.type === 'page' && t.url.includes('apps-and-keys'));
  if (!target) {
    // Open a new tab
    target = await CDP.New({ host: 'localhost', port: 9222, url: 'about:blank' });
    await sleep(2000);
  }
  console.log('Tab:', target.url);
  const attached = await CDP({ target });
  const { Page, Runtime } = attached;
  await Page.enable(); await Runtime.enable();

  // Hard navigate to apps-and-keys
  console.log('[1] Navigating to apps-and-keys...');
  await Page.navigate({ url: 'https://apps-d.docusign.com/admin/apps-and-keys' });
  await sleep(8000);

  let url = await Runtime.evaluate({ expression: 'window.location.href', returnByValue: true });
  console.log('  URL:', url.result.value);

  // Find OUR app row and its Actions button
  console.log('[2] Finding app row...');
  const findRes = await Runtime.evaluate({
    expression: `
      (function() {
        const rows = document.querySelectorAll('tr, [role="row"]');
        for (const row of rows) {
          if (row.textContent.includes('easy-hire-docusign-integration') && row.textContent.length < 600) {
            // Get all buttons in this row
            const buttons = Array.from(row.querySelectorAll('button, a, [role="button"]'));
            return {
              found: true,
              rowText: row.textContent.trim().slice(0, 100),
              buttons: buttons.map(b => b.textContent.trim())
            };
          }
        }
        return { found: false };
      })();
    `,
    returnByValue: true,
  });
  console.log('  Row:', JSON.stringify(findRes.result.value));

  if (!findRes.result.value.found) {
    console.error('App row not found');
    process.exit(1);
  }

  // Click Actions button on app row
  console.log('[3] Clicking Actions...');
  await Runtime.evaluate({
    expression: `
      (function() {
        const rows = document.querySelectorAll('tr, [role="row"]');
        for (const row of rows) {
          if (row.textContent.includes('easy-hire-docusign-integration') && row.textContent.length < 600) {
            const buttons = Array.from(row.querySelectorAll('button, a, [role="button"]'));
            for (const b of buttons) {
              if (/^actions$|^actions$/i.test(b.textContent.trim())) { b.click(); return true; }
              if (b.textContent.trim().toLowerCase() === 'actions') { b.click(); return true; }
            }
          }
        }
      })();
    `
  });
  await sleep(2000);

  // Find Edit menu item
  console.log('[4] Clicking Edit in menu...');
  const menuRes = await Runtime.evaluate({
    expression: `
      (function() {
        const allItems = Array.from(document.querySelectorAll('li, button, a, [role="menuitem"], [role="option"]'));
        const visible = allItems.filter(i => i.offsetParent !== null);
        const edit = visible.find(i => /^edit$/i.test((i.textContent || '').trim()));
        if (edit) { edit.click(); return 'clicked: ' + edit.textContent.trim(); }
        // Print first 30 visible items
        return { visibleItems: visible.map(i => (i.textContent || '').trim().slice(0, 50)).slice(0, 30) };
      })();
    `,
    returnByValue: true,
  });
  console.log('  Menu:', JSON.stringify(menuRes.result.value));
  await sleep(5000);

  url = await Runtime.evaluate({ expression: 'window.location.href', returnByValue: true });
  console.log('  URL after Edit:', url.result.value);

  // Scroll to Additional Settings
  await Runtime.evaluate({
    expression: `
      (function() {
        const all = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, div, span, label, p'));
        for (const el of all) {
          if (/additional settings|redirect uris/i.test(el.textContent || '')) {
            el.scrollIntoView({block: 'center'});
            return el.textContent.trim().slice(0, 60);
          }
        }
      })();
    `
  });
  await sleep(1000);

  // Find and click Add URI
  console.log('[5] Clicking Add URI...');
  const addUriRes = await Runtime.evaluate({
    expression: `
      (function() {
        const allBtns = Array.from(document.querySelectorAll('button, a, [role="button"]'));
        const addUri = allBtns.find(b => /add uri/i.test(b.textContent || ''));
        if (addUri) {
          addUri.scrollIntoView({block: 'center'});
          addUri.click();
          return { clicked: true, text: addUri.textContent.trim() };
        }
        return { clicked: false };
      })();
    `,
    returnByValue: true,
  });
  console.log('  Add URI:', JSON.stringify(addUriRes.result.value));
  await sleep(2000);

  // Find the new URI input
  console.log('[6] Filling URI...');
  const fillRes = await Runtime.evaluate({
    expression: `
      (function() {
        const inputs = Array.from(document.querySelectorAll('input[type="text"], input[type="url"], input:not([type])'));
        const visible = inputs.filter(i => i.offsetParent !== null && !i.disabled);
        // The newly added one is usually the last one
        if (visible.length === 0) return { count: 0 };
        const last = visible[visible.length - 1];
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(last, 'http://localhost:5000/auth/callback');
        last.dispatchEvent(new Event('input', { bubbles: true }));
        last.dispatchEvent(new Event('change', { bubbles: true }));
        last.dispatchEvent(new Event('blur', { bubbles: true }));
        return { filled: true, count: visible.length, placeholder: last.placeholder };
      })();
    `,
    returnByValue: true,
  });
  console.log('  Fill:', JSON.stringify(fillRes.result.value));
  await sleep(2000);

  // Click Save (bottom of page)
  console.log('[7] Saving...');
  await Runtime.evaluate({
    expression: `
      (function() {
        const allBtns = Array.from(document.querySelectorAll('button, a, [role="button"]'));
        const save = allBtns.find(b => /^save$|save app|update/i.test((b.textContent || '').trim()));
        if (save) { save.scrollIntoView({block: 'center'}); save.click(); return save.textContent.trim(); }
        return null;
      })();
    `,
    returnByValue: true,
  });
  await sleep(6000);

  const ss = await Page.captureScreenshot({ format: 'png' });
  fs.writeFileSync('/tmp/ulw-docusign-uri-saved.png', Buffer.from(ss.data, 'base64'));
  console.log('  Saved. Screenshot: /tmp/ulw-docusign-uri-saved.png');

  // Now visit consent URL
  console.log('[8] Visiting consent URL...');
  await Page.navigate({ url: 'https://account-d.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=9addabe1-1ad2-4e78-8270-4f53c29fd98c&redirect_uri=http://localhost:5000/auth/callback' });
  await sleep(8000);

  url = await Runtime.evaluate({ expression: 'window.location.href', returnByValue: true });
  console.log('  Consent URL:', url.result.value);

  const body = await Runtime.evaluate({ expression: 'document.body.innerText', returnByValue: true });
  console.log('\n  Body snippet:');
  console.log((body.result.value || '').slice(0, 1500));

  // Try to find Accept/Allow button
  const acceptRes = await Runtime.evaluate({
    expression: `
      (function() {
        const allBtns = Array.from(document.querySelectorAll('button, a, [role="button"], input[type="submit"]'));
        const visible = allBtns.filter(b => b.offsetParent !== null);
        const accept = visible.find(b => /accept|allow|grant|agree|continue|authorize/i.test(b.textContent || b.value || ''));
        if (accept) { accept.click(); return accept.textContent.trim() || accept.value; }
        return { visibleTexts: visible.map(b => (b.textContent || b.value || '').trim()).filter(t => t.length > 0).slice(0, 30) };
      })();
    `,
    returnByValue: true,
  });
  console.log('  Accept:', JSON.stringify(acceptRes.result.value));
  await sleep(5000);

  const finalUrl = await Runtime.evaluate({ expression: 'window.location.href', returnByValue: true });
  console.log('  Final URL:', finalUrl.result.value);

  const ss2 = await Page.captureScreenshot({ format: 'png' });
  fs.writeFileSync('/tmp/ulw-docusign-consent-final.png', Buffer.from(ss2.data, 'base64'));

  await attached.close();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
