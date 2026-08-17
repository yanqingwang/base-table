# 次卡管家 / 微信云托管 / 小程序 工作日志

> 从 wk/memory/work.md 抽取的微信相关章节（2026-08-01 起）
> 后续微信/小程序开发记录统一维护在此文件

---

## 📌 快速开始（每次开工先看这里，最后更新 2026-08-10 v2.5.2）

**当前状态**
- 网页（云托管）：**v2.5.2 已上线**（含 v2.5.1）。v2.5.1 修复「签到撤销后次数不回退」+ used_times 改由签到记录派生；v2.5.2 新增**账号绑定**——注册用户网页「绑定微信」、微信用户小程序「设置登录密码」，两种登录归一为同一账号同一份数据。
- 小程序：v2.5.2 代码已提交 `python` 分支（checkin/edit 支持扣减次数设为 0；profile「设置登录密码」；同步以云端 usedTimes 为准），**待上传开发版 + 发布**（上传被本机 IPv6 出口拦，需白名单内环境重传）。
- **待办（人工）**：
  1. **小程序上传/发布**：v2.5.2 需从白名单内重传开发版 + 提交审核发布；扫码登录(需 v2.5.0 发布) 与绑定/扣减0 UI 才对线上生效。
  2. **扫码登录仍依赖**：v2.5.0 发布 + 小程序 API IP 白名单（49.234.141.38）。

**部署命令**
```bash
# 网页/后端（云托管构建源）
cd code/card-counter-flask
git add wxcloudrun/views.py wxcloudrun/dao.py wxcloudrun/model.py wxcloudrun/__init__.py wxcloudrun/templates/index.html   # 勿 git add -A（card_counter.db/__pycache__ 被跟踪）
git commit -m "..." && git push origin main
# 若云托管未自动重建：追加空提交 git commit --allow-empty -m "chore: 触发云托管重建" && git push origin main
# 线上验证：curl -s https://flask-z9hh-281177-5-1453124923.sh.run.tcloudbase.com/ | grep <特征串>

# 小程序上传
cd code/card-counter-miniapp
# 上传前检查 private.key md5 = ff454fb9596f8e95d686acdd03878de2（被 joplin/obsidian 同步污染时从 ~/下载/private.wx9c5974ab24d057c3 (1).key 恢复）
NODE_PATH=$(npm root -g) node scripts/upload_ci.js <version> <desc>
```
> 详细部署流程 / 坑 / 提交审核 → `docs/部署手册.md`；环境与密钥 → `docs/环境配置.md`；版本状态表亦见 `docs/版本状态.md`

**仓库拓扑（两仓库陷阱）**
- `code/card-counter-flask/` 是**独立 git 仓库**（`origin=github.com/yanqingwang/card-counter-flask.git`），云托管读它 `main` 分支自动构建；只推父仓库 `base-table` 的 `python` 分支**不会部署**。
- 父仓库 `base-table`（python 分支）仅作版本记录，网页/小程序改动后补提交。
- 小程序代码被父仓库跟踪（非独立仓库），部署 = miniprogram-ci 上传工作树。

**关键环境**
| 项 | 值 |
|----|-----|
| AppID | `wx9c5974ab24d057c3` |
| 云托管环境 ID | `prod-d5gm4a2q00a7f9209` |
| 云托管服务名 | `flask-z9hh` |
| 公网地址 | `https://flask-z9hh-281177-5-1453124923.sh.run.tcloudbase.com/` |
| 上传密钥 | `code/card-counter-miniapp/private.key`（md5 `ff454fb9...`） |

**版本发布状态总览**
| 版本 | 核心内容 | 网页 | 小程序 |
|------|---------|------|--------|
| 1.0.1 | web-view 旧版 | — | 线上旧版 |
| 2.0.0 | 云开发原生改造 | — | 已上传，待发布 |
| 2.3.0~2.3.5 | 登录/多用户/智能合并/全量同步/生命周期同步 | 已上线 | 已上传，待发布 |
| 2.4.0 | 修复打不开 + 重置数据/删同步记录 | 已上线 | 已上传，待发布 |
| 2.4.1 | 签到时间筛选+排序 + 谨慎操作区块 | 已上线 | 已上传，待发布 |
| 2.4.2 | 最常去商家(配额名) + 已消费金额 | 已上线 | 已上传，待发布 |
| 2.4.3 | 改期/撤销移入「修改」按钮 + 导出备份修复 | 已上线 | 已上传，待发布 |
| 2.4.4 | 配额默认扣除次数 | 已上线 | 已上传，待发布 |
| 2.4.5 | 备注同步小程序 + 修改页空白兜底 + 默认扣减 min=0 | 已上线 | 已上传，待发布 |
| 2.4.6 | 撤销/删除配额同步小程序 + usedTimes 误覆盖修复 | 已上线 | 已上传，待发布 |
| 2.4.7 | 修改页打不开加固 + 移除 lazyCodeLoading | —（仅小程序） | 已上传，待发布 |
| 2.4.8 | **修改签到支持备注+日期编辑**（小程序+网页+后端 PUT） | **已上线** | **已上传，待发布** |
| 2.4.9 | 总览签到「@xxx」语义修正：@ 改为显示备注(note)；商家差异改以「· 商家：X」展示；新增一次性数据清理将历史误存商家字段的内容(27条)迁回备注；签到弹窗商家输入框在等于配额商家时默认隐藏 | **已上线** | 无需改动 |
| 2.4.10 | 删除次卡时级联删除关联签到（网页+后端+小程序）；确认框提示将连带删除N条签到；同步清理云端已删配额的本地孤儿签到 | **已上线** | **已上传，待发布** |
| 2.5.0 | **网页版微信扫码登录（小程序码）**：新增 `qr-login/start|confirm|status` 三接口 + `LoginSession` 模型 + 前端二维码弹窗与轮询；不再依赖公众号网页授权（免认证服务号） | **已上线** | **已上传，待发布（需发布后扫码登录才生效）** |
| 2.5.1 | **修复撤销不回退**：`used_times` 改由签到记录 `SUM` 派生（撤销/签到/改扣减次数均重算），客户端传入值被忽略；新增 `/api/quotas/recompute`；签到/修改支持扣减次数设为 0 | **已上线** | 已上传（白名单拦，待重传） |
| 2.5.2 | **账号绑定 双向打通**：`LoginSession` 加 `mode`；新增 `qr-login/bind/start` + confirm/status bind 模式（扫码回写 openid）、`bind-account`（微信设密码）；冲突拒绝不合并；网页「绑定微信/设置账号密码」+ 小程序「设置登录密码」 | **已上线** | 已提交 `python` 分支，待上传/发布 |
| 2.6.0 | **B 端商业化闭环 + Bug 修复**：P0/P1 修复（usedTimes 权威源/静默登录去 getUserProfile/写入即同步/401 上限/删除墓碑/双finish/多环境/容量兜底）；发卡→领卡→动态签名码核销（防重放/幂等/跨商户隔离）；Phase 4 云事件+订阅消息可配置接线；Phase 5 网页实时看板+微信支付准备；小程序 B 端页面（领卡/卡包/商户控制台/核销/电脑看板） | **已上线(后端)** | **v2.6.0 开发版已上传**，待人工提交审核/发布 |

