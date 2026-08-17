// pages/checkin/history/history.js - 签到历史
const app = getApp();
const storage = require('../../../utils/storage');
const syncManager = require('../../../utils/syncManager');
const util = require('../../../utils/util');

Page({
  data: {
    checkins: [],
    merchants: [],
    filterMerchant: '',
    loading: true,
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      // 每次进入先同步云端，确保历史记录完整
      if (!app.globalData.token) {
        await app.wechatLogin();
      }
      await syncManager.pull(app);
      const quotas = storage.getQuotas() || [];
      const quotaByName = {};
      quotas.forEach(q => { const n = util.normalizeQuota(q); quotaByName[n.localId] = n; });
      const merchantOf = (c) => {
        const q = quotaByName[c.quotaId] || quotas.map(util.normalizeQuota).find(q => String(q.id) === String(c.quotaId));
        return (q && q.merchant) || c.merchant || '手动记录';
      };
      const checkins = storage.getCheckins() || [];
      const normalized = checkins
        .map(util.normalizeCheckin)
        .filter(c => !c.isRevoked)
        .sort((a, b) => (b.checkinDate + ' ' + (b.checkinTime || '')).localeCompare(a.checkinDate + ' ' + (a.checkinTime || '')));
      normalized.forEach(c => {
        c.merchantText = merchantOf(c);
        c.dateEditText = (c.dateEditLogs || []).map(l => l.from + ' → ' + l.to).join('；');
        c.dateModified = !!(c.dateEditLogs && c.dateEditLogs.length);
      });

      // 商家列表（按配额名称）
      const merchants = [...new Set(normalized.map(c => c.merchantText).filter(Boolean))];

      this.setData({ checkins: normalized, merchants, loading: false });
      this.applyFilter();
    } catch (e) {
      this.setData({ loading: false });
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
    }
  },

  onFilterChange(e) {
    const filterMerchant = e.detail.value;
    this.setData({ filterMerchant }, () => this.applyFilter());
  },

  applyFilter() {
    const { checkins, filterMerchant } = this.data;
    const filtered = filterMerchant ? checkins.filter(c => c.merchantText === filterMerchant) : checkins;
    this.setData({ filteredCheckins: filtered });
  },

  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh());
  },

  // 进入签到记录修改管理界面（改期/撤销）
  goEdit(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/checkin/edit/edit?id=' + id });
  },
});
