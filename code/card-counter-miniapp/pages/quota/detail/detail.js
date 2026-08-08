// pages/quota/detail/detail.js - 配额详情
const app = getApp();
const storage = require('../../../utils/storage');
const syncManager = require('../../../utils/syncManager');
const learningPlan = require('../../../utils/learningPlan');
const util = require('../../../utils/util');

Page({
  data: {
    quota: null,
    suggestion: null,
    checkins: [],
    loading: true,
    error: '',
  },

  onLoad(options) {
    this.setData({ quotaId: options.id });
    this.loadData();
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      // 每次进入详情页先同步云端，确保签到明细最新
      if (!app.globalData.token) {
        await app.wechatLogin();
      }
      await syncManager.pull(app);
      const quotas = storage.getQuotas() || [];
      const normalized = quotas.map(util.normalizeQuota);
      const quota = normalized.find(q => q.localId === this.data.quotaId || String(q.id) === this.data.quotaId);
      if (!quota) {
        this.setData({ loading: false, error: '配额不存在' });
        return;
      }
      quota.status = learningPlan.getStatus(quota);
      quota.statusClass = { '进行中': 'active', '已用完': 'used', '已过期': 'expired' }[quota.status] || 'active';
      quota.remain = (quota.totalTimes || 0) - (quota.usedTimes || 0);
      quota.expireText = quota.expireDate || '长期';
      const suggestion = learningPlan.calculateQuotaSuggestion(quota);

      // 签到历史
      let checkins = storage.getCheckins() || [];
      const quotaCheckins = checkins
        .map(util.normalizeCheckin)
        .filter(c => c.quotaId === quota.localId || String(c.quota_id) === String(quota.id))
        .filter(c => !c.isRevoked)
        .sort((a, b) => (b.checkinDate + ' ' + (b.checkinTime || '')).localeCompare(a.checkinDate + ' ' + (a.checkinTime || '')));

      this.setData({
        quota,
        suggestion,
        checkins: quotaCheckins,
        loading: false,
      });
    } catch (e) {
      this.setData({ loading: false, error: e.message || '加载失败' });
    }
  },

  goEdit() {
    wx.navigateTo({ url: '/pages/quota/quota?id=' + this.data.quota.localId });
  },

  goCheckin() {
    wx.setStorageSync('pendingCheckinQuota', this.data.quota.localId);
    wx.switchTab({ url: '/pages/checkin/checkin' });
  },

  onShareAppMessage() {
    return {
      title: '次卡管家 - ' + (this.data.quota ? this.data.quota.merchant : ''),
      path: '/pages/index/index',
    };
  },
});
