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
- ⚠️ **两仓库陷阱（2026-08-08 实测）**：`code/card-counter-flask/` 是**独立 git 仓库**（`origin = github.com/yanqingwang/card-counter-flask.git`），同时它也被父仓库 `base-table` 作为普通文件跟踪。改完 flask 代码必须 `cd code/card-counter-flask && git add/commit && git push origin main` 才会触发云托管构建；只推父仓库 `base-table` 的 `python` 分支**不会部署**（云托管读的是 card-counter-flask 仓库，不是 base-table）。

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
- **已上传**：小程序 2.3.5 ✅（包含下方「签到记录全量同步修复」全部改动）
### 2026-08-08 签到记录（消费明细）全量同步修复（后端 + 小程序 + 网页）
- **问题**：网页总览→详情底部「签到记录」（日期/扣减次数/备注）初始化同步未上传服务器，历史记录（_synced=true）被增量推送跳过，同账号多端不一致
- **根因**：
  1. 网页 manualSync 只推 quotas，从不推 checkins/ratings；init/login/register 只拉不推
  2. 网页 pushToServer 吞错误 + 无 _synced 标记 → 失败记录永久丢失
  3. 网页 revoke 用 localId 调 `/api/checkins/<int:cid>/revoke` → 404，服务端记录未撤销
  4. 小程序 push() 按 _synced 跳过历史记录（服务器重建后历史数据无法找回）
  5. 后端 Checkin 无 note（备注）列；POST 硬编码 is_revoked=False（本地撤销记录重推后复活）
  6. push() 先推配额再推签到 → 全新服务器上 quota usedTimes 被签到累加二次计数
- **后端修复**（views.py / model.py / __init__.py）：
  - Checkin 新增 note 列 + 自动迁移（MySQL information_schema + SQLite PRAGMA，统一用 text() 修复原 SQLAlchemy2 隐患）
  - POST /api/checkins 接受 note + 尊重 isRevoked；仅新记录且未撤销时累加 used_times；existing 更新 note
  - checkin_to_dict 输出 note
- **小程序修复**：
  - checkin.js 表单加「备注」输入 + doCheckin 记录/推送含 note + 成功后标记 _synced=true
  - syncManager push(app, force=false)：force 忽略 _synced 全量上传（重建服务器/找回历史用）；推送顺序改为 签到→评价→配额（配额 usedTimes 最后权威覆盖，防二次计数）
  - app.js bootstrap hasLocal 改为检查三类数据（原来只看 quotas）
  - 详情/签到/历史页展示签到备注
- **网页修复**（index.html）：
  - 新增 pushLocalPending()：init/login/register/manualSync 推送三类本地数据（checkins→ratings→quotas 顺序）
  - confirmCheckin 增加 note 输入 + await pushCheckin + _synced 标记；失败保留待推送
  - revokeCheckin 改用服务端 id（ci.id），未推送过的走 POST isRevoked
  - 新增「⬆️ 强制上传」按钮（forceUpload）：全量覆盖上传本地所有数据
  - pushToServer 成功后回写服务端 id + _synced
- **小程序 profile 页**：新增「强制上传」按钮（橙色，确认弹窗后全量上传）
- **测试**：本地 SQLite 迁移验证 ✓；API 测试（note 持久化 / dedup 不重复扣减 / isRevoked 不扣减 / revoke 返还）✓；浏览器 E2E（历史记录 init 自动推送 + 强制上传 + 详情展示备注 + usedTimes 一致）✓；test_diff/test_merge 全过 ✓
- **部署状态**：小程序 2.3.5 已上传 ✅（含本小节全部改动，待人工提交审核）；后端待 git push 云托管（网页随后端部署自动更新）

### 2026-08-08 修复：小程序无法打开 + 重置数据/删除同步记录（v2.4.0）
- **根因（小程序打不开）**：
  1. `app.json` 只注册了 `pages/index/index` 且无 `tabBar`，但 `login.js`/`stats.js`/`detail.js` 都用 `wx.switchTab` 跳 5 个 Tab 页 → switchTab 失败，页面打不开
  2. `pages/index/index.wxml` 仍是失效的 `<web-view src="https://flask-z9hh-...sh.run.tcloudbase.com/">`（业务域名未备案无法加载）→ 首页空白
  - 注：`pages/index/index.wxss` 早已写好原生配额列表样式，但 `.js`/`.wxml` 从未补完（停在 web-view 桩）
