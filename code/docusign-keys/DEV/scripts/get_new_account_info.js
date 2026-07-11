const CDP = require('/home/wang/wk/code/docusign-keys/node_modules/chrome-remote-interface');
const fs = require('fs');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const targets = await CDP.List();
  // Find a page that's already logged in (not on login/2FA page)
  const target = targets.find(t => t.type === 'page' && t.url.includes('docusign'));
  console.log('Tab:', target.url);
  const att = await CDP({ target });
  const { Page, Runtime } = att;
  await Page.enable(); await Runtime.enable();
  // If not on home, go to apps-d.docusign.com
  if (!target.url.includes('apps-d.docusign.com/send') && !target.url.includes('apps-d.docusign.com/admin')) {
    await Page.navigate({ url: 'https://apps-d.docusign.com/' });
    await sleep(7000);
  }
  const url = await Runtime.evaluate({ expression: 'window.location.href', returnByValue: true });
  console.log('URL:', url.result.value);
  const title = await Runtime.evaluate({ expression: 'document.title', returnByValue: true });
  console.log('Title:', title.result.value);
  // Get account ID
  const accRes = await Runtime.evaluate({
    expression: `
      (function() {
        const all = document.body.innerText;
        const match = all.match(/Account ID[\\s:]*\\s*(\\d+)/i);
        const emailMatch = all.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/);
        const guids = all.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi);
        return {
          accountId: match ? match[1] : null,
          email: emailMatch ? emailMatch[0] : null,
          guids: guids ? Array.from(new Set(guids)).slice(0, 5) : [],
          snippet: all.slice(0, 600)
        };
      })();
    `,
    returnByValue: true,
  });
  console.log('Account info:', JSON.stringify(accRes.result.value, null, 2));
  await att.close();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
