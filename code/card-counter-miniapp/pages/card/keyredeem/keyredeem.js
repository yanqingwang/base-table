// pages/card/keyredeem/keyredeem.js - 卡密兑换（跨租户卡密 → 统一账本入账）
const app = getApp();

function genIdemKey() {
  return 'kr-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
}

Page({
  data: {
    code: '',
    redeeming: false,
    result: null,   // {card:{cardNo,amountCents,...}, balanceCents, seq}
  },

  onShow() {
    if (!app.ensureLogin('/pages/card/keyredeem/keyredeem')) return;
  },

  onInput(e) {
    this.setData({ code: (e.detail.value || '').trim().toUpperCase() });
  },

  async onRedeem() {
    if (this.data.redeeming) return;
    const code = this.data.code;
    if (!code) {
      wx.showToast({ title: '请输入卡密', icon: 'none' });
      return;
    }
    if (!app.ensureLogin('/pages/card/keyredeem/keyredeem')) return;
    this.setData({ redeeming: true });
    try {
      const res = await app.callApi('/api/redeem', 'POST', {
        code,
        idempotencyKey: genIdemKey(),
      });
      this.setData({ result: res, redeeming: false });
      wx.showToast({ title: '兑换成功', icon: 'success' });
    } catch (e) {
      this.setData({ redeeming: false });
      wx.showToast({ title: e.message || '兑换失败', icon: 'none' });
    }
  },

  goMyCards() {
    // /pages/card/list/list 不是 tab 页，switchTab 会直接失败 → 用 navigateTo
    wx.navigateTo({ url: '/pages/card/list/list' });
  },
});
