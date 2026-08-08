# 次卡管家 / 微信云托管 / 小程序 工作日志

> 从 wk/memory/work.md 抽取的微信相关章节（2026-08-01 起）
> 后续微信/小程序开发记录统一维护在此文件

---

## 2026-08-01 Card-Counter 小程序云开发版改造记录

### 背景与根因
小程序（奶爸的那些事，AppID `wx9c5974ab24d057c3`）原本用 **web-view** 加载 Flask 云托管（`https://flask-z9hh-281177-5-1453124923.sh.run.tcloudbase.com/`），线上 1.0.1 无法访问该链接。
**根因**：web-view 的**业务域名必须 ICP 备案**，腾讯云托管共享域名（`*.tcloudbase.com`）无法备案，无法配置为业务域名。

### 解决方案：云开发模式（v2.0.0）
放弃 web-view，重写为**原生小程序 UI + `wx.cloud.callContainer` 调用 Flask 云托管**：
- `wx.cloud.callContainer` 免配置业务域名，微信自动注入 `X-WX-OPENID` 头识别用户
- Flask 后端 `/api/auth/wechat-login` 读取 `X-WX-OPENID` 自动登录（无需修改后端）

### 关键配置
| 项 | 值 |
|----|-----|
| 云托管环境 ID | `prod-d5gm4a2q00a7f9209` |
| 云托管服务名 | `flask-z9hh` |
| Flask 公网地址 | `https://flask-z9hh-281177-5-1453124923.sh.run.tcloudbase.com/` |
| 调用方式 | `wx.cloud.callContainer({config:{env}, path, header:{'X-WX-SERVICE':'flask-z9hh'}, ...})` |
| 请求域名白名单 | request: `https://card-counter.8.130.118.200.sslip.io` |
| 代码上传 IP 白名单 | `5.226.50.86`、`103.190.179.55`、`117.185.175.253` |
| 代码上传密钥 | private.key（本机 `/home/wang/wk/code/card-counter-miniapp/private.key`） |

### 小程序代码结构（v2.0.0）
- `app.js` — 云开发初始化 + `callApi()` 封装（401 自动重登录）+ 微信自动登录
- `pages/index` — 配额列表（汇总卡片/进度条/下拉刷新/FAB 新增）
- `pages/quota` — 新增/编辑/删除配额
- `pages/checkin` — 签到消费（选次卡/扣减次数/最近记录）
- `pages/profile` — 个人中心（用户信息/数据统计）

### Flask 后端 API（wxcloudrun-flask）
- `/api/auth/wechat-login`（GET，读 X-WX-OPENID）、`/api/auth/me`、register/login/profile/change-password
- `/api/quotas`（CRUD，含 local_id 去重）、`/api/checkins`（+revoke）、`/api/ratings`
- 认证：JWT Bearer token；数据模型：User/Quota/Checkin/Rating

### 上传/发布经验
1. **miniprogram-ci 上传**：`node upload_ci.js`（version 2.0.0），需 IP 白名单含本机出口 IP
2. **IP 白名单坑**：本机 IPv6（`2409:8a1e:4d26:a631::e6a`）无法加入白名单 → **关闭路由器 IPv6** 后走 IPv4（`103.190.179.55`）成功
3. **提交审核**：版本管理 → 开发版本 → 提交审核 → 勾选协议（React 受控 checkbox 需 click() 触发）→ 处理"接口未配置"+"安全测试"弹窗 → 审核中
4. **体验版**：需在版本管理将开发版本"设为体验版"，体验成员微信扫码访问（非 URL）

### 当前状态（2026-08-01）
- 线上版本：1.0.1（旧 web-view 版）
- 审核中：2.0.0（云开发版，2026-08-01 20:34 提交，预计 1-7 天）
- 审核通过后需在"审核版本"点击发布

### 相关文件
- 小程序代码：`/home/wang/wk/code/card-counter-miniapp/`
- Flask 后端：`/home/wang/wk/code/card-counter-flask/`
- 上传脚本：`/tmp/upload_ci.js`
- 任务文档：`AITasks/Product - Card_count*.md`、`AITasks/小程序云托管开发.md`

---

### 2026-08-08 补充：2.3.x 系列上传完成
- **2.3.0** ✅ 上传成功（移除示例数据/备份到系统文件/微信登录/多用户隔离）
- **2.3.1** ✅ 上传成功（签到日期选择，硬性30天）
- **2.3.2** ✅ 上传成功（**日期限制改为软性**：不强制30天，自由改期，超出标记 outOfRange；改期记录日志）
- **新上传密钥**：`code/card-counter-miniapp/private.key`（md5 `ff454fb9...`，2026-08-08 14:20 重置后下载）
  - ⚠️ **坑1**：该文件会被 joplin/obsidian 同步**覆盖回旧版**（md5 254c...），上传前必须检查 md5 并重新从 `~/下载/private.wx9c5974ab24d057c3 (1).key` 复制
  - ⚠️ **坑2**：启用代理后出口 IP 会变（如 185.248.186.60），需加入小程序后台代码上传 IP 白名单
- **代理已启用**：git push 走代理后可正常推送到 GitHub
- **云托管后端部署中**：599d71f（软性日期）推送成功，date 接口 `/api/checkins/<cid>/date`（PUT）已上线验证（30天内改期成功+超30天软性标记）
- **待用户操作**：小程序后台 → 版本管理 → 选 2.3.2 开发版本 → 提交审核 → 审核通过后发布

