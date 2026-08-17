// pages/merchant/redeem/redeem.js - 商户核销（扫码 / 输入动态令牌）
const app = getApp();

Page({
  data: {
    merchantId: 0,
    token: '',
    loading: false,
    result: null,    // { remaining, recordId } 或 { error }
  },

  onLoad(query) {
    this.setData({ merchantId: parseInt(query.merchantId) || 0 });
  },

  onInput(e) {
    this.setData({ token: (e.detail.value || '').trim() });
  },

  scan() {
    wx.scanCode({
      success: (res) => {
        this.setData({ token: (res.result || '').trim() });
        this.doRedeem();
      },
      fail: () => {},
    });
  },

  async doRedeem() {
    const token = this.data.token;
    if (!token) { wx.showToast({ title: '请先扫描或输入核销码', icon: 'none' }); return; }
    if (!this.data.merchantId) { wx.showToast({ title: '缺少商户信息', icon: 'none' }); return; }
    this.setData({ loading: true, result: null });
    try {
      const res = await app.callApi('/api/merchant/redeem?merchantId=' + this.data.merchantId, 'POST', { token });
      this.setData({ result: res, token: '' });
      wx.showToast({ title: '核销成功', icon: 'success' });
    } catch (e) {
      this.setData({ result: { error: e.message } });
      wx.showToast({ title: e.message || '核销失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },
});
