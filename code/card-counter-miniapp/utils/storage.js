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
    this._syncTimer = null;
    this._storageWarned = false;
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

  /**
   * 写入本地存储。
   * @param {boolean} [silent] 为 true 时不触发"写入即同步"（用于同步管理器内部持久化，避免自触发循环）
   * 列表类 key（quotas/checkins/ratings）写入后默认 debounce 触发一次 push，保证切后台前数据已上云。
   */
  set(key, value, silent = false) {
    try {
      wx.setStorageSync(key, value);
    } catch (e) {
      // 超出本地存储上限等异常：记录标记，避免静默失败无感知
      console.error('本地存储写入失败（可能超出容量上限）:', key, e);
      try {
        const status = this.getSyncStatus() || {};
        status.storageError = true;
        status.storageErrorMessage = (e && e.message) || '存储写入失败';
        this.set(this.keys.SYNC_STATUS, status, true);
      } catch (_) {}
      if (!this._storageWarned) {
        this._storageWarned = true;
        wx.showToast({ title: '本地存储已满，请及时清理', icon: 'none' });
      }
      return false;
    }
    if (!silent && this.isListKey(key)) {
      this.scheduleSync();
    }
    return true;
  }

  /**
   * 写入即同步：用户编辑（新建/核销/评分）落地后，debounce 推送一次到云端。
   * onHide 仍作为最后兜底，但主路径不再依赖它，避免切后台异步任务被系统挂起导致丢数据。
   */
  scheduleSync() {
    if (this._syncTimer) clearTimeout(this._syncTimer);
    this._syncTimer = setTimeout(() => {
      this._syncTimer = null;
      try {
        const app = (typeof getApp === 'function') ? getApp() : null;
        if (app && typeof app.autoSync === 'function') {
          app.autoSync('push');
        }
      } catch (e) {}
    }, 800);
  }

  isListKey(key) {
    return key === this.keys.QUOTAS || key === this.keys.CHECKINS || key === this.keys.RATINGS;
  }

  // 配额
  getQuotas() { return this.get(this.keys.QUOTAS); }
  setQuotas(v) { return this.set(this.keys.QUOTAS, v); }
  setQuotasSilent(v) { return this.set(this.keys.QUOTAS, v, true); }
  getCheckins() { return this.get(this.keys.CHECKINS); }
  setCheckins(v) { return this.set(this.keys.CHECKINS, v); }
  setCheckinsSilent(v) { return this.set(this.keys.CHECKINS, v, true); }
  getRatings() { return this.get(this.keys.RATINGS); }
  setRatings(v) { return this.set(this.keys.RATINGS, v); }
  setRatingsSilent(v) { return this.set(this.keys.RATINGS, v, true); }

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