---

## 历史详情（按日期/版本，供回溯）

## 2026-08-17 Bug 修复（P0/P1）+ B 端最小闭环（Phase 1-3）

### 小程序端 Bug 修复（card-counter-miniapp）
- **P0#1 usedTimes 权威源**：`syncManager.push()` 配额 payload 不再上传 `usedTimes`（后端本就按 checkins 派生，客户端上传旧值会冲正核销效果）；移除 merge 中与服务端派生矛盾的本地「撤销补偿」逻辑（会造成双重扣减）。`mergeQuota` 统一采用云端值。
- **P0#2 静默登录 getUserProfile**：`loginByCode()` 不再调用 `wx.getUserProfile`（无手势必挂、新注册小程序不可用），静默登录直接用空昵称建号；资料完善保留在「我的」页官方 `chooseAvatar`/`nickname` 流程。已用 Node 测试验证。
- **P0#3 写入即同步**：`storage.js` 列表类 key 写入后 debounce 触发 `autoSync('push')`，`onHide` 仅作兜底；同步管理器内部持久化改用 `setXxxSilent` 避免自触发循环。
- **P0#4 callApi 401 死循环**：新增 `retry` 参数，401 重登录最多 1 次。
- **P1**：`merge()` 为 checkins/ratings 补 `_cloudKnown` 删除墓碑（网页删了小程序同步移除）；`autoSync` 用 `finished`/`started` 标志修复 `finish` 双调用造成的并发重入；新增 `utils/config.js` 按 `envVersion` 自动选环境（env/service/resourceAppid 不再硬编码）；`storage.set` 捕获写入异常并标记 `storageError`。

### 后端 B 端最小闭环（card-counter-flask，与 quota 共存不替换）
- 新增模型：`Merchant / Staff / CardTemplate / Card / RedemptionRecord / NotificationLog`（保留现有 quota/checkin，零破坏性）。
- 商户鉴权：`@require_staff_auth(role)` 装饰器，强制带 `merchantId` 并校验员工归属实现多商户隔离。
- Phase 1：建商户（创建人=owner）、商户列表、邀请员工、卡种增删查。
- Phase 2/3：发卡（一次性领取码 + 行锁防并发抢领）、领卡、动态 HMAC 签名核销令牌（90s 时效防截图重放）、核销（行锁 + `verify_token` 幂等 + 余额/过期校验 + 乐观锁 version）。`emit_cloud_event`/`send_subscribe_message` 留占位（Phase 4 接入云开发）。
- 测试：Flask test_client 覆盖发卡→领卡→核销→幂等→过期/篡改/跨商户拒绝→用满拒绝，全部通过。

### 待办（人工 / 下阶段）
- 小程序端需增加商户/核销相关页面（当前仅后端 API 就绪，客户小程序未接 B 端 UI）。
- Phase 4 订阅消息 + 云开发定时触发器、Phase 5 实时看板 + 微信支付，依赖 CloudBase 环境（当前仓库外）。
- 小程序/网页部署同现有流程（work.md 快速开始），B 端改动需上传开发版 + 发布后生效。

#### 续：小程序 B 端页面（同日下午）
- 新增 `pages/card/{claim,list,detail}`（领卡 / 我的卡包 / 动态核销码）与 `pages/merchant/{index,redeem}`（商户控制台 / 核销），注册到 app.json；profile 增加「我的卡包 / 我是商户」入口。
- 后端补 `GET /api/cards`（我的卡包）、`GET /api/merchant/cards`（商户卡列表），Flask test_client 验证发卡→领卡→卡包→核销闭环通过。
- **动态核销码当前以文本展示**（仓库无 QR 库），`wx.scanCode` 核销入口已就绪；真实部署建议接入 QR 库或后端出图。
- 已写 `wechat/docs/测试手册-次卡管家-B端.md`（后端自动化用例 + 小程序手动验证 + 回归清单）。
- Phase 4/5（订阅消息、云开发看板、微信支付）仍依赖 CloudBase 环境，当前为占位函数。

