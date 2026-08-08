// pages/login/login.js - 登录/注册页
const app = getApp();
const storage = require('../../utils/storage');

Page({
  data: {
    mode: 'login',          // login | register
    username: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    loading: false,
    error: '',
  },

  onLoad(options) {
    // 支持 redirect 参数：登录成功后跳转
    this.redirect = options.redirect || '';
  },

  switchMode() {
    this.setData({
      mode: this.data.mode === 'login' ? 'register' : 'login',
      error: '',
    });
  },

  onUsernameInput(e) { this.setData({ username: e.detail.value, error: '' }); },
  onPasswordInput(e) { this.setData({ password: e.detail.value, error: '' }); },
  onConfirmInput(e) { this.setData({ confirmPassword: e.detail.value, error: '' }); },
  onNicknameInput(e) { this.setData({ nickname: e.detail.value, error: '' }); },

  // 登录成功后跳转（tab 页用 switchTab，其他用 redirectTo）
  gotoAfterLogin() {
    const tabPages = ['/pages/index/index', '/pages/checkin/checkin', '/pages/stats/stats', '/pages/rating/rating', '/pages/profile/profile'];
    if (this.redirect) {
      if (tabPages.includes(this.redirect)) {
        wx.switchTab({ url: this.redirect });
      } else {
        wx.redirectTo({ url: this.redirect });
      }
    } else {
      wx.switchTab({ url: '/pages/index/index' });
    }
  },

  async doSubmit() {
    const { mode, username, password, confirmPassword, nickname } = this.data;
    if (!username || !password) {
      this.setData({ error: '请输入用户名和密码' });
      return;
    }
    if (mode === 'register') {
      if (username.length < 3) {
        this.setData({ error: '用户名至少3个字符' });
        return;
      }
      if (password.length < 6) {
        this.setData({ error: '密码至少6个字符' });
        return;
      }
      if (password !== confirmPassword) {
        this.setData({ error: '两次输入的密码不一致' });
        return;
      }
    }
    this.setData({ loading: true, error: '' });
    try {
      const path = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload = mode === 'login'
        ? { username, password }
        : { username, password, nickname: nickname || username };
      // 密码登录不走 auth 头（需要先登录拿 token）
      const result = await app.callApi(path, 'POST', payload, false);
      app.globalData.token = result.token;
      app.globalData.userInfo = result.user;
      storage.set(storage.keys.TOKEN, result.token);
      storage.set(storage.keys.USER_INFO, result.user);
      wx.showToast({ title: mode === 'login' ? '登录成功' : '注册成功', icon: 'success' });
      setTimeout(() => this.gotoAfterLogin(), 800);
    } catch (e) {
      this.setData({ error: e.message || '操作失败' });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 微信一键登录
  async doWechatLogin() {
    this.setData({ loading: true, error: '' });
    try {
      await app.wechatLogin();
      wx.showToast({ title: '微信登录成功', icon: 'success' });
      setTimeout(() => this.gotoAfterLogin(), 800);
    } catch (e) {
      this.setData({ error: e.message || '微信登录失败，请使用用户名密码登录' });
    } finally {
      this.setData({ loading: false });
    }
  },
});
