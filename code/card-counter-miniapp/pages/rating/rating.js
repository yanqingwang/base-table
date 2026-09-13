// pages/rating/rating.js - 商家评价
const app = getApp();
const storage = require('../../utils/storage');
const syncManager = require('../../utils/syncManager');
const util = require('../../utils/util');

Page({
  data: {
    ratings: [],
    showForm: false,
    form: { merchant: '', score: 5, comment: '' },
    starList: [1, 2, 3, 4, 5],
    loading: true,
  },

  onShow() {
    if (!app.ensureLogin('/pages/rating/rating')) {
      return;
    }
    this.loadData();
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      let ratings = storage.getRatings();
      if (!ratings || ratings.length === 0) {
        await syncManager.pull(app);
        ratings = storage.getRatings();
      }
      const normalized = (ratings || []).map(util.normalizeRating)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      normalized.forEach(r => { r.stars = '★'.repeat(Math.min(5, Math.max(1, r.score))); });
      this.setData({ ratings: normalized, loading: false });
    } catch (e) {
      this.setData({ loading: false });
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
    }
  },

  showForm() {
    // 从已有配额中取商家建议
    const quotas = storage.getQuotas() || [];
    const merchants = [...new Set(quotas.map(q => q.merchant).filter(Boolean))];
    this.setData({ showForm: true, form: { merchant: merchants[0] || '', score: 5, comment: '' } });
  },

  hideForm() {
    this.setData({ showForm: false });
  },

  onMerchantInput(e) {
    this.setData({ 'form.merchant': e.detail.value });
  },

  onCommentInput(e) {
    this.setData({ 'form.comment': e.detail.value });
  },

  onStarTap(e) {
    const score = parseInt(e.currentTarget.dataset.score);
    this.setData({ 'form.score': score });
  },

  async submit() {
    const { form } = this.data;
    if (!form.merchant.trim()) {
      wx.showToast({ title: '请输入商家名称', icon: 'none' });
      return;
    }
    try {
      const localId = storage.generateId('rating');
      // 本地保存
      const ratings = storage.getRatings();
      ratings.push({
        localId,
        merchant: form.merchant.trim(),
        score: form.score,
        comment: form.comment.trim(),
        createdAt: Date.now(),
        _synced: false,
      });
      storage.setRatings(ratings);

      // 云端推送
      app.callApi('/api/ratings', 'POST', {
        localId,
        merchant: form.merchant.trim(),
        score: form.score,
        comment: form.comment.trim(),
      }).catch(() => {
        storage.setSyncStatus({ ...storage.getSyncStatus(), hasPendingSync: true });
      });

      wx.showToast({ title: '评价成功', icon: 'success' });
      this.setData({ showForm: false });
      this.loadData();
    } catch (e) {
      wx.showToast({ title: e.message || '保存失败', icon: 'none' });
    }
  },

  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh());
  },
});
