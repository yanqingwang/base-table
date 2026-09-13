# work.md — 次卡管家（card-counter）开发记录（AGENTS.md 约定）

> 按 AGENTS.md：微信云托管/小程序（次卡管家）的开发记录统一写本文件，勿写全局 memory/work.md。
> 更新时间：2026-09-12。本文件为交接速查；AI 长期记忆见 `.workbuddy/memory/MEMORY.md`。

## 当前进度（截至 2026-09-13，全部实测通过）

### 2026-09-13 鉴权安全加固（P0 修复）+ 生产入口改 gunicorn
- **评估结论**：登录鉴权能力存在（账密/扫码/公众号/小程序+JWT+角色），但有 P0 级缺陷——**生产 JWT_SECRET 未配置（回退公开默认值）→ 任何人可伪造任意用户 token**；登录无防爆破；B端控制台 token 走 URL、无登出吊销；web 员工入驻不可用。
- **修复（`93baa9c`，已上线 flask-z9hh-062）**：启动守卫（USE_MYSQL+默认密钥拒绝启动）、登录防爆破（login_lockouts 表 5 次锁 15 分钟）、密码策略（≥8 位含字母数字）、JWT jti+revoked_tokens 登出/改密即时吊销、控制台 token 移出 URL+登出按钮、员工邀请码（staff/invite-code + staff/join + 控制台「团队」Tab）、账密用户合成 openid（pw:<username>）。
- **生产验证**：云端调试实测错误密码 ×5 → 429 锁定 ✓；`JWT_SECRET`（64hex）已配到 flask-z9hh 环境变量（值在 .secrets/cardcount.env）。
- **测试**：新增 test_auth_security.py 10 项全绿；五套回归全通过。
- **数据保护**：部署前手动快照备份成功（备份 ID 10542318，备注 before-auth-hardening-20260912，可回档）。
- **附带发现并修复（`d946b2b`，已 push）**：生产容器 CMD=python3 run.py 且 FLASK_DEBUG 缺省 true → Werkzeug 调试器暴露（Debugger PIN 运行日志可见，RCE 面）+ 无 worker 管理；改为 gunicorn（wsgi.py + gunicorn.conf.py，WEB_CONCURRENCY 默认 1 语义不变）+ FLASK_DEBUG 默认 false。
- ⚠️ **待完成**：gunicorn 修复版本（-063/-064/-065）三次构建成功但发布停滞（线上仍 -062）——需手动发布：控制台 → flask-z9hh → 部署发布 → 发布 → 选择方式「执行流水线」→ 发布；完成后验证 `/` 200 且运行日志无 Debugger PIN。
- ⚠️ **工作区事件**：① monorepo 被切到 main 分支（本文档历史都在 python 分支，a672577c 及之前全部安全）；② code/card-counter-flask 工作区曾被误删 21 个跟踪文件（已 git restore 恢复）；其目录下未跟踪 `card-counter/` 子目录（另一项目）归属待确认。
- ⚠️ JWT_SECRET 更换使旧 token 全失效：小程序自动重登无感；网页用户需重新登录。

### 2026-09-12 晚 产品定位定型：commercial=Demo，flask=商业版（to B）

### 2026-09-12 晚 产品定位定型：commercial=Demo，flask=商业版（to B）
- **定位**：card-counter-commercial 明确为 **Demo 演示版**（web 已改「次卡管家 Demo（演示版·非生产）」，`0ca26d4` 已上线 cardcount-web）；**card-counter-flask = 商业版**（小程序 C 端 + web B 端控制台，一套后端一套账本）。
- **flask 新增 B端商业控制台（`9ca239b`，已上线）**：`/merchant/<id>/console`（员工 JWT 鉴权）
  * 经营看板：`/api/merchant/console/summary` 聚合（卡/今日核销/顾客/线上收入 + 近7天趋势 + 卡密账本概况）
  * 卡密中心：生成批次（明文码一次性 + CSV 导出）/ 核销报表（兑换率/未核销余额）/ 批次明细
  * 对账中心：平台令牌（localStorage）→ 准确率/处理率 KPI、立即对账、差异单结单、全局账本流水
