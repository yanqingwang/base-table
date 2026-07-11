#!/usr/bin/env node
// Step 2: Upload RSA public key to the app + get User ID
const CDP = require('/home/wang/wk/code/docusign-keys/node_modules/chrome-remote-interface');
const fs = require('fs');

const PUBLIC_KEY_PATH = '/home/wang/wk/code/docusign-keys/docusign_public.pem';
const ENV_PATH = '/home/wang/wk/code/docusign-keys/.env';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  try {
    const targets = await CDP.List();
    const pageTargets = targets.filter(t => t.type === 'page' && t.url.includes('apps-and-keys'));
    const target = pageTargets[0];
    console.log('Tab:', target.url);

    const attached = await CDP({ target });
    const { Page, Runtime, DOM } = attached;
    await Page.enable();
    await Runtime.enable();

    // Click the Actions button on the app row
    console.log('[Step 1] Clicking app Actions...');
    const actionRes = await Runtime.evaluate({
      expression: `
        (function() {
          // Find the app row and click its action
          const rows = document.querySelectorAll('tr, [role="row"]');
          for (const row of rows) {
            if (row.textContent.includes('easy-hire-docusign-integration')) {
              const actionBtn = row.querySelector('button, a, [role="button"]');
              if (actionBtn) { actionBtn.click(); return { found: true, text: actionBtn.textContent.trim() }; }
            }
          }
          return { found: false };
        })();
      `,
      returnByValue: true,
    });
    console.log('  Action:', JSON.stringify(actionRes.result.value));

    // Find and click "Edit" option in menu
    await sleep(1500);
    const editRes = await Runtime.evaluate({
      expression: `
        (function() {
          const allBtns = Array.from(document.querySelectorAll('button, a, [role="button"], li, [role="menuitem"]'));
          const edit = allBtns.find(b => /^edit$|edit app|configure/i.test((b.textContent || '').trim()));
          if (edit) { edit.click(); return edit.textContent.trim(); }
          return null;
        })();
      `,
      returnByValue: true,
    });
    console.log('  Edit clicked:', editRes.result.value);
    await sleep(3500);

    // Now we should be on edit page. Find and click "Upload RSA"
    console.log('[Step 2] Clicking Upload RSA...');
    const uploadRes = await Runtime.evaluate({
      expression: `
        (function() {
          const allBtns = Array.from(document.querySelectorAll('button, a, [role="button"]'));
          const upload = allBtns.find(b => /upload rsa|upload.*key/i.test(b.textContent || ''));
          if (upload) { upload.click(); return upload.textContent.trim(); }
          return null;
        })();
      `,
      returnByValue: true,
    });
    console.log('  Upload clicked:', uploadRes.result.value);
    await sleep(2500);

    // Find file input
    const fileRes = await Runtime.evaluate({
      expression: `
        (function() {
          const inputs = Array.from(document.querySelectorAll('input[type="file"]'));
          if (inputs.length === 0) return null;
          inputs[0].setAttribute('data-ds-target', 'true');
          return { count: inputs.length, first: { name: inputs[0].name, id: inputs[0].id } };
        })();
      `,
      returnByValue: true,
    });
    console.log('  Files:', JSON.stringify(fileRes.result.value));

    if (fileRes.result.value) {
      const fileNode = await DOM.querySelector({ selector: 'input[type="file"][data-ds-target="true"]' });
      if (fileNode && fileNode.nodeId) {
        await DOM.setFileInputFiles({ nodeId: fileNode.nodeId, files: [PUBLIC_KEY_PATH] });
        console.log('  ✓ Public key uploaded');
        await sleep(2000);
      }
    }

    // Screenshot after upload
    const ss1 = await Page.captureScreenshot({ format: 'png' });
    fs.writeFileSync('/tmp/ulw-docusign-rsa-uploaded.png', Buffer.from(ss1.data, 'base64'));

    // Click Save
    console.log('[Step 3] Clicking Save...');
    const saveRes = await Runtime.evaluate({
      expression: `
        (function() {
          const allBtns = Array.from(document.querySelectorAll('button, a, [role="button"]'));
          const save = allBtns.find(b => /^(save|done|update)$/i.test((b.textContent || '').trim()));
          if (save) { save.click(); return save.textContent.trim(); }
          return null;
        })();
      `,
      returnByValue: true,
    });
    console.log('  Save clicked:', saveRes.result.value);
    await sleep(5000);

    // Now navigate to Admin → Users to get User ID
    console.log('[Step 4] Navigating to Admin → Users...');
    await Page.navigate({ url: 'https://admindemo.docusign.com/admin/users' });
    await sleep(7000);

    const urlRes = await Runtime.evaluate({ expression: 'window.location.href', returnByValue: true });
    console.log('  URL:', urlRes.result.value);

    // Get all user rows and find Ross Wang's API Username
    const userIdRes = await Runtime.evaluate({
      expression: `
        (function() {
          // Look for the user API username GUID
          const all = document.body.innerText;
          // User GUID is a hex string (no hyphens)
          const hex32 = all.match(/[0-9a-f]{32,}/gi);
          // Also try hyphens
          const guids = all.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi);
          return { hex: hex32 ? Array.from(new Set(hex32)).slice(0, 5) : [], guids: guids ? Array.from(new Set(guids)).slice(0, 5) : [] };
        })();
      `,
      returnByValue: true,
    });
    console.log('  User IDs:', JSON.stringify(userIdRes.result.value, null, 2));

    const userId = (userIdRes.result.value.hex && userIdRes.result.value.hex[0]) ||
                   (userIdRes.result.value.guids && userIdRes.result.value.guids[0]) || '';

    // Update .env
    const integrationKey = '9addabe1-1ad2-4e78-8270-4f53c29fd98c';
    const envContent = `# DocuSign Integration Key (Demo environment)
# Generated: ${new Date().toISOString()}
DOCUSIGN_INTEGRATION_KEY="${integrationKey}"
DOCUSIGN_USER_ID="${userId}"
DOCUSIGN_ACCOUNT_ID="44406721"
DOCUSIGN_ACCOUNT_GUID="9e0945e3-1711-4eff-8f42-31a00aba791e"
DOCUSIGN_BASE_URL="https://demo.docusign.net/restapi"
DOCUSIGN_OAUTH_BASE="https://account-d.docusign.com"
DOCUSIGN_ADMIN_BASE="https://admindemo.docusign.com"
DOCUSIGN_PRIVATE_KEY_PATH="/home/wang/wk/code/docusign-keys/docusign_private.pem"
DOCUSIGN_WEBHOOK_HMAC_SECRET="REPLACE_WITH_HMAC_SECRET"
DOCUSIGN_REDIRECT_URI="http://localhost:5000/auth/callback"
`;
    fs.writeFileSync(ENV_PATH, envContent);

    console.log('\n========== UPDATED SUMMARY ==========');
    console.log('Integration Key:', integrationKey);
    console.log('User ID:', userId);
    console.log('.env file:', ENV_PATH);
    console.log('=====================================');

    await attached.close();
    process.exit(0);
  } catch (e) {
    console.error('FATAL:', e.message);
    console.error(e.stack);
    process.exit(1);
  }
})();
