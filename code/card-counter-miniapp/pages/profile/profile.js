// pages/profile/profile.js - 个人中心
const app = getApp();
const storage = require('../../utils/storage');
const syncManager = require('../../utils/syncManager');
const learningPlan = require('../../utils/learningPlan');

Page({
  data: {
    userInfo: null,
    syncStatus: { lastSyncTime: 0, hasPendingSync: false },
    stats: { quotaCount: 0, checkinCount: 0, ratingCount: 0 },
    loginMethods: [],
    hasPassword: false,
    showBind: false,
    bindUsername: '',
    bindPassword: '',
    bindConfirm: '',
    loading: true,
    syncing: false,
    forceSyncing: false,
  },

  onShow() {
    if (!app.ensureLogin('/pages/profile/profile')) {
      return;
    }
    this.loadProfile();
  },

  async loadProfile() {
    this.setData({ loading: true });
    try {
      if (!app.globalData.token) {
        await app.wechatLogin();
      }
      const quotas = storage.getQuotas() || [];
      const checkins = storage.getCheckins() || [];
      const ratings = storage.getRatings() || [];
      const syncStatus = storage.getSyncStatus();
      // 拉取登录方式（微信 / 账号密码），用于展示「设置登录密码」入口
      let loginMethods = [];
      try {
        const me = await app.callApi('/api/auth/me', 'GET');
        loginMethods = me.loginMethods || [];
        if (me.nickname) {
          app.globalData.userInfo = { ...(app.globalData.userInfo || {}), nickname: me.nickname, avatar_url: me.avatarUrl };
        }
      } catch (e) {
        console.warn('获取登录方式失败:', e);
      }
      this.setData({
        userInfo: app.globalData.userInfo,
        loginMethods,
        hasPassword: loginMethods.includes('password'),
        syncStatus,
        syncText: this.fmtTime(syncStatus.lastSyncTime),
        stats: {
          quotaCount: quotas.length,
          checkinCount: checkins.length,
          ratingCount: ratings.length,
        },
        loading: false,
      });
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  fmtTime(ts) {
    if (!ts) return '从未同步';
    const d = new Date(ts);
    return '上次同步：' + (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  },

  async manualSync() {
    if (this.data.syncing) return;
    this.setData({ syncing: true });
    wx.showLoading({ title: '同步中...', mask: true });
    try {
      if (!app.globalData.token) {
        await app.wechatLogin();
      }
      // 先推送本地，再拉取
      await syncManager.push(app);
      const ok = await syncManager.pull(app);
      wx.hideLoading();
      if (ok) {
        wx.showToast({ title: '同步成功', icon: 'success' });
      } else {
        wx.showToast({ title: '同步失败', icon: 'none' });
      }
      this.loadProfile();
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: '同步失败', icon: 'none' });
    } finally {
      this.setData({ syncing: false });
    }
  },

  // 强制上传：忽略 _synced 标记全量推送本地数据到云端（用于重建服务器 / 找回历史数据）
  forceUpload() {
    if (this.data.syncing || this.data.forceSyncing) return;
    const total = this.data.stats.quotaCount + this.data.stats.checkinCount + this.data.stats.ratingCount;
    if (total === 0) {
      wx.showToast({ title: '本地暂无数据', icon: 'none' });
      return;
    }
    wx.showModal({
      title: '强制上传',
      content: `将本地全部 ${total} 条数据（含历史签到记录）全量覆盖上传到云端，确定？`,
      confirmColor: '#e67e22',
      success: async (res) => {
        if (!res.confirm) return;
        this.setData({ forceSyncing: true });
        wx.showLoading({ title: '上传中...', mask: true });
        try {
          if (!app.globalData.token) {
            await app.wechatLogin();
          }
          const n = await syncManager.push(app, true);
          wx.hideLoading();
          wx.showToast({ title: '已上传 ' + n + ' 条', icon: 'success' });
          this.loadProfile();
        } catch (e) {
          wx.hideLoading();
          wx.showToast({ title: '上传失败', icon: 'none' });
        } finally {
          this.setData({ forceSyncing: false });
        }
      },
    });
  },

  // 导出备份：写入本地文件并保存到系统文件（wx.saveFileToDisk）
  exportData() {
    const data = {
      quotas: storage.getQuotas() || [],
      checkins: storage.getCheckins() || [],
      ratings: storage.getRatings() || [],
      learningPlan: storage.getLearningPlan(),
      exportTime: new Date().toISOString(),
      version: '2.1.0',
    };
    const fs = wx.getFileSystemManager();
    const filePath = `${wx.env.USER_DATA_PATH}/cardcount_backup_${Date.now()}.json`;
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      // 导出方式：优先保存到系统文件（saveFileToDisk），失败则回退为分享到聊天（shareFileMessage）
      // 体验版/部分基础库 saveFileToDisk 会失败，需回退到分享，否则导出失败
      const fallbackShare = () => {
        if (wx.shareFileMessage) {
          wx.shareFileMessage({
            filePath,
            fileName: '次卡管家备份_' + Date.now() + '.json',
            success: () => wx.showToast({ title: '已导出到聊天', icon: 'none' }),
            fail: () => wx.showToast({ title: '导出失败', icon: 'none' }),
          });
        } else {
          wx.showToast({ title: '当前版本不支持导出', icon: 'none' });
        }
      };
      if (wx.saveFileToDisk) {
        wx.saveFileToDisk({
          filePath,
          success: () => wx.showToast({ title: '备份已保存', icon: 'success' }),
          fail: (err) => {
            if (err && err.errMsg && err.errMsg.indexOf('cancel') !== -1) return;
            fallbackShare();
          },
        });
      } else {
        fallbackShare();
      }
    } catch (e) {
      wx.showToast({ title: '导出失败: ' + e.message, icon: 'none' });
    }
  },

  // 导入备份：从聊天会话中选择备份文件（微信小程序唯一文件选择入口）
  importData() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      success: (res) => {
        const filePath = res.tempFiles[0].path;
        const fs = wx.getFileSystemManager();
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const imported = JSON.parse(content);
          if (!imported.quotas && !imported.checkins) {
            wx.showToast({ title: '文件格式不正确', icon: 'none' });
            return;
          }
          wx.showModal({
            title: '确认导入',
            content: `将导入 ${(imported.quotas || []).length} 条配额、${(imported.checkins || []).length} 条签到记录，是否覆盖当前数据？`,
            success: (modalRes) => {
              if (modalRes.confirm) {
                storage.setQuotas(imported.quotas || []);
                storage.setCheckins(imported.checkins || []);
                storage.setRatings(imported.ratings || []);
                wx.showToast({ title: '导入成功', icon: 'success' });
                this.loadProfile();
              }
            },
          });
        } catch (e) {
          wx.showToast({ title: '解析失败', icon: 'none' });
        }
      },
    });
  },

  // 清除本地数据（云端保留）
  clearAllData() {
    wx.showModal({
      title: '清除本地数据',
      content: '将删除本地所有数据（云端数据保留），确定？',
      confirmColor: '#e74c3c',
      success: (res) => {
        if (res.confirm) {
          storage.clearAll();
          wx.showToast({ title: '已清除', icon: 'success' });
          this.loadProfile();
        }
      },
    });
  },

  // 重置全部数据（本地 + 云端）：清空业务数据并删除同步记录（_synced / syncStatus）
  resetAllData() {
    wx.showModal({
      title: '重置全部数据',
      content: '将清空本机与云端的所有次卡、签到、评价数据，并删除同步记录。此操作不可恢复，确定？',
      confirmColor: '#e74c3c',
      success: async (res) => {
        if (!res.confirm) return;
        wx.showLoading({ title: '重置中...', mask: true });
        try {
          if (!app.globalData.token) {
            await app.wechatLogin();
          }
          // 1. 云端清空（失败也继续清本地）
          try {
            await app.callApi('/api/reset', 'POST');
          } catch (e) {
            console.warn('云端重置失败，仅清除本地:', e);
          }
          // 2. 清空本地数据 + 同步记录（_synced 标记随数据清除，syncStatus 一并清除）
          storage.clearAll();
          try { wx.removeStorageSync('pendingCheckinQuota'); } catch (e) {}
          wx.hideLoading();
          wx.showToast({ title: '已重置', icon: 'success' });
          this.loadProfile();
        } catch (e) {
          wx.hideLoading();
          wx.showToast({ title: '重置失败', icon: 'none' });
        }
      },
    });
  },

  // 我的卡包
  goCardList() {
    wx.navigateTo({ url: '/pages/card/list/list' });
  },

  // 我是商户
  goMerchant() {
    wx.navigateTo({ url: '/pages/merchant/index/index' });
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '退出登录',
      content: '确定退出当前账号？',
      confirmColor: '#e74c3c',
      success: (res) => {
        if (res.confirm) {
          app.globalData.token = '';
          app.globalData.userInfo = null;
          storage.set(storage.keys.TOKEN, '');
          storage.set(storage.keys.USER_INFO, null);
          wx.reLaunch({ url: '/pages/login/login' });
        }
      },
    });
  },

  // 编辑资料：选择头像（官方 chooseAvatar 方案，转 base64 存储）
  onChooseAvatar(e) {
    const avatarUrl = e.detail.avatarUrl;
    if (!avatarUrl) return;
    wx.getFileSystemManager().readFile({
      filePath: avatarUrl,
      encoding: 'base64',
      success: (res) => {
        const base64 = 'data:image/jpeg;base64,' + res.data;
        this.setData({ avatarUrl: base64, showEdit: true });
      },
      fail: () => {
        // 读取失败则用临时路径预览
        this.setData({ avatarUrl, showEdit: true });
      },
    });
  },

  // 编辑资料：输入昵称（官方 nickname 输入框）
  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value });
  },

  // 打开编辑资料弹窗
  openEdit() {
    const ui = app.globalData.userInfo || {};
    this.setData({
      showEdit: true,
      nickname: ui.nickname || '',
      avatarUrl: ui.avatar_url || '',
    });
  },

  closeEdit() {
    this.setData({ showEdit: false });
  },

  // 保存资料到后端
  async saveProfile() {
    const { nickname, avatarUrl } = this.data;
    try {
      await app.callApi('/api/auth/profile', 'PUT', {
        nickname: nickname || '',
        avatarUrl: avatarUrl || '',
      });
      // 更新本地
      const userInfo = { ...(app.globalData.userInfo || {}), nickname: nickname || '', avatar_url: avatarUrl || '' };
      app.globalData.userInfo = userInfo;
      storage.set(storage.keys.USER_INFO, userInfo);
      this.setData({ showEdit: false });
      this.loadProfile();
      wx.showToast({ title: '已保存', icon: 'success' });
    } catch (e) {
      wx.showToast({ title: e.message || '保存失败', icon: 'none' });
    }
  },

  onPullDownRefresh() {
    this.loadProfile().then(() => wx.stopPullDownRefresh());
  },

  // 打开「设置登录密码」弹窗（微信用户绑定账号密码，使两种登录归一）
  openBindAccount() {
    this.setData({
      showBind: true,
      bindUsername: '',
      bindPassword: '',
      bindConfirm: '',
    });
  },

  closeBind() {
    this.setData({ showBind: false });
  },

  onBindUsername(e) { this.setData({ bindUsername: e.detail.value }); },
  onBindPassword(e) { this.setData({ bindPassword: e.detail.value }); },
  onBindConfirm(e) { this.setData({ bindConfirm: e.detail.value }); },

  // 设置/绑定账号密码
  async bindAccount() {
    const { bindUsername, bindPassword, bindConfirm } = this.data;
    const username = (bindUsername || '').trim();
    if (username.length < 3) { wx.showToast({ title: '用户名至少3个字符', icon: 'none' }); return; }
    if ((bindPassword || '').length < 6) { wx.showToast({ title: '密码至少6个字符', icon: 'none' }); return; }
    if (bindPassword !== bindConfirm) { wx.showToast({ title: '两次密码不一致', icon: 'none' }); return; }
    wx.showLoading({ title: '设置中...', mask: true });
    try {
      const data = await app.callApi('/api/auth/bind-account', 'POST', {
        username, password: bindPassword, confirm: bindConfirm,
      });
      wx.hideLoading();
      this.setData({ showBind: false, hasPassword: (data.loginMethods || []).includes('password') });
      this.loadProfile();
      wx.showToast({ title: '已设置，现也可用账号登录', icon: 'success' });
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: e.message || '设置失败', icon: 'none' });
    }
  },

  // 注销账号：删除全部数据 + 账号本身（用于清理孤儿账号，释放 openid）
  deleteAccount() {
    wx.showModal({
      title: '注销账号',
      content: '将删除全部次卡/签到数据且不可恢复，确定注销？',
      confirmColor: '#e74c3c',
      success: async (res) => {
        if (!res.confirm) return;
        wx.showLoading({ title: '注销中...', mask: true });
        try {
          await app.callApi('/api/auth/delete-account', 'POST');
          wx.hideLoading();
          app.globalData.token = '';
          app.globalData.userInfo = null;
          storage.set(storage.keys.TOKEN, '');
          storage.set(storage.keys.USER_INFO, null);
          wx.reLaunch({ url: '/pages/login/login' });
        } catch (e) {
          wx.hideLoading();
          wx.showToast({ title: e.message || '注销失败', icon: 'none' });
        }
      },
    });
  },
});
