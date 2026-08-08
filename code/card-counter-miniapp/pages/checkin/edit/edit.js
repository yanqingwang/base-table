// pages/checkin/edit/edit.js - 签到记录修改（改期/撤销）管理界面
const app = getApp();
const storage = require('../../../utils/storage');
const util = require('../../../utils/util');

Page({
  data: {
    loading: true,
    checkin: null,
    merchantText: '',
    quotaId: '',
    dateModified: false,
    editLogs: [],
  },

  onLoad(options) {
    this._id = options.id || '';
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    this.setData({ loading: true });
    try {
      const checkins = storage.getCheckins() || [];
      const raw = checkins.find(c => (c.localId || String(c.id)) === this._id);
      if (!raw) {
        wx.showToast({ title: '记录不存在', icon: 'none' });
        this.setData({ loading: false });
        return;
      }
      const c = util.normalizeCheckin(raw);
      const quotas = (storage.getQuotas() || []).map(util.normalizeQuota);
      const q = quotas.find(q => String(q.localId) === String(c.quotaId))
        || (c.quotaId && quotas.find(q => String(q.id) === String(c.quotaId)));
      const merchantText = (q && q.merchant) || c.merchant || '手动记录';
      const dateModified = !!(c.dateEditLogs && c.dateEditLogs.length);
      const editLogs = (c.dateEditLogs || []).map(l => (l.from || '') + ' → ' + (l.to || ''));
      this.setData({
        loading: false,
        checkin: c,
        merchantText,
        quotaId: c.quotaId,
        dateModified,
        editLogs,
      });
    } catch (e) {
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  // 修改签到日期（限定今天前后 30 天，记录更改日志）
  changeDate() {
    const c = this.data.checkin;
    if (!c) return;
    const now = new Date();
    const d30 = (offset) => {
      const t = new Date(now);
      t.setDate(t.getDate() + offset);
      return util.formatDate(t);
    };
    wx.showModal({
      title: '修改签到日期',
      content: '',
      editable: true,
      placeholderText: '输入日期 YYYY-MM-DD（前后30天内）',
      success: async (res) => {
        if (!res.confirm || !res.content) return;
        const newDate = String(res.content).trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
          wx.showToast({ title: '日期格式应为 YYYY-MM-DD', icon: 'none' });
          return;
        }
        const diff = Math.round((new Date(newDate) - new Date(util.formatDate(now))) / 86400000);
        if (Math.abs(diff) > 30) {
          wx.showToast({ title: '只能在今天前后30天内修改', icon: 'none' });
          return;
        }
        try {
          const checkins = storage.getCheckins();
          const idx = checkins.findIndex(x => (x.localId || String(x.id)) === this._id);
          const oldDate = c.checkinDate;
          if (idx !== -1) {
            const logs = checkins[idx].dateEditLogs || [];
            logs.push({ from: oldDate, to: newDate, changedAt: new Date().toISOString() });
            checkins[idx].checkinDate = newDate;
            checkins[idx].dateEditLogs = logs;
            checkins[idx].updatedAt = Date.now();
            storage.setCheckins(checkins);
          }
          if (c.id) {
            await app.callApi('/api/checkins/' + c.id + '/date', 'PUT', { checkinDate: newDate }).catch(() => {});
          }
          wx.showToast({ title: '日期已修改', icon: 'success' });
          this.loadData();
        } catch (err) {
          wx.showToast({ title: err.message || '修改失败', icon: 'none' });
        }
      },
    });
  },

  // 撤销签到（次数返还）
  revoke() {
    const c = this.data.checkin;
    if (!c) return;
    wx.showModal({
      title: '撤销签到',
      content: '确定撤销本次签到？次数将返还。',
      confirmColor: '#e74c3c',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          const checkins = storage.getCheckins();
          const idx = checkins.findIndex(x => (x.localId || String(x.id)) === this._id);
          if (idx !== -1) {
            checkins[idx].isRevoked = true;
            checkins[idx].updatedAt = Date.now();
            storage.setCheckins(checkins);
          }
          if (c.quotaId) {
            const quotas = storage.getQuotas();
            const qIdx = quotas.findIndex(q => (q.localId || String(q.id)) === c.quotaId);
            if (qIdx !== -1) {
              quotas[qIdx].usedTimes = Math.max(0, (quotas[qIdx].usedTimes || 0) - c.deductTimes);
              quotas[qIdx].updatedAt = Date.now();
              storage.setQuotas(quotas);
            }
          }
          if (c.id) {
            app.callApi('/api/checkins/' + c.id + '/revoke', 'POST').catch(() => {});
          } else {
            app.callApi('/api/checkins', 'POST', { ...c, isRevoked: true }).catch(() => {});
          }
          wx.showToast({ title: '已撤销', icon: 'success' });
          setTimeout(() => wx.navigateBack(), 600);
        } catch (err) {
          wx.showToast({ title: err.message || '撤销失败', icon: 'none' });
        }
      },
    });
  },
});
