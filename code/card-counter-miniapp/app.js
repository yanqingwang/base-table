// app.js - 次卡管家 云开发版（5 Tab 完整版）
const storage = require('./utils/storage');
const syncManager = require('./utils/syncManager');
const config = require('./utils/config');

App({
  globalData: {
    env: config.env,                // 微信云托管环境 ID（按运行环境自动选择）
    service: config.service,        // 云托管服务名
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
        resourceAppid: config.resourceAppid, // 小程序 AppID
        resourceEnv: config.env,             // 云托管环境 ID
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
      const hasLocal = (storage.get(storage.keys.QUOTAS) || []).length > 0
        || (storage.get(storage.keys.CHECKINS) || []).length > 0
        || (storage.get(storage.keys.RATINGS) || []).length > 0;
      await syncManager.pull(this);
      // 若有本地数据未同步，推送
      if (hasLocal) {
        syncManager.push(this);
      }
    } catch (e) {
      console.error('启动同步失败（离线模式可用）:', e);
    }
  },

  /**
   * 打开/回到前台：自动拉取云端最新（保持一致性）
   */
  onShow() {
    this.autoSync('pull');
  },

  /**
   * 关闭/切后台：自动推送本地未同步数据（防止数据丢失）
   */
  onHide() {
    this.autoSync('push');
  },

  // 生命周期自动同步（幂等，isSyncing 防重入）
  autoSync(mode) {
    if (this.globalData.syncing) return;
    this.globalData.syncing = true;
    // 用「是否已完成」标志确保 finish 只生效一次：
    // 一旦 doSync 开始执行，syncing 锁的释放只由 doSync 的 finally 负责，
    // 8s 超时只在云一直未就绪（doSync 从未启动）时才兜底释放，避免提前释放造成并发重入。
    let finished = false;
    let started = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      this.globalData.syncing = false;
    };
    const doSync = async () => {
      try {
        if (!this.globalData.token) {
          await this.wechatLogin();
        }
        if (mode === 'push') {
          await syncManager.push(this);
        } else {
          await syncManager.pull(this);
        }
      } catch (e) {
        console.error('自动' + mode + '失败:', e);
      } finally {
        finish();
      }
    };
    // 等待云就绪后执行
    this.waitCloudReady().then(ready => {
      if (ready) { started = true; doSync(); }
      else finish();
    });
    // 8s 超时：仅当 doSync 始终未启动（云未就绪）时兜底释放锁；已启动则由 finally 释放
    setTimeout(() => { if (!started) finish(); }, 8000);
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
   * @param {number} retry 401 重登录已尝试次数（上限 1，避免 token 签发即失效导致无限重登录）
   */
  callApi(path, method = 'GET', data = {}, auth = true, retry = 0) {
    const header = { 'X-WX-SERVICE': this.globalData.service };
    if (auth && this.globalData.token) {
      header['Authorization'] = 'Bearer ' + this.globalData.token;
    }
    return new Promise((resolve, reject) => {
      const doCall = (cloudRetry) => {
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
                if (retry >= 1) {
                  reject(new Error('登录状态异常，请重新进入小程序'));
                  return;
                }
                this.wechatLogin().then(() => {
                  this.callApi(path, method, data, auth, retry + 1).then(resolve).catch(reject);
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
            if (cloudRetry < 3 && err.errMsg && err.errMsg.indexOf('Cloud API') !== -1) {
              setTimeout(() => doCall(cloudRetry + 1), 500);
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
   * 静默登录：无用户手势，不得调用 wx.getUserProfile（该接口必须由用户点击触发，
   * 且 2022-02 后新注册小程序已无法调用）。此处不强求头像昵称，先用默认值建号，
   * 资料完善交由「我的」页的官方按钮流程（open-type=chooseAvatar / nickname 输入框）处理。
   */
  loginByCode() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (loginRes) => {
          if (!loginRes.code) {
            reject(new Error('wx.login 未返回 code'));
            return;
          }
          // 静默登录不强求头像昵称，先用默认值建号
          this.callWxLogin(loginRes.code, '', '').then(resolve).catch(reject);
        },
        fail: (err) => reject(new Error(err.errMsg || 'wx.login 失败')),
      });
    });
  },

  /**
   * 调用后端 wx-login 接口完成登录
   */
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
