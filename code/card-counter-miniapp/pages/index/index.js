// pages/index/index.js - 配额列表（首页 / 次卡 Tab，原生 UI，云端同步）
const app = getApp();
const storage = require('../../utils/storage');
const syncManager = require('../../utils/syncManager');
const learningPlan = require('../../utils/learningPlan');
const util = require('../../utils/util');

Page({
  data: {
    userInfo: null,
    syncText: '',
    suggestion: null,
    expiring: [],
    quotas: [],
    loading: true,
    error: '',
  },

  onShow() {
    if (!app.ensureLogin('/pages/index/index')) {
      return;
    }
    this.loadData();
  },

  async loadData() {
    this.setData({ loading: true, error: '' });
    try {
      if (!app.globalData.token) {
        await app.wechatLogin();
      }
      // 进入首页先拉取云端，保持本地与云端一致
      await syncManager.pull(app);

      const quotas = (storage.getQuotas() || []).map(util.normalizeQuota);
      const syncStatus = storage.getSyncStatus();

      // 逐条配额展示信息
      const enriched = quotas.map((q) => {
        const total = q.totalTimes || 0;
        const used = q.usedTimes || 0;
        const remain = Math.max(0, total - used);
        const progress = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
        const status = learningPlan.getStatus(q);
        return {
          ...q,
          remain,
          progress,
          status,
          expireText: q.expireDate || '长期',
          amountText: q.amount ? '¥' + q.amount : '',
        };
      });

      // 即将到期（30 天内）提醒
      const now = new Date();
      const todayStr = util.formatDate(now);
      const expiring = enriched
        .filter((q) => q.expireDate && q.status === '进行中')
        .map((q) => ({ ...q, daysLeft: util.daysBetween(todayStr, q.expireDate) }))
        .filter((q) => q.daysLeft <= 30)
        .sort((a, b) => a.daysLeft - b.daysLeft)
        .slice(0, 3)
        .map((q) => ({
          localId: q.localId,
          name: q.merchant,
          sub: (q.item || '') + ' · 剩 ' + q.remain + ' 次',
          daysLeft: q.daysLeft,
        }));

      // 全局学习建议
      const suggestion = learningPlan.calculateGlobalSuggestion(enriched);

      this.setData({
        userInfo: app.globalData.userInfo,
        syncText: this.fmtTime(syncStatus.lastSyncTime),
        suggestion: {
          totalRemaining: suggestion.totalRemaining,
          message: suggestion.message,
        },
        expiring,
        quotas: enriched,
        loading: false,
      });
    } catch (e) {
      this.setData({ loading: false, error: e.message || '加载失败' });
    }
  },

  fmtTime(ts) {
    if (!ts) return '尚未同步';
    const d = new Date(ts);
    const pad = (n) => String(n).padStart(2, '0');
    return '同步于 ' + (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  },

  goAdd() {
    wx.navigateTo({ url: '/pages/quota/quota' });
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/quota/detail/detail?id=' + id });
  },

  // 快速签到：带上选中的配额跳到签到 Tab
  quickCheckin(e) {
    const id = e.currentTarget.dataset.id;
    wx.setStorageSync('pendingCheckinQuota', id);
    wx.switchTab({ url: '/pages/checkin/checkin' });
  },

  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh());
  },

  onShareAppMessage() {
    return {
      title: '次卡管家 — 预充值消费管理',
      path: '/pages/index/index',
    };
  },
});
