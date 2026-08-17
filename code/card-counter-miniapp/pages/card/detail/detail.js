// pages/card/detail/detail.js - 卡详情 + 动态核销码（防截图重放）
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
    id: 0,
    card: null,
    token: '',
    remainSec: 0,
    loading: true,
  },

  onLoad(query) {
    this.setData({ id: parseInt(query.id) || 0 });
  },

  onShow() {
    if (!app.ensureLogin()) return;
    this.loadCard();
    this.refreshToken();
  },

  onHide() { this.stopTimer(); },
  onUnload() { this.stopTimer(); },

  async loadCard() {
    this.setData({ loading: true });
    try {
      const cards = await app.callApi('/api/cards', 'GET');
      const card = (cards || []).find(c => c.id === this.data.id);
      if (card) {
        card.remaining = Math.max(0, (card.totalTimes || 0) - (card.usedTimes || 0));
        card.statusText = STATUS_TEXT[card.status] || card.status;
        this.setData({ card, loading: false });
      } else {
        this.setData({ loading: false });
      }
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  async refreshToken() {
    this.stopTimer();
    if (!this.data.id) return;
    try {
      const res = await app.callApi('/api/cards/' + this.data.id + '/redeem-token', 'GET');
      this.setData({ token: res.token, remainSec: res.expiresIn || 90 });
      this.startTimer();
    } catch (e) {
      wx.showToast({ title: e.message || '获取核销码失败', icon: 'none' });
    }
  },

  startTimer() {
    this.stopTimer();
    // 每秒倒计时；到 0 或每 60s 主动刷新一次（令牌 90s 时效，保证商户扫码时始终有效）
    this._tick = setInterval(() => {
      const s = this.data.remainSec - 1;
      if (s <= 0) { this.refreshToken(); } else { this.setData({ remainSec: s }); }
    }, 1000);
    this._refresh = setTimeout(() => this.refreshToken(), 60000);
  },

  stopTimer() {
    if (this._tick) { clearInterval(this._tick); this._tick = null; }
    if (this._refresh) { clearTimeout(this._refresh); this._refresh = null; }
  },

  copyToken() {
    if (!this.data.token) return;
    wx.setClipboardData({ data: this.data.token, success: () => wx.showToast({ title: '已复制核销码', icon: 'none' }) });
  },

  onPullDownRefresh() {
    Promise.all([this.loadCard(), this.refreshToken()]).then(() => wx.stopPullDownRefresh());
  },
});
