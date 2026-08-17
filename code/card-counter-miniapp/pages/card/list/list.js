// pages/card/list/list.js - 我的卡包
const app = getApp();

const STATUS_TEXT = {
  unclaimed: '待领取',
  active: '可用',
  used_up: '已用完',
  expired: '已过期',
  voided: '已作废',
};

Page({
  data: {
    cards: [],
    loading: true,
  },

  onShow() {
    if (!app.ensureLogin('/pages/card/list/list')) return;
    this.load();
  },

  async load() {
    this.setData({ loading: true });
    try {
      const cards = await app.callApi('/api/cards', 'GET');
      const list = (cards || []).map(c => ({
        ...c,
        remaining: Math.max(0, (c.totalTimes || 0) - (c.usedTimes || 0)),
        statusText: STATUS_TEXT[c.status] || c.status,
      }));
      this.setData({ cards: list, loading: false });
    } catch (e) {
      this.setData({ loading: false });
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
    }
  },

  openDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/card/detail/detail?id=' + id });
  },

  goClaim() {
    wx.navigateTo({ url: '/pages/card/claim/claim' });
  },

  onPullDownRefresh() {
    this.load().then(() => wx.stopPullDownRefresh());
  },
});