#### 续2：Phase 4/5 完成（2026-08-17 晚）
- **Phase 4 接入云开发（可配置、安全 no-op）**：
  - `emit_cloud_event()` / `send_subscribe_message()` 从占位改为**可配置 HTTP 接线**：配置 `CLOUDBASE_EVENT_URL` / `CLOUDBASE_SUBSCRIBE_URL` 时 POST 到对应云函数，未配置则安全 no-op（不抛异常、不阻断核销主流程）。`send_subscribe_message` 始终先落库 `NotificationLog`（pending），便于对账。
  - 新增内部事件接口（@require_internal 保护，共享密钥 `INTERNAL_API_TOKEN`，未配置时仅本进程可调用）：
    - `GET /api/internal/expiring-cards?merchantId&days`：即将到期在售卡（订阅消息定时器用）。
    - `GET /api/internal/redemption-feed?merchantId&limit`：核销事件流（看板备用事件源）。
  - 云函数 deliverable：`cloudfunctions/checkExpiringCards/index.js`（定时触发 → 拉取到期卡 → 调 notifySubscribe 发订阅消息）、`cloudfunctions/notifySubscribe/index.js`（云侧 `cloud.openapi.subscribeMessage.send`）。均通过 `node --check`。
- **Phase 5 实时看板（网页版）+ 微信支付准备**：
  - 新增 `GET /api/merchant/redemptions?merchantId`（员工鉴权）返回最近核销 feed（看板前端轮询）。
  - 新增网页看板 `GET /merchant/<id>?token=` + 模板 `templates/merchant_dashboard.html`：概览（发卡总数/在售/已用满/今日核销）+ 5s 轮询的实时核销记录 + 全部卡表；无 token/非本商户员工 → 302 跳首页。
  - 微信支付准备 `POST /api/merchant/pay/prepare`（owner，受 env 守卫）：未配置 `WECHAT_PAY_MCH_ID/API_KEY` 返回 503 明确错误；`WECHAT_PAY_MOCK=1` 返回占位 prepay 便于联调；真实下单留 v3 TODO（需证书）。新增 `config.WECHAT_PAY_*`。
  - 小程序商户控制台新增「电脑看板」按钮（`pages/merchant/index`）：拼接 `webBase/merchant/<id>?token=` 复制到剪贴板，商户在电脑浏览器打开实时看板；`utils/config.js` 新增各环境 `webBase`。
- **测试**：`test_b_end.py` 已落地为真实文件（原手册仅嵌代码），覆盖 Phase 1-5：商户/越权/发卡/领卡/动态码核销（幂等/过期/篡改/跨商户/用满）/列表/内部接口/核销feed/微信支付守卫，全部 `ALL B-END TESTS PASSED`。修正了手册中原样例的三处缺陷（越权用例用非员工、令牌秒级碰撞需 sleep、建商户需带 body）。Quota 原有流程回归通过（usedTimes 派生不变）。小程序 `node --check` 全绿。
- **发布**：后端 `card-counter-flask` 已 `git push main` 并云托管自动构建上线（验证 `/merchant/<id>` 302）；父仓库 `python` 分支已 `git push`（版本记录）。小程序 **v2.6.0 开发版已上传**（`scripts/upload_ci.js`，经 IPv4 代理 `127.0.0.1:20171` 绕过 IPv6 白名单拦截；上传前已把代理 egress `141.11.22.41` 加入微信上传 IP 白名单）。**待人工**：微信公众平台「提交审核 / 发布」(开发版→体验版→正式版)。B 端功能（发卡/领卡/核销/看板）需发布后对线上用户生效。

## 2026-08-09 网页版微信登录问题排查 + 改小程序码扫码登录（v2.5.0）

### 问题
网页版「微信登录」原本走**公众号网页授权**（snsapi_userinfo），在微信内置浏览器跳转 `official-callback` 拿 token。实测报 `SSLError` → 修复证书后报 `invalid ip ... not in whitelist` → 最终根因：**公众号「心和路」(`wx6a8321a707ccce6d`) 是个人未认证订阅号，无网页授权权限（errcode 10005）**，该路径对任何普通微信号都不可用。

### 决策
用户确认「普通微信号可以登录即可」，且域名仅用云托管 `flask-z9hh-...sh.run.tcloudbase.com`（不用 sslip.io）。采用 **小程序码扫码登录**，不依赖认证服务号。

### 实现（v2.5.0）
- 后端 `views.py` 新增三接口：
  - `POST /api/auth/qr-login/start`：先取小程序 access_token（内存缓存）→ 调 `getwxacodeunlimit` 生成小程序码（scene 限 32 字符，`check_path:false` 便于体验版验证）→ 落库 `LoginSession` → 返回 base64 码 + scene
  - `POST /api/auth/qr-login/confirm`：读云托管注入的 `X-WX-OPENID`（免出站调用）确认会话
  - `GET /api/auth/qr-login/status?scene=`：网页轮询，`confirmed` 返回 JWT token（一次性消费）
  - 另加 `wx_api_request`（POST 通用）与 `get_miniapp_access_token`（缓存）辅助；`LoginSession` 模型由 `db.create_all()` 自动建表
- 小程序 `pages/qr-login/qr-login`：onLoad 读 `options.scene`（decodeURIComponent）→ 调 confirm → 成功 reLaunch 首页；已注册进 `app.json`
- 网页 `index.html`：登录按钮改为「微信扫码登录」→ 弹窗展示码 + 2s 轮询 + 确认后自动登录；保留 `handleWechatLogin` 兼容入口

