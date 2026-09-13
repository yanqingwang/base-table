// pages/card/claim/claim.js - 领取次卡（输入领取码）
const app = getApp();

Page({
  data: {
    code: '',
    loading: false,
  },

  onInput(e) {
    this.setData({ code: (e.detail.value || '').trim().toUpperCase() });
  },

  async submit() {
    const code = this.data.code;
    if (!code) {
      wx.showToast({ title: '请输入领取码', icon: 'none' });
      return;
    }
    if (!app.ensureLogin('/pages/card/claim/claim')) return;
    this.setData({ loading: true });
    try {
      const card = await app.callApi('/api/cards/claim', 'POST', { issueCode: code });
      wx.showToast({ title: '领取成功', icon: 'success' });
      setTimeout(() => {
        wx.redirectTo({ url: '/pages/card/detail/detail?id=' + card.id });
      }, 800);
    } catch (e) {
      wx.showToast({ title: e.message || '领取失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },
});
