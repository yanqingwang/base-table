App({
  onLaunch() {
    // 小程序启动时检查云开发环境
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'cardcount-d4gjfjexz3097d803',
        traceUser: true,
      });
    }
  },
});
