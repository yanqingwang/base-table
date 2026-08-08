// pages/quota/quota.js - 新增/编辑配额（本地优先）
const app = getApp();
const storage = require('../../utils/storage');
const util = require('../../utils/util');

Page({
  data: {
    id: '',
    form: {
      merchant: '',
      item: '',
      amount: '',
      totalTimes: '',
      expireDate: '',
      note: '',
    },
    saving: false,
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ id: options.id, expireText: '不设期限' });
      wx.setNavigationBarTitle({ title: '编辑次卡' });
      this.loadQuota(options.id);
    } else {
      wx.setNavigationBarTitle({ title: '新增次卡' });
      this.setData({ expireText: '不设期限' });
    }
  },

  loadQuota(id) {
    const quotas = storage.getQuotas() || [];
    const q = quotas.find(x => (x.localId || String(x.id)) === String(id));
    if (q) {
      const nq = util.normalizeQuota(q);
      this.setData({
        form: {
          merchant: nq.merchant || '',
          item: nq.item || '',
          amount: nq.amount ? String(nq.amount) : '',
          totalTimes: nq.totalTimes ? String(nq.totalTimes) : '',
          expireDate: nq.expireDate || '',
          note: nq.note || '',
        },
        expireText: nq.expireDate || '不设期限',
      });
    }
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ ['form.' + field]: e.detail.value });
  },

  onDateChange(e) {
    this.setData({ 'form.expireDate': e.detail.value, expireText: e.detail.value || '不设期限' });
  },

  async save() {
    const { form, id } = this.data;
    if (!form.merchant.trim()) {
      wx.showToast({ title: '请输入商户名称', icon: 'none' });
      return;
    }
    if (!form.totalTimes || parseInt(form.totalTimes) <= 0) {
      wx.showToast({ title: '请输入有效次数', icon: 'none' });
      return;
    }
    this.setData({ saving: true });
    try {
      const quotas = storage.getQuotas() || [];
      const payload = {
        merchant: form.merchant.trim(),
        item: form.item.trim(),
        amount: form.amount ? parseFloat(form.amount) : 0,
        totalTimes: parseInt(form.totalTimes),
        expireDate: form.expireDate || '',
        note: form.note.trim(),
        updatedAt: Date.now(),
      };

      if (id) {
        // 编辑：更新本地
        const idx = quotas.findIndex(q => (q.localId || String(q.id)) === String(id));
        if (idx !== -1) {
          quotas[idx] = { ...quotas[idx], ...payload };
          quotas[idx]._synced = false;
          storage.setQuotas(quotas);
          // 云端同步
          app.callApi('/api/quotas/' + (quotas[idx].id || ''), 'PUT', {
            merchant: payload.merchant,
            item: payload.item,
            amount: payload.amount,
            totalTimes: payload.totalTimes,
            expireDate: payload.expireDate || undefined,
            note: payload.note,
          }).catch(() => storage.setSyncStatus({ ...storage.getSyncStatus(), hasPendingSync: true }));
        }
        wx.showToast({ title: '已保存' });
      } else {
        // 新增：本地生成 localId
        const localId = storage.generateId('quota');
        quotas.push({ localId, ...payload, usedTimes: 0, _synced: false });
        storage.setQuotas(quotas);
        // 云端同步
        app.callApi('/api/quotas', 'POST', {
          localId,
          merchant: payload.merchant,
          item: payload.item,
          amount: payload.amount,
          totalTimes: payload.totalTimes,
          expireDate: payload.expireDate || undefined,
          note: payload.note,
        }).catch(() => storage.setSyncStatus({ ...storage.getSyncStatus(), hasPendingSync: true }));
        wx.showToast({ title: '已添加' });
      }
      setTimeout(() => wx.navigateBack(), 800);
    } catch (e) {
      wx.showToast({ title: e.message || '保存失败', icon: 'none' });
    } finally {
      this.setData({ saving: false });
    }
  },

  async remove() {
    const { id } = this.data;
    if (!id) return;
    wx.showModal({
      title: '删除次卡',
      content: '确定删除这张次卡吗？相关记录将保留。',
      confirmColor: '#e74c3c',
      success: async (res) => {
        if (res.confirm) {
          try {
            const quotas = storage.getQuotas() || [];
            const q = quotas.find(x => (x.localId || String(x.id)) === String(id));
            const filtered = quotas.filter(x => (x.localId || String(x.id)) !== String(id));
            storage.setQuotas(filtered);
            if (q && q.id) {
              app.callApi('/api/quotas/' + q.id, 'DELETE').catch(() => {});
            }
            wx.showToast({ title: '已删除' });
            setTimeout(() => wx.navigateBack(), 800);
          } catch (e) {
            wx.showToast({ title: e.message || '删除失败', icon: 'none' });
          }
        }
      },
    });
  },
});