### 验证
- 后端已上线（curl 验证）：`start` 返回 `生成二维码失败：获取 access_token 失败: invalid ip 49.234.141.38 ... not in whitelist` —— 证明 `WECHAT_APP_SECRET` 云端**已配置**（调用已到达微信），唯一阻塞是 **云托管出口 IP 不在小程序 API IP 白名单**。
- `status`（未知 scene）返回「登录会话不存在」—— 路由与查询正常。
- 小程序 v2.5.0 已上传开发版（miniprogram-ci 成功）。

### 剩余人工步骤（阻塞扫码登录可用）
1. 小程序后台「开发管理 → 开发设置 → IP 白名单」加入 `49.234.141.38`（生成小程序码所需，出站调用）。
2. 小程序后台版本管理 → v2.5.0 开发版 → 提交审核 → 发布（getwxacodeunlimit 的码只对线上版生效）。
两步完成后，普通微信号用微信扫网页二维码即可登录。

---



## 2026-08-10 修复撤销不回退 + 账号绑定（v2.5.1 / v2.5.2）

### v2.5.1 问题：签到撤销后次数不回加
- **根因**：`used_times` 由客户端/服务端增量维护，网页与小程序签到时把本地 `usedTimes` 推回服务端**覆盖**正确值（"中毒"），撤销的减量在下次同步后被覆盖丢失。
- **修复**：`used_times` 改为**单一权威 = 由非撤销签到 `deduct_times` 的 `SUM` 派生**。后端在 `GET /api/quotas`、配额写操作、`POST/PUT/revoke` 签到、新增 `/api/quotas/recompute` 处处重算；客户端不再拥有/覆盖 `usedTimes`（网页字段只读，同步以云端为准）。
- 同时支持**扣减次数设为 0**（赠送/免单）：网页签到计数器、修改弹窗移除非 0 下限；小程序 checkin/edit 输入 min=0；后端 `deduct<0→0`。
- 提交：`card-counter-flask` `66132c2` + `b04e647`（修 `quotas_recompute` 缺 `user` 定义导致的 500）。

### v2.5.2 需求：注册账号可绑定微信，绑定后也可用注册账号登录
- **方案**：`User` 模型本就同时支持 `openid` 与 `username/password_hash`，但此前两套登录各建独立账号、数据割裂。新增绑定使两者指向同一行。
- **实现**：
  - `LoginSession` 加 `mode`（`login`/`bind`）+ MySQL/SQLite 升级迁移。
  - `POST /api/auth/qr-login/bind/start`（需登录）：生成绑定专用小程序码，会话写 `user_id`+`mode='bind'`。
  - `qr-login/confirm`/`status` 支持 bind：扫码后把 openid 回写当前账号；status 返回 `{bound:true}`（不发新 token）。
  - `POST /api/auth/bind-account`（需登录）：微信用户设置/更新账号密码。
  - 冲突（openid/用户名已属其他账号）**拒绝并提示**，不自动合并（孤儿账号需先人工处理）。
  - 网页 profile「绑定微信」「设置账号密码」；小程序 profile「设置登录密码」。
- **验证**：本地集成测试通过——双向归一（微信登录拿到同一 user.id）、绑定冲突 409、用户名冲突 409、微信用户设密码后账号登录同一 id。Web/Mini JS `node --check` 通过。
- 提交：后端 `250a75e`（已 push，云托管自动重建）；小程序 `0bd6d681`（已提交 `python` 分支，待上传/发布）。
- **已知限制**：若微信此前已生成过独立孤儿账号，绑定会冲突报错，需先处理该孤儿账号再绑定。

### 待用户人工步骤
1. 小程序上传/发布 v2.5.2（注意**上传 IP 白名单**：本机 IPv6 出口不在白名单，需白名单内重传）。
2. v2.5.0 发布 + 小程序 API IP 白名单（49.234.141.38）使扫码登录可用。

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

### 2026-08-08 网页撤销/删除配额同步小程序 + 修改页空白（v2.4.6）
- **需求**：① 小程序签到管理中，点某次签到「修改」后页面空白（无修改界面、无改期/撤销），请修正；② 网页版本撤销签到后，没有真正同步到小程序页面；并检查网页版本修改后是否同步到小程序端；③ 网页版本删除次卡后，似乎没有成功保存。网页 + 小程序都更新；验证→发布→更新日志。
- **修复 ① 修改页空白（根因：v2.4.5 修复未发布）**：
  - 复核：`app.json` 已注册 `pages/checkin/edit/edit`；`goEdit` 传 `item.localId`（`normalizeCheckin` 保证恒有值）；`edit.js` 按 `localId` 查找正确；`edit.wxml` 已为 `wx:if loading / wx:elif checkin / wx:else 未找到` 三段式，任何状态都不会空白。
  - 结论：代码修复 v2.4.5 已就绪但**只上传了开发版、从未发布**，用户实际仍跑旧构建 → 空白复现。本次随 v2.4.6 一并上传，发布后即生效。
