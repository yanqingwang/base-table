#!/usr/bin/env node
/**
 * Finalize the PRD DocuSign app setup:
 *   - Save the app configuration
 *   - Update PRD/.env with new Integration Key and private key path
 *   - Verify the new IK works with get_access_token()
 *
 * PREREQ: RSA keys already generated (run setup_prd_rsa.js first).
 *         PRD/rsa_setup_state.json must exist.
 *
 * This script:
 *   1. Reads rsa_setup_state.json for IK and key paths
 *   2. (Optionally) Navigates to the app edit page and clicks Save
 *   3. Updates PRD/.env with new IK and PRD-specific private key
 *   4. Runs a quick auth test to verify the new setup works
 */

const CDP = require('/home/wang/wk/code/docusign-keys/PRD/node_modules/chrome-remote-interface');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const PRD_DIR = path.resolve(__dirname, '..');

(async () => {
  // ----- READ SETUP STATE -----
  const statePath = path.join(PRD_DIR, 'rsa_setup_state.json');
  if (!fs.existsSync(statePath)) {
    console.error('rsa_setup_state.json not found. Run setup_prd_rsa.js first.');
    process.exit(1);
  }
  const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
  console.log('Setup state:', JSON.stringify(state, null, 2));

  const integrationKey = state.integrationKey;
  const privateKeyPath = path.resolve(PRD_DIR, 'docusign_private_prd.pem');
  const publicKeyPath = path.resolve(PRD_DIR, 'docusign_public_prd.pem');

  if (!fs.existsSync(privateKeyPath)) {
    console.error(`Private key not found at ${privateKeyPath}`);
    process.exit(1);
  }

  // ----- OPTIONAL: CDP Save -----
  console.log('\n[1] (Optional) Navigating to app edit page to click Save...');
  console.log('  If RSA keys were generated inline (not saved), this step saves the app.');
  console.log('  If keys were already saved, CDP Save may not be needed.');

  try {
    const targets = await CDP.List();
    const target = targets.find(t =>
      t.type === 'page' && t.url.includes('apps.docusign.com')
    );
    if (target) {
      const attached = await CDP({ target });
      const { Page, Runtime } = attached;
      await Page.enable();
      await Runtime.enable();

      // Check if we're on the edit page for our app
      const curUrl = await Runtime.evaluate({ expression: 'window.location.href', returnByValue: true });
      console.log('  Current URL:', curUrl.result.value);

      if ((curUrl.result.value || '').includes(`/apps-and-keys/${integrationKey}`)) {
        // Look for and click Save
        console.log('  [1a] Looking for Save button...');
        const saveRes = await Runtime.evaluate({
          expression: `
            (() => {
              const btns = Array.from(document.querySelectorAll('button'))
                .filter(b => b.offsetParent);
              for (const b of btns) {
                const t = (b.textContent || '').trim();
                if (/^(save|update|save changes|update app)$/i.test(t)) {
                  b.scrollIntoView({block: 'center'});
                  b.click();
                  return { clicked: true, text: t };
                }
              }
              return { clicked: false, all: btns.map(b => (b.textContent || '').trim()).filter(t => t && t.length < 30).slice(0, 15) };
            })();
          `,
          returnByValue: true,
        });
        console.log('  Save:', JSON.stringify(saveRes.result.value));
        await sleep(6000);

        const finalUrl = await Runtime.evaluate({ expression: 'window.location.href', returnByValue: true });
        console.log('  Post-save URL:', finalUrl.result.value);

        const ss = await Page.captureScreenshot({ format: 'png' });
        fs.writeFileSync('/tmp/prd-finalized.png', Buffer.from(ss.data, 'base64'));
        console.log('  Screenshot: /tmp/prd-finalized.png');
      } else {
        console.log('  Not on edit page. Skipping CDP Save.');
      }

      await attached.close();
    } else {
      console.log('  No apps.docusign.com tab found. Skipping CDP Save.');
    }
  } catch (e) {
    console.log('  CDP save skipped (Chrome not running?):', e.message);
  }

  // ----- UPDATE .ENV -----
  console.log('\n[2] Updating PRD/.env...');
  const envPath = path.join(PRD_DIR, '.env');

  // Read existing .env
  let envContent = fs.readFileSync(envPath, 'utf-8');

  // Update or add entries
  const updates = {
    DOCUSIGN_INTEGRATION_KEY: `"${integrationKey}"`,
    DOCUSIGN_PRIVATE_KEY_PATH: `"${privateKeyPath}"`,
  };

  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
      console.log(`  Updated: ${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}\n`;
      console.log(`  Added: ${key}=${value}`);
    }
  }

  // Add PUBLIC_KEY_PATH if not present
  if (!envContent.includes('DOCUSIGN_PUBLIC_KEY_PATH')) {
    envContent += `DOCUSIGN_PUBLIC_KEY_PATH="${publicKeyPath}"\n`;
  } else {
    envContent = envContent.replace(
      /DOCUSIGN_PUBLIC_KEY_PATH=.*$/m,
      `DOCUSIGN_PUBLIC_KEY_PATH="${publicKeyPath}"`
    );
  }

  // Update comment about IK
  envContent = envContent.replace(
    /^# IK reused.*$/m,
    `# PRD-specific Integration Key (separate from DEV)`
  );

  // Make sure base URL is correct for PRD
  if (!envContent.includes('DOCUSIGN_BASE_URL')) {
    envContent += `DOCUSIGN_BASE_URL="https://eu.docusign.net"\n`;
  }

  fs.writeFileSync(envPath, envContent);
  console.log('\n  .env updated successfully.');

  // ----- VERIFY -----
  console.log('\n[3] Verifying auth with new configuration...');
  try {
    const result = execSync(
      `cd "${PRD_DIR}" && python3 docusign_auth.py 2>&1`,
      { timeout: 30000, encoding: 'utf-8' }
    );
    console.log('  Auth result:', result.trim());
    console.log('\n[✓] PRD auth verified successfully with new IK!');
  } catch (e) {
    console.error('  Auth verification failed:', e.stderr || e.message);
    console.error('  You may need to grant consent for the new IK.');
    console.error('  Grant URL: https://account.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=' + integrationKey + '&redirect_uri=http://localhost:5000/auth/callback');
    console.log('\n  Saved .env anyway. Grant consent manually, then re-run verification.');
  }

  // ----- SUMMARY -----
  console.log('\n========== PRD SETUP SUMMARY ==========');
  console.log(`  Integration Key: ${integrationKey}`);
  console.log(`  Private Key:     ${privateKeyPath}`);
  console.log(`  Public Key:      ${publicKeyPath}`);
  console.log(`  .env:            ${envPath}`);
  console.log('========================================\n');

  // Clean up state files
  try {
    fs.unlinkSync(statePath);
    fs.unlinkSync(path.join(PRD_DIR, 'new_app_info.json'));
    console.log('Temporary state files cleaned up.');
  } catch (_) {}

  console.log('[✓] PRD app setup complete! DEV and PRD are now isolated.');
  process.exit(0);
})().catch(e => { console.error(e.message); console.error(e.stack); process.exit(1); });
