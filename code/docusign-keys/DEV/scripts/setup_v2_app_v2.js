const CDP = require('/home/wang/wk/code/docusign-keys/node_modules/chrome-remote-interface');
const fs = require('fs');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const targets = await CDP.List();
  const target = targets.find(t => t.type === 'page' && t.url.includes('docusign'));
  const att = await CDP({ target });
  const { Runtime, Page } = att;
  await Page.enable(); await Runtime.enable();
  await Page.navigate({ url: 'https://apps-d.docusign.com/admin/apps-and-keys' });
  await sleep(8000);

  console.log('[1] Click Add App and Integration Key...');
  await Runtime.evaluate({
    expression: `
      (() => {
        const all = Array.from(document.querySelectorAll('button, a, [role="button"], span[role="button"]'));
        const add = all.find(b => /add app and integration key/i.test(b.textContent || ''));
        if (add) { add.click(); return true; }
        return false;
      })();
    `,
    returnByValue: true,
  });
  await sleep(4000);

  // Dump dialog state
  const dlgRes = await Runtime.evaluate({
    expression: `
      (() => {
        const dialogs = document.querySelectorAll('[role="dialog"], .modal, [aria-modal="true"]');
        const visible = Array.from(dialogs).filter(d => d.offsetParent !== null);
        if (visible.length > 0) {
          return { found: true, html: visible[0].outerHTML.slice(0, 3000) };
        }
        // Maybe a new form appeared
        const inputs = Array.from(document.querySelectorAll('input[type="text"], input:not([type])'))
          .filter(i => i.offsetParent !== null);
        return { found: 'inputs', count: inputs.length, html: inputs.slice(0, 3).map(i => i.outerHTML).join('\n') };
      })();
    `,
    returnByValue: true,
  });
  console.log('[2] Dialog/Form state:', JSON.stringify(dlgRes.result.value).slice(0, 800));

  // Fill the name (try input + textarea)
  console.log('[3] Filling name...');
  const fillRes = await Runtime.evaluate({
    expression: `
      (() => {
        const dialogs = document.querySelectorAll('[role="dialog"], .modal');
        const visible = Array.from(dialogs).filter(d => d.offsetParent !== null);
        const root = visible[0] || document.body;
        const inputs = Array.from(root.querySelectorAll('input')).filter(i => i.offsetParent !== null && !i.disabled);
        const setters = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        // Find name field
        for (const i of inputs) {
          const ph = (i.placeholder || '').toLowerCase();
          const lbl = (i.closest('label')?.textContent || i.getAttribute('aria-label') || i.name || '').toLowerCase();
          if (ph.includes('name') || lbl.includes('name') || ph.includes('app')) {
            setters.call(i, 'easy-hire-docusign-integration-v2');
            i.dispatchEvent(new Event('input', { bubbles: true }));
            i.dispatchEvent(new Event('change', { bubbles: true }));
            return { filled: true, ph, lbl, type: i.type };
          }
        }
        return { filled: false, inputs: inputs.map(i => ({ ph: i.placeholder, lbl: i.getAttribute('aria-label') })) };
      })();
    `,
    returnByValue: true,
  });
  console.log('  Fill:', JSON.stringify(fillRes.result.value));
  await sleep(2000);

  // Click the actual Create button (in the dialog)
  console.log('[4] Click Create in dialog...');
  const createRes = await Runtime.evaluate({
    expression: `
      (() => {
        const dialogs = document.querySelectorAll('[role="dialog"], .modal');
        const visible = Array.from(dialogs).filter(d => d.offsetParent !== null);
        const root = visible[0] || document.body;
        const btns = Array.from(root.querySelectorAll('button, a, [role="button"]'));
        // Look for "Create", "Save", "Add"
        const create = btns.find(b => {
          const t = (b.textContent || '').trim().toLowerCase();
          return t === 'create' || t === 'save' || t === 'create app' || t === 'add';
        });
        if (create) { create.click(); return create.textContent.trim(); }
        return { buttons: btns.map(b => b.textContent.trim()).filter(t => t && t.length < 30) };
      })();
    `,
    returnByValue: true,
  });
  console.log('  Clicked:', JSON.stringify(createRes.result.value));
  await sleep(8000);

  const url = await Runtime.evaluate({ expression: 'window.location.href', returnByValue: true });
  console.log('[5] URL:', url.result.value);

  // Capture new Integration Key from edit page
  const keyRes = await Runtime.evaluate({
    expression: `
      (() => {
        const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
        const found = inputs.map(i => ({ id: i.id, value: i.value, visible: i.offsetParent !== null })).filter(i => i.visible && /[0-9a-f-]{36}/.test(i.value));
        const body = document.body.innerText;
        const guids = body.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi);
        return { inputs: found, guids: guids ? Array.from(new Set(guids)) : [] };
      })();
    `,
    returnByValue: true,
  });
  console.log('[6] Keys:', JSON.stringify(keyRes.result.value, null, 2));

  // Try clicking Generate RSA on the edit page
  console.log('[7] Clicking Generate RSA...');
  await Runtime.evaluate({
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button, a, [role="button"]'));
        const gen = btns.find(b => /^generate rsa/i.test((b.textContent || '').trim()));
        if (gen) { gen.scrollIntoView({block: 'center'}); gen.click(); return true; }
        return false;
      })();
    `,
    returnByValue: true,
  });
  await sleep(5000);

  // After click, the page should show the new key. Capture it.
  const keysAfter = await Runtime.evaluate({
    expression: `
      (() => {
        const tas = Array.from(document.querySelectorAll('textarea, pre, code'));
        let pub = '', priv = '';
        for (const t of tas) {
          const txt = (t.textContent || '').trim();
          if (txt.startsWith('-----BEGIN PUBLIC KEY-----')) pub = txt;
          if (txt.startsWith('-----BEGIN RSA PRIVATE KEY-----') || txt.startsWith('-----BEGIN PRIVATE KEY-----')) priv = txt;
        }
        return { pubLen: pub.length, privLen: priv.length, hasBoth: pub && priv };
      })();
    `,
    returnByValue: true,
  });
  console.log('  After gen:', JSON.stringify(keysAfter.result.value));

  if (keysAfter.result.value.hasBoth) {
    const textRes = await Runtime.evaluate({
      expression: `
        (() => {
          const tas = Array.from(document.querySelectorAll('textarea, pre, code'));
          let pub = '', priv = '';
          for (const t of tas) {
            const txt = (t.textContent || '').trim();
            if (txt.startsWith('-----BEGIN PUBLIC KEY-----')) pub = txt;
            if (txt.startsWith('-----BEGIN RSA PRIVATE KEY-----') || txt.startsWith('-----BEGIN PRIVATE KEY-----')) priv = txt;
          }
          return { pub, priv };
        })();
      `,
      returnByValue: true,
    });
    fs.writeFileSync('/home/wang/wk/code/docusign-keys/docusign_private_v2.pem', textRes.result.value.priv);
    fs.writeFileSync('/home/wang/wk/code/docusign-keys/docusign_public_v2.pem', textRes.result.value.pub);
    console.log('  Saved DocuSign-generated keys');
  }

  // Find and click Add URI
  console.log('[8] Adding redirect URI...');
  await Runtime.evaluate({
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button, a, [role="button"]'));
        const addUri = btns.find(b => /add (a )?uri|add redirect|add url/i.test(b.textContent || ''));
        if (addUri) { addUri.scrollIntoView({block: 'center'}); addUri.click(); return true; }
        return false;
      })();
    `,
    returnByValue: true,
  });
  await sleep(2500);

  // Type URI in the new field
  await Runtime.evaluate({
    expression: `
      (() => {
        const inputs = Array.from(document.querySelectorAll('input[type="text"], input[type="url"]'))
          .filter(i => i.offsetParent && !i.disabled);
        // Find empty input near "Redirect URI" label
        for (const i of inputs) {
          if (i.value === '' || /localhost/.test(i.value) === false) {
            // Check parent context
            let p = i.parentElement;
            for (let k = 0; k < 8 && p; k++) {
              if (/redirect uri/i.test(p.textContent || '')) {
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
        // Fallback: any empty visible input
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
  await sleep(2000);

  // Save
  console.log('[9] Clicking Save...');
  await Runtime.evaluate({
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button[type="submit"], button, a, [role="button"]'));
        const save = btns.find(b => {
          const t = (b.textContent || '').trim().toLowerCase();
          return t === 'save' || t === 'update' || t === 'save app';
        });
        if (save) { save.scrollIntoView({block: 'center'}); save.click(); return true; }
        return { all: btns.map(b => (b.textContent || '').trim()).filter(t => t && t.length < 30).slice(0, 15) };
      })();
    `,
    returnByValue: true,
  });
  await sleep(6000);

  const ss = await Page.captureScreenshot({ format: 'png' });
  fs.writeFileSync('/tmp/ulw-docusign-v2-saved.png', Buffer.from(ss.data, 'base64'));

  await att.close();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
