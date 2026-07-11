const CDP = require('/home/wang/wk/code/docusign-keys/node_modules/chrome-remote-interface');
const fs = require('fs');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const targets = await CDP.List();
  const target = targets.find(t => t.type === 'page' && t.url.includes('admin/users'));
  if (!target) {
    const any = targets.find(t => t.type === 'page' && t.url.includes('docusign'));
    const a2 = await CDP({ target: any });
    const { Page } = a2;
    await Page.enable();
    await Page.navigate({ url: 'https://apps-d.docusign.com/admin/users' });
    await sleep(7000);
    await a2.close();
    process.exit(0);
  }
  const att = await CDP({ target });
  const { Page, Runtime } = att;
  await Page.enable(); await Runtime.enable();
  await sleep(2000);

  // Find the search input and type "ross"
  console.log('[1] Searching for Ross...');
  const searchRes = await Runtime.evaluate({
    expression: `
      (function() {
        const inputs = Array.from(document.querySelectorAll('input[type="search"], input[placeholder*="search" i], input[placeholder*="Search" i]'));
        const visible = inputs.filter(i => i.offsetParent !== null);
        if (visible.length > 0) {
          const target = visible[0];
          target.focus();
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(target, 'ross');
          target.dispatchEvent(new Event('input', { bubbles: true }));
          target.dispatchEvent(new Event('keyup', { bubbles: true }));
          target.dispatchEvent(new Event('change', { bubbles: true }));
          return { count: visible.length, first: target.placeholder };
        }
        return { count: 0, all: inputs.map(i => ({ ph: i.placeholder, visible: i.offsetParent !== null })) };
      })();
    `,
    returnByValue: true,
  });
  console.log('  Search:', JSON.stringify(searchRes.result.value));
  await sleep(3000);

  // Dump body to see search results
  const body = await Runtime.evaluate({ expression: 'document.body.innerText', returnByValue: true });
  const t = body.result.value || '';
  const idx = t.indexOf('Ross');
  if (idx >= 0) {
    console.log('\n[2] Ross found in body, context:');
    console.log(t.slice(Math.max(0, idx-100), idx+500));
  } else {
    console.log('\n[2] No Ross in body. Last 1000 chars:');
    console.log(t.slice(-1000));
  }

  // Get all user rows after search
  const rowsRes = await Runtime.evaluate({
    expression: `
      (function() {
        const rows = document.querySelectorAll('tr, [role="row"], div[class*="user" i], div[class*="row" i]');
        const matches = [];
        for (const row of rows) {
          if (row.textContent.includes('Ross') && row.textContent.length < 800) {
            const links = row.querySelectorAll('a[href]');
            for (const l of links) {
              if (l.href.includes('user') || l.href.match(/[0-9a-f]{8}-/)) {
                matches.push({ href: l.href, text: l.textContent.trim() });
                return { found: true, href: l.href };
              }
            }
            // Click actions
            const btns = Array.from(row.querySelectorAll('button, a, [role="button"]'));
            return { found: true, text: row.textContent.trim().slice(0, 200), buttons: btns.map(b => b.textContent.trim()) };
          }
        }
        return { found: false };
      })();
    `,
    returnByValue: true,
  });
  console.log('\n[3] Rows:', JSON.stringify(rowsRes.result.value));

  await att.close();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
