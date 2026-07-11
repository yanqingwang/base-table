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
  const ss = await Page.captureScreenshot({ format: 'png' });
  fs.writeFileSync('/tmp/ulw-state.png', Buffer.from(ss.data, 'base64'));
  console.log('Screenshot saved');
  // Click add
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
  await sleep(5000);
  const ss2 = await Page.captureScreenshot({ format: 'png' });
  fs.writeFileSync('/tmp/ulw-after-click.png', Buffer.from(ss2.data, 'base64'));
  const body = await Runtime.evaluate({ expression: 'document.body.innerText', returnByValue: true });
  console.log('Body after click:');
  console.log((body.result.value || '').slice(0, 3000));
  await att.close();
  process.exit(0);
})();