- **修复 ② 网页撤销/修改未同步小程序（根因：usedTimes 计数器只增不减 + 撤销状态被时间戳 LWW 吞掉）**：
  - 根因 A：`syncManager.mergeQuota` 的 `usedTimes` 用 `max(local, cloud)` 合并——网页撤销后云端 usedTimes 已扣减，但小程序本地旧的较高值在 max 下恒胜 → 撤销次数永不回落到小程序（配额剩余数不变）。
  - 根因 B：`QUOTA_FIELDS` 同时含 `usedTimes`（驼峰）与 `used_times`，第 1 步已对计数器做 max 特殊处理，但第 2 步 LWW 循环只跳过 `used_times`、漏跳 `usedTimes` → 云端较低值会在 `cloudTs > localTs` 时被普通 LWW 覆盖（实测 `mergeQuota` 把 10 覆盖成 8），再叠加补偿就出现二次扣减（6）。
  - 根因 C：签到记录合并是严格 `cloudTs > localTs`，若小程序本地 `updatedAt` 偏大（时钟/并发），云端撤销 `isRevoked=true` 记录不被采用 → 撤销的签到仍显示。
  - 修复（`utils/syncManager.js`）：
    1. LWW 循环同时跳过 `used_times`/`usedTimes`，计数器统一走 max 特殊处理（避免被覆盖/二次扣减）。
    2. 签到合并：**撤销状态以云端为准**——`cc.isRevoked && !existing.isRevoked` 时无论时间戳都采用 `isRevoked=true`，并记录 `newlyRevoked {quotaId, deductTimes}`。
    3. 撤销补偿：合并后对 `newlyRevoked` 逐条从对应配额 `usedTimes` 扣回（clamp≥0）→ 网页撤销真正同步到小程序（签到消失 + 剩余次数恢复）。
  - 网页修改（改期）检查：`submitCheckinDate` → `PUT /api/checkins/<id>/date`，服务端写 `checkin_date`+`date_edit_logs`，`updated_at` 因 model `onupdate=utcnow` 自动刷新 → 小程序整记录 LWW 拉取，日期/改期记录正常同步，无需改动。
  - 验证：临时 node 模拟 5 场景（网页撤销同步 / 网页删配额清除 / 离线本地不丢失 / 未同步本地保留 / 双端均已撤销不二次扣减）全绿 ✅。
- **修复 ③ 网页删除次卡未保存（根因：deleteQuota 从未调用服务端 DELETE）**：
  - 根因：`index.html deleteQuota` 只 `localData.quotas.filter(...)` + `saveLocal()`，**未请求服务端**；刷新后 `init()→syncFromServer()` 又从云端拉回 → 删除"没保存"。
  - 修复（`templates/index.html`）：
    1. `deleteQuota` 本地先移除，登录态下调用 `DELETE /api/quotas/<qid>`（`q.id` 缺失时按 `localId` 兜底查云端列表匹配 id）；云端失败仅提示、不影响本地。
    2. `pushToServer` 原先对 `quotas` 不回写 `res.id`（`collection !== 'quotas'` 分支排除），导致网页新建的配额永远没有服务端 id、无法删除——改为三类都回写 `id` 与 `_synced`。
  - 小程序侧联动：`syncManager.merge` 新增**删除同步**——云端已知（`_synced` 或 `_cloudKnown`）但本次拉取不存在的配额 → 从本地移除；未同步过的本地记录保留待推送。网页删除后小程序下次下拉即清除该配额。
- **验证**：
  - 小程序 `syncManager.js` 等 7 个 JS `node --check` 全过；merge 逻辑 node 模拟 5 场景全绿 ✅
  - Flask `index.html` 内联 JS 语法校验 OK（`node --check` 提取脚本通过）
  - miniprogram-ci 上传 **v2.4.6 成功** ✅（zip 87421B / 39 文件）
- **部署**：
  - 网页：嵌套仓库 commit `05330b2`（deleteQuota+pushToServer）→ `git push origin main` → 追加空提交 `492f66f` 强制触发云托管重建；**线上已生效** ✅（轮询 probe 5：size **68977**，`del_marker=1`、`qpush=1`，含删除确认文案「删除后该次卡将从云端移除」与 pushToServer 配额 id 回写）
  - 小程序：**v2.4.6 已上传（开发版本）**，**仍待人工提交审核+发布**（wujie 微前端无法脚本化提交审核）
  - 提交（父仓库 base-table python）：`78893457`（syncManager.js 同步增强）随本次 work.md 提交
- **遗留提醒**：v2.4.6 仍待人工：版本管理→选 2.4.6 开发版本→提交审核→审核通过后发布（发布后 v2.4.5 的修改页空白修复一并生效）。

### 2026-08-08 签到「修改」页打不开加固（v2.4.7）
- **需求**：小程序签到界面点「修改」无法打开页面（网页版本正常），请检查并修正。
- **排查结论**：
  - 修改页三段式 wxml 兜底（v2.4.5）、页面注册（app.json）、`goEdit` 传 `localId`、`edit.js` 按 localId 查找——链路本身正确；**用户端持续复现主要系未发布所致**（v2.4.5/v2.4.6 均仅上传开发版）。
  - 同时做四项加固，杜绝一切可能的「打不开/空白」成因：
- **加固项**：
  1. `pages/checkin/edit/edit.js`：新增 `_matchId(x, id)` 统一匹配 `localId`/`local_id`/`id` 三种键，`loadData`/`changeDate`/`revoke` 全部改用（兼容历史数据或跨端记录只有部分 id 键的情况）。
  2. `checkin.wxml`/`history.wxml`：「修改」按钮 `data-id="{{item.localId || item.id}}"` 回退传 `id`，杜绝空 id。
  3. `app.json`：移除 `lazyCodeLoading: "requiredComponents"`（v2.4.5 曾标记为空白/打不开的疑似诱因，去掉以排除懒加载竞态）。
  4. 修改页 `edit.wxml` 保持 `wx:if loading / wx:elif checkin / wx:else 未找到` 三段式，任何状态都有渲染。
