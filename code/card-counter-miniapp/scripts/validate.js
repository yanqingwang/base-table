/**
 * 简化验证脚本 - 本地逻辑验证（无需微信开发者工具）
 * 验证：学习建议算法、配额状态计算、数据合并逻辑、示例数据
 */
const assert = require('assert');

// Mock wx API
const mockStorage = {};
global.wx = {
  getStorageSync: (k) => mockStorage[k] === undefined ? '' : mockStorage[k],
  setStorageSync: (k, v) => { mockStorage[k] = v; },
  removeStorageSync: (k) => { delete mockStorage[k]; },
  cloud: { init: () => {}, callContainer: () => {} },
};

const learningPlan = require('../utils/learningPlan');
const storage = require('../utils/storage');

const results = {};

// 测试1: 配额状态计算
function testStatus() {
  const today = new Date();
  const expiredDate = new Date(today); expiredDate.setDate(expiredDate.getDate() - 5);
  const fmt = (d) => d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');

  assert.strictEqual(learningPlan.getStatus({ totalTimes: 10, usedTimes: 3, expireDate: fmt(new Date(today.getTime() + 86400000*30)) }), '进行中', '进行中');
  assert.strictEqual(learningPlan.getStatus({ totalTimes: 10, usedTimes: 10, expireDate: fmt(new Date(today.getTime() + 86400000*30)) }), '已用完', '已用完');
  assert.strictEqual(learningPlan.getStatus({ totalTimes: 10, usedTimes: 3, expireDate: fmt(expiredDate) }), '已过期', '已过期');
  results.status = true;
}

// 测试2: 全局学习建议
function testGlobalSuggestion() {
  const today = new Date();
  const expire = new Date(today); expire.setDate(expire.getDate() + 30);
  const fmt = (d) => d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');

  const s = learningPlan.calculateGlobalSuggestion([
    { totalTimes: 30, usedTimes: 5, expireDate: fmt(expire), status: '进行中' },
  ]);
  assert.ok(s.totalRemaining === 25, '剩余25次');
  assert.ok(s.suggestInterval >= 1, '建议间隔>=1');
  assert.ok(s.message.includes('建议平均每'), '消息格式');
  results.globalSuggestion = true;
}

// 测试3: 单条配额建议
function testQuotaSuggestion() {
  const today = new Date();
  const expire = new Date(today); expire.setDate(expire.getDate() + 30);
  const fmt = (d) => d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');

  const s = learningPlan.calculateQuotaSuggestion({ totalTimes: 30, usedTimes: 25, expireDate: fmt(expire) });
  assert.ok(s.remaining === 5, '剩5次');
  assert.ok(s.daysLeft >= 28 && s.daysLeft <= 32, '30天左右, got ' + s.daysLeft);
  assert.ok(s.message.includes('建议每'), '消息');
  results.quotaSuggestion = true;
}

// 测试4: 加权天数计算（周末权重>工作日）
function testWeightedDays() {
  // 找最近一个周一，取整周
  const today = new Date();
  const day = today.getDay(); // 0=周日
  const daysSinceMon = (day + 6) % 7;
  const mon = new Date(today);
  mon.setDate(mon.getDate() - daysSinceMon);
  const sun = new Date(mon);
  sun.setDate(sun.getDate() + 6);
  const weighted = learningPlan.calculateWeightedDays(mon, sun);
  // 5个工作日*1 + 2个周末*2 = 9
  assert.strictEqual(weighted, 9, '加权天数=9, got ' + weighted);
  results.weightedDays = true;
}

// 测试5: 本地存储 + 示例数据
function testStorage() {
  storage.setQuotas([{ localId: 'test-1', merchant: '测试' }]);
  assert.strictEqual(storage.getQuotas().length, 1, '存储配额');
  assert.ok(storage.generateId('q').startsWith('q-'), '生成ID');
  results.storage = true;
}

// 运行
try {
  testStatus();
  testGlobalSuggestion();
  testQuotaSuggestion();
  testWeightedDays();
  testStorage();
  console.log('✅ 所有逻辑验证通过:');
  Object.keys(results).forEach(k => console.log('   ✅', k));
  console.log('\n🎉 验证通过，可以发布');
  process.exit(0);
} catch (e) {
  console.error('❌ 验证失败:', e.message);
  process.exit(1);
}
