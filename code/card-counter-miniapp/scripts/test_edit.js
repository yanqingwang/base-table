// scripts/test_edit.js - 验证签到记录编辑页保存逻辑（扣减次数/备注/日期）
// 模拟 edit.js 的 saveChanges 核心逻辑：早退条件必须包含 deductChanged
const assert = require('assert');

// 模拟一个签到记录
function makeCheckin(overrides = {}) {
  return {
    localId: 'checkin-test-001',
    id: 101,
    quotaId: 'quota-001',
    merchant: '测试商户',
    deductTimes: 2,
    checkinDate: '2026-08-08',
    checkinTime: '10:30:00',
    note: '原始备注',
    isRevoked: false,
    updatedAt: 1780000000000,
    ...overrides,
  };
}

// 复刻 edit.js 的早退判断逻辑（修复前 vs 修复后）
function shouldSaveOld(c, originalDate, originalNote, dataDeduct) {
  const dateChanged = c.checkinDate !== originalDate;
  const noteChanged = dataNote !== originalNote;
  return dateChanged || noteChanged; // BUG: 漏掉 deduct
}
let dataNote = '';

function shouldSaveNew(c, originalDate, originalNote, dataDeduct) {
  const dateChanged = c.checkinDate !== originalDate;
  const noteChanged = dataNote !== originalNote;
  const deductChanged = (dataDeduct || 0) !== (c.deductTimes || 0);
  return dateChanged || noteChanged || deductChanged;
}

// 测试 1: 只修改扣减次数 → 修复前不保存（BUG），修复后保存
{
  const c = makeCheckin();
  dataNote = '原始备注';
  assert.strictEqual(shouldSaveOld(c, c.checkinDate, c.note, 5), false, '旧逻辑：只改次数 → 不保存（BUG）');
  assert.strictEqual(shouldSaveNew(c, c.checkinDate, c.note, 5), true, '新逻辑：只改次数 → 应保存');
  console.log('✅ 测试1: 只修改扣减次数 → 修复后识别为可保存');
}

// 测试 2: 只修改备注 → 两种逻辑都应保存
{
  const c = makeCheckin();
  dataNote = '新备注';
  assert.strictEqual(shouldSaveOld(c, c.checkinDate, '原始备注', c.deductTimes), true);
  assert.strictEqual(shouldSaveNew(c, c.checkinDate, '原始备注', c.deductTimes), true);
  console.log('✅ 测试2: 只修改备注 → 可保存');
}

// 测试 3: 只修改日期 → 都应保存
{
  const c = makeCheckin();
  dataNote = '原始备注';
  assert.strictEqual(shouldSaveNew(c, '2026-08-09', '原始备注', c.deductTimes), true);
  console.log('✅ 测试3: 只修改日期 → 可保存');
}

// 测试 4: 无修改 → 都不保存
{
  const c = makeCheckin();
  dataNote = '原始备注';
  assert.strictEqual(shouldSaveNew(c, c.checkinDate, c.note, c.deductTimes), false);
  console.log('✅ 测试4: 无修改 → 提示没有修改');
}

// 测试 5: 扣减次数改为 0（v2.5.2 修复点）→ 应识别为修改
{
  const c = makeCheckin();
  dataNote = '原始备注';
  assert.strictEqual(shouldSaveNew(c, c.checkinDate, c.note, 0), true, '扣减次数=0 也应识别为修改');
  console.log('✅ 测试5: 扣减次数改为 0 → 识别为修改');
}

// 测试 6: 本地配额 usedTimes 差值调整逻辑
{
  const c = makeCheckin({ deductTimes: 2 });
  const newDeduct = 5;
  const quota = { localId: 'quota-001', usedTimes: 4 };
  const diff = newDeduct - (c.deductTimes || 0);
  quota.usedTimes = Math.max(0, (quota.usedTimes || 0) + diff);
  assert.strictEqual(quota.usedTimes, 7, '扣减 2→5，配额 usedTimes 应 +3 → 7');
  console.log('✅ 测试6: 配额 usedTimes 差值调整 2→5: 4+3=7');

  const c2 = makeCheckin({ deductTimes: 5 });
  const newDeduct2 = 1;
  const quota2 = { localId: 'quota-001', usedTimes: 7 };
  const diff2 = newDeduct2 - (c2.deductTimes || 0);
  quota2.usedTimes = Math.max(0, (quota2.usedTimes || 0) + diff2);
  assert.strictEqual(quota2.usedTimes, 3, '扣减 5→1，配额 usedTimes 应 -4 → 3');
  console.log('✅ 测试7: 配额 usedTimes 差值调整 5→1: 7-4=3');
}

console.log('\n🎉 全部编辑页保存逻辑测试通过');