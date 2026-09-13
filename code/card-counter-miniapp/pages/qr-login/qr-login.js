// pages/qr-login/qr-login.js - 网页版扫码登录确认页
// 用户用微信扫网页上的小程序码后打开此页，自动确认登录，网页端轮询拿到 token。
const app = getApp();

Page({
  data: {
    status: 'loading',   // loading | success | error
    message: '正在确认登录…',
    scene: '',
  },

  onLoad(options) {
    // getwxacodeunlimit 的 scene 通过 options.scene 传入（URL 编码）
    let scene = (options && options.scene) || '';
    try {
      scene = decodeURIComponent(scene);
    } catch (e) { /* 非编码字符串直接使用 */ }
    this.setData({ scene });
    if (!scene) {
      this.setData({ status: 'error', message: '缺少登录参数，请重新扫码' });
      return;
    }
    this.confirmLogin(scene);
  },

  async confirmLogin(scene) {
    try {
      // 小程序 callContainer 会自动注入 X-WX-OPENID，后端据此确认登录
      const result = await app.callApi('/api/auth/qr-login/confirm', 'POST', { scene }, false);
      if (result && result.confirmed) {
        this.setData({ status: 'success', message: '登录成功！请返回网页端继续。' });
        wx.showToast({ title: '登录成功', icon: 'success' });
        // 稍后返回小程序首页（扫码启动无返回栈，用 reLaunch）
        setTimeout(() => { wx.reLaunch({ url: '/pages/index/index' }); }, 1500);
      } else {
        this.setData({ status: 'error', message: '确认失败，请重试' });
      }
    } catch (e) {
      this.setData({ status: 'error', message: '确认失败：' + (e.message || '网络错误') });
    }
  },

  goHome() {
    wx.reLaunch({ url: '/pages/index/index' });
  },
});
