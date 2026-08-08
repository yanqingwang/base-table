// 微信小程序 CI 上传脚本（基于 memory/work.md 记录）
const ci = require('miniprogram-ci');

(async () => {
  const project = new ci.Project({
    appid: 'wx9c5974ab24d057c3',
    type: 'miniProgram',
    projectPath: '/home/wang/wk/code/card-counter-miniapp',
    privateKeyPath: '/home/wang/wk/code/card-counter-miniapp/private.key',
    ignores: ['node_modules/**/*'],
  });

  const version = process.argv[2] || '2.3.0';
  const desc = process.argv[3] || 'fix: remove example data, backup to system files';

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
  console.log('✅ 上传成功', JSON.stringify(result));
})().catch(e => {
  console.error('❌ 上传失败:', e.message || e);
  process.exit(1);
});
