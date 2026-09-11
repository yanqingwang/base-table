// 微信小程序 CI 上传脚本
//
// 踩坑记录（2026-09-11）：本机 IPv6 出口不在微信「小程序代码上传 IP 白名单」中，
// 而 miniprogram-ci 的 request 会优先走 IPv6 → 报
//   {"errCode":-10008,"errMsg":"invalid ip: 2408:820c:...::e6a"}
// 处理：
//   1) 强制 DNS 只解析 IPv4（本机 IPv4 出口 112.65.121.227 已在白名单内）；
//   2) 出口路由仍会随机抖动，故失败自动重试（默认 6 次）。
// 也可外挂：NODE_OPTIONS="--require /path/force-ipv4.js"，但脚本内自带更稳。

const dns = require('dns');
const ci = require('miniprogram-ci');

// ---- 1. 强制 IPv4 ----
try { dns.setDefaultResultOrder('ipv4first'); } catch (e) {}

(function forceIPv4() {
  if (dns.__forcedIPv4) return;
  dns.__forcedIPv4 = true;

  const normalize = (opts) => {
    let o;
    if (typeof opts === 'function') o = {};
    else if (typeof opts === 'number') o = { family: opts };
    else o = Object.assign({}, opts || {});
    o.family = 4;
    return o;
  };

  const origLookup = dns.lookup;
  dns.lookup = function (hostname, options, callback) {
    if (typeof options === 'function') { callback = options; options = {}; }
    return origLookup.call(dns, hostname, normalize(options), callback);
  };

  if (dns.promises && dns.promises.lookup) {
    const origP = dns.promises.lookup;
    dns.promises.lookup = function (hostname, options) {
      return origP.call(dns.promises, hostname, normalize(options));
    };
  }
})();

const project = new ci.Project({
  appid: 'wx9c5974ab24d057c3',
  type: 'miniProgram',
  projectPath: '/home/wang/wk/code/card-counter-miniapp',
  privateKeyPath: '/home/wang/wk/code/card-counter-miniapp/private.key',
  ignores: ['node_modules/**/*'],
});

const version = process.argv[2] || '2.3.0';
const desc = process.argv[3] || 'fix: remove example data, backup to system files';
const MAX_ATTEMPTS = Number(process.env.UPLOAD_ATTEMPTS || 8);
// 只对「可重试的网络类错误」重试；版本号冲突等业务错误直接失败
const RETRYABLE = /invalid ip|ETIMEDOUT|ECONNRESET|ECONNREFUSED|socket hang up|EAI_AGAIN|timeout|failed to connect/i;

// miniprogram-ci 抛出的错误对象 message 可能为空，需从多个字段拼出可读文本
function errText(e) {
  if (!e) return '';
  const parts = [e.message, e.errMsg, e.errmsg, e.stack, String(e)];
  try { parts.push(JSON.stringify(e)); } catch (_) {}
  return parts.filter(Boolean).join(' | ');
}

(async () => {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const result = await ci.upload({
        project,
        version,
        desc,
        setting: {
          es6: true,
          minify: true,
          minifyWXSS: true,
          minifyWXML: true,
        },
        onProgressUpdate: () => {},
      });
      console.log(`✅ 上传成功（第 ${attempt} 次尝试）`, JSON.stringify(result));
      return;
    } catch (e) {
      lastErr = e;
      const msg = errText(e);
      if (!RETRYABLE.test(msg) || attempt === MAX_ATTEMPTS) break;
      console.warn(`⚠️  第 ${attempt} 次失败（可重试）：${msg.slice(0, 160)}`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  console.error('❌ 上传失败:', errText(lastErr).slice(0, 400));
  process.exit(1);
})();
