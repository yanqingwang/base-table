// app.js - 次卡管家 云开发版（5 Tab 完整版）
const storage = require('./utils/storage');
const syncManager = require('./utils/syncManager');

App({
  globalData: {
    env: 'prod-d5gm4a2q00a7f9209', // 微信云托管环境 ID
    service: 'flask-z9hh',          // 云托管服务名
    token: '',
    userInfo: null,
    cloud: null,                    // wx.cloud.Cloud 实例
    cloudReady: false,              // 是否初始化完成
  },

  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      // 用 Cloud 实例 + resourceAppid/resourceEnv，await init 完成后才能 callContainer
      const cloud = new wx.cloud.Cloud({
        resourceAppid: 'wx9c5974ab24d057c3', // 小程序 AppID
        resourceEnv: 'prod-d5gm4a2q00a7f9209', // 云托管环境 ID
      });
      this.globalData.cloud = cloud;
      this.initCloud(cloud);
    }
    // 读取本地 token
    const token = storage.get(storage.keys.TOKEN);
    if (token) {
      this.globalData.token = token;
    }
    this.globalData.userInfo = storage.get(storage.keys.USER_INFO);

    // 启动后静默登录 + 拉取云端
    this.bootstrap();
  },

  /**
   * 异步初始化云托管（init 完成后设置 cloudReady）
   */
  async initCloud(cloud) {
    try {
      await cloud.init();
      this.globalData.cloudReady = true;
    } catch (e) {
      console.error('云托管初始化失败:', e);
      this.globalData.cloudReady = false;
    }
  },

  /**
   * 启动引导：登录 + 首次登录检查云端备份 + 同步
   */
  async bootstrap() {
    try {
      if (!this.globalData.token) {
        await this.wechatLogin();
      }
      // 清理旧版示例数据（example- 前缀），避免测试数据进入云端
      this.cleanupExampleData();
      // 拉取云端数据合并
      const hasLocal = storage.get(storage.keys.QUOTAS) && storage.get(storage.keys.QUOTAS).length > 0;
      await syncManager.pull(this);
      // 若有本地数据未同步，推送
      if (hasLocal) {
        syncManager.push(this);
      }
    } catch (e) {
      console.error('启动同步失败（离线模式可用）:', e);
    }
  },

  cleanupExampleData() {
    const isExample = (item) => item && item.localId && String(item.localId).indexOf('example-') === 0;
    const quotas = (storage.getQuotas() || []).filter(q => !isExample(q));
    const checkins = (storage.getCheckins() || []).filter(c => !isExample(c));
    const ratings = (storage.getRatings() || []).filter(r => !isExample(r));
    if (quotas.length !== (storage.getQuotas() || []).length
        || checkins.length !== (storage.getCheckins() || []).length
        || ratings.length !== (storage.getRatings() || []).length) {
      storage.setQuotas(quotas);
      storage.setCheckins(checkins);
      storage.setRatings(ratings);
    }
  },

  /**
   * 等待 Cloud 实例就绪（init 异步）
   */
  waitCloudReady(attempt = 0) {
    return new Promise((resolve) => {
      const check = () => {
        if (this.globalData.cloud && this.globalData.cloudReady) {
          resolve(true);
        } else if (attempt < 5) {
          setTimeout(() => {
            this.waitCloudReady(attempt + 1).then(resolve);
          }, 300);
        } else {
          resolve(false);
        }
      };
      check();
    });
  },

  /**
   * 调用云托管 Flask 后端
   */
  callApi(path, method = 'GET', data = {}, auth = true) {
    const header = { 'X-WX-SERVICE': this.globalData.service };
    if (auth && this.globalData.token) {
      header['Authorization'] = 'Bearer ' + this.globalData.token;
    }
    return new Promise((resolve, reject) => {
      const doCall = (retry) => {
        this.globalData.cloud.callContainer({
          config: { env: this.globalData.env },
          path,
          method,
          header,
          data,
          success: (res) => {
            const body = res.data;
            // 后端响应格式：{code: 0, data: ...} 或 {code: -1, errorMsg: "..."}
            if (body && body.code === 0) {
              resolve(body.data);
            } else if (body && body.code === -1) {
              if ((body.errorMsg === '未登录或登录已过期' || res.statusCode === 401) && auth) {
                this.wechatLogin().then(() => {
                  this.callApi(path, method, data, auth).then(resolve).catch(reject);
                }).catch(reject);
              } else {
                reject(new Error(body.errorMsg || '请求失败'));
              }
            } else {
              reject(new Error('请求失败: ' + res.statusCode));
            }
          },
          fail: (err) => {
            // Cloud API isn't enabled → init 未完成，重试
            if (retry < 3 && err.errMsg && err.errMsg.indexOf('Cloud API') !== -1) {
              setTimeout(() => doCall(retry + 1), 500);
            } else {
              reject(new Error(err.errMsg || '网络错误'));
            }
          },
        });
      };
      this.waitCloudReady().then(() => doCall(0));
    });
  },

  /**
   * 微信登录：优先 X-WX-OPENID 头，失败回退 wx.login + code2Session
   */
  wechatLogin() {
    return new Promise((resolve, reject) => {
      const doLogin = (retry) => {
        this.globalData.cloud.callContainer({
          config: { env: this.globalData.env },
          path: '/api/auth/wechat-login',
          method: 'GET',
          header: { 'X-WX-SERVICE': this.globalData.service },
          success: (res) => {
            const body = res.data;
            if (body && body.code === 0) {
              this.globalData.token = body.data.token;
              this.globalData.userInfo = body.data.user;
              storage.set(storage.keys.TOKEN, body.data.token);
              storage.set(storage.keys.USER_INFO, body.data.user);
              resolve(body.data);
            } else {
              this.loginByCode().then(resolve).catch(reject);
            }
          },
          fail: (err) => {
            if (retry < 3 && err.errMsg && err.errMsg.indexOf('Cloud API') !== -1) {
              setTimeout(() => doLogin(retry + 1), 500);
            } else {
              this.loginByCode().then(resolve).catch(reject);
            }
          },
        });
      };
      this.waitCloudReady().then(() => doLogin(0));
    });
  },

  /**
   * wx.login + code2Session 登录（不依赖云托管环境归属）
   */
  loginByCode() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (loginRes) => {
          if (!loginRes.code) {
            reject(new Error('wx.login 未返回 code'));
            return;
          }
          this.fetchUserProfile(loginRes.code).then(resolve).catch(reject);
        },
        fail: (err) => reject(new Error(err.errMsg || 'wx.login 失败')),
      });
    });
  },

  /**
   * 获取用户资料（昵称头像）后调用后端登录
   * 新版微信 getUserProfile 返回匿名信息，能获取到就用，否则用默认值
   */
  fetchUserProfile(code) {
    return new Promise((resolve, reject) => {
      let nickname = '';
      let avatarUrl = '';
      wx.getUserProfile({
        desc: '用于展示用户信息',
        success: (profileRes) => {
          const ui = profileRes.userInfo || {};
          nickname = ui.nickName || '';
          avatarUrl = ui.avatarUrl || '';
          // 过滤匿名值（新版微信返回"微信用户"+灰头像）
          if (nickname === '微信用户') nickname = '';
          this.callWxLogin(code, nickname, avatarUrl).then(resolve).catch(reject);
        },
        fail: () => {
          this.callWxLogin(code, nickname, avatarUrl).then(resolve).catch(reject);
        },
      });
    });
  },

  callWxLogin(code, nickname, avatarUrl) {
    return new Promise((resolve, reject) => {
      const doCall = (retry) => {
        this.globalData.cloud.callContainer({
          config: { env: this.globalData.env },
          path: '/api/auth/wx-login',
          method: 'POST',
          header: {
            'X-WX-SERVICE': this.globalData.service,
            'Content-Type': 'application/json',
          },
          data: { code, nickname, avatarUrl },
          success: (res) => {
            const body = res.data;
            if (body && body.code === 0) {
              this.globalData.token = body.data.token;
              this.globalData.userInfo = body.data.user;
              storage.set(storage.keys.TOKEN, body.data.token);
              storage.set(storage.keys.USER_INFO, body.data.user);
              resolve(body.data);
            } else {
              reject(new Error((body && body.errorMsg) || '登录失败'));
            }
          },
          fail: (err) => {
            if (retry < 3 && err.errMsg && err.errMsg.indexOf('Cloud API') !== -1) {
              setTimeout(() => doCall(retry + 1), 500);
            } else {
              reject(new Error(err.errMsg || '登录失败'));
            }
          },
        });
      };
      this.waitCloudReady().then(() => doCall(0));
    });
  },

  ensureLogin(redirect) {
    if (this.globalData.token) {
      return true;
    }
    const url = '/pages/login/login' + (redirect ? '?redirect=' + encodeURIComponent(redirect) : '');
    wx.navigateTo({ url });
    return false;
  },
});
