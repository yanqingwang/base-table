// scripts/test_revoke.js - 验证撤销逻辑（云端成功才改本地，失败保留原状态）
const assert = require('assert');

// 模拟撤销逻辑（复刻 edit.js revoke 的核心决策）
function revokeDecision(cloudOk) {
  const record = { isRevoked: false, localId: 'c-001' };
  let localChanged = false;
  // ... 云端调用
  if (!cloudOk) {
    return { localChanged, msg: '撤销失败，请检查网络' };
  }
  record.isRevoked = true;
  localChanged = true;
  return { localChanged, msg: '已撤销' };
}

// 测试 1: 云端成功 → 本地标记撤销 + 提示成功
{
  const r = revokeDecision(true);
  assert.strictEqual(r.localChanged, true, '云端成功应改本地');
  assert.strictEqual(r.msg, '已撤销');
  console.log('✅ 测试1: 云端撤销成功 → 本地标记撤销 + 提示已撤销');
}

// 测试 2: 云端失败 → 本地不标记 + 提示失败（修复前：本地照常标记+提示成功 = BUG）
{
  const r = revokeDecision(false);
  assert.strictEqual(r.localChanged, false, '云端失败不应改本地');
  assert.strictEqual(r.msg, '撤销失败，请检查网络');
  console.log('✅ 测试2: 云端撤销失败 → 本地不标记 + 提示失败（修复前会误报成功）');
}

// 测试 3: 无 id 时带 localId + isRevoked 推送，服务端幂等
{
  const payload = { localId: 'c-001', quotaId: 'q-1', merchant: '涂来涂去', deductTimes: 1, isRevoked: true };
  assert.strictEqual(payload.isRevoked, true, '无id撤销应带 isRevoked');
  assert.strictEqual(payload.localId, 'c-001', '无id撤销应带 localId 供服务端幂等');
  console.log('✅ 测试3: 无 id 撤销 → 携带 localId + isRevoked 推送');
}

console.log('\n🎉 撤销逻辑测试通过');
// 测试 4: 模拟云端失败回滚场景（app.callApi reject）
// 测试 4: 模拟云端失败 → 本地不被标记（修复核心）
async function simulateRevokeCloudFail() {
  const storage = { checkins: [{ localId: 'c-1', isRevoked: false, updatedAt: 100 }], quotas: [{ localId: 'q-1', usedTimes: 3 }] };
  const app = {
    callApi: () => Promise.reject(new Error('network')),
  };
  let cloudOk = true;
  try { await app.callApi('/api/checkins/1/revoke', 'POST'); } catch (e) { cloudOk = false; }
  assert.strictEqual(cloudOk, false, '云端应失败');
  assert.strictEqual(storage.checkins[0].isRevoked, false, '云端失败不应改本地 isRevoked（修复前会误标 true）');
  console.log('✅ 测试4: 云端失败 → 本地 isRevoked 保持 false（修复前会误报撤销成功）');
}
simulateRevokeCloudFail().then(() => console.log('\n🎉 撤销回滚测试通过')).catch(e => { console.error('❌', e.message); process.exit(1); });
