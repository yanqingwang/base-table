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
      defaultDeduct: '1',
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
          defaultDeduct: nq.defaultDeduct ? String(nq.defaultDeduct) : '1',
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
      const dd = parseInt(form.defaultDeduct, 10);
      const defaultDeduct = isNaN(dd) ? 1 : Math.max(0, dd); // 最小为 0，空值回退默认 1
      const payload = {
        merchant: form.merchant.trim(),
        item: form.item.trim(),
        amount: form.amount ? parseFloat(form.amount) : 0,
        totalTimes: parseInt(form.totalTimes),
        defaultDeduct,
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
            defaultDeduct: payload.defaultDeduct,
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
          defaultDeduct: payload.defaultDeduct,
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
    const quotas = storage.getQuotas() || [];
    const q = quotas.find(x => (x.localId || String(x.id)) === String(id));
    // 收集该次卡关联的本地签到（按 quotaId 匹配 localId 或 id），用于提示与级联删除
    const ids = new Set();
    if (q) {
      if (q.localId) ids.add(String(q.localId));
      if (q.id) ids.add(String(q.id));
    } else {
      ids.add(String(id));
    }
    const checkins = storage.getCheckins() || [];
    const relatedCount = checkins.filter(c => ids.has(String(c.quotaId || '')) && !c.isRevoked).length;
    let content = '确定删除这张次卡吗？删除后将从云端移除。';
    if (relatedCount > 0) {
      content = `确定删除这张次卡吗？该次卡下还有 ${relatedCount} 条签到记录，将一并删除且不可恢复。`;
    }
    wx.showModal({
      title: '删除次卡',
      content,
      confirmColor: '#e74c3c',
      success: async (res) => {
        if (res.confirm) {
          try {
            const filtered = quotas.filter(x => (x.localId || String(x.id)) !== String(id));
            storage.setQuotas(filtered);
            // 级联删除本地签到记录，保持与云端一致，避免孤儿签到
            storage.setCheckins(checkins.filter(c => !ids.has(String(c.quotaId || ''))));
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
