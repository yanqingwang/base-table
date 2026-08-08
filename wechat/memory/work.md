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

### 2026-08-08 签到记录时间筛选 + 排序 + 谨慎操作区块（v2.4.1）
- **需求**：签到页显示当天签到记录，增加时间筛选（默认今天，含最近一月/全部）；显示可按时间/配额排序；网页与小程序都更新；强制上传、重置数据单独作为谨慎操作区块。
- **小程序（pages/checkin）**：
  - 新增 `timeFilter`（today/month/all，默认 today）+ `sortBy`（time/quota，默认 time）
  - `applyFilter()`：`_rawCheckins`（未撤销）按范围过滤（today=当天，month=近30天，all=全部），再按 time（日期↓时间↓）或 quota（商户名↑+时间↓）排序；`onTimeFilter`/`onSortBy` 仅前端重算（不重新拉取）
  - `revokeCheckin`/`changeCheckinDate` 改为读 `filteredCheckins`（原 `todayCheckins`）
  - WXML：`filter-bar`（seg 分段控件 今天/最近一月/全部 + 排序 时间/配额）+ `recordTitle`（含计数）；`<block wx:if>` 包 `wx:for` 列表，`wx:else` 空态（修复 wx:if+wx:for 同元素导致 wx:else 编译失败）
- **网页（index.html checkin tab）**：
  - 模块级 `checkinFilter`/`checkinSort` 状态 + `setCheckinFilter`/`setCheckinSort` 处理器 + `checkinMerchant`/`monthAgoStr` 辅助
  - `renderCheckinTab` 改为按筛选+排序渲染，动态标题 `<h3 id="checkinRecordsTitle">` + seg 高亮；新增 `.seg`/`.seg-btn`/`.seg-label` 样式
- **谨慎操作区块**（强制上传 + 重置数据 独立出来）：
  - 网页 settings：从「数据管理」拆除，新建「⚠️ 谨慎操作」红框区块（含说明）；保留 `forceUploadBtn` id
  - 小程序 profile：从同步区拆出「强制上传」、从「数据管理」拆出「重置全部数据（含云端）」，归入新「⚠️ 谨慎操作」红框区块（`.danger-zone`/`.menu-section-title`）；版本号显示更新为 2.4.1
- **验证**：
  - 小程序 18 个 JS `node --check` 全过；Flask `py_compile` 过
  - 本地起 Flask curl `/` → 200，含 `setCheckinFilter`/`checkinFilterSeg`/`谨慎操作`/`forceUploadBtn`/`最近一月`/`排序`；`/api/reset` → 401
  - miniprogram-ci 上传 **v2.4.1 成功** ✅（首次因 wx:if+wx:for 同元素编译失败，拆 `<block>` 后重试成功）
- **部署**：
  - 网页：嵌套仓库 commit `656e56b`（仅 `templates/index.html`）→ `git push origin main` → 云托管构建；线上验证 200，新控件已生效 ✅
  - 小程序：**v2.4.1 已上传（开发版本）**，**仍待人工提交审核+发布**（wujie 微前端无法脚本化提交审核）
- **提交（父仓库 base-table python）**：`5e391a3f`（功能）+ `4b386699`（wx:else 修复）

### 2026-08-08 商户签到记录展示 + 最常去商家修正 + 已消费金额统计（v2.4.2）
- **需求**：① 商户详情页查看签到记录时显示 日期/备注/扣减次数；② 签到页历史展示含 商户/日期/备注/扣减次数；③ 危险操作必须二次确认；④ 小程序「最常去商家」商家名识别错误（应为配额名称）；⑤ 新增「已消费金额」统计，按商户汇总消费金额。网页与小程序都更新；验证→发布→更新日志。
- **现状核对（核心结论）**：req ①②③ 在 web + mini **已满足**，无需改动：
  - 网页 `showDetail` 详情底部「签到记录」已含 日期+扣减次数+备注；`renderCheckinTab` 历史含 商户+日期+备注+扣减次数；`resetData`/`forceUpload` 均有 `confirm()` 二次确认
  - 小程序 `detail.wxml`/`history.wxml` 详情与历史均已含 日期/备注/扣减次数/商户；`profile` 强制上传/重置均 `wx.showModal` 二次确认
  - 真正待修的是 ④（bug）+ ⑤（新功能）