- **验证**：`edit.js`/`checkin.js` `node --check` 过；`app.json` JSON 合法；miniprogram-ci 上传 **v2.4.7 成功** ✅（zip 87781B / 39 文件，size 129399B）
- **部署**：
  - 小程序：**v2.4.7 已上传（开发版本）**，**仍待人工提交审核+发布**（wujie 微前端无法脚本化提交审核）
  - 提交（父仓库 base-table python）：`018abab2`（加固改动）随本次 work.md 提交
- **遗留提醒**：**务必发布 v2.4.7 后该问题才会消失**（此前 v2.4.5 的修改页修复同样未发布）。版本管理→选 2.4.7 开发版→提交审核→审核通过后发布。

### 2026-08-08 小程序+网页「修改签到」支持编辑备注+日期（v2.4.8）
- **需求**：小程序、网页在修改签到（改期/撤销管理）时，都可修改**备注**和**日期**两个字段；改后重新发布部署。
- **后端**（`wxcloudrun/views.py`）：
  - 新增 `PUT /api/checkins/<int:cid>`：更新 `note`（`db.session.commit()` 触发 `updated_at` 模型 `onupdate=utcnow` 自动刷新 → 跨端 LWW 同步生效）。
- **小程序**（`pages/checkin/edit/`）：
  - `edit.wxml`：日期改为 `<picker mode="date">`（start/end=今天±30天，改期后显示「（已改期）」），备注改为输入框，新增「💾 保存修改」按钮（无改动时禁用），保留「↩️ 撤销签到」。
  - `edit.js`：`onDateChange`/`onNoteInput`/`_updateCanSave`/`saveChanges`——本地更新 + 云端推送（日期走 `PUT /api/checkins/<id>/date` 记录改期日志；备注走 `PUT /api/checkins/<id>`）；云端失败置 `_synced=false` 待下次推送补齐；`_matchId` 兼容 `localId/local_id/id`。
  - `edit.wxss`：新增 `.date-picker/.edit-input/.act-btn.save` 样式。
- **网页**（`templates/index.html`）：
  - `openCheckinEdit`：备注改为可编辑输入框 `id="editCheckinNote"`，保留日期输入，按钮统一为「保存修改」+「撤销」。
  - 新增 `saveCheckinEdit`：日期/备注任一变化才保存；日期走 `PUT /api/checkins/<id>/date`（含±30天校验与改期日志），备注走 `PUT /api/checkins/<id>`；本地 `updatedAt` 刷新 + `_synced` 回写；替换原 `submitCheckinDate`。
- **验证**：
  - Flask `py_compile` 过；`index.html` 内联 JS `node --check` 过；`submitCheckinDate` 零残留引用
  - 小程序 `edit.js` `node --check` 过；miniprogram-ci 上传 **v2.4.8 成功** ✅（zip 88768B / 39 文件，size 130666B）
  - 网页线上轮询 probe 5：size **69830**，`saveCheckinEdit`(2) / `editCheckinNote`(1) 出现，`PUT /api/checkins/1` 由 **404→401**（路由已上线且鉴权生效）✅
- **部署**：
  - 网页/后端：嵌套仓库 `4eb3546`（views.py + index.html）→ `git push origin main` → 空提交 `05a3efc` 触发云托管重建；**线上已生效** ✅
  - 小程序：**v2.4.8 已上传（开发版本）**，**仍待人工提交审核+发布**（wujie 微前端无法脚本化提交审核）
  - 提交（父仓库 base-table python）：`c354d3b2`（edit 页改造）随本次 work.md 提交
- **遗留提醒**：v2.4.8 仍待人工：版本管理→选 2.4.8 开发版→提交审核→审核通过后发布（发布后小程序端备注/日期编辑才可见）。

### 2026-08-08 网页总览「@」语义修正 + 历史数据清理（v2.4.9，纯网页端）
- **现象/根因**：网页总览配额详情的签到记录历史，格式为 `2026-08-05 扣1次 @8/5 g金蛇送福`。其中 `@` 后内容实际是 **商家(merchant)** 字段（仅当本次签到商家≠配额商家时显示），**不是备注(note)**；备注另以 ` · ` 分隔显示。用户本意「@ 后面是备注」，但因「商家名称」「备注」两个输入框外观相似，曾把想记的内容误填进商家框 → 存入 merchant → 总览以 @ 显示，而签到详情「备注」字段为空，造成「备注丢失」的观感。备注字段本身同步正常（后端 POST 持久化、小程序推送/拉取均带 note）。
- **修复**（`templates/index.html`）：
  - 总览渲染：'`@` + note' 展示备注，`· 商家：X` 仅在签到商家≠配额商家时带标签展示（实现用户本意 @=备注，且商家信息不丢失）。
  - 签到弹窗：当配额已有商家时**默认隐藏「商家名称」输入框**，仅显示「本次为不同门店？」链接可展开（`confirmCheckin` 对空商家回退到配额商家，安全）；避免再误把备注填进商家框。
- **一次性数据清理**（受临时令牌保护的 `/api/admin/migrate-merchant-to-note`，执行后已删除路由）：把「merchant 与所属配额 merchant 不同、且 note 为空」的签到记录，将 merchant 文本并入 note，并把 merchant 归一化为配额 merchant。共迁移 **27 条**；另有 **25 条**因 quota_local_id 找不到对应配额（孤儿记录，本不出现在任何配额详情中）被安全跳过。
- **验证**：
  - 网页线上：空提交 `c11238f` 触发重建 → 迁移接口上线（无令牌 403、带令牌 200 且 migrated=27）；幂等二次执行 migrated=0；删除路由后空提交 `379423f` 重建 → 接口 404、页面含 `@'+esc(c.note)` 渲染、页面体积 69830→77837。✅
  - 小程序：无需改动（note 展示逻辑本就正确）。
