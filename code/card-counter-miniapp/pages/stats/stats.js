// pages/stats/stats.js - 统计
const app = getApp();
const storage = require('../../utils/storage');
const syncManager = require('../../utils/syncManager');
const learningPlan = require('../../utils/learningPlan');
const util = require('../../utils/util');

Page({
  data: {
    summary: { totalCheckins: 0, weekCheckins: 0, avgPerDay: 0, usageRate: 0 },
    merchantRank: [],
    ratings: [],
    suggestion: null,
    weekData: [],
    loading: true,
  },

  onShow() {
    if (!app.ensureLogin('/pages/stats/stats')) {
      return;
    }
    this.loadData();
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      // 每次进入统计页先同步云端
      if (!app.globalData.token) {
        await app.wechatLogin();
      }
      await syncManager.pull(app);
      const quotas = storage.getQuotas() || [];
      const checkins = storage.getCheckins() || [];
      const ratings = storage.getRatings() || [];

      const nCheckins = (checkins || []).map(util.normalizeCheckin).filter(c => !c.isRevoked);
      const nQuotas = (quotas || []).map(util.normalizeQuota);
      const nRatings = (ratings || []).map(util.normalizeRating);

      // 总签到次数
      const totalCheckins = nCheckins.length;

      // 本周签到（最近7天）
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekCheckins = nCheckins.filter(c => c.checkinDate && new Date(c.checkinDate) >= weekAgo).length;

      // 使用天数
      const days = new Set(nCheckins.map(c => c.checkinDate).filter(Boolean));
      const avgPerDay = days.size > 0 ? (totalCheckins / days.size).toFixed(1) : 0;

      // 配额使用率
      const totalUsed = nQuotas.reduce((s, q) => s + (q.usedTimes || 0), 0);
      const totalTimes = nQuotas.reduce((s, q) => s + (q.totalTimes || 0), 0);
      const usageRate = totalTimes > 0 ? Math.round(totalUsed / totalTimes * 100) : 0;

      // 商家签到排行（前3）
      const merchantCount = {};
      nCheckins.forEach(c => {
        if (c.merchant) {
          merchantCount[c.merchant] = (merchantCount[c.merchant] || 0) + 1;
        }
      });
      const merchantRank = Object.entries(merchantCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, count]) => ({ name, count }));

      // 学习建议
      const suggestion = learningPlan.calculateGlobalSuggestion(nQuotas);

      // 近7天趋势
      const weekData = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = util.formatDate(d);
        const count = nCheckins.filter(c => c.checkinDate === dateStr).length;
        weekData.push({ date: dateStr.slice(5), count });
      }
      const maxCount = Math.max(1, ...weekData.map(d => d.count));
      weekData.forEach(d => { d.height = Math.round(d.count / maxCount * 100); });

      nRatings.forEach(r => { r.stars = '★'.repeat(Math.min(5, Math.max(1, r.score))); });
      merchantRank.forEach((m, i) => { m.rank = i + 1; });
      this.setData({
        summary: { totalCheckins, weekCheckins, avgPerDay, usageRate },
        merchantRank,
        ratings: nRatings,
        suggestion,
        weekData,
        maxCount,
        loading: false,
      });
    } catch (e) {
      this.setData({ loading: false });
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
    }
  },

  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh());
  },

  goRating() {
    wx.switchTab({ url: '/pages/rating/rating' });
  },
});
