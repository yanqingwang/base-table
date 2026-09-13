// utils/config.js - 多环境配置
// 按小程序当前运行环境（开发版/体验版/正式版）自动选择云托管环境与服务名，
// 避免 env / appid / service 硬编码在 app.js 中，便于多环境（测试/预发/生产）与多商户隔离。
const RESOURCE_APPID = 'wx9c5974ab24d057c3'; // 小程序 AppID（固定）

// 各环境对应的云托管环境 ID 与服务名。
// 注意：以下 develop / trial 暂复用生产环境值，接入测试/预发环境后请替换为对应 env / service。
const ENV_CONFIG = {
  develop: { env: 'prod-d5gm4a2q00a7f9209', service: 'flask-z9hh', webBase: 'https://flask-z9hh-281177-5-1453124923.sh.run.tcloudbase.com' }, // 开发版
  trial: { env: 'prod-d5gm4a2q00a7f9209', service: 'flask-z9hh', webBase: 'https://flask-z9hh-281177-5-1453124923.sh.run.tcloudbase.com' },  // 体验版
  release: { env: 'prod-d5gm4a2q00a7f9209', service: 'flask-z9hh', webBase: 'https://flask-z9hh-281177-5-1453124923.sh.run.tcloudbase.com' }, // 正式版
};

function resolveEnv() {
  let envVersion = 'release';
  try {
    if (typeof wx !== 'undefined' && typeof wx.getAccountInfoSync === 'function') {
      const info = wx.getAccountInfoSync();
      const v = info && info.miniProgram && info.miniProgram.envVersion;
      if (v) envVersion = v;
    }
  } catch (e) {}
  return envVersion;
}

const envVersion = resolveEnv();
const conf = ENV_CONFIG[envVersion] || ENV_CONFIG.release;

module.exports = {
  envVersion,
  env: conf.env,
  service: conf.service,
  webBase: conf.webBase,
  resourceAppid: RESOURCE_APPID,
};
