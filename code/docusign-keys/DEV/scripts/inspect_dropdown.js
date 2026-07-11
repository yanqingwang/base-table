const CDP = require('/home/wang/wk/code/docusign-keys/node_modules/chrome-remote-interface');
const fs = require('fs');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const targets = await CDP.List();
  const target = targets.find(t => t.type === 'page' && t.url.includes('docusign'));
  const att = await CDP({ target });
  const { Page, Runtime } = att;
  await Page.enable(); await Runtime.enable();

  // Reopen the account selector
  await Page.navigate({ url: 'https://apps-d.docusign.com/admin/apps-and-keys' });
  await sleep(8000);
  await sleep(2000);

  // Click the top "TE" link
  console.log('[1] Click TE in top nav...');
  const clickRes = await Runtime.evaluate({
    expression: `
      (() => {
        // The account switcher is usually a clickable element with current account name
        // Try various selectors
        const all = Array.from(document.querySelectorAll('a, button, [role="button"], [role="combobox"]'));
        const candidates = all.filter(x => {
          const t = (x.textContent || '').trim();
          return x.offsetParent && /TE\\s*\\(?45445035|TEDefault|^TE$/i.test(t) && t.length < 30;
        });
        if (candidates.length > 0) {
          candidates[0].click();
          return { clicked: candidates[0].textContent.trim(), tag: candidates[0].tagName };
        }
        return { not_found: all.filter(x => x.offsetParent).map(x => (x.textContent || '').trim()).filter(t => t && t.length < 30).slice(0, 30) };
      })();
    `,
    returnByValue: true,
  });
  console.log('  Result:', JSON.stringify(clickRes.result.value));
  await sleep(2000);

  // Dump all visible text items containing account IDs
  console.log('[2] Account selector dropdown items:');
  const dropRes = await Runtime.evaluate({
    expression: `
      (() => {
        const all = Array.from(document.querySelectorAll('li, a, button, [role="option"], label, div, span'));
        return all.filter(x => {
          if (!x.offsetParent) return false;
          const t = (x.textContent || '').trim();
          return /45444181|45445035|48104293|TE-MY|TE-2|TEDefault/.test(t) && t.length < 100;
        }).map(x => ({
          tag: x.tagName,
          text: (x.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 80),
          html: x.outerHTML.slice(0, 200),
        })).slice(0, 30);
      })();
    `,
    returnByValue: true,
  });
  for (const item of (dropRes.result.value || [])) {
    console.log('  ', JSON.stringify(item));
  }

  const ss = await Page.captureScreenshot({ format: 'png' });
  fs.writeFileSync('/tmp/ulw-dropdown.png', Buffer.from(ss.data, 'base64'));

  await att.close();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
