# MEMORY.md — 次卡管家（card-counter）项目长期记忆

## 部署与发布（勿混淆）
- 生产后端 = 微信云托管 cloud.weixin.qq.com：env **prod**(prod-d5gm4a2q00a7f9209) / 服务 **flask-z9hh** / GitHub `yanqingwang/card-counter-flask`；**push main 即自动部署**（不跑 CLI，构建需数分钟）。
- ⚠️ `cardcount-d4gjfjexz3097d803` 是无关 tcb 测试环境，**勿走 tcb/CloudBase**。
- 线上域名 `https://flask-z9hh-281177-5-1453124923.sh.run.tcloudbase.com`（小程序 `utils/config.js` 三环境 webBase 指向它）。`/api/health` 不存在→404 属正常；探路由判版本：`/api/cards/1/refund-estimate` 401=服务在线，新发布专属路由仍 404=旧代码。
- **`cardcount-web`（commercial 演示服务）不 push 自动部署** → 须在云托管控制台手动「重新发布」；沙箱无凭据（无 `~/.tcb`），无法代劳。**判版本看字节数**：`curl -s -o /dev/null -w '%{size_download}' <域名>/web/app.js`（091ebde=51866 / 9d7b61a=89803）。服务缩容到 0：首请求 503、重试即 200。runbook=`docs/商业网页部署到云托管-runbook-2026-09-05.md`。
- 小程序上传：`cd card-counter-miniapp && node scripts/upload_ci.js <版本> "<描述>"`（脚本已内置强制 IPv4 DNS + 8 次重试）。⚠️ 微信报 `-10008 invalid ip: 2408:820c:...` 是**本机 IPv6 出口不在白名单**，不是要改白名单；国内 IPv4 出口 `112.65.121.227` 已在白名单（用国内回显验证 `curl -4 -s http://ip.3322.net/`；**勿用 ifconfig.me**——它返回国外代理 141.11.22.43）。IPv4 路径约 50% 抖动，失败重跑即可；同版本号可重复上传（覆盖开发版）。
- 发布状态（2026-09-11）：顾客端 **2.7.2 已上传开发版**（待用户在 MP 后台提交审核）；企业端 merchant-miniapp 已推 GitHub 但**无 AppID 未上传**；后端 flask 已推 `f43a4d3`、commercial 已推 `bf9178b`（后者需手动重发布）。
- ⚠️ 生产库不可从沙箱直连（凭据仅在容器 env）。仓内 `card_counter.db`(SQLite) 是本地 dev/种子数据。`card-counter-flask/count_users.py` 统计用户数（设 `MYSQL_*` 可指生产）。

## 代码库地图（/home/wang/wk/code/）
- `card-counter-flask/` 生产后端（微信云托管链路，Flask 2.3.3 + SQLAlchemy **1.4.41**）。
- `card-counter-miniapp/` 顾客端小程序（v2.7.x）。⚠️ **不是独立 git 仓**：git 根是 `/home/wang/wk`（remote=base-table.git，branch `python`），只 `git add code/card-counter-miniapp`。
- `card-counter-merchant-miniapp/` 独立企业端小程序 MVP（自有 git 仓，待新 AppID）。
- `card-counter-commercial/` 商业化主开发仓（自包含 `python run.py`，SQLAlchemy 2.0.51；已部署 `cardcount-web`）。
- `wechat/` 仅工作区（AGENTS/docs/logs/memory/tasks）。

### 本地启动（测试用）
- commercial 演示 Web（含商户端/owner/平台三套 UI + 全部 API）：
  `cd card-counter-commercial && PORT=8090 WEB_CONCURRENCY=1 THREADS=8 DB_URL="sqlite:///data/cards.db" SEED=1 .venv/bin/gunicorn -c gunicorn.conf.py wsgi:app`
  入口 `/`、`/web/app.js`；演示账号 `admin1`/`clerk1`/`platform`，密码 `Demo@123456`；`GET /api/dev/state` 给出全部演示 ID
  （customerId1 / customerOpenid `cust_demo` / merchantId1 / ownerStaffId1 / frontStaffId3 / platformAdminId1）。
- 生产后端（顾客端 API + H5）本地：`cd card-counter-flask && TMPDIR=/home/wang/wk/tmp .venv/bin/python run.py 0.0.0.0 8091`
  入口 `/`(顾客端 H5 PWA)、`/merchant/<id>`(商户看板，会 302)。默认端口 5000 与 commercial 冲突，须显式传端口。
- 两个服务都必须用**受管后台**（`run_in_background`）启动，`nohup ... &` 会在该次 Bash 调用结束时被回收。
- 小程序（顾客端/企业端）本地测试需微信开发者工具，沙箱内跑不了。

