#!/usr/bin/env node
// Apply for DocuSign Integration Key via CDP-driven Chromium
const CDP = require('/home/wang/wk/code/docusign-keys/node_modules/chrome-remote-interface');
const fs = require('fs');

const PUBLIC_KEY_PATH = '/home/wang/wk/code/docusign-keys/docusign_public.pem';
const APP_NAME = 'easy-hire-docusign-integration';
const ENV_PATH = '/home/wang/wk/code/docusign-keys/.env';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  try {
    const targets = await CDP.List();
    const pageTargets = targets.filter(t => t.type === 'page' && t.url.includes('docusign'));
    const target = pageTargets.find(t => t.url.includes('apps-and-keys')) || pageTargets[0];
    console.log('Using tab:', target.url);

    const attached = await CDP({ target });
    const { Page, Runtime, DOM } = attached;
    await Page.enable();
    await Runtime.enable();

    // Scroll to bottom and get all interactive elements
    console.log('Scrolling to bottom of page...');
    await Runtime.evaluate({ expression: 'window.scrollTo(0, document.body.scrollHeight)' });
    await sleep(2000);

    // Get all visible buttons / links with text
    const allBtns = await Runtime.evaluate({
      expression: `
        (function() {
          window.scrollTo(0, document.body.scrollHeight);
          const btns = Array.from(document.querySelectorAll('button, a, [role="button"]'));
          return btns.map(b => ({
            tag: b.tagName,
            text: (b.textContent || '').trim().slice(0, 80),
            visible: b.offsetParent !== null,
            cls: (b.className || '').slice(0, 50)
          })).filter(b => b.text.length > 0);
        })();
      `,
      returnByValue: true,
    });
    const btns = allBtns.result.value;
    console.log('All buttons (after scroll):', JSON.stringify(btns, null, 2));

    // Get the body innerText to understand layout
    const bodyText = await Runtime.evaluate({ expression: 'document.body.innerText', returnByValue: true });
    console.log('\n=== BODY TEXT (truncated) ===');
    console.log((bodyText.result.value || '').slice(0, 3000));
    console.log('=== END ===\n');

    // Save screenshot
    const ss1 = await Page.captureScreenshot({ format: 'png' });
    fs.writeFileSync('/tmp/ulw-docusign-apps-keys.png', Buffer.from(ss1.data, 'base64'));

    await attached.close();
    process.exit(0);
  } catch (e) {
    console.error('FATAL:', e.message);
    console.error(e.stack);
    process.exit(1);
  }
})();
