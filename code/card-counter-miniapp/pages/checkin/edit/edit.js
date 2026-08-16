// pages/checkin/edit/edit.js - 签到记录修改管理界面（改期 / 备注编辑 / 撤销）
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
    note: '',
    dateStart: '',
    dateEnd: '',
    deductTimes: 1,
    canSave: false,
  },

  onLoad(options) {
    this._id = (options && options.id) || '';
  },

  onShow() {
    this.loadData();
  },

  // 兼容多种 id 键（localId / local_id / id）匹配记录
  _matchId(x, id) {
    if (!x || !id) return false;
    const target = String(id);
    const lid = x.localId != null ? String(x.localId) : (x.local_id != null ? String(x.local_id) : '');
    if (lid && lid === target) return true;
    return x.id != null && String(x.id) === target;
  },

  loadData() {
    this.setData({ loading: true });
    try {
      const checkins = storage.getCheckins() || [];
      const raw = checkins.find(c => this._matchId(c, this._id));
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
      const now = new Date();
      const d30 = (offset) => {
        const t = new Date(now);
        t.setDate(t.getDate() + offset);
        return util.formatDate(t);
      };
      this._originalDate = c.checkinDate;
      this._originalNote = c.note || '';
      this.setData({
        loading: false,
        checkin: c,
        merchantText,
        quotaId: c.quotaId,
        dateModified,
        editLogs,
        note: c.note || '',
        dateStart: d30(-30),
        dateEnd: d30(30),
        deductTimes: (c.deductTimes != null ? c.deductTimes : (c.deduct_times != null ? c.deduct_times : 1)),
        canSave: false,
      });
    } catch (e) {
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  // 修改日期（picker 已限定前后 30 天）
  onDateChange(e) {
    const c = this.data.checkin;
    if (!c) return;
    const newDate = e.detail.value;
    if (!newDate) return;
    this.setData({ 'checkin.checkinDate': newDate, dateModified: true }, () => this._updateCanSave());
  },

  onNoteInput(e) {
    this.setData({ note: e.detail.value }, () => this._updateCanSave());
  },

  onDeductInput(e) {
    const v = parseInt(e.detail.value);
    this.setData({ deductTimes: (isNaN(v) || v < 0) ? 0 : v }, () => this._updateCanSave());
  },

  _updateCanSave() {
    const c = this.data.checkin;
    if (!c) return;
    const dateChanged = c.checkinDate !== this._originalDate;
    const noteChanged = this.data.note !== this._originalNote;
    const deductChanged = (this.data.deductTimes || 0) !== (c.deductTimes || 0);
    this.setData({ canSave: dateChanged || noteChanged || deductChanged });
  },

  // 保存备注 + 日期 + 扣减次数修改
  async saveChanges() {
    const c = this.data.checkin;
    if (!c) return;
    const dateChanged = c.checkinDate !== this._originalDate;
    const noteChanged = this.data.note !== this._originalNote;
    const deductChanged = (this.data.deductTimes || 0) !== (c.deductTimes || 0);
    if (!dateChanged && !noteChanged && !deductChanged) {
      wx.showToast({ title: '没有修改', icon: 'none' });
      return;
    }
    try {
      const checkins = storage.getCheckins();
      const idx = checkins.findIndex(x => this._matchId(x, this._id));
      if (idx === -1) {
        wx.showToast({ title: '记录不存在', icon: 'none' });
        return;
      }
      const record = checkins[idx];
      let synced = true;

      // 1. 日期修改：记录改期日志并推送 /date
      if (dateChanged) {
        const oldDate = record.checkinDate;
        const logs = record.dateEditLogs || [];
        logs.push({ from: oldDate, to: c.checkinDate, changedAt: new Date().toISOString() });
        record.checkinDate = c.checkinDate;
        record.dateEditLogs = logs;
        if (c.id) {
          try {
            await app.callApi('/api/checkins/' + c.id + '/date', 'PUT', { checkinDate: c.checkinDate });
          } catch (e) { synced = false; }
        }
      }

      // 2. 备注修改：推送 /api/checkins/<id>
      if (noteChanged) {
        record.note = this.data.note.trim();
        if (c.id) {
          try {
            await app.callApi('/api/checkins/' + c.id, 'PUT', { note: this.data.note.trim() });
          } catch (e) { synced = false; }
        }
      }

      // 3. 扣减次数修改：推送 /api/checkins/<id>（允许改为 0），服务端据签到重算配额已用次数
      if (deductChanged) {
        const newDeduct = this.data.deductTimes || 0;
        record.deductTimes = newDeduct;
        record._deductOriginal = c.deductTimes; // 供本地配额差值调整
        if (c.id) {
          try {
            await app.callApi('/api/checkins/' + c.id, 'PUT', { deductTimes: newDeduct });
          } catch (e) { synced = false; }
        }
        // 本地配额 usedTimes 同步调整差值
        if (c.quotaId) {
          const quotas = storage.getQuotas();
          const qIdx = quotas.findIndex(q => (q.localId || String(q.id)) === c.quotaId);
          if (qIdx !== -1) {
            const diff = newDeduct - (c.deductTimes || 0);
            quotas[qIdx].usedTimes = Math.max(0, (quotas[qIdx].usedTimes || 0) + diff);
            quotas[qIdx].updatedAt = Date.now();
            storage.setQuotas(quotas);
          }
        }
      }

      record.updatedAt = Date.now();
      if (!synced) record._synced = false; // 云端失败则待下次推送补齐
      storage.setCheckins(checkins);

      wx.showToast({ title: '已保存', icon: 'success' });
      this.loadData();
    } catch (err) {
      wx.showToast({ title: err.message || '保存失败', icon: 'none' });
    }
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
          const idx = checkins.findIndex(x => this._matchId(x, this._id));
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
