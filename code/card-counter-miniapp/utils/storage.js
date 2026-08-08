// utils/storage.js - 本地缓存管理（本地优先 + 云端同步）
class StorageManager {
  constructor() {
    this.keys = {
      QUOTAS: 'quotas',
      CHECKINS: 'checkins',
      RATINGS: 'ratings',
      LEARNING_PLAN: 'learningPlan',
      SYNC_STATUS: 'syncStatus',
      USER_INFO: 'userInfo',
      TOKEN: 'token',
    };
  }

  get(key) {
    try {
      const data = wx.getStorageSync(key);
      if (data === '' || data === null || data === undefined) {
        return this.isListKey(key) ? [] : null;
      }
      return data;
    } catch (e) {
      return this.isListKey(key) ? [] : null;
    }
  }

  set(key, value) {
    try {
      wx.setStorageSync(key, value);
      return true;
    } catch (e) {
      return false;
    }
  }

  isListKey(key) {
    return key === this.keys.QUOTAS || key === this.keys.CHECKINS || key === this.keys.RATINGS;
  }

  // 配额
  getQuotas() { return this.get(this.keys.QUOTAS); }
  setQuotas(v) { return this.set(this.keys.QUOTAS, v); }
  getCheckins() { return this.get(this.keys.CHECKINS); }
  setCheckins(v) { return this.set(this.keys.CHECKINS, v); }
  getRatings() { return this.get(this.keys.RATINGS); }
  setRatings(v) { return this.set(this.keys.RATINGS, v); }

  // 同步状态
  getSyncStatus() { return this.get(this.keys.SYNC_STATUS) || { lastSyncTime: 0, hasPendingSync: false }; }
  setSyncStatus(v) { return this.set(this.keys.SYNC_STATUS, v); }

  // 学习规划
  getLearningPlan() {
    return this.get(this.keys.LEARNING_PLAN) || {
      weekendHours: '周六上午9-11点，周日下午3-5点',
      holidayHours: '每天上午9-11点，下午2-4点',
      weekdayWeight: 1,
      weekendWeight: 2,
      holidayWeight: 1.5,
    };
  }
  setLearningPlan(v) { return this.set(this.keys.LEARNING_PLAN, v); }

  // 生成唯一 ID
  generateId(prefix) {
    return (prefix || 'id') + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);
  }

  // 清除所有数据（跨设备恢复测试用）
  clearAll() {
    Object.values(this.keys).forEach(k => {
      try { wx.removeStorageSync(k); } catch (e) {}
    });
  }
}

module.exports = new StorageManager();