## card-counter-commercial 约定（主开发仓）
- 结构 `src/backend/{models,db,services,routes,seed,app,tests}`；列名与 JSON 均 camelCase，服务层 snake_case（路由 `_snake()`）。
- 强一致原语：`atomic()`(MUTEX+commit/rollback) / `lock()`(MySQL FOR UPDATE，SQLite 忽略) / `IdempotencyKey` / `audit()`+`AuditLog` / `recompute_card_aggregates()`。
- 卡种：`times`(扣 deductTimes) / `stored`(扣 amountCents，balanceCents=faceValue−已核销)。
- 动态核销码：cardId+exp+HMAC，75s TTL，token 即幂等键防重放。
- 鉴权：**首选 `Authorization: Bearer <token>`**（`_staff`/`_platform_admin`/`_customer_id` 均支持）；演示头（仅演示模式）商户 `X-Merchant-Id`+`X-Staff-Id`、顾客 `X-Customer-Id`+`X-Customer-Openid`、平台 `X-Platform-Admin`。`_run(fn)` 把 BizError 转 JSON；`ensure_permission(staff,perm)`。
- 账号：`UserAccount.actorType` ∈ platform_admin/staff/customer；`AuthToken` 不透明 DB 会话(12h，可吊销)。顾客由公众号 openid 经 `auth_svc.wechat_login()` find-or-create。真实公众号只需 env `WECHAT_OAUTH_APPID/SECRET/REDIRECT/SCOPE`(+`WECHAT_OAUTH_ALLOW_DEMO=0`)，未配置自动降级演示登录。seed 账号 `admin1`/`clerk1`/`platform`，密码 `Demo@123456`。
- 测试：`TMPDIR=/home/wang/wk/tmp PYTHONPATH=src .venv/bin/python run_tests.py` → **171/171**；单跑 `-m unittest backend.tests.<name>`。⚠️ 全量 ~4.5 分钟，**必须 `run_in_background=true` 落日志**（前台会被 SIGTERM 且无任何输出；`nohup ... &` 起的 gunicorn 也会在该次调用结束时被回收）。
- 已有能力：经营看板 `/api/merchant/dashboard`(view_report) / 平台总览 `/api/platform/overview`；`services/wechat_auth.py`+前端登录闸门；跨租户 `cardkey|ledger|sync|recon.py`；商户端卡详情聚合 `GET /api/merchant/cards/<id>/detail`。
- 鉴权收紧（2026-09-11）：`GET /api/cards/<id>/records` 原先**无鉴权**，现要求「持卡顾客本人 或 所属商户员工(view_report)」，跨商户 404。`/api/merchant/redeem` 现透传 body `idempotencyKey`（原先被忽略 → 并发共用 5s 默认键被幂等短路、掩盖超卖）。
- 压测脚本 `scripts/load_redeem_http.py`（纯标准库）：`--base <url> [--kind times|stored] [--capacity N] [--concurrency M] [--expect-oversell]`。`.venv` 已装 `PyMySQL==1.1.1`、`gunicorn==26.0.0`。

## 跨租户集成约定（2026-09-10）
- 中间平台 = **唯一真相源**；两端本地账本只是缓存+待确认队列，冲突以平台账本+`seq` 为准。
- 卡密：展示编号 `cardNo`（非凭证，明文）≠ 兑换码 `code`；只存 `codeHash=sha256(normalized)`+`codeTail`，明文仅生成响应下发一次（`CardBatch.codesReturnedAt`）。批次 `secret` 做 `HMAC(secret, cardNo|amount)`。字母表 31 字符×12 位。
- 状态机 `CREATED→ISSUED→REDEEMED→BOUND→ACTIVE→CONSUMED/EXPIRED/REFUNDED`；**绑账号不绑设备**（`accountKey=cust:<id>`）。
- 账本复式记账：同一交易 debit/credit **双分录共享全局单调 `seq`**；`balance=Σcredit−Σdebit`；每分录写 `balanceAfter`。账户 `cust:<id>`/`merch:<merchantId>`（发卡方为负债账户）。
- 同步 `GET /api/changes?since=seq[&scope=me|all]`（all 仅平台）+ `SyncCursor(lastSeq/ackedSeq)`；REST 增量 + 游标兜底。
- 对账三方：发卡方账 × 平台账本 × 客户端上报 spend_event；卡级校验只对**已兑换卡**，未兑换卡 `remainingCents=0` 正常（否则误报）。
- ⚠️ 撞库风控事件必须在**主事务回滚后以独立事务补记**（`/api/redeem` 手工 try/except，非 `_run`）。
- 脚本 `scripts/verify_cross_tenant_ui.py`、`scripts/smoke_login.py`。

