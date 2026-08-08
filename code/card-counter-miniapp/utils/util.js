// utils/util.js - 通用工具函数
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function nowTime() {
  const d = new Date();
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

function daysBetween(start, end) {
  return Math.max(0, Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)));
}

function isExpired(expireDate) {
  if (!expireDate) return false;
  return new Date(expireDate + 'T23:59:59') < new Date();
}

function calcProgress(q) {
  const total = q.total_times || q.totalTimes || 0;
  const used = q.used_times || q.usedTimes || 0;
  if (total <= 0) return 0;
  return Math.min(100, Math.round(used / total * 100));
}

// 归一化后端字段 -> 前端字段
function normalizeQuota(q) {
  return {
    ...q,
    localId: q.localId || q.local_id || String(q.id),
    merchant: q.merchant || '',
    item: q.item || '',
    amount: q.amount || 0,
    totalTimes: q.total_times || q.totalTimes || 0,
    usedTimes: q.used_times || q.usedTimes || 0,
    expireDate: q.expire_date || q.expireDate || '',
    note: q.note || '',
    updatedAt: q.updatedAt || q.updated_at || Date.now(),
  };
}

function normalizeCheckin(c) {
  return {
    ...c,
    localId: c.localId || c.local_id || String(c.id),
    quotaId: c.quotaId || c.quota_id || '',
    merchant: c.merchant || '',
    deductTimes: c.deduct_times || c.deductTimes || 1,
    checkinDate: c.checkin_date || c.checkinDate,
    checkinTime: c.checkin_time || c.checkinTime || '',
    isRevoked: c.is_revoked || c.isRevoked || false,
    dateEditLogs: c.dateEditLogs || c.date_edit_logs || [],
    updatedAt: c.updatedAt || c.updated_at || Date.now(),
  };
}

function normalizeRating(r) {
  return {
    ...r,
    localId: r.localId || r.local_id || String(r.id),
    merchant: r.merchant || '',
    score: r.score || 5,
    comment: r.comment || '',
  };
}

module.exports = {
  formatDate,
  nowTime,
  daysBetween,
  isExpired,
  calcProgress,
  normalizeQuota,
  normalizeCheckin,
  normalizeRating,
};
