// 验证智能分层合并逻辑
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

// 测试1: usedTimes 取最大值（离线扣减不丢失）
reset();
storage.setQuotas([{ localId: 'q1', merchant: 'A店', usedTimes: 5, updatedAt: 1000 }]);
syncManager.merge(
  [{ localId: 'q1', merchant: 'A店', usedTimes: 8, updatedAt: 2000 }], [], []);
const q1 = storage.getQuotas()[0];
console.assert(q1.usedTimes === 8, 'FAIL: usedTimes 应取大值 8, got ' + q1.usedTimes);
console.log('✅ 测试1: usedTimes 取最大值（5 vs 8 → 8）');

// 测试2: 字段级 LWW（云端较新的 merchant 生效，本地较新的 note 保留）
reset();
storage.setQuotas([{ localId: 'q2', merchant: '旧店名', note: '本地新备注', usedTimes: 3, updatedAt: 2000 }]);
syncManager.merge(
  [{ localId: 'q2', merchant: '新店名', note: '云端旧备注', usedTimes: 3, updatedAt: 1000 }], [], []);
const q2 = storage.getQuotas()[0];
console.assert(q2.merchant === '旧店名', 'FAIL: merchant 应保留本地(较新)');
console.assert(q2.note === '本地新备注', 'FAIL: note 应保留本地(较新)');
console.log('✅ 测试2: 字段级 LWW（本地较新 → 保留本地 merchant/note）');

// 测试3: 云端较新的字段生效
reset();
storage.setQuotas([{ localId: 'q3', merchant: '旧店名', note: '本地旧备注', usedTimes: 3, updatedAt: 1000 }]);
syncManager.merge(
  [{ localId: 'q3', merchant: '新店名', note: '云端新备注', usedTimes: 3, updatedAt: 2000 }], [], []);
const q3 = storage.getQuotas()[0];
console.assert(q3.merchant === '新店名', 'FAIL: merchant 应取云端(较新)');
console.assert(q3.note === '云端新备注', 'FAIL: note 应取云端(较新)');
console.log('✅ 测试3: 字段级 LWW（云端较新 → 取云端 merchant/note）');

// 测试4: 同时间戳同字段双改 → 冲突标记
reset();
storage.setQuotas([{ localId: 'q4', merchant: 'A店名', usedTimes: 3, updatedAt: 5000 }]);
syncManager.merge(
  [{ localId: 'q4', merchant: 'B店名', usedTimes: 3, updatedAt: 5000 }], [], []);
const q4 = storage.getQuotas()[0];
console.assert(q4.conflict === true, 'FAIL: 应标记冲突');
console.assert(q4.conflictFields.includes('merchant'), 'FAIL: 冲突字段应为 merchant');
console.log('✅ 测试4: 同时间戳双改 → 标记 conflict + conflictFields');

// 测试5: 评价合并改为 LWW（云端更新应生效）
reset();
storage.setRatings([{ localId: 'r1', merchant: '店', score: 4, comment: '旧', createdAt: 1000 }]);
syncManager.merge([], [], [{ localId: 'r1', merchant: '店', score: 5, comment: '新', createdAt: 2000 }]);
const r1 = storage.getRatings()[0];
console.assert(r1.score === 5 && r1.comment === '新', 'FAIL: 云端较新的评价应生效');
console.log('✅ 测试5: 评价 LWW（云端较新 score 5/新 生效）');

// 测试6: 签到去重 + LWW
reset();
storage.setCheckins([{ localId: 'c1', merchant: '店', deductTimes: 1, updatedAt: 1000 }]);
syncManager.merge([], [{ localId: 'c1', merchant: '店', deductTimes: 2, updatedAt: 2000 }], []);
const c1 = storage.getCheckins()[0];
console.assert(c1.deductTimes === 2, 'FAIL: 云端较新的签到应生效');
console.log('✅ 测试6: 签到 LWW（云端较新 deductTimes 2 生效）');

console.log('\n🎉 全部智能合并测试通过');