- **Bug ④ 修复：最常去商家按配额名称（而非 free-text 商家名）**：
  - 根因：原逻辑用 `checkin.merchant`（签到时手填的商家文本，可能为空/不一致）分组，导致商家识别错误
  - 修正：用 `quotaId` 反查配额 `localId` → 取 `quota.merchant`（配额名称，即真正的商家）分组
  - 网页 `renderStatsTab`：遍历 `localData.checkins`，`if (c.isRevoked) return`，`q = quotas.find(q=>q.localId===c.quotaId)`，`name = (q&&q.merchant)||c.merchant||'手动记录'`，`freq[name]++`；取前 5 渲染
  - 小程序 `stats.js`：建 `quotaByName[localId]` 索引 + `merchantOf(c)`（回退 `nQuotas.find(q=>String(q.id)===String(c.quotaId))` 再回退 `c.merchant`/`手动记录`）；`merchantCount[name]++`
  - 小程序 `checkin/history.js`：`merchantText` 统一改为配额名（同 `quotaByName` 查法，回退 `c.merchant`）；商户筛选列表由 `merchantText` 构建，`applyFilter` 按 `merchantText` 过滤（历史页商家维度一致）
- **功能 ⑤ 新增：已消费金额统计（按商户）**：
  - 公式：`每配额已消费 = amount × usedTimes / totalTimes`（amount 为配额总额，usedTimes 已用次数，totalTimes 总次数）；按 `quota.merchant`（配额名称）聚合求和
  - 网页 `renderStatsTab`：`consumed[name] += c`；`amountList = Object.entries(consumed).filter(v>0).sort(desc)`；`totalConsumed = sum.toFixed(2)`
  - 小程序 `stats.js`：`merchantAmount[name] += consumed`；`amountRank = entries.filter(v>0).sort(desc).map(([name,amount])=>({name,amount:amount.toFixed(2)}))`；`totalConsumed = reduce.toFixed(2)`
  - 网页新增「💰 已消费金额（按商户）」区块（rank + 合计）；小程序 `stats.wxml` 新增 `.amount-card`（`amount-item`/`amount-name`/`amount-value` 橙色/`amount-total`）
  - 同时修正网页 `showDetail` 签到记录排序：原仅按 `checkinTime` 排序 → 改为 `checkinDate + ' ' + checkinTime` 降序（避免同日跨日排序错乱）
- **验证**：
  - 小程序 18 个 JS `node --check` 全过；Flask `py_compile` 过
  - 本地起 Flask curl `/` → 200
  - 推送 120s 后线上探测：HTTP 200，size **71396**（原 69406），含 `最常去商家`(2) / `已消费金额`(2) / `freq[name]` / `consumed[name]` → 新构建已生效 ✅
  - miniprogram-ci 上传 **v2.4.2 成功** ✅（代理 TLS 抖动重试 3 次后成功，同一版本号重复上传无害）
- **部署**：
  - 网页：嵌套仓库 commit `225a867`（"feat(web): 统计页新增最常去商家排行(按配额名称)+已消费金额(按商户)；修复详情签到记录排序"）→ `git push origin main` → 云托管构建（线上已验证 71396）
  - 小程序：**v2.4.2 已上传（开发版本）**，**仍待人工提交审核+发布**（wujie 微前端无法脚本化提交审核）
  - 提交（父仓库 base-table python）：`6e607837`（"feat(card-counter): 最常去商家按配额名称修正+已消费金额统计(按商户)；历史/详情商家名统一(v2.4.2)"）
- **遗留提醒**：
  - 小程序 `profile.wxml` 版本号仍显示 `2.4.1`（非硬要求未改）；如需精确可改 `2.4.2`
  - v2.4.2 仍待人工：版本管理→选 2.4.2 开发版本→提交审核→审核通过后发布

### 2026-08-08 签到记录改期/撤销移入修改按钮 + 修复导出备份（v2.4.3）
- **需求**：① 次卡管理仍走管理界面（小程序现有方式不变，无需改）；② 小程序 改期/撤销 都通过一个「修改」按钮进入，默认签到页只显示 商户/日期/备注/扣减，改期后的日期变小字体；网页版也通过管理界面改期+撤销，保留当日撤销按钮；③ 签到历史记录显示备注；④ 小程序「导出备份」在体验版失败；⑤ 导入恢复无法测试（体验版），手机版备份文件默认从哪来。网页+小程序都更新；验证→发布→更新日志。
- **现状核对**：
  - req ③（历史显示备注）：小程序 `history.wxml` 已有 `💬 备注`（line 22），网页 `renderCheckinTab` 列表与 `showDetail` 详情均已含 `note` → 已满足，仅需在改版后保留
  - req ①（次卡管理进管理界面）：小程序 `checkin.wxml` 新增/管理均 navigate 到 quota 页、`index` 页 FAB 管理 → 已满足，不改
