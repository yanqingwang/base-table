#!/usr/bin/env node
/**
 * open_docusign.js
 *
 * Connect to an existing Chromium instance (with --remote-debugging-port=9222)
 * via the Chrome DevTools Protocol (CDP), create a new tab, navigate to
 * Docusign's demo send page, and report the page state so the user can log in
 * manually.
 *
 * Usage:
 *   node open_docusign.js [url]            # default: https://apps-d.docusign.com/send/home
 *   CHROME_DEBUG_HOST=127.0.0.1 CHROME_DEBUG_PORT=9222 node open_docusign.js
 */

const CDP = require('/home/wang/wk/code/docusign-keys/node_modules/chrome-remote-interface');

const HOST = process.env.CHROME_DEBUG_HOST || '127.0.0.1';
const PORT = parseInt(process.env.CHROME_DEBUG_PORT || '9222', 10);
const TARGET_URL = process.argv[2] || 'https://apps-d.docusign.com/send/home';

function log(...args) {
  console.log(`[cdp]`, ...args);
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function getTitle(Page) {
  try {
    const { result } = await Page.getLayoutMetrics?.() || { result: {} };
  } catch (_) {}
}

async function main() {
  log(`Connecting to Chromium at http://${HOST}:${PORT} ...`);

  // 1. List existing targets first (sanity check, also tells us if browser is alive)
  let targets;
  try {
    targets = await CDP.List({ host: HOST, port: PORT });
    log(`Browser alive. Existing targets: ${targets.length}`);
    for (const t of targets) {
      log(`  - [${t.type}] id=${t.id} title="${t.title}" url=${t.url}`);
    }
  } catch (e) {
    throw new Error(`Cannot list targets from ${HOST}:${PORT}: ${e.message}`);
  }

  // 2. Create a new tab on the same browser. background:false means it will
  //    become the active tab in the browser UI.
  log(`Creating new tab ...`);
  const newTarget = await CDP.New({
    host: HOST,
    port: PORT,
    url: 'about:blank',
  });
  const targetId = newTarget.id;
  const webSocketDebuggerUrl = newTarget.webSocketDebuggerUrl;
  log(`Created tab id=${targetId}`);
  log(`  webSocketDebuggerUrl = ${webSocketDebuggerUrl}`);

  // 3. Connect a client to that specific target.
  const client = await CDP({ host: HOST, port: PORT, target: targetId });
  const { Page, Runtime, Emulation, Network, DOM } = client;

  // Surface page-side console + page errors in our terminal (helpful for debugging).
  Runtime.enable();
  Page.enable();
  Network.enable();
  Runtime.consoleAPICalled(({ type, args }) => {
    const text = args.map((a) => a.value ?? a.description ?? '').join(' ');
    log(`[page.console.${type}] ${text}`);
  });
  Runtime.exceptionThrown(({ exceptionDetails }) => {
    log(`[page.exception] ${exceptionDetails.text} :: ${exceptionDetails.exception?.description || ''}`);
  });
  Page.frameNavigated(({ frame }) => {
    if (frame.parentId === undefined) {
      log(`[page.frameNavigated] url=${frame.url}`);
    }
  });
  Page.loadEventFired(() => log(`[page] loadEventFired`));
  Page.domContentEventFired(() => log(`[page] domContentEventFired`));
  Network.requestWillBeSent(({ requestId, request }) => {
    // Trim noisy resource log
    const u = request.url;
    if (u.includes('favicon') || u.endsWith('.ico')) return;
    log(`[net.${request.method}] ${u}`);
  });
  Network.responseReceived(({ requestId, response }) => {
    if (response.status >= 400) {
      log(`[net.resp] ${response.status} ${response.url}`);
    }
  });

  // 4. Set a generous viewport (Docusign is desktop-first).
  await Emulation.setDeviceMetricsOverride({
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  // 5. Navigate.
  log(`Navigating to ${TARGET_URL} ...`);
  const navPromise = Page.navigate({ url: TARGET_URL });
  const navResult = await navPromise;
  if (navResult.result?.errorText) {
    log(`Navigation errorText: ${navResult.result.errorText}`);
  }
  log(`Navigation command dispatched. loaderId=${navResult.result?.loaderId}`);

  // 6. Wait for the page to settle. Docusign's SPA can take a few seconds.
  //    Poll document.title + a known selector until the login UI is ready or we time out.
  const start = Date.now();
  const TIMEOUT_MS = 30000;
  let lastTitle = '';
  let lastUrl = '';
  let loginInfo = null;

  while (Date.now() - start < TIMEOUT_MS) {
    await sleep(1500);
    try {
      const { result } = await Runtime.evaluate({
        expression: `JSON.stringify({
          title: document.title,
          url: location.href,
          hasEmailInput: !!document.querySelector('input[type=email], input[name=email], input[id*=email i]'),
          hasPasswordInput: !!document.querySelector('input[type=password]'),
          hasSignInButton: !!Array.from(document.querySelectorAll('button, a, input[type=submit]'))
            .find(b => /sign\\s*in|log\\s*in|继续|登录|登\\s*录/i.test(b.innerText || b.value || '')),
          bodySnippet: (document.body && document.body.innerText || '').slice(0, 400)
        })`,
        returnByValue: true,
        awaitPromise: false,
      });
      const data = JSON.parse(result.value);
      lastTitle = data.title;
      lastUrl = data.url;
      loginInfo = data;
      log(`tick: title="${data.title}" url=${data.url} email?=${data.hasEmailInput} pwd?=${data.hasPasswordInput} signIn?=${data.hasSignInButton}`);

      // Heuristic: if we see a password input or sign-in button OR we've left
      // the initial loading shell, consider ready.
      if (data.hasPasswordInput || data.hasSignInButton) {
        log(`Login UI detected.`);
        break;
      }
    } catch (e) {
      log(`tick error: ${e.message}`);
    }
  }

  // 7. Report.
  console.log('\n=========== REPORT ===========');
  console.log('Target (tab) id     :', targetId);
  console.log('Page title          :', lastTitle);
  console.log('Page URL            :', lastUrl);
  if (loginInfo) {
    console.log('Has email input     :', loginInfo.hasEmailInput);
    console.log('Has password input  :', loginInfo.hasPasswordInput);
    console.log('Has sign-in control :', loginInfo.hasSignInButton);
    console.log('Body snippet (400ch):');
    console.log(loginInfo.bodySnippet);
  }
  console.log('=============================\n');
  console.log('The tab is open and ready. You can now type your credentials manually.');
  console.log('To attach to this same tab later, use target id:', targetId);
  console.log('Keeping the CDP client open. Press Ctrl+C to close this script.');

  // Keep the process alive so the DevTools session stays attached.
  // The user can drive the tab from the browser UI; we just hold the connection.
  process.on('SIGINT', async () => {
    log('Caught SIGINT, closing CDP client ...');
    try { await client.close(); } catch (_) {}
    process.exit(0);
  });

  // Idle forever (until Ctrl+C). This keeps the WebSocket alive.
  await new Promise(() => {});
}

main().catch((e) => {
  console.error('[cdp] FATAL:', e.stack || e.message);
  process.exit(1);
});