- **修复**：
  - `app.json` 注册全部 9 个页面 + `tabBar`（次卡/签到/统计/评价/我的），FAB bottom 偏移已为 tabBar 预留
  - 重写 `index.js`/`index.wxml` 为原生配额列表（汇总卡/进度条/即将到期提醒/全局学习建议/快速签到/FAB 新增），复用既有 wxss
  - `node --check` 全量 JS 通过；`app.json` 等 JSON 校验通过
- **重置数据 + 删除同步记录**：
  - 后端新增 `dao.reset_user_data(user_id)` + `POST /api/reset`（require_auth，仅清当前用户 quotas/checkins/ratings，保留账号；其他用户不受影响）
  - 小程序 profile 新增「重置全部数据（含云端）」：`/api/reset` 清云端 → `storage.clearAll()` 清本地 + `_synced`/`syncStatus` 同步记录 + `pendingCheckinQuota`
  - 保留原「清除本地数据」（仅本地，云端保留）
  - 本地 SQLite `db.sqlite3` 已删除（重置开发数据），运行自动 `db.create_all()` 重建
- **验证**：
  - 小程序 **已上传 v2.4.0** ✅（开发版本，待人工：版本管理→提交审核→发布）
  - 后端 `py_compile` 通过；Flask(SQLite) 启动 `/api/reset` 路由注册；功能测试：用户数据 1/1/1 → 0/0/0，其他用户不受影响 ✅
  - `test_merge.js`/`test_diff.js` 6 场景全过 ✅（数据同步完整性）
  - 后端改动（含 2.3.x 全量同步修复）最初误推到父仓库 `base-table` 的 `python` 分支，**未触发云托管构建**（详见下方「云托管网页未更新根因与修复」）
- **待用户操作**：微信公众平台 → 版本管理 → 选 2.4.0 开发版本 → 提交审核 → 审核通过后发布（wujie 微前端无法脚本化提交审核）

### 2026-08-08 云托管网页未更新根因与修复（网页/小程序一致性）
- **用户反馈**：云托管网页 `https://flask-z9hh-281177-5-1453124923.sh.run.tcloudbase.com/` 未更新；「初始化上传没有做好」（初始化全量同步缺失）；要求云托管页面与小程序内容一致。
- **诊断**：
  - 探测线上：`POST /api/reset` → **404**；`index.html`（61843 字节）含 `重置`/`resetData` 但**缺 `强制上传`/`pushLocalPending`** → 线上是旧提交 `8b9183c`
  - 发现 `code/card-counter-flask/` 是**独立 git 仓库**，`origin = github.com/yanqingwang/card-counter-flask.git`（真正云托管构建源），而父仓库 `base-table` 只是把它当普通文件跟踪
  - 之前误把改动 commit 到父仓库 `base-table` 的 `python` 分支并 `git push origin python`，该推送**不会触发云托管构建**（云托管读 card-counter-flask 仓库的 main 分支）
  - 改动实际在嵌套仓库工作区（与父仓库共享物理文件），但从未 commit+push 到嵌套仓库 → 云托管始终构建旧代码
- **修复**：
  - `cd code/card-counter-flask` → `git add` 仅源码（wxcloudrun/__init__.py、dao.py、model.py、views.py、templates/index.html），**排除** `card_counter.db` 与 `__pycache__/*`
  - commit `9ed1d6c` → `git push origin main` → 云托管自动构建
- **验证（部署后）**：
  - `POST /api/reset` → **401 未登录**（部署前 404，证明路由已上线且鉴权生效）
  - 线上 `index.html` 61843 → **65891 字节**，现含 `强制上传`(4) / `pushLocalPending`(5) / `resetData`(2) / `重置`(3) → 全量同步初始化上传 + 重置功能已生效
  - 云托管网页与小程序 v2.4.0 现共享同一后端能力（强制上传 / 重置数据删除同步记录），内容一致 ✅
- **遗留提醒**：
  - 小程序 v2.4.0 已上传但**仍待人工提交审核+发布**（wujie 微前端无法脚本化提交审核）
  - 嵌套仓库 `card_counter.db`、`__pycache__/*` 被 git 跟踪（无 .gitignore），后续提交须 `git add` 指定文件，勿 `git add -A`
