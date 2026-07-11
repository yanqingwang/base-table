const CDP = require('/home/wang/wk/code/docusign-keys/node_modules/chrome-remote-interface');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const targets = await CDP.List();
  const target = targets.find(t => t.type === 'page' && t.url.includes('docusign'));
  const att = await CDP({ target });
  const { Page, Runtime } = att;
  await Page.enable(); await Runtime.enable();
  await Page.navigate({ url: 'https://apps-d.docusign.com/admin/users' });
  await sleep(8000);
  const body = await Runtime.evaluate({ expression: 'document.body.innerText', returnByValue: true });
  console.log((body.result.value || '').slice(0, 3000));
  await att.close();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
