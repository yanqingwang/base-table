// pages/checkin/checkin.js - 签到消费
const app = getApp();
const storage = require('../../utils/storage');
const syncManager = require('../../utils/syncManager');
const learningPlan = require('../../utils/learningPlan');
const util = require('../../utils/util');

Page({
  data: {
    quotas: [],
    selectedId: '',
    selectedQuota: null,
    deductTimes: 1,
    merchant: '',
    note: '',
    checkinTime: '',
    checkinDate: '',
    dateStart: '',
    dateEnd: '',
    todayCheckins: [],
    filteredCheckins: [],
    recordTitle: '📋 今天签到记录',
    timeFilter: 'today', // today | month | all
    sortBy: 'time', // time | quota
    loading: true,
  },

  // ══ 时间筛选 + 排序 ══
  applyFilter() {
    const raw = this._rawCheckins || [];
    const now = new Date();
    const today = util.formatDate(now);
    const m = new Date(now);
    m.setDate(m.getDate() - 30);
    const monthAgo = util.formatDate(m);
    const quotas = this.data.quotas || [];
    const merchantOf = (c) => {
      const q = quotas.find(q => String(q.localId) === String(c.quotaId));
      return q ? q.merchant : (c.merchant || '');
    };
    let list = raw.slice();
    if (this.data.timeFilter === 'today') list = list.filter(c => c.checkinDate === today);
    else if (this.data.timeFilter === 'month') list = list.filter(c => (c.checkinDate || '') >= monthAgo);
    // 'all' 不做日期过滤
    if (this.data.sortBy === 'time') {
      list.sort((a, b) => (b.checkinDate || '').localeCompare(a.checkinDate || '') || (b.checkinTime || '').localeCompare(a.checkinTime || ''));
    } else {
      list.sort((a, b) => merchantOf(a).localeCompare(merchantOf(b)) || (b.checkinDate || '').localeCompare(a.checkinDate || '') || (b.checkinTime || '').localeCompare(a.checkinTime || ''));
    }
    const labels = { today: '今天', month: '最近一月', all: '全部' };
    list.forEach(c => { c.merchantText = merchantOf(c) || '手动记录'; });
    this.setData({
      filteredCheckins: list,
      recordTitle: `📋 ${labels[this.data.timeFilter]}签到记录（${list.length}）`,
    });
  },

  onTimeFilter(e) {
    this.setData({ timeFilter: e.currentTarget.dataset.f }, () => this.applyFilter());
  },

  onSortBy(e) {
    this.setData({ sortBy: e.currentTarget.dataset.s }, () => this.applyFilter());
  },

  onShow() {
    if (!app.ensureLogin('/pages/checkin/checkin')) {
      return;
    }
    // 检查是否有从列表页跳转过来的待签到配额
    const pendingId = wx.getStorageSync('pendingCheckinQuota');
    if (pendingId) {
      this.setData({ selectedId: pendingId });
      wx.removeStorageSync('pendingCheckinQuota');
    }
    this.loadData();
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      // 每次进入签到页先同步云端，确保次卡和签到记录最新
      if (!app.globalData.token) {
        await app.wechatLogin();
      }
      await syncManager.pull(app);
      const quotas = storage.getQuotas() || [];
      const checkins = storage.getCheckins() || [];

      const normalizedQuotas = (quotas || []).map(util.normalizeQuota);
      // 只显示进行中的
      const activeQuotas = normalizedQuotas.filter(q => learningPlan.getStatus(q) === '进行中');
      activeQuotas.forEach(q => { q.remain = (q.totalTimes || 0) - (q.usedTimes || 0); });

      const now = new Date();
      const timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
      const todayStr = util.formatDate(now);

      // 日期范围：今天前后 30 天（用于新建签到的日期选择）
      const d30 = (offset) => {
        const t = new Date(now);
        t.setDate(t.getDate() + offset);
        return util.formatDate(t);
      };

      // 全量签到记录（未撤销），供时间筛选 + 排序使用
      this._rawCheckins = (checkins || []).map(util.normalizeCheckin).filter(c => !c.isRevoked);

      this.setData({
        quotas: activeQuotas,
        checkinTime: timeStr,
        checkinDate: this.data.checkinDate || todayStr,
        dateStart: d30(-30),
        dateEnd: d30(30),
        loading: false,
      });
      this.applyFilter();

      // 若有默认选中
      const selectedId = this.data.selectedId;
      if (selectedId) {
        const q = activeQuotas.find(x => String(x.localId) === String(selectedId));
        if (q) {
          this.setData({ selectedQuota: q, merchant: q.merchant || '' });
        }
      }
    } catch (e) {
      this.setData({ loading: false });
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
    }
  },

  onDateChange(e) {
    this.setData({ checkinDate: e.detail.value }, () => this.loadData());
  },

  onSelectQuota(e) {
    const id = e.currentTarget.dataset.id;
    const q = this.data.quotas.find(x => String(x.localId) === String(id));
    this.setData({ selectedId: id, selectedQuota: q, merchant: q ? q.merchant : '' });
  },

  onDeductChange(e) {
    this.setData({ deductTimes: parseInt(e.detail.value) || 1 });
  },

  onMerchantInput(e) {
    this.setData({ merchant: e.detail.value });
  },

  onNoteInput(e) {
    this.setData({ note: e.detail.value });
  },

  async doCheckin() {
    const { selectedId, selectedQuota, deductTimes, merchant, checkinTime, note } = this.data;
    if (!selectedId && !merchant) {
      wx.showToast({ title: '请选择次卡或填写商户', icon: 'none' });
      return;
    }
    if (selectedQuota) {
      const remain = (selectedQuota.totalTimes || 0) - (selectedQuota.usedTimes || 0);
      if (remain < deductTimes) {
        wx.showToast({ title: '剩余次数不足', icon: 'none' });
        return;
      }
    }
    wx.showModal({
      title: '确认签到',
      content: (selectedQuota ? selectedQuota.merchant + ' ' : '') + '扣减 ' + deductTimes + ' 次？',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          const dateStr = this.data.checkinDate || util.formatDate(new Date());
          const localId = storage.generateId('checkin');

          // 1. 更新本地配额
          if (selectedQuota) {
            const quotas = storage.getQuotas();
            const idx = quotas.findIndex(q => (q.localId || String(q.id)) === selectedId);
            if (idx !== -1) {
              quotas[idx].usedTimes = (quotas[idx].usedTimes || 0) + deductTimes;
              quotas[idx].updatedAt = Date.now();
              storage.setQuotas(quotas);
            }
          }

          // 2. 新增本地签到记录
          const checkins = storage.getCheckins();
          checkins.push({
            localId,
            quotaId: selectedId || '',
            merchant: merchant || (selectedQuota ? selectedQuota.merchant : ''),
            deductTimes,
            checkinDate: dateStr,
            checkinTime,
            note: note || '',
            isRevoked: false,
            updatedAt: Date.now(),
            _synced: false,
          });
          storage.setCheckins(checkins);

          // 3. 异步推送到云端
          app.callApi('/api/checkins', 'POST', {
            localId,
            quotaId: selectedId || '',
            merchant: merchant || (selectedQuota ? selectedQuota.merchant : ''),
            deductTimes,
            checkinDate: dateStr,
            checkinTime,
            note: note || '',
            isRevoked: false,
          }).then(() => {
            // 标记已同步，避免重复推送
            const list = storage.getCheckins();
            const idx = list.findIndex(x => x.localId === localId);
            if (idx !== -1) {
              list[idx]._synced = true;
              storage.setCheckins(list);
            }
            // 更新配额 usedTimes 到云端
            if (selectedQuota) {
              app.callApi('/api/quotas/' + (selectedQuota.id || ''), 'PUT', {
                usedTimes: (selectedQuota.usedTimes || 0) + deductTimes,
              }).catch(() => {});
            }
          }).catch(() => {
            storage.setSyncStatus({ ...storage.getSyncStatus(), hasPendingSync: true });
          });

          wx.showToast({ title: '签到成功', icon: 'success' });
          this.loadData();
        } catch (e) {
          wx.showToast({ title: e.message || '签到失败', icon: 'none' });
        }
      },
    });
  },

  async revokeCheckin(e) {
    const id = e.currentTarget.dataset.id;
    const ci = this.data.filteredCheckins.find(c => c.localId === id);
    if (!ci) return;
    wx.showModal({
      title: '撤销签到',
      content: '确定撤销本次签到？次数将返还。',
      confirmColor: '#e74c3c',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          // 1. 本地标记撤销
          const checkins = storage.getCheckins();
          const idx = checkins.findIndex(c => (c.localId || String(c.id)) === id);
          if (idx !== -1) {
            checkins[idx].isRevoked = true;
            checkins[idx].updatedAt = Date.now();
            storage.setCheckins(checkins);
          }
          // 2. 返还配额次数
          if (ci.quotaId) {
            const quotas = storage.getQuotas();
            const qIdx = quotas.findIndex(q => (q.localId || String(q.id)) === ci.quotaId);
            if (qIdx !== -1) {
              quotas[qIdx].usedTimes = Math.max(0, (quotas[qIdx].usedTimes || 0) - ci.deductTimes);
              quotas[qIdx].updatedAt = Date.now();
              storage.setQuotas(quotas);
            }
          }
          // 3. 云端撤销
          if (ci.id) {
            app.callApi('/api/checkins/' + ci.id + '/revoke', 'POST').catch(() => {});
          } else {
            app.callApi('/api/checkins', 'POST', {
              ...ci,
              isRevoked: true,
            }).catch(() => {});
          }
          wx.showToast({ title: '已撤销', icon: 'success' });
          this.loadData();
        } catch (err) {
          wx.showToast({ title: err.message || '撤销失败', icon: 'none' });
        }
      },
    });
  },

  // 修改签到日期（限定今天前后 30 天，记录更改日志）
  changeCheckinDate(e) {
    const id = e.currentTarget.dataset.id;
    const ci = this.data.filteredCheckins.find(c => c.localId === id);
    if (!ci) return;
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
          const idx = checkins.findIndex(c => (c.localId || String(c.id)) === id);
          const oldDate = ci.checkinDate;
          if (idx !== -1) {
            const logs = checkins[idx].dateEditLogs || [];
            logs.push({ from: oldDate, to: newDate, changedAt: new Date().toISOString() });
            checkins[idx].checkinDate = newDate;
            checkins[idx].dateEditLogs = logs;
            checkins[idx].updatedAt = Date.now();
            storage.setCheckins(checkins);
          }
          if (ci.id) {
            await app.callApi('/api/checkins/' + ci.id + '/date', 'PUT', { checkinDate: newDate }).catch(() => {});
          }
          wx.showToast({ title: '日期已修改', icon: 'success' });
          this.loadData();
        } catch (err) {
          wx.showToast({ title: err.message || '修改失败', icon: 'none' });
        }
      },
    });
  },

  goAddQuota() {
    wx.navigateTo({ url: '/pages/quota/quota' });
  },

  goHistory() {
    wx.navigateTo({ url: '/pages/checkin/history/history' });
  },

  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh());
  },
});