- **部署**：网页/后端 `1414e45`+`c11238f`（含路由）→ `9d737db`+`379423f`（删路由+重建）；**线上已生效** ✅。小程序无改动，**无需发布**。
- **遗留提醒**：25 条孤儿签到（quota 已删或无对应）如需也可单独处理，但不影响任何配额详情展示，故未动。若日后删除配额希望同时清理其签到，可在 `delete_quota` 增加级联。

### 2026-08-08 补充：25 条孤儿签到处置（v2.4.9 延续）
- **背景**：上轮数据清理跳过 25 条「quota_local_id 无对应配额」的孤儿签到（本不出现在任何配额详情）。用户要求「显示25条孤儿记录」。
- **显示**：网页签到记录列表（签到 tab → 全部）为孤儿签到加红色「（无配额）」标记（`index.html` renderCheckinRecords），已上线。
- **审查**：经临时诊断路由列出 25 条，确认**全部为测试/调试数据**（merchant 如 测试店/迁移验证/去重测试/X/Y/云托管验证/涂来涂去，note 如 备注测试/ceshi remark；其中 5 条已撤销）。
- **处置**：用户确认「全部删除」。经临时删除路由删除 25 条，复检孤儿数=0。两个临时路由（list/delete）已删除并重建下线（均 404）。
- **验证**：删除接口 `deleted=25`；复检 list 接口 `count=0`；删除/列表临时路由均 404；页面仍含「无配额」标记。✅
- **部署**：`138c1a8`+`f7e723b`（孤儿标记）→ `c958a21`+`53c3d59`/`62ef6cc`（诊断）→ `c73d56a`+`bd63103`（删除）→ `a2c98ad`+`2871166`/`871af22`（删临时路由+重建）；**线上已生效** ✅。

### 2026-08-08 删除次卡级联删除关联签到（v2.4.10）
- **现象/根因**：删除次卡（配额）时，`delete_quota` 只删 Quota 不删关联 Checkin → 产生孤儿签到（正是上轮 25 条孤儿的根源）。用户在删除次卡时也未收到「会连带删除签到」的提示。
- **修复**：
  - 后端 `dao.py delete_quota`：按 `quota_local_id == q.local_id 且 user_id == q.user_id` 级联删除关联 Checkin 后再删 Quota，孤儿从源头不再产生。
  - 网页 `index.html deleteQuota`：删除前统计该次卡未撤销签到数，确认框提示「将一并删除且不可恢复」；确认后本地同步移除该配额所有签到（`localData.checkins` 按 quotaId 过滤），保持本地与云端一致。
  - 小程序 `quota.js remove()`：确认框提示连带删除 N 条签到（本地按 quotaId 匹配 localId/id 统计）；确认后本地同步删除关联签到。
  - 小程序 `syncManager.js merge()`：云端已删除配额（其他端操作）同步拉取时，其本地关联签到一并清理，避免孤儿签到被再次推送。
- **部署**：
  - 网页/后端：`a811774`（修复）+`6a97487`（空提交触发重建）；线上验证页面含「将一并删除且不可恢复」✅。
  - 小程序：`78f020a1`（父仓库）→ 上传开发版 **v2.4.10** 成功（`upload_ci.js 2.4.10`）；**待人工发布**（wujie 微前端无法脚本化）。
- **验证**：`node --check` 小程序两文件 ✅、`py_compile dao.py` ✅、网页 curl 特征串 ✅。后端级联效果建议删除一条有签到的次卡后复查孤儿数。

### 2026-08-08 鸿蒙版（Cloud 静态托管）扣减次数/备注保存修复
- **问题**（用户报告）：鸿蒙 WebView 版更改扣减次数（已用次数/总次数）不识别修改、不能自动保存，修改备注也有问题
- **根因**：`code/card-counter-cloud/index.html`（鸿蒙 WebView 加载的静态托管版）配额表单用 `<form onsubmit>` + `type="submit"` — 鸿蒙 WebView (ArkWeb) 对 form submit 事件支持不完整，点击保存触发默认表单提交/不触发 onsubmit → saveQuota 不执行 → 次数/备注修改丢失
- **修复**（card-counter-cloud/index.html）：
  1. 配额表单 `<form onsubmit>` → `<div>`，保存按钮 `type="submit"` → `type="button" onclick="saveQuota()"`（不再依赖表单提交事件）
  2. `saveQuota()` 去除 `e.preventDefault()` 依赖 + 补必填校验（商家/事项为空时 toast 提示）
  3. 签到弹窗新增「备注（可选）」输入框 `checkinNote`（与 Flask 版对齐），`confirmCheckin` 保存 note 字段
  4. 今日签到记录/详情页签到记录展示备注（`c.note`）
  5. 签到弹窗 +/− 按钮补 `type="button"`（防 ArkWeb 表单语义干扰）
- **同步**：`pushToCloud` 用 `{...data, userId}` 全字段展开，note 随记录自动同步（CloudBase NoSQL 无需 schema）
- **测试**：本地静态服务 + 浏览器实测 — 新增配额（次数/备注）✓ 编辑配额真实点击保存按钮（usedTimes/note 保存、弹窗关闭）✓ 签到填备注 ✓ 详情页展示备注 ✓ JS 语法检查 ✓
- **部署状态**：待部署静态托管（需 CloudBase 授权）

