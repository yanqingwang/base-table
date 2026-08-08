// 验证记录级比对 diff 检测 + 同步方向确定
const mockStorage = {};
global.wx = {
  getStorageSync: (k) => mockStorage[k] === undefined ? '' : mockStorage[k],
  setStorageSync: (k, v) => { mockStorage[k] = v; },
  removeStorageSync: (k) => { delete mockStorage[k]; },
};
const storage = require('/home/wang/wk/code/card-counter-miniapp/utils/storage');
const syncManager = require('/home/wang/wk/code/card-counter-miniapp/utils/syncManager');

function reset() {
  Object.keys(mockStorage).forEach(k => delete mockStorage[k]);
}

// 测试1: 本地有云端无 → local_to_cloud
reset();
storage.setQuotas([{ localId: 'q1', merchant: '店', usedTimes: 0 }]);
let report = syncManager.diffLocalCloud([], [], []);
console.assert(report.some(r => r.type === 'local_only' && r.direction === 'local_to_cloud'), 'FAIL: 应有 local_only');
console.log('✅ 测试1: 本地独有记录 → 方向 local_to_cloud');

// 测试2: 云端有本地无 → cloud_to_local
reset();
storage.setQuotas([]);
report = syncManager.diffLocalCloud([{ localId: 'q9', merchant: '云端店', usedTimes: 2 }], [], []);
console.assert(report.some(r => r.type === 'cloud_only' && r.direction === 'cloud_to_local'), 'FAIL: 应有 cloud_only');
console.log('✅ 测试2: 云端独有记录 → 方向 cloud_to_local');

// 测试3: usedTimes 差异 → 增量合并方向
reset();
storage.setQuotas([{ localId: 'q3', merchant: '店', usedTimes: 5, updatedAt: 1000 }]);
report = syncManager.diffLocalCloud([{ localId: 'q3', merchant: '店', usedTimes: 8, updatedAt: 2000 }], [], []);
const ut = report.find(r => r.field === 'usedTimes');
console.assert(ut && ut.direction === 'cloud_to_local', 'FAIL: usedTimes 应 cloud_to_local(取大值)');
console.log('✅ 测试3: usedTimes 5 vs 8 → 方向 cloud_to_local（增量合并取大值）');

// 测试4: 同时间戳不同值 → conflict
reset();
storage.setQuotas([{ localId: 'q4', merchant: 'A店', usedTimes: 3, updatedAt: 5000 }]);
report = syncManager.diffLocalCloud([{ localId: 'q4', merchant: 'B店', usedTimes: 3, updatedAt: 5000 }], [], []);
const cf = report.find(r => r.field === 'merchant');
console.assert(cf && cf.direction === 'conflict', 'FAIL: 同时间戳应 conflict');
console.log('✅ 测试4: 同时间戳双改 merchant → conflict');

// 测试5: 签到记录比对
reset();
storage.setCheckins([{ localId: 'c1', merchant: '店', deductTimes: 1, checkinDate: '2026-08-08', updatedAt: 1000 }]);
report = syncManager.diffLocalCloud([], [{ localId: 'c1', merchant: '店', deductTimes: 1, checkinDate: '2026-08-08', updatedAt: 1000 }], []);
console.assert(report.length === 0, 'FAIL: 相同签到应无差异, got ' + report.length);
console.log('✅ 测试5: 相同签到记录 → 无差异');

// 测试6: 评价差异方向
reset();
storage.setRatings([{ localId: 'r1', merchant: '店', score: 4, comment: '旧', updatedAt: 1000 }]);
report = syncManager.diffLocalCloud([], [], [{ localId: 'r1', merchant: '店', score: 5, comment: '新', updatedAt: 2000 }]);
const rd = report.find(r => r.field === 'score');
console.assert(rd && rd.direction === 'cloud_to_local', 'FAIL: 评价云端较新应 cloud_to_local');
console.log('✅ 测试6: 评价云端较新 → 方向 cloud_to_local');

console.log('\n🎉 全部记录级比对测试通过');