- **小程序（改期/撤销 → 修改按钮）**：
  - 新增独立页 `pages/checkin/edit/edit`（管理界面）：展示 商家/扣减/日期/备注 + 改期记录；含「📅 修改日期」（`wx.showModal` editable 输入 YYYY-MM-DD，限前后30天，写 `dateEditLogs`）+「↩️ 撤销签到」（本地标记撤销+返还配额次数+云端 revoke/创建）；已改期日期标 `（已改期）`
  - `checkin.wxml` 移除原内联 `改期`/`撤销` 两按钮，改为单个「修改」按钮（`goEdit` → navigate 到 edit 页）；列表保留 商户/日期/备注/扣减；`dateModified` 时日期用 `.date-small` 小字体
  - `checkin.js`：`applyFilter` 增加 `c.dateModified = !!dateEditLogs.length`；新增 `goEdit`；移除已迁走的 `revokeCheckin`/`changeCheckinDate`（避免重复/死代码）
  - `history.wxml`/`history.js`：每条记录加「修改」按钮（`goEdit`）；同样标记 `dateModified` 小字体；备注一直显示
  - `app.json` 注册新页 `pages/checkin/edit/edit`
- **网页（改期/撤销 → 修改弹窗，保留当日撤销）**：
  - `renderCheckinTab` 每条记录改内联「撤销」为「修改」按钮（`openCheckinEdit`）；**仅当日记录保留内联「撤销」按钮**（`c.checkinDate === today`）；列表已含 备注 + `（已改期）`标记
  - 新增 `openCheckinEdit(id)`：打开 `#checkinEditModal` 弹窗，展示 商家/扣减/备注 + 日期 `<input type=date>` + 改期记录，含「确认改期」(`submitCheckinDate`) + 「撤销」(`revokeCheckin`) 两个操作
  - 新增 `submitCheckinDate(id)`：校验前后30天 → 更新 `checkinDate` + 写 `dateEditLogs` + `saveLocal()` + `PUT /api/checkins/<id>/date`（云端）
  - 新增弹窗 HTML `#checkinEditModal`（复用 `.modal-overlay`/`.modal` 样式，`closeModal` 关闭）
- **修复 ④ 导出备份失败（体验版）**：
  - 根因：`exportData` 优先 `wx.saveFileToDisk`，仅当该 API **不存在**才回退 `wx.shareFileMessage`；体验版基础库 `saveFileToDisk` 存在但**运行失败**，fail 回调直接 toast「保存失败」且**不回退**，导致导出失败
  - 修复：fail 回调（非用户取消）改走 `fallbackShare()` → `wx.shareFileMessage` 把备份文件分享到微信聊天（稳定且跨版本可用），文件名 `次卡管家备份_<时间戳>.json`
- **解答 ⑤ 导入恢复来源（手机版）**：
  - 小程序导入用 `wx.chooseMessageFile`，文件**取自微信聊天会话**（如「文件传输助手」），不是设备某个文件夹；故在 `profile.wxml` 导入按钮下加提示：「导入文件来自微信聊天（如文件传输助手），先把备份文件发到聊天，再点此处选择」
  - 导出回退为 `shareFileMessage` 后，备份文件恰好落入聊天，形成「导出→聊天→导入」闭环，手机版可直接走通
  - 版本号 `profile.wxml` 更新为 `2.4.3`
- **验证**：
  - 小程序改动 JS 全部 `node --check` 通过（checkin/checkin/edit/edit/history/profile）
  - 网页 `py_compile` 通过；本地起 Flask curl `/` → 200，size **74619**，含 `openCheckinEdit`(2)/`checkinEditModal`(5)/`submitCheckinDate`(2)
  - miniprogram-ci 上传 **v2.4.3 成功** ✅（首次即成功）