### 2026-08-08 签到修改页扣减次数/备注保存修复（小程序 v2.5.3）
- **问题**（用户报告）：签到修改页改扣减次数不识别修改、不能保存；改备注也有问题
- **根因**（pages/checkin/edit/edit.js + edit.wxml）：
  1. `saveChanges()` 早退条件 `if (!dateChanged && !noteChanged) return` **漏掉 deductChanged** → 只改扣减次数提示「没有修改」直接返回，永不保存
  2. edit.wxml 扣减次数 input `value="{{checkin.deductTimes}}"` 绑定错误——onDeductInput 更新的是顶层 `deductTimes`，input 显示 checkin 对象原始值，用户输入后显示不回显/保存取错值
  3. 扣减次数修改未同步本地配额 usedTimes 差值（服务端会重算，本地会不一致）
- **修复**：
  1. saveChanges 早退条件加 `deductChanged`（日期/备注/次数任一修改均可保存）
  2. wxml input 改绑 `{{deductTimes}}`
  3. 扣减次数变化时本地配额 usedTimes 按差值同步调整（`newDeduct - oldDeduct`）
- **测试**：
  - 新增 `scripts/test_edit.js` 7 场景（只改次数/只改备注/只改日期/无修改/改为0/配额差值双向）全部通过
  - 后端 PUT `/api/checkins/<id>` 实测：deduct 2→5→1，quota usedTimes 同步重算 2→5→1，note 更新 ✓
- **上传**：`NODE_PATH=$(npm root -g) node --dns-result-order=ipv4first scripts/upload_ci.js 2.5.3 "..."` — **关键：加 `--dns-result-order=ipv4first` 强制 IPv4 出口，绕开本机 IPv6 不在上传 IP 白名单的拦截**（v2.5.2 因此一直传不上，本次成功）
- **已提交**：`ded939dc`（python 分支），v2.5.3 开发版已上传 ✅（待人工提交审核发布）

### 2026-08-08 撤销签到云端优先修复（小程序 v2.5.4 + 网页）
- **问题**（用户报告）：部分签到显示「撤销成功」但实际未撤销（如涂来涂去改期记录）；改期后需显示新时间
- **根因**：
  1. 小程序 edit.js revoke()：`app.callApi(.../revoke).catch(() => {})` 吞掉云端失败 + **无条件 toast「已撤销」+ 本地先标记 isRevoked=true** → 云端失败时本地显示已撤销，实际云端未撤销（数据不一致）
  2. 网页 revokeCheckin 同样：`.catch(() => { ci._synced = false })` 但 toast 已无条件显示成功，本地已标记撤销
  3. 无 id 记录（本地新建未同步）：`POST {...c, isRevoked:true}` 未显式带 localId 幂等
- **修复**：
  1. 小程序 revoke()：**await 云端结果**——云端成功才改本地 isRevoked + 返还配额；云端失败提示「撤销失败，请检查网络」，本地保持原状态可重试
  2. 无 id 时显式 POST `{localId, quotaId, merchant, deductTimes, checkinDate, checkinTime, note, isRevoked:true}`（服务端按 localId 幂等）
  3. 网页 revokeCheckin 同步修复：await revoke API，成功才改本地；失败 toast 提示不误报
  4. 改期显示：小程序 edit 保存后 loadData 刷新（wxml 绑 checkin.checkinDate）；网页 saveCheckinEdit 后 renderAll 刷新 + 「已改期」标记 —— 均验证显示新时间 ✓
- **测试**：
  - 新增 `scripts/test_revoke.js` 4 场景（云端成功改本地/云端失败不改本地/无id幂等/失败回滚）✓
  - 后端 API 实测：创建→改期 8-01→8-05→撤销→quota 返还 0→重复撤销幂等返回「该签到已撤销」✓
  - 网页 E2E（浏览器）：改期 08-05 后列表显示新时间+已改期标记 ✓；撤销后 server isRevoked=true + quota=0 + 本地同步 ✓
- **上传**：`HTTPS_PROXY=http://127.0.0.1:20171 node --dns-result-order=ipv4first scripts/upload_ci.js 2.5.4 "..."` — **关键：走本地代理 20171 强制 IPv4 出口**（v2.5.3 时 `--dns-result-order` 单独有效，v2.5.4 需叠加代理；本机 IPv6 路由正常时会走 IPv6 被微信 IP 白名单拦截）
- **发布**：小程序 v2.5.4 开发版已上传 ✅（待人工提交审核发布）；后端 commit `d8e228e` 已 git push 云托管自动构建 ✅

### 2026-08-08 网页版同步补齐修复（后端 fc5f0d7）
- **检测发现**（用户要求同步检测网页版）：
  1. `pushLocalPending` 只推送「云端没有的 localId」——改期/备注/扣减次数修改 PUT 云端失败后 `_synced=false`，但手动同步**永不补推**（原逻辑按云端存在性判断，本地失败修改丢失）
  2. `saveCheckinEdit` 改扣减次数**未同步本地配额 usedTimes 差值**（小程序 v2.5.4 已修，网页版漏了）→ 本地 quota 与签到记录不一致
- **修复**（wxcloudrun/templates/index.html）：
  1. `pushLocalPending` 改为：云端没有的 localId 全推；云端已有但 `_synced===false` 的记录补推（POST 按 localId 幂等更新）
  2. `saveCheckinEdit` 改扣减次数时本地配额 usedTimes 按差值调整（`Math.max(0, used + (newDeduct - oldDeduct))`）
- **验证**（浏览器 E2E，本地 5098）：
  - 修改备注 → mock 云端 PUT 失败 → `_synced=false` → 手动同步 → **云端 note 已补推更新** ✓
  - 扣减次数 2→5 → 本地 quota usedTimes 5 = 服务端 5 ✓
- **发布**：commit `fc5f0d7` 已 git push → 云托管自动构建 ✅（网页随构建自动上线）
