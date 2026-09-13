// pages/order/buy/buy.js - 顾客买卡落地页
// 通过商家分享的购卡链接进入：?templateId=xxx
// 商户由后端根据卡种归属决定，前端无需也不应指定 merchantId。
const app = getApp();

Page({
  data: {
    templateId: 0,
    tpl: null,        // {id,name,totalTimes,priceCents,validDays,defaultDeduct,refundRule,refundRuleType}
    loading: true,
    buying: false,
    result: null,     // {orderId, status, paidAmountCents, cardId}
  },

  onLoad(query) {
    this.setData({ templateId: parseInt(query.templateId) || 0 });
  },

  onShow() {
    if (!app.ensureLogin()) return;
    this.loadTemplate();
  },

  async loadTemplate() {
    this.setData({ loading: true });
    try {
      if (!this.data.templateId) {
        this.setData({ loading: false, tpl: null });
        return;
      }
      const tpl = await app.callApi('/api/templates/' + this.data.templateId, 'GET');
      this.setData({ tpl, loading: false });
    } catch (e) {
      this.setData({ loading: false });
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
    }
  },

  priceYuan(cents) {
    return (cents / 100).toFixed(2);
  },

  async onBuy() {
    if (this.data.buying) return;
    this.setData({ buying: true });
    try {
      const order = await app.callApi('/api/orders', 'POST', { templateId: this.data.templateId });
      // 演示态：直接确认支付（真实接入微信支付时在此唤起 wx.requestPayment）
      const paid = await app.callApi('/api/orders/' + order.orderId + '/pay', 'POST', {});
      this.setData({ result: paid, buying: false });
      wx.showToast({ title: '购卡成功', icon: 'success' });
    } catch (e) {
      this.setData({ buying: false });
      wx.showToast({ title: e.message || '支付失败', icon: 'none' });
    }
  },

  goMyCards() {
    // /pages/card/list/list 不是 tab 页，switchTab 会直接失败 → 用 navigateTo 兜底
    wx.navigateBack({ fail: () => wx.navigateTo({ url: '/pages/card/list/list' }) });
  },
});
