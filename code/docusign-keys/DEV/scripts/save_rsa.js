const CDP = require('/home/wang/wk/code/docusign-keys/node_modules/chrome-remote-interface');
const fs = require('fs');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const targets = await CDP.List();
  const target = targets.find(t => t.type === 'page' && t.url.includes('docusign'));
  const att = await CDP({ target });
  const { Runtime, Page } = att;
  await Page.enable(); await Runtime.enable();
  // Navigate to v3 app edit page
  await Page.navigate({ url: 'https://apps-d.docusign.com/admin/apps-and-keys/08c113af-a90c-4c5d-bb14-f94478f07dcb' });
  await sleep(8000);

  // Scroll to RSA section
  for (let y = 0; y < 3000; y += 400) {
    await Runtime.evaluate({ expression: `window.scrollTo(0, ${y});` });
    await sleep(200);
  }
  await sleep(1000);

  // Take a screenshot of the Authentication/RSA section
  const ss = await Page.captureScreenshot({ format: 'png' });
  fs.writeFileSync('/tmp/ulw-v3-rsa-state.png', Buffer.from(ss.data, 'base64'));
  console.log('Screenshot: /tmp/ulw-v3-rsa-state.png');

  // Check current state - is RSA committed or still in edit mode?
  const stateRes = await Runtime.evaluate({
    expression: `
      (() => {
        const tas = Array.from(document.querySelectorAll('textarea'));
        const taInfo = tas.map(t => ({ readonly: t.readOnly, disabled: t.disabled, len: (t.value || '').length }));
        // Find the "Generate RSA" button - if present, RSA hasn't been generated yet
        const btns = Array.from(document.querySelectorAll('button')).filter(b => b.offsetParent);
        const btnTexts = btns.map(b => b.textContent.trim()).filter(t => /rsa|save|update|regenerate/i.test(t));
        return { taInfo, btnTexts };
      })();
    `,
    returnByValue: true,
  });
  console.log('State:', JSON.stringify(stateRes.result.value));

  // Check for the public key fingerprint or "Regenerate" button
  // If we see Regenerate RSA, it means RSA IS registered
  const hasRegenerate = await Runtime.evaluate({
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button')).filter(b => b.offsetParent);
        return btns.some(b => /regenerate|add rsa|upload.*key/i.test((b.textContent || '').toLowerCase()));
      })();
    `,
    returnByValue: true,
  });
  console.log('Has Regenerate button (RSA already registered):', hasRegenerate.result.value);

  // Look at the page text around RSA
  const rsaSection = await Runtime.evaluate({
    expression: `
      (() => {
        const body = document.body.innerText;
        // Find "RSA" section context
        const idx = body.indexOf('RSA');
        if (idx < 0) return 'NO_RSA_FOUND';
        return body.slice(Math.max(0, idx-100), idx+1000);
      })();
    `,
    returnByValue: true,
  });
  console.log('\n=== RSA SECTION ===');
  console.log(rsaSection.result.value);
  console.log('=== END ===');

  // Find Save button at bottom and click it
  console.log('\n[2] Clicking final Save...');
  await Runtime.evaluate({ expression: `window.scrollTo(0, document.body.scrollHeight);` });
  await sleep(1000);
  await Runtime.evaluate({
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button, input[type="submit"]')).filter(b => b.offsetParent);
        for (const b of btns) {
          const t = (b.textContent || b.value || '').trim();
          if (/^(save|update|save changes|update app)$/i.test(t)) { b.click(); return t; }
        }
        return { all: btns.map(b => (b.textContent || b.value || '').trim()).filter(t => t && t.length < 30).slice(0, 20) };
      })();
    `,
    returnByValue: true,
  });
  await sleep(6000);

  const ss2 = await Page.captureScreenshot({ format: 'png' });
  fs.writeFileSync('/tmp/ulw-v3-after-save.png', Buffer.from(ss2.data, 'base64'));
  const url2 = await Runtime.evaluate({ expression: 'window.location.href', returnByValue: true });
  console.log('  After save URL:', url2.result.value);

  await att.close();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