### 2026-08-08 踩坑记录：工作区被外部同步污染（严重）
- **症状**：views.py 从 620 行 → 431 行，index.html 从 1249 → 989 行，register/login/wx-login 接口 404
- **根因**：**joplin/obsidian 同步把工作区文件回滚到了旧版本**，且 `git add` 提交了污染版本（0374881/599d71f 丢失 146 行代码）
- **修复**：`git checkout 9d34d79 -- <files>` 恢复正确基准 → 用 Python 脚本重新叠加 date 接口 → 提交 b974379
- **教训**：
  1. 每次提交前必须 `git diff HEAD --stat` 核对文件行数
  2. private.key 同样会被覆盖（上传前查 md5 应为 `ff454fb9`）
  3. 关键文件改完立即 commit + push，不要拖延

### 2026-08-08 补充：date_edit_logs 列迁移
- **问题**：`Unknown column 'checkins.date_edit_logs'`——`db.create_all()` 不 ALTER 已有表
- **修复**：`__init__.py` 启动时查 information_schema + `ALTER TABLE checkins ADD COLUMN date_edit_logs JSON NULL`（幂等）
- **线上版本**：765442d 已部署，验证通过（签到创建 + 超30天软性改期 + 日志完整）

### 部署机制总结（重要）
1. **网页/后端**：git push 到 `github.com/yanqingwang/card-counter-flask` → 云托管自动构建（**GitHub 被墙时需开代理**，代理会改变出口 IP，git push 和 miniprogram-ci 都受影响）
2. **小程序**：`NODE_PATH=$(npm root -g) node scripts/upload_ci.js <version> <desc>`（脚本已持久保存）
3. **miniprogram-ci 上传前置检查**：
   - private.key md5 = `ff454fb9...`（被污染时从 `~/下载/private.wx9c5974ab24d057c3 (1).key` 恢复）
   - 出口 IP 在白名单（代理开启时 IP 会变，需加入）

### 2026-08-08 发布状态（当前）
- **小程序 2.3.2 已上传成功**（开发版本在微信后台），**待人工提交审核 + 发布**
- **发布步骤（人工）**：
  1. 微信公众平台 → 管理 → 版本管理 → 开发版本
  2. 找到 2.3.2 → 提交审核（勾选协议 + 处理接口配置/安全测试弹窗）
  3. 审核通过后 → 审核版本 → 发布
- **wujie 微前端坑**：小程序后台版本管理页通过 wujie 微前端加载，CDP 自动化时 shadow DOM 不加载应用 JS（只加载 qrcheck 静态资源），无法脚本化提交审核，需人工操作

### 2026-08-08 智能分层数据合并（小程序 2.3.3）
- **问题**：旧 merge 是文档级 LWW（updatedAt 大者胜整体覆盖），导致：
  - usedTimes 冲突 → 离线扣减丢失（商家亏）
  - 不同字段双改 → 一方修改丢失
  - 评价"本地优先"→ 云端更新永不生效
- **方案（用户选定：智能分层）**：
  - 配额：usedTimes 取 max（防扣减丢失）+ 其余字段逐字段 LWW + 同时间戳双改标 conflict
  - 签到：localId 去重 + updatedAt LWW（记录不可变）
  - 评价：localId 去重 + updatedAt LWW（修复本地优先 bug）
- **同步时机修复**：detail/checkin/history/stats 页面每次进入都 pull（原来只在本地为空时）
- **测试**：`scripts/test_merge.js` 6 场景全过（usedTimes max / 字段LWW双向 / 冲突标记 / 评价LWW / 签到LWW）
- **已上传**：小程序 2.3.3 ✅
- **UI**：配额详情页 conflict 时显示 ⚠️ 提示

### 2026-08-08 数据同步完整性修复（小程序 2.3.4 + 后端 8b9183c）
- **完整性缺陷**：
  1. checkin.js/rating.js 创建记录后**未标记 _synced** → push 跟踪不到
  2. push() 推送成功后**未标记 _synced=true** → 每次 push 重复推送
  3. 后端 /api/checkins POST **无 localId 去重** → 重复推送创建重复签到
- **修复**：
  1. checkin/rating 创建时 `_synced: false`
  2. push() 成功后 `_synced = true` 并持久化，返回推送计数
  3. 后端 checkins POST 加 localId 去重（同 quotas 模式，used_times 仅首次累加）
- **记录级比对**：新增 `syncManager.diffLocalCloud(cloudQuotas, cloudCheckins, cloudRatings)`：
  - 逐条比对本地 vs 云端，检测 local_only / cloud_only / field_diff
  - 每个差异确定方向：`local_to_cloud` / `cloud_to_local` / `conflict`（同时间戳双改）
  - 计数器（usedTimes）方向 = 增量合并取大值
  - 报告存入 `syncStatus.lastDiff`（总数/分类统计/前20条明细）
- **UI**：profile 页展示最近同步差异（待推送/待拉取/字段差异/冲突数）
- **测试**：`scripts/test_diff.js` 6 场景全过 + `scripts/test_merge.js` 6 场景全过
- **线上验证**：重复推送同 localId 返回相同 id；quota usedTimes 未重复累加
- **部署**：后端 8b9183c 已部署 ✅；小程序 2.3.4 已上传 ✅（待人工提交审核）

### 2026-08-08 生命周期自动同步（小程序 2.3.5）
- **机制**（用户提议）：打开/回到前台自动拉取，关闭/切后台自动推送
- **实现**（app.js）：
  - `onShow()` → `autoSync('pull')`：打开小程序自动拉取云端最新
  - `onHide()` → `autoSync('push')`：关闭/切后台自动推送本地未同步数据
  - `autoSync(mode)`：幂等（syncing 标志防重入）+ 等云就绪 + 8s 超时兜底
- **配合已有机制**：各页面 onShow 也 pull（详情/签到/历史/统计）+ bootstrap 初始同步