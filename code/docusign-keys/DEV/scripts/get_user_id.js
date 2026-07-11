#!/usr/bin/env node
// Step 3: Get User ID (API Username GUID) from user profile
const CDP = require('/home/wang/wk/code/docusign-keys/node_modules/chrome-remote-interface');
const fs = require('fs');

const ENV_PATH = '/home/wang/wk/code/docusign-keys/.env';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function dumpPage(Runtime, Page, label) {
  const r1 = await Runtime.evaluate({ expression: 'document.body.innerText', returnByValue: true });
  console.log(`\n=== BODY (${label}) ===`);
  console.log((r1.result.value || '').slice(0, 3500));
  console.log('=== END ===\n');
  const ss = await Page.captureScreenshot({ format: 'png' });
  fs.writeFileSync(`/tmp/ulw-docusign-${label}.png`, Buffer.from(ss.data, 'base64'));
}

(async () => {
  try {
    const targets = await CDP.List();
    const pageTargets = targets.filter(t => t.type === 'page' && t.url.includes('docusign'));
    const target = pageTargets[0];
    console.log('Tab:', target.url);

    const attached = await CDP({ target });
    const { Page, Runtime } = attached;
    await Page.enable();
    await Runtime.enable();

    // First, click on Ross Wang in users page
    console.log('[1] Navigating to users page...');
    await Page.navigate({ url: 'https://admindemo.docusign.com/admin/users' });
    await sleep(7000);

    // Click on Ross Wang row
    const userClick = await Runtime.evaluate({
      expression: `
        (function() {
          // Find row containing "Ross Wang"
          const all = document.querySelectorAll('tr, [role="row"], a, button, div');
          for (const el of all) {
            const t = (el.textContent || '').trim();
            if (t.includes('Ross Wang') && t.length < 200) {
              el.click();
              return { clicked: true, tag: el.tagName, text: t.slice(0, 60) };
            }
          }
          return { clicked: false };
        })();
      `,
      returnByValue: true,
    });
    console.log('  User click:', JSON.stringify(userClick.result.value));
    await sleep(4000);
    await dumpPage(Runtime, Page, 'user-profile');

    // Look for User ID / API Username
    const idRes = await Runtime.evaluate({
      expression: `
        (function() {
          const all = document.body.innerText;
          // Look for "User ID" or "API Username" labels followed by hex/guid
          const lines = all.split('\\n');
          const result = {};
          for (let i = 0; i < lines.length; i++) {
            const ln = lines[i].trim();
            if (/user id|api username|user guid/i.test(ln)) {
              result[ln] = lines[i+1] ? lines[i+1].trim() : 'N/A';
            }
          }
          // Also just regex the page
          const hex = all.match(/[0-9a-f]{32,}/gi);
          const guids = all.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi);
          return {
            labeledContext: result,
            hex: hex ? Array.from(new Set(hex)).slice(0, 5) : [],
            guids: guids ? Array.from(new Set(guids)).slice(0, 5) : []
          };
        })();
      `,
      returnByValue: true,
    });
    console.log('  ID extraction:', JSON.stringify(idRes.result.value, null, 2));

    await attached.close();
    process.exit(0);
  } catch (e) {
    console.error('FATAL:', e.message);
    process.exit(1);
  }
})();