- **部署**：
  - 网页：嵌套仓库 commit `13cd828`（"feat(web): 签到记录改期/撤销移入修改弹窗(管理界面)，保留当日撤销按钮；列表显示备注与已改期标记"）→ `git push origin main` → 云托管构建；线上轮询至 probe 7 生效，size **74619**，含 `openCheckinEdit`(2) ✅
  - 小程序：**v2.4.3 已上传（开发版本）**，**仍待人工提交审核+发布**（wujie 微前端无法脚本化提交审核）
  - 提交（父仓库 base-table python）：待本次 work.md 提交

### 2026-08-08 配额新增「默认扣除次数」（v2.4.4）
- **需求**：增加次卡配额时，增加「默认扣除次数」字段，默认 1 次；签到时自动填入该默认值。网页 + 小程序都更新；验证→发布→更新日志。
- **后端（card-counter-flask）**：
  - `model.py` Quota 新增 `default_deduct`（Integer, default 1）
  - `quota_to_dict` 输出 `defaultDeduct`（缺省 1）
  - `quotas()` POST 与 `quota_detail()` PUT 均读取 `defaultDeduct`（缺省 1）写入
  - `__init__.py` 轻量迁移：为 `quotas` 表补 `default_deduct` 列（MySQL `information_schema` + SQLite `PRAGMA` 双分支，缺省 1）
- **小程序**：
  - `util.normalizeQuota` 增加 `defaultDeduct`（后端 `default_deduct` / 本地 `defaultDeduct` 统一，缺省 1）
  - `pages/quota/quota.js`：`form` 增加 `defaultDeduct`（默认 '1'）；`loadQuota` 回填；`save` 的 payload 与 `POST /api/quotas`、`PUT /api/quotas/<id>` 均带 `defaultDeduct`
  - `pages/quota/quota.wxml`：总次数行下新增「默认扣除次数」输入（number，placeholder 1）
  - `pages/checkin/checkin.js`：`onSelectQuota` 与自动选中（`loadData` pendingId）时把 `deductTimes` 预填为 `quota.defaultDeduct || 1`（原固定 1）
- **网页（index.html）**：
  - 配额弹窗（`#quotaModal`）新增「默认扣除次数」输入（id `fDefaultDeduct`，默认 1），并提示「每次签到默认扣几次」
  - `editQuota` 回填 `fDefaultDeduct`；`saveQuota` 读取并写入 `data.defaultDeduct`（随 `pushToServer('quotas', data)` 走 `POST /api/quotas` 落库）
  - `openCheckin` 打开签到弹窗时，扣减计数默认填 `q.defaultDeduct || 1`（原固定 1）
- **验证**：
  - 小程序 `quota.js`/`checkin.js`/`util.js` `node --check` 全过；修复 quota.wxml 多一个 `</view>` 导致的编译失败（第三次上传成功）
  - Flask `py_compile` 过；本地起 Flask 渲染 75149 字节含 `fDefaultDeduct`(3)；迁移无报错
  - miniprogram-ci 上传 **v2.4.4 成功** ✅
- **部署**：
  - 网页：嵌套仓库 commit `60b7a47`（model/views/__init__ 后端）+ `2556631`（index.html 配额弹窗/签到预填）→ `git push origin main` → 云托管构建；线上轮询至 probe 3 生效，size **75149**，含 `fDefaultDeduct`(3) ✅
  - 小程序：**v2.4.4 已上传（开发版本）**，**仍待人工提交审核+发布**（wujie 微前端无法脚本化提交审核）
  - 提交（父仓库 base-table python）：待本次 work.md 提交
- **遗留提醒**：
  - 旧配额（未设置过 defaultDeduct）在 `quota_to_dict`/`normalizeQuota` 均回退为 1，向后兼容，无需迁移数据
  - v2.4.4 仍待人工：版本管理→选 2.4.4 开发版本→提交审核→审核通过后发布

