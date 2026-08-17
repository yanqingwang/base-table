// pages/merchant/index/index.js - 商户控制台（建商户 / 卡种 / 发卡 / 已发卡）
const app = getApp();
const config = require('../../utils/config.js');

Page({
  data: {
    merchants: [],
    current: null,        // 当前选中的商户 id
    role: '',
    templates: [],
    cards: [],
    showCreate: false,
    showIssue: false,
    createForm: { name: '', contactPhone: '' },
    issueTemplateId: '',
    issueTemplateName: '',
    lastIssueCode: '',
    loading: true,
  },

  onShow() {
    if (!app.ensureLogin('/pages/merchant/index/index')) return;
    this.loadMerchants();
  },

  async loadMerchants() {
    this.setData({ loading: true });
    try {
      const list = await app.callApi('/api/merchant/list', 'GET');
      if (list && list.length) {
        const cur = list[0];
        this.setData({
          merchants: list,
          current: cur.merchant.id,
          role: cur.role,
          loading: false,
        });
        await Promise.all([this.loadTemplates(), this.loadCards()]);
      } else {
        this.setData({ merchants: [], current: null, loading: false, showCreate: true });
      }
    } catch (e) {
      this.setData({ loading: false });
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
    }
  },

  async loadTemplates() {
    if (!this.data.current) return;
    try {
      const templates = await app.callApi('/api/merchant/templates?merchantId=' + this.data.current, 'GET');
      this.setData({ templates: templates || [], issueTemplateId: (templates && templates[0] && templates[0].id) || '' });
    } catch (e) { wx.showToast({ title: e.message || '加载卡种失败', icon: 'none' }); }
  },

  async loadCards() {
    if (!this.data.current) return;
    try {
      const cards = await app.callApi('/api/merchant/cards?merchantId=' + this.data.current, 'GET');
      this.setData({ cards: cards || [] });
    } catch (e) { wx.showToast({ title: e.message || '加载卡列表失败', icon: 'none' }); }
  },

  onNameInput(e) { this.setData({ 'createForm.name': e.detail.value }); },
  onPhoneInput(e) { this.setData({ 'createForm.contactPhone': e.detail.value }); },

  async createMerchant() {
    const name = (this.data.createForm.name || '').trim();
    if (!name) { wx.showToast({ title: '请输入商户名称', icon: 'none' }); return; }
    try {
      await app.callApi('/api/merchant/create', 'POST', { name, contactPhone: this.data.createForm.contactPhone });
      wx.showToast({ title: '商户已创建', icon: 'success' });
      this.setData({ showCreate: false, createForm: { name: '', contactPhone: '' } });
      this.loadMerchants();
    } catch (e) { wx.showToast({ title: e.message || '创建失败', icon: 'none' }); }
  },

  onTemplatePick(e) {
    const idx = e.detail.value;
    const tpl = this.data.templates[idx];
    if (tpl) this.setData({ issueTemplateId: tpl.id, issueTemplateName: tpl.name });
  },

  async issueCard() {
    if (!this.data.issueTemplateId) { wx.showToast({ title: '请选择卡种', icon: 'none' }); return; }
    try {
      const res = await app.callApi('/api/merchant/cards/issue?merchantId=' + this.data.current, 'POST', {
        templateId: this.data.issueTemplateId,
      });
      this.setData({ lastIssueCode: res.issueCode, showIssue: false });
      wx.showToast({ title: '已发卡', icon: 'success' });
      this.loadCards();
    } catch (e) { wx.showToast({ title: e.message || '发卡失败', icon: 'none' }); }
  },

  openIssue() { this.setData({ showIssue: true }); },
  closeIssue() { this.setData({ showIssue: false }); },
  noop() {},
  copyIssueCode() {
    if (!this.data.lastIssueCode) return;
    wx.setClipboardData({ data: this.data.lastIssueCode, success: () => wx.showToast({ title: '已复制领取码', icon: 'none' }) });
  },

  goRedeem() {
    wx.navigateTo({ url: '/pages/merchant/redeem/redeem?merchantId=' + this.data.current });
  },

  // 复制「电脑看板」链接：商户在手机复制，到电脑浏览器打开实时看板
  copyDashboardLink() {
    const token = app.globalData.token;
    if (!token || !this.data.current) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    const url = config.webBase + '/merchant/' + this.data.current + '?token=' + encodeURIComponent(token);
    wx.setClipboardData({
      data: url,
      success: () => wx.showModal({
        title: '看板链接已复制',
        content: '请在电脑浏览器粘贴打开，即可查看实时核销看板。链接含登录凭证，请勿外泄。',
        showCancel: false,
      }),
    });
  },

  onPullDownRefresh() {
    this.loadMerchants().then(() => wx.stopPullDownRefresh());
  },
});
