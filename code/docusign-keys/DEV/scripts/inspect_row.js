const CDP = require('/home/wang/wk/code/docusign-keys/node_modules/chrome-remote-interface');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const targets = await CDP.List();
  const target = targets.find(t => t.type === 'page' && t.url.includes('apps-and-keys'));
  const att = await CDP({ target });
  const { Runtime, Page } = att;
  await Page.enable(); await Runtime.enable();
  await Page.navigate({ url: 'https://apps-d.docusign.com/admin/apps-and-keys' });
  await sleep(7000);
  const r = await Runtime.evaluate({
    expression: `
      (() => {
        const rows = document.querySelectorAll('tr, [role="row"]');
        for (const row of rows) {
          if (row.textContent.includes('easy-hire-docusign-integration-v2') && row.textContent.length < 600) {
            return row.outerHTML.slice(0, 3000);
          }
        }
        return 'NOT_FOUND';
      })();
    `,
    returnByValue: true,
  });
  console.log(r.result.value);
  await att.close();
  process.exit(0);
})();