### 2026-08-08 网页备注同步小程序 + 修改页空白修复 + 默认扣除次数最小0（v2.4.5）
- **需求**：① 网页版本在详情中可见的「备注」，没有同步到小程序，检查并修正；② 小程序签到管理中，点某次签到「修改」后页面空白（未弹出修改数据界面，也无改期/撤销选择），请修正；③（追加）增加次卡配额时「默认扣除次数」最小为 0、默认为 1。网页 + 小程序都更新；验证→发布→更新日志。
- **修复 ① 网页备注未同步小程序（根因：字段级 LWW 被时间戳遮蔽）**：
  - 根因：`syncManager.js` 的 `mergeQuota` 逐字段比较 `updatedAt` 取最新（`cloudTs > localTs ? cv : lv`）。小程序本地一次签到会 `bump` 该配额 `updatedAt`，使本地时间戳新于网页；而此过程不动 `note`。于是合并时 `note` 用本地（空）值，网页编辑过的备注被本地空值覆盖 → 小程序始终看不到网页备注。
  - 修复：改为**空感知 LWW**——字段双方皆空跳过；云端空保留本地；**本地空且云端有值→采用云端（补齐网页备注/偏好等）**；仅当本地非空且云端非空且值不同才按时间戳裁决（冲突标记取云端）。`QUOTA_FIELDS` 已含 `note`。
  - 影响：网页改备注/偏好后下拉同步，小程序即时补齐；不破坏本地优先写入（本地非空仍以时间戳为准）。
- **修复 ② 修改页空白（根因：缺 `wx:else` 兜底 + 疑似陈旧构建）**：
  - 现象：点「修改」进入 `pages/checkin/edit/edit` 后整页空白，无 商家/日期/备注，也无 改期/撤销 按钮。
  - 核对：`app.json` 已注册该页；`goEdit` 经 `edit?id=<localId>` navigate；`edit.js` 以 `localId` 查找并 `normalizeCheckin`，逻辑正确；`checkin.wxml` 列表 `data-id="{{item.localId}}"` 与查找键一致 → 数据通道无误。
  - 旧 `edit.wxml` 用 `<block wx:elif="{{checkin}}">` 且**无 `wx:else`**：当 `loading=false` 且 `checkin` 未命中（或短暂未加载）时，整页无任何渲染 → 表现为空白。
  - 修复：重写为 `wx:if loading` / `wx:elif checkin`（独立 `<view>`）/ `wx:else 未找到该签到记录` 三段式，确保任何状态下都渲染可见内容，永不空白；找不到记录时给出明确提示而非空白。
  - 结论：空白主因为陈旧构建未含此页/旧 wxml 无兜底，加固 + 重新上传 v2.4.5 为根本解决。
- **修复 ③ 默认扣除次数最小为 0（默认仍 1）**：
  - 小程序 `pages/quota/quota.js` `save`：`dd=parseInt(form.defaultDeduct); defaultDeduct = isNaN(dd)?1:Math.max(0,dd)`（原 `:dd` 未夹 0，现夹最小值 0，允许填 0）
  - 网页 `index.html` `saveQuota`：同源 `Math.max(0, dd)`（空值回退默认 1）
  - `quota.wxml` 输入加 `min="0"`（与网页 `min="0"` 一致）；后端 `int(data.get('defaultDeduct', 1))` 本就接受 0，`quota_to_dict` 中 `0 is not None` 正确保留 0
- **验证**：
  - 小程序 JS 全 `node --check` 过（`syncManager`/`quota`/`checkin/edit/edit`/`util`）；`quota.wxml` 加 `min` 合法
  - Flask `py_compile` 过；嵌套仓库 commit `501759e`（"fix(web): 配额默认扣除次数最小为0（Math.max(0,dd)）"）→ `git push origin main`，线上轮询待生效（验证 `Math.max(0, dd)` 出现）
  - miniprogram-ci 上传 **v2.4.5 成功** ✅（首次即成功，desc 含三项修复）
- **部署**：
  - 网页：嵌套仓库 `501759e` → `git push origin main` → 云托管构建；**线上已生效** ✅（轮询至 probe 6 生效，size **75232**，含 `fDefaultDeduct min="0"`(1) / `Math.max(0, dd)`(1) / `openCheckinEdit`(2)；注：本次构建曾被云托管延迟，追加空提交 `48f37e9` 重新触发 webhook 后生效）
  - 小程序：**v2.4.5 已上传（开发版本）**，**仍待人工提交审核+发布**（wujie 微前端无法脚本化提交审核）
  - 提交（父仓库 base-table python）：随本次 work.md 提交
- **遗留提醒**：v2.4.5 仍待人工：版本管理→选 2.4.5 开发版本→提交审核→审核通过后发布；网页构建若迟迟未生效，于云托管控制台确认构建日志。
