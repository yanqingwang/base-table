// pages/groupbuy/redeem/redeem.js - 团购券核销落私域
const app = getApp();

Page({
  data: {
    code: '',
    redeeming: false,
    result: null,   // {voucherId, code, cardId, status}
  },

  onShow() {
    if (!app.ensureLogin()) return;
  },

  onInput(e) {
    this.setData({ code: (e.detail.value || '').trim().toUpperCase() });
  },

  async onRedeem() {
    if (this.data.redeeming) return;
    const code = this.data.code;
    if (!code) {
      wx.showToast({ title: '请输入团购券码', icon: 'none' });
      return;
    }
    this.setData({ redeeming: true });
    try {
      const res = await app.callApi('/api/group-buy/redeem', 'POST', { code });
      this.setData({ result: res, redeeming: false });
      wx.showToast({ title: '核销成功', icon: 'success' });
    } catch (e) {
      this.setData({ redeeming: false });
      wx.showToast({ title: e.message || '核销失败', icon: 'none' });
    }
  },

  goMyCards() {
    // /pages/card/list/list 不是 tab 页，switchTab 会直接失败 → 用 navigateTo
    wx.navigateTo({ url: '/pages/card/list/list' });
  },
});
