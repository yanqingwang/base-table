const CDP = require('/home/wang/wk/code/docusign-keys/node_modules/chrome-remote-interface');
const fs = require('fs');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  let targets = await CDP.List();
  let target = targets.find(t => t.type === 'page' && t.url.includes('apps-and-keys'));
  if (!target) {
    const anyDs = targets.find(t => t.type === 'page' && t.url.includes('docusign'));
    const att = await CDP({ target: anyDs });
    const { Page } = att;
    await Page.enable();
    await Page.navigate({ url: 'https://apps-d.docusign.com/admin/apps-and-keys' });
    await sleep(7000);
    await att.close();
    process.exit(0);
  }
  const attached = await CDP({ target });
  const { Page, Runtime } = attached;
  await Page.enable(); await Runtime.enable();

  await Page.navigate({ url: 'https://apps-d.docusign.com/admin/apps-and-keys' });
  await sleep(7000);

  // Click Actions on the app row
  await Runtime.evaluate({
    expression: `
      (function() {
        const rows = document.querySelectorAll('tr, [role="row"]');
        for (const row of rows) {
          if (row.textContent.includes('easy-hire-docusign-integration') && row.textContent.length < 600) {
            const buttons = Array.from(row.querySelectorAll('button, a, [role="button"]'));
            for (const b of buttons) {
              if (b.textContent.trim().toLowerCase() === 'actions') { b.click(); return; }
            }
          }
        }
      })();
    `
  });
  await sleep(1500);
  await Runtime.evaluate({
    expression: `
      (function() {
        const items = Array.from(document.querySelectorAll('li, button, a, [role="menuitem"]'));
        for (const i of items) {
          if (/^edit$/i.test((i.textContent || '').trim())) { i.click(); return; }
        }
      })();
    `
  });
  await sleep(5000);

  // Find all visible inputs and their context
  const inputs = await Runtime.evaluate({
    expression: `
      (function() {
        const all = Array.from(document.querySelectorAll('input'));
        return all.map((i, idx) => {
          // Find parent container with heading/label
          let parent = i.parentElement;
          let ctx = '';
          for (let p = 0; p < 5 && parent; p++) {
            const txt = (parent.textContent || '').slice(0, 80);
            if (/redirect|additional|uri/i.test(txt)) {
              ctx = txt;
              break;
            }
            parent = parent.parentElement;
          }
          return {
            idx, type: i.type, placeholder: i.placeholder, value: i.value,
            visible: i.offsetParent !== null, name: i.name, id: i.id, ctx
          };
        }).filter(i => i.visible);
      })();
    `,
    returnByValue: true,
  });
  console.log('All visible inputs:');
  console.log(JSON.stringify(inputs.result.value, null, 2));

  // Click Add URI button
  console.log('\nClicking Add URI...');
  await Runtime.evaluate({
    expression: `
      (function() {
        const allBtns = Array.from(document.querySelectorAll('button, a, [role="button"]'));
        const addUri = allBtns.find(b => /add uri/i.test(b.textContent || ''));
        if (addUri) { addUri.scrollIntoView({block: 'center'}); addUri.click(); return true; }
        return false;
      })();
    `,
    returnByValue: true,
  });
  await sleep(2500);

  // Now find the new URI input - it should be empty and in Redirect URIs section
  const newInputs = await Runtime.evaluate({
    expression: `
      (function() {
        const all = Array.from(document.querySelectorAll('input'));
        return all.map((i, idx) => {
          let parent = i.parentElement;
          let ctx = '';
          for (let p = 0; p < 5 && parent; p++) {
            const txt = (parent.textContent || '').slice(0, 80);
            if (/redirect|additional|uri/i.test(txt)) { ctx = txt; break; }
            parent = parent.parentElement;
          }
          return {
            idx, type: i.type, placeholder: i.placeholder, value: i.value,
            visible: i.offsetParent !== null, name: i.name, id: i.id, ctx
          };
        }).filter(i => i.visible && (i.value === '' || i.value === 'http://www.example.com/privacy' || i.value === 'http://www.example.com/terms'));
      })();
    `,
    returnByValue: true,
  });
  console.log('\nNewly-empty inputs:');
  console.log(JSON.stringify(newInputs.result.value, null, 2));

  // The newly added URI input is the one in the "Redirect URIs" context
  console.log('\nFilling URI in correct field...');
  const fillRes = await Runtime.evaluate({
    expression: `
      (function() {
        const all = Array.from(document.querySelectorAll('input'));
        // Find the one whose parent context contains "Redirect URIs"
        for (const i of all) {
          if (!i.offsetParent || i.disabled) continue;
          let parent = i.parentElement;
          for (let p = 0; p < 6 && parent; p++) {
            if (/redirect uris/i.test(parent.textContent || '')) {
              // This is the URI input
              const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
              setter.call(i, 'http://localhost:5000/auth/callback');
              i.dispatchEvent(new Event('input', { bubbles: true }));
              i.dispatchEvent(new Event('change', { bubbles: true }));
              return { filled: true, value: i.value, parentCtx: parent.textContent.slice(0, 60) };
            }
            parent = parent.parentElement;
          }
        }
        return { filled: false };
      })();
    `,
    returnByValue: true,
  });
  console.log('Fill result:', JSON.stringify(fillRes.result.value));
  await sleep(1500);

  // Clear wrongly filled Terms of Use field if it was set
  await Runtime.evaluate({
    expression: `
      (function() {
        const all = Array.from(document.querySelectorAll('input'));
        for (const i of all) {
          if (!i.offsetParent || i.disabled) continue;
          if (i.value === 'http://localhost:5000/auth/callback') continue;  // Don't clear the URI we just set
          let parent = i.parentElement;
          for (let p = 0; p < 5 && parent; p++) {
            if (/terms of use/i.test(parent.textContent || '') && i.value === 'http://localhost:5000/auth/callback') {
              const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
              setter.call(i, '');
              i.dispatchEvent(new Event('input', { bubbles: true }));
              return { cleared: 'terms' };
            }
            parent = parent.parentElement;
          }
        }
        return { cleared: 'none' };
      })();
    `,
    returnByValue: true,
  });
  await sleep(1000);

  // Save
  console.log('\nSaving...');
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
  fs.writeFileSync('/tmp/ulw-docusign-uri2-saved.png', Buffer.from(ss.data, 'base64'));

  // Visit consent
  await Page.navigate({ url: 'https://account-d.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=9addabe1-1ad2-4e78-8270-4f53c29fd98c&redirect_uri=http://localhost:5000/auth/callback' });
  await sleep(8000);

  const url = await Runtime.evaluate({ expression: 'window.location.href', returnByValue: true });
  const body = await Runtime.evaluate({ expression: 'document.body.innerText', returnByValue: true });
  console.log('\nConsent URL:', url.result.value);
  console.log('Body:', (body.result.value || '').slice(0, 1500));

  const acceptRes = await Runtime.evaluate({
    expression: `
      (function() {
        const all = Array.from(document.querySelectorAll('button, a, [role="button"], input[type="submit"]'));
        const visible = all.filter(b => b.offsetParent !== null);
        const accept = visible.find(b => /accept|allow|grant|agree|continue|authorize/i.test(b.textContent || b.value || ''));
        if (accept) { accept.click(); return accept.textContent.trim() || accept.value; }
        return { visible: visible.map(b => (b.textContent || b.value || '').trim()).filter(t => t.length > 0).slice(0, 20) };
      })();
    `,
    returnByValue: true,
  });
  console.log('Accept:', JSON.stringify(acceptRes.result.value));
  await sleep(5000);

  const finalUrl = await Runtime.evaluate({ expression: 'window.location.href', returnByValue: true });
  console.log('Final URL:', finalUrl.result.value);

  await attached.close();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
