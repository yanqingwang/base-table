Page({
  data: {},
  onLoad() {
    // 页面加载时可执行初始化逻辑
  },
  onShareAppMessage() {
    return {
      title: '次卡管家 — 预充值消费管理',
      path: '/pages/index/index',
    };
  },
});
