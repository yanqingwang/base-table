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
    walletBalance: '',
    walletKeys: [],
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
    // 卡密钱包（统一账本）：后端未部署跨租户栈时静默跳过，不影响既有卡包
    try {
      const wallet = await app.callApi('/api/wallet', 'GET');
      const keys = (wallet.cards || []).map(k => ({
        ...k,
        remainText: '¥' + (((k.remainingCents != null ? k.remainingCents : k.amountCents) || 0) / 100).toFixed(2),
        amountText: '¥' + ((k.amountCents || 0) / 100).toFixed(2),
        keyStatusText: { ACTIVE: '可用', CONSUMED: '已用完', EXPIRED: '已过期', REFUNDED: '已退款', ISSUED: '未兑换', BOUND: '已绑定' }[k.status] || k.status,
      }));
      this.setData({
        walletBalance: wallet.balanceCents != null ? '¥' + (wallet.balanceCents / 100).toFixed(2) : '',
        walletKeys: keys,
      });
    } catch (e) { /* 卡密账本不可用时忽略 */ }
  },

  openDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/card/detail/detail?id=' + id });
  },

  goClaim() {
    wx.navigateTo({ url: '/pages/card/claim/claim' });
  },

  goGroupBuy() {
    wx.navigateTo({ url: '/pages/groupbuy/redeem/redeem' });
  },

  goKeyRedeem() {
    wx.navigateTo({ url: '/pages/card/keyredeem/keyredeem' });
  },

  onPullDownRefresh() {
    this.load().then(() => wx.stopPullDownRefresh());
  },
});
