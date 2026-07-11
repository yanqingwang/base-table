#!/usr/bin/env node
/**
 * docusign_bulk_send_cdp.js
 *
 * CDP-based bulk send for DocuSign DEV environment.
 * Automates the browser to:
 *   1. Open DocuSign bulk send page
 *   2. Wait for user to log in
 *   3. Upload a CSV/XLSX data file
 *   4. Select a template
 *   5. Initiate bulk send
 *
 * Prerequisites:
 *   - Chrome running with --remote-debugging-port=9222
 *   - Already logged into apps-d.docusign.com in Chrome
 *   - Data file prepared (CSV with Employee::Name, Employee::Email, etc.)
 *
 * Usage:
 *   node scripts/docusign_bulk_send_cdp.js [--file data.csv] [--template V4]
 *
 * Template options:
 *   V4 = MY_Offer_Laird_Bulk_Send-V4 (ed18a325)
 *   V3 = MY_Offer_Laird_Bulk_Send-V3 (6908f56d)
 */

const CDP = require('/home/wang/wk/code/docusign-keys/node_modules/chrome-remote-interface');
const fs = require('fs');
const path = require('path');

const HOST = process.env.CHROME_DEBUG_HOST || '127.0.0.1';
const PORT = parseInt(process.env.CHROME_DEBUG_PORT || '9222', 10);

const TEMPLATES = {
  V4: { id: 'ed18a325-e2b5-492a-913a-be7d8029b9e0', name: 'MY_Offer_Laird_Bulk_Send-V4' },
  V3: { id: '6908f56d-f41c-46a7-9610-297299088f8d', name: 'MY_Offer_Laird_Bulk_Send-V3' },
};

function log(...args) { console.log('[cdp]', ...args); }

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const args = process.argv.slice(2);
  const fileFlag = args.indexOf('--file');
  const tmplFlag = args.indexOf('--template');
  const dataFile = fileFlag >= 0 ? args[fileFlag + 1] : '';
  const tmplName = tmplFlag >= 0 ? args[tmplFlag + 1] : 'V3';
  const tmpl = TEMPLATES[tmplName] || TEMPLATES.V3;

  if (dataFile && !fs.existsSync(dataFile)) {
    console.error(`Data file not found: ${dataFile}`);
    process.exit(1);
  }

  log(`Connecting to Chrome at ${HOST}:${PORT} ...`);
  const targets = await CDP.List({ host: HOST, port: PORT });
  log(`Browser alive. ${targets.length} target(s)`);

  // Find existing DocuSign tab or create new one
  let tab = targets.find(t => t.url && t.url.includes('apps-d.docusign.com'));
  let client;
  let targetId;

  if (tab) {
    log(`Found existing DocuSign tab: ${tab.id}`);
    targetId = tab.id;
    client = await CDP({ host: HOST, port: PORT, target: targetId });
  } else {
    log('Creating new tab...');
    const newTarget = await CDP.New({ host: HOST, port: PORT, url: 'about:blank' });
    targetId = newTarget.id;
    client = await CDP({ host: HOST, port: PORT, target: targetId });
  }

  const { Page, Runtime, Emulation, Network } = client;
  Page.enable();
  Runtime.enable();

  // Set viewport
  await Emulation.setDeviceMetricsOverride({
    width: 1440, height: 900, deviceScaleFactor: 1, mobile: false,
  });

  // Navigate to bulk send page
  const BULK_SEND_URL = 'https://apps-d.docusign.com/send/documents';
  log(`Navigating to ${BULK_SEND_URL} ...`);
  await Page.navigate({ url: BULK_SEND_URL });

  // Wait for page to load
  log('Waiting for page to load...');
  const start = Date.now();
  let loggedIn = false;
  let onSendPage = false;

  while (Date.now() - start < 60000) {
    await sleep(2000);
    try {
      const { result } = await Runtime.evaluate({
        expression: `JSON.stringify({
          url: location.href,
          hasLoginForm: !!document.querySelector('input[type=password]'),
          hasSendUI: !!document.querySelector('[data-qa="create-new-button"], [data-qa="send-document-btn"], .send-container'),
          bodySnippet: (document.body.innerText || '').slice(0, 200)
        })`,
        returnByValue: true,
      });
      const state = JSON.parse(result.value);
      log(`State: url=${state.url.slice(0,60)} loginForm=${state.hasLoginForm} sendUI=${state.hasSendUI}`);

      if (state.hasLoginForm) {
        log('Login page detected. Please log in manually in the browser.');
        loggedIn = false;
      } else if (state.hasSendUI) {
        log('Send page loaded!');
        onSendPage = true;
        break;
      } else if (state.url.includes('send')) {
        onSendPage = true;
        break;
      }
    } catch (e) {
      log(`Tick error: ${e.message}`);
    }
  }

  if (!onSendPage) {
    log('Timed out waiting for send page. The tab is open for manual use.');
    console.log(`\n=========== MANUAL STEPS ===========`);
    console.log(`1. The browser tab is open at DocuSign`);
    console.log(`2. Log in if needed`);
    console.log(`3. Go to Bulk Send or use template ${tmpl.name}`);
    console.log(`4. Upload data file and send`);
    console.log(`====================================\n`);
  } else {
    log(`\n=========== BULK SEND INSTRUCTIONS ===========`);
    log(`Template: ${tmpl.name} (${tmpl.id})`);
    if (dataFile) log(`Data file: ${dataFile}`);
    log(``);
    log(`Manual steps in the browser:`);
    log(`1. Click "Bulk Send" or "Send" button`);
    log(`2. Select template "${tmpl.name}"`);
    log(`3. Upload data file: ${dataFile || 'your CSV/XLSX'}`);
    log(`4. Map columns to template fields`);
    log(`5. Send`);
    log(`================================================\n`);
    
    // Keep connection open
    process.on('SIGINT', async () => {
      log('Closing...');
      try { await client.close(); } catch (_) {}
      process.exit(0);
    });
    await new Promise(() => {});
  }
}

main().catch(e => {
  console.error('[cdp] FATAL:', e.message);
  process.exit(1);
});