## 微信订阅消息（P0-4，2026-09-11）
- 底座 `services/wechat_mps.py`：token 内存缓存（Lock+提前 300s+失效重试一次）；`subscribeMessage.send` 直连/代理双模式（`WECHAT_SUBSCRIBE_PROXY`）。errcode 归一：43101→no_grant、40001/40014/42001/40013→token_invalid、47003/41030→bad_param、45009/45011→rate_limited、40003→user_not_found。
- **一次性订阅**：每次授权只能发一条 → 必须有 `SubscribeGrant` 台账（(openid,scene) 唯一）；`remaining<=0` 不发，直接记 no_grant。
- 状态：`sent`(+delivered) / `sent`+channel=demo / `no_grant` / `failed`；**failed 与 no_grant 不扣额度**；按天去重、次日自动重试、`force=true` 立即补发。
- 字段适配：thing 截 20 字、amount 分→元两位、date 补 `yyyy-MM-dd HH:mm`；**缺字段不造空 value**（否则 47003）；可用 `WECHAT_SUBSCRIBE_FIELDS`(JSON) 覆盖映射。
- env：`WECHAT_MINI_APPID/SECRET`(回退 `WECHAT_APP_ID/SECRET`)、`WECHAT_TMPL_EXPIRE|LOW_TIMES|LOW_BALANCE`、`WECHAT_SUBSCRIBE_PAGE|STATE`；**全不配=自动降级演示，不报错**。
- 接口：`GET /api/notifications/subscribe/config`(公开，只下发模板 ID 不下发 Secret)、`POST /api/notifications/subscribe`、`GET /api/notifications/grants`、`GET /api/merchant/notifications`(不返 openid)、`POST /api/merchant|platform/notifications/scan`。
- 离线验证 `scripts/wx_stub_proxy.py` + `scripts/verify_notify_ui.py`。演示库 times 卡属**商户 3**，商户 1 只有一张储值卡 → 造演示数据须把商户 1 储值余额压到阈值内，否则扫不到。文档 `docs/订阅消息接入-2026-09-11.md`（小程序端片段未提交，遵守"不影响原小程序"约束）。

## 产品/UX 原则
- **禁止强制登录墙**：核心功能（次卡/签到/统计/评价）本地优先可用，登录可选，登录后静默同步(`bestEffortSync`)。
- 合规闸门（上海，完成前不对真实客户收费）：预付卡备案→资金存管→微信支付类目资质→退费规则明示。

## 并发/部署约束（实测）
- SQLite+RLock 仅单进程(workers=1)安全；MySQL 行锁可多 worker。云托管容器 FS 临时 → 生产必用 MySQL。
- 🔴 实测（`scripts/load_redeem_http.py`）：单 worker+SQLite 正确（次数卡 40 并发/容量 10 → 10 成功；储值卡 80/20 → 20 成功、余额 0）；**4 worker+SQLite 超卖**（次数卡 → **13 成功**；储值卡 → **23 成功、余额 −300 分**）。→ `gunicorn.conf.py` 的 `workers=1` 是**正确性约束**而非保守选择。
- 🔴 多 worker 时 `SEED` 必须=0：`SEED=1` 会让 N 个 worker 并发 seed 撞 `UNIQUE constraint failed: merchant.id` → **worker 全部 boot 失败**。先单进程 `SEED=1` 种子一次，再 `SEED=0` 起多 worker。
- 生产后端 SQLAlchemy **1.4**：迁移里 `_conn.commit()` 会 AttributeError（1.4 legacy Connection 无 `.commit()`，2.x 才有）且被 except 静默吞掉 → 补列**中途中断**。必须用 `_commit()`：有 `.commit()` 用之，否则回落 `conn.connection.commit()`（重发 `COMMIT` SQL 会报 "no transaction is active"，DDL 已 autocommit）。

## 踩坑清单
- 跨事务独立 session 必须函数内动态读 `db._engine`（顶层 import 为 None）。超额拦截主事务 rollback 后落告警须用独立 session，否则 SQLite `database is locked`。
- `atomic(session) as s` 必须绑定；`_snake` 后键变 snake(voidType→void_type)；BizError 可选 `detail` 供落告警。
- 演示时间相对 `datetime.utcnow()`，勿用 `date.today()` 硬编码（致偶败）。
- `migrate()` 增量补列（可空追加），新表 `create_all()`，老库升级不丢数据。
- ⚠️ 本机 `/tmp` 仅 10MB tmpfs → 跑测试前 `export TMPDIR=/home/wang/wk/tmp`，否则 `database or disk is full`（假性失败）。
- ⚠️ 系统 Python 受 PEP 668 保护：依赖装仓内 `.venv`（`python3 -m venv .venv && .venv/bin/pip install Flask==3.1.3 SQLAlchemy==2.0.51`）。
- ⚠️ Playwright：自带 chromium 版本常不匹配 → `p.chromium.launch(executable_path="/usr/bin/chromium")`；`wait_for_selector` 默认等 visible，等**隐藏**元素须显式 `state="hidden"`。commercial 的 `.venv` 没装 playwright，用 `/home/wang/wk/code/.venv/bin/python`。
- ⚠️ 前端 Tab 回调里 `await tabXxx()` 重绘整页会清空刚写入的结果面板 → 只局部更新目标容器。
- ⚠️ `pkill -f "<关键字>"` 会匹配到执行它的 shell 自身并杀掉（表现为 SIGTERM、后续命令不执行）→ 先 `pgrep -af` 看清再 kill。