- **本地确认（开发库实测）**：生成批次 B20260912-5DCB（3×¥50）→ 顾客兑换 ¥50 → 消费 ¥20（HMAC 回执）→ 钱包余 ¥30 → 对账 0 差异准确率 100% → 全局账本借贷平衡（seq1 兑换 / seq2 消费）。截图验证三个 Tab 全通过。
- 回归：cardkey_port 19/19 · commercial_integration 44/44。
- 注：flask 的对账中心平台令牌 = 服务级 `PLATFORM_ADMIN_TOKEN`（web 端 localStorage 填入）；commercial 平台裸头后门已在 `3d14c26` 加固。

### 2026-09-12 下午 生产上线完成（两服务）
- **flask-z9hh（小程序后端）**：`-058` 跨租户栈上线 → `-059` +PLATFORM_ADMIN_TOKEN。**数据安全已核验**（DMC 直查 card_counter 库）：8 新表建成且 0 行、旧数据完好（users 108/checkins 214/quotas 22/login_sessions 22）、部署后仍有新写入。云端调试验证平台端点：对令牌 200、无/错 403。
- **cardcount-web（网页版）**：从 09-05 的 -002 升到 `-014`。**根因复盘：commercial gunicorn.conf.py 用了 py3.12 f-string 嵌套引号语法，python:3.11 容器启动即崩 → -005 起所有流水线版本从未上线成功**（线上一直停在 -002），修复 `99055d8`。**安全加固 `3d14c26`：`X-Platform-Admin` 裸头后门（公网任何人可当平台超管）→ 必须同时携带 X-Platform-Token == PLATFORM_ADMIN_TOKEN**，公网验证 403/403/200。
- 部署手册（含结果与踩坑）：`wk/wechat/docs/生产部署手册-跨租户卡密栈-2026-09-12.md`。
- ⚠️ **两本账架构现状**：flask 卡密表与 commercial 同名不同列（snake/camelCase），**两服务禁止共库**；cardcount-web 暂用临时 SQLite（演示账本），网页要与小程序统一账本需把双端 UI 并入 flask（下次起点）。
- 待用户完成：小程序真机 发卡→兑换→消费→对账 全链路（config.js 服务名已正确指向 flask-z9hh）。

### 2026-09-12 上午 跨租户栈并入生产后端 + 小程序兑换页
- **卡密/账本/同步/对账栈并入 `code/card-counter-flask/`（commit `7760b8e`，已上线）**：
  `wxcloudrun/cardkey_models.py`（8 表 snake_case）+ `cardkey_svc.py`（ledger/sync/cardkey/recon 四节，969 行）+ `cardkey_views.py`（15 端点）+ `test_cardkey_port.py`（19 用例全绿）；既有 44+12+10 用例无回归。
  鉴权映射：顾客=require_auth（account_key=cust:<user_id>）、发卡方=require_staff_auth、平台=X-Platform-Token == config.PLATFORM_ADMIN_TOKEN（空值 403）。
  踩坑修复：① `__init__.py` 的 create_all 未注册 cardkey_models（新表不会建）；② platform_ledger 位置参数 0 绑到 session 致 500。
- **小程序接入（commit `f675fa70`）**：新增 `pages/card/keyredeem` 卡密兑换页（幂等键内联生成）；卡包列表加「卡密兑换」入口 + 卡密卡分区（GET /api/wallet，后端未部署时静默跳过）。
- 待办：flask-z9hh 云托管部署验证（新表靠 create_all 自动建；MySQL 下走行锁）；生产设 PLATFORM_ADMIN_TOKEN。

### 2026-09-11 商业化对账指标 + 商店橱窗（commercial 仓库 commit `59577eb`）
- recon `platform_summary` 指标拆分：`consistencyRate`=数据准确率（从未出差异的批次占比，**结单不恢复**，cardkey 级差异经 union 归属批次）、`diffResolutionRate`=差异处理率；修正 batchCount 误标租户数。
- `/api/shop/templates` 定型为公开橱窗端点（游客匿名浏览，字段白名单 + 防泄露测试）。
- web 对账中心 KPI 拆分展示；测试 158/158 全绿。

### 2026-09-11 顾客端购卡/兑换闭环（commercial 仓库 commit `414ecfb`）
- web 顾客端「在线购卡」「我的订单」Tab（模拟支付）+ 卡密兑换入口 + 退费估算弹层。
- 安全修复：非字符串卡密 400（此前 500）；批次缺失时消费拒绝（此前空签名回执）。

