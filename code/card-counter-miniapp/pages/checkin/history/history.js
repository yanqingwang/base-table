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

  onLoad() {
    this.loadData();
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      let checkins = storage.getCheckins();
      if (!checkins || checkins.length === 0) {
        await syncManager.pull(app);
        checkins = storage.getCheckins();
      }
      const normalized = (checkins || [])
        .map(util.normalizeCheckin)
        .filter(c => !c.isRevoked)
        .sort((a, b) => (b.checkinDate + ' ' + (b.checkinTime || '')).localeCompare(a.checkinDate + ' ' + (a.checkinTime || '')));
      normalized.forEach(c => {
        c.merchantText = c.merchant || '手动记录';
        c.dateEditText = (c.dateEditLogs || []).map(l => l.from + ' → ' + l.to).join('；');
      });

      // 商家列表
      const merchants = [...new Set(normalized.map(c => c.merchant).filter(Boolean))];

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
    const filtered = filterMerchant ? checkins.filter(c => c.merchant === filterMerchant) : checkins;
    this.setData({ filteredCheckins: filtered });
  },

  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh());
  },
});
