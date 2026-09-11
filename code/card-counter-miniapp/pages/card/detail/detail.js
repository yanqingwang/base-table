// pages/card/detail/detail.js - 卡详情（聚合单端点）+ 动态核销码（防截图重放）
const app = getApp();

const STATUS_TEXT = {
  unclaimed: '待领取',
  active: '可用',
  used_up: '已用完',
  expired: '已过期',
  voided: '已作废',
  refunded: '已退款',
};

// 合规徽标文案：对客展示，只反映商户「已提交的资料状态」，
// 不做「已合规 / 已备案」这类过度承诺（真实备案与存管以监管口径为准）。
const BADGE_TEXT = {
  verified: '合规资料已核验',
  partial: '合规资料准备中',
  none: '',
};

function fmtMs(ms) {
  if (!ms) return '';
  const d = new Date(ms);
  const p = (n) => (n < 10 ? '0' + n : '' + n);
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
    ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}

/** 分 → 元，保留两位（避免 wxml 里做除法出现 ¥12.5.00 这类脏格式）。 */
function yuan(cents) {
  const n = Number(cents || 0);
  return (n / 100).toFixed(2);
}

Page({
  data: {
    id: 0,
    card: null,
    token: '',
    remainSec: 0,
    loading: true,
    // 聚合端点 /api/cards/<id>/customer-detail 的结果
    refund: null,        // {refundCents, refundable, rule, reason, maxRefundCents}
    refundYuan: '0.00',  // 已格式化的可退金额（元）
    refundRule: '',      // 退费规则明文（卡种配置）
    badge: '',           // 合规徽标文案（空则不展示）
    merchantName: '',
    legalName: '',
    templateName: '',
    voucher: null,       // {redemptionCount, totalDeductTimes, lastRedeemedAt, redemptions:[]}
    useVoucher: false,   // 聚合端点可用才为 true
    checkins: [],        // 兜底：老后端无聚合端点时用 /api/checkins
    voucherOpen: false,
  },

  onLoad(query) {
    this.setData({ id: parseInt(query.id) || 0 });
  },

  onShow() {
    // ensureLogin 已改为非阻塞（登录可选）；核心次卡管理可不登录使用
    this.refreshToken();
    this.loadAll();
  },

  /** 优先消费聚合单端点；失败则回退旧的多段式调用，任何后端版本下页面都可用。 */
  async loadAll() {
    if (!this.data.id) return;
    this.setData({ loading: true });
    try {
      const d = await app.callApi('/api/cards/' + this.data.id + '/customer-detail', 'GET');
      const m = d.merchant || {};
      const v = d.voucher || null;
      if (v && v.redemptions) {
        v.redemptions = v.redemptions.map((r) => ({
          id: r.id,
          deductTimes: r.deductTimes,
          staffName: r.staffName || '门店',
          when: fmtMs(r.redeemedAt),
        }));
        v.lastWhen = fmtMs(v.lastRedeemedAt);
      }
      this.setData({
        card: this.decorateCard(d.card),
        loading: false,
        refund: d.refundEstimate || null,
        refundYuan: yuan((d.refundEstimate || {}).refundCents),
        refundRule: d.refundRule || '',
        badge: BADGE_TEXT[m.complianceBadge] || '',
        merchantName: m.merchantName || '',
        legalName: m.legalName || '',
        templateName: d.templateName || '',
        voucher: v,
        useVoucher: true,
      });
    } catch (e) {
      // 后端未部署聚合端点（404）或网络异常 → 回退，不阻塞详情页
      this.setData({ useVoucher: false });
      this.loadCardFallback();
      this.loadRefund();
      this.loadCheckins();
    }
  },

  decorateCard(card) {
    if (!card) return null;
    const c = Object.assign({}, card);
    c.remaining = (typeof c.remaining === 'number')
      ? c.remaining
      : Math.max(0, (c.totalTimes || 0) - (c.usedTimes || 0) - (c.heldTimes || 0));
    c.statusText = STATUS_TEXT[c.status] || c.status;
    return c;
  },

  /** 兜底路径：老后端只提供 /api/cards 列表。 */
  async loadCardFallback() {
    try {
      const cards = await app.callApi('/api/cards', 'GET');
      const card = (cards || []).find((c) => c.id === this.data.id);
      this.setData({ card: this.decorateCard(card) || null, loading: false });
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  async loadRefund() {
    if (!this.data.id) return;
    try {
      const refund = await app.callApi('/api/cards/' + this.data.id + '/refund-estimate', 'GET');
      this.setData({ refund, refundYuan: yuan((refund || {}).refundCents) });
    } catch (e) {
      // 非关键信息，失败不阻塞详情页
    }
  },

  async loadCheckins() {
    if (!this.data.id) return;
    try {
      const list = await app.callApi('/api/checkins', 'GET') || [];
      const items = (list || [])
        .filter((c) => !c.isRevoked)
        .sort((a, b) => (b.checkinDate || '').localeCompare(a.checkinDate || ''))
        .slice(0, 20)
        .map((c) => ({
          id: c.id,
          staffName: c.merchant || '手动记录',
          when: [c.checkinDate || '', c.checkinTime || ''].join(' ').trim(),
          deductTimes: c.deductTimes || 1,
          note: c.note || '',
        }));
      this.setData({ checkins: items });
    } catch (e) {
      // 非关键信息，失败不阻塞详情页
    }
  },

  openVoucher() { this.setData({ voucherOpen: true }); },
  closeVoucher() { this.setData({ voucherOpen: false }); },
  noop() {},   // 浮层内部点击不冒泡到遮罩

  /** 凭证复制为文本，便于在微信内转发给商户/客服（本地可查的消费记录）。 */
  shareVoucher() {
    const v = this.data.voucher;
    if (!v) return;
    const lines = [
      '消费凭证 · 次卡 #' + this.data.id,
      '商户：' + (this.data.merchantName || '—'),
      '卡种：' + (this.data.templateName || '—'),
      '核销笔数：' + (v.redemptionCount || 0) + ' 笔，合计扣次 ' + (v.totalDeductTimes || 0),
      '最近核销：' + (v.lastWhen || '—'),
    ];
    (v.redemptions || []).forEach((r, i) => {
      lines.push((i + 1) + '. ' + (r.when || '') + '  ' + r.staffName + '  -' + r.deductTimes + ' 次');
    });
    wx.setClipboardData({
      data: lines.join('\n'),
      success: () => wx.showToast({ title: '凭证已复制，可粘贴转发', icon: 'none' }),
    });
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
    Promise.all([this.loadAll(), this.refreshToken()]).then(() => wx.stopPullDownRefresh());
  },

  onHide() { this.stopTimer(); },
  onUnload() { this.stopTimer(); },
});
