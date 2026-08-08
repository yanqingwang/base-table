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
    merchantAmount: [],
    totalConsumed: '0.00',
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

      // 商家签到排行（前3）—— 商家=配额名称（按 quotaId 关联，回退 checkin.merchant）
      const quotaByName = {};
      nQuotas.forEach(q => { quotaByName[q.localId] = q; });
      const merchantOf = (c) => {
        const q = quotaByName[c.quotaId] || nQuotas.find(q => String(q.id) === String(c.quotaId));
        return (q && q.merchant) || c.merchant || '手动记录';
      };
      const merchantCount = {};
      nCheckins.forEach(c => {
        const name = merchantOf(c);
        merchantCount[name] = (merchantCount[name] || 0) + 1;
      });
      const merchantRank = Object.entries(merchantCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, count]) => ({ name, count }));

      // 已消费金额（按商户，商家=配额名称）—— 每配额消费 = 金额 × 已用/总次数
      const merchantAmount = {};
      nQuotas.forEach(q => {
        const name = q.merchant || '未命名';
        const consumed = q.totalTimes > 0 ? (q.amount || 0) * (q.usedTimes || 0) / q.totalTimes : 0;
        merchantAmount[name] = (merchantAmount[name] || 0) + consumed;
      });
      const amountRank = Object.entries(merchantAmount)
        .filter(([, v]) => v > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([name, amount]) => ({ name, amount: amount.toFixed(2) }));
      const totalConsumed = Object.values(merchantAmount).reduce((s, v) => s + v, 0).toFixed(2);

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
        merchantAmount: amountRank,
        totalConsumed,
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