### 2026-09-10 跨租户集成（Phase 0+1 / 里程碑 M1+M2，commercial 仓库）
- 依据 `wk/wechat/tasks/次卡管理 - 跨租户集成.md` 规划落地：卡密状态机（兑换码仅存哈希、HMAC 防伪、防枚举字母表）、复式账本（全局 seq）、幂等 + 乐观锁、增量同步（/api/changes + 设备游标）、三方对账差异单、撞库风控、多租户隔离、15 端点。
- 验收详见 `wk/wechat/docs/跨租户集成-验收说明-2026-09-10.md`。

### 既有基线（2026-08-19）
- 商业化功能已并入生产后端 `code/card-counter-flask/`：发卡/领卡、排课+时间窗格、预约/候补递补、签到转核销、销卡、退款、审计、幂等、学员档案。

## 关键文件
| 文件 | 说明 |
|---|---|
| code/card-counter-flask/wxcloudrun/cardkey_svc.py | 生产后端卡密/账本/同步/对账服务层（969 行） |
| code/card-counter-flask/wxcloudrun/cardkey_views.py | 生产后端 15 个跨租户端点 |
| code/card-counter-flask/wxcloudrun/cardkey_models.py | 8 张新表（snake_case） |
| code/card-counter-flask/test_cardkey_port.py | 移植验证测试（19 用例） |
| code/card-counter-miniapp/pages/card/keyredeem/ | 小程序卡密兑换页 |
| code/card-counter-commercial/ | 演示/参考版（跨租户源头实现 + 网页双端 Demo） |
| wk/wechat/docs/测试手册-次卡管家-2026-09-12.md | 三仓库测试 + 本地确认 + 生产验证手册 |
| wk/wechat/docs/部署手册-次卡管家-2026-09-12.md | 部署手册（push 即发布/环境变量/验证/坑位/回退） |
| wk/wechat/docs/跨租户集成-验收说明-2026-09-10.md | 跨租户交付验收（含运行/验证命令） |

## 经验教训速记
- 响应信封 `{'code':0,'data':...}` / 失败 `{'code':-1,'errorMsg':...}`，测试要 unwrap data
- 顾客侧（require_auth）无 current_merchant_id，merchantId 从 query/body 取
- 返回 (result, idempotent) 的服务函数，路由必须取 [0]
- dao 直调需 app.app_context()；ORM 对象跨 context 会 DetachedInstanceError
- SQLite+RLock 只能单 worker；生产走 MySQL 行锁（write_locked 装饰器）
- 风控事件必须在主事务回滚后以独立事务补记，否则随主事务一起被回滚（flask 版用 db.session.remove() 重开）
- 对账卡级校验只针对已兑换卡（BOUND/ACTIVE/CONSUMED）；展示编号（cardNo）≠ 兑换码，兑换码仅存哈希
- flask 仓库是 SQLAlchemy 1.4.41（2.0 风格 select 可用）；系统 python 3.14 编不过 greenlet，测试用 /home/wang/wk/tmp/flask-venv（Python 3.11）
- 本机 /tmp 仅 10MB tmpfs：跑测试必须 `export TMPDIR=/home/wang/wk/tmp`
- 两个 commercial 移植类踩坑：create_all 前必须显式 import 新模型模块；服务函数关键字传参避免位置参数错绑

## 下次起点（按优先级）
1. **flask-z9hh 云托管部署验证**：跨租户栈上线（8 新表 create_all 自动建）；生产环境配置 PLATFORM_ADMIN_TOKEN；MySQL 行锁下重跑并发用例
2. 小程序真机验证卡密兑换全链路（发卡→兑换→消费→对账）
3. 真实微信支付回调替代模拟支付（commercial 演示 + 生产 orders）
4. 规划 Phase 2+：WebSocket 实时推送、Redis 分布式锁（跨实例）、小程序本地账本（SQLCipher + 离线队列 + seq 冲突裁决）、发卡方 API-Key 开放接口
5. 合规：预付卡备案 → 资金存管 → 微信支付资质 → 退费规则上线
6. 既有项：多 worker 并发压测、迁移机制测试同步
