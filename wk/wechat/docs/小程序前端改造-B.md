# B · 小程序前端改造（P1-4 / P3-1 / G）

## B1 · 端点对接走查（已完成）

### 现状：小程序实际调用的端点
```
顾客端：/api/cards · /api/cards/<id>/redeem-token · /api/cards/<id>/refund-estimate(404)
        /api/checkins · /api/checkins/<cid>(改/撤) · /api/quotas · /api/ratings
        /api/group-buy/redeem · /api/cards/claim · /api/orders
商户端：/api/merchant/cards(/issue) · /api/merchant/redeem · /api/merchant/templates
        · /api/merchant/create(/list) · /api/auth/*
```

### 关键发现（阻断 P1-4 完整闭环）
1. **prod 后端（flask-z9hh = `card-counter-flask`）缺两个顾客端端点**：
   - `/api/cards/<id>/customer-detail`（核销明细+凭证+退费+合规徽标）—— 仅存在于 `card-counter-commercial`，**未回迁**。
   - `/api/cards/<id>/refund-estimate` —— 小程序 `detail.js` 已在调用，但 **prod 返回 404，被 try/catch 静默吞掉**。
2. **数据模型不一致**：prod 的 `Card` 只是「次卡」模型（无 `cardKind`/`balanceCents`），`Checkin` 关联 **quota 而非 Card**。因此「按卡的核销明细」在 prod **无法直接查**。
3. 结论：P1-4 的顾客端完整闭环 = **前端 + 后端回迁** 两件事，见任务 #21。

## ✅ 2026-09-11 收口：G 清单两项阻断已解除

| 原发现 | 现状 |
|---|---|
| prod 缺 `/api/cards/<id>/customer-detail` | **已回迁**（`card-counter-flask`），返回卡视图+退费规则+合规徽标+凭证摘要（含逐笔核销） |
| prod 的 `/api/cards/<id>/refund-estimate` 返回 404 | **早已存在**（`commercial_views.py`，两条：顾客侧 + 商户侧）；当时结论已过时，实测已注册可用 |
| 「prod 无卡→核销关联，无法按卡查明细」 | **不成立**：`redemption_records.card_id` 就是卡→核销的权威关联（也是扣次权威来源），新端点据此聚合，无需改模型 |

配套（2026-09-11）：
- 新增 `GET /api/cards/<id>/voucher`（凭证摘要单端点，语义与聚合里 `voucher` 一致）。
- `Merchant` 补 4 个合规可空列（`legal_name`/`compliance_pack_enabled`/`prepaid_filing_status`/`fund_custody_status`），仅配置+展示，**不伪合规**。
- 测试：集成用例 31 → **44 项**，含「前端契约字段齐备」断言（锁住 detail 页消费的字段名，改名即失败）。

## B2 · P1-4 前端可行部分（已升级为单端点消费）
- 卡详情页 `pages/card/detail/` 改为**优先消费 `/api/cards/<id>/customer-detail`**：一次拿到进销明细、退费规则明文、合规徽标、凭证摘要。
- 新增「**查看凭证**」入口（浮层展示商户/主体/卡种/核销笔数与逐笔明细，可一键复制转发），对应 P1-2 的顾客侧凭证摘要。
- **降级链**：聚合端点 404/异常 → 自动回退旧的两段式（`/api/cards` + `/refund-estimate` + `/api/checkins`），老后端上页面依然可用。
- 全程沿用「登录可选」：`ensureLogin` 非阻塞，所有附加信息 `try/catch` 降级。
- 改动文件：`detail.js`、`detail.wxml`、`detail.wxss`；`node --check` 通过。

## B3 · P3-1 极简页流重构（已实施）
- **tabBar 5 → 3**：`卡包(pages/index/index) / 签到(checkin) / 我的(profile)`；统计、评价降级为「我的」内的入口，弱化设置与营销。
- 同步修正所有跳转：`login.js` 的 tabPages 白名单、`stats → 评价` 改 `navigateTo`。
- **顺带修掉两处隐藏 bug**：`order/buy/buy.js`、`groupbuy/redeem/redeem.js` 里 `wx.switchTab('/pages/card/list/list')` —— 该页从来不是 tab 页，switchTab 必然失败（用户会「点不动」），已改为 `navigateTo`。
- 版本号：`profile.wxml` 显示位更新为 **2.7.2**（v2.7.1 已在审核中，本次前端改动需作为新版本上传才生效）。


## 待办（依赖）
- ~~**#21 后端回迁 customer-detail**~~ → **已完成**（2026-09-11，`card-counter-flask` 已实现并测试 44/44）。
- **待用户出手**：`card-counter-flask` 改动需 `git push`（该仓 push main 即自动部署 flask-z9hh）；
  小程序前端改动需 `upload_ci` 上传 **2.7.2** 并在 MP 后台提交审核（v2.7.1 审核中的包不受影响）。

---

## C · 企业端小程序改造（C1，2026-09-11）

仓库：`card-counter-merchant-miniapp`（独立企业端小程序 MVP，契约指向 `card-counter-commercial` 演示后端）。

### 后端（`card-counter-commercial`）
- **新增** `GET /api/merchant/cards/<id>/detail` —— 商户端单端点聚合：卡视图 + 全量记录（流水/核销/冻结/作废）+ 纠纷凭证摘要。需 `view_report`，跨商户 404。
- **收紧** `GET /api/cards/<id>/records` —— 此前**无任何鉴权**（知道 cardId 即可读任意卡的核销审计链），现要求「持卡顾客本人 或 该卡所属商户员工(view_report)」。
- **透传** `/api/merchant/redeem` 的 `idempotencyKey`（此前被忽略 → 并发请求共用 5s 默认幂等键而被短路）。
- `services/card.py` 新增 `card_view()` 公开别名，商户端详情与列表共用同一序列化，避免两处漂移。

### 前端（`card-counter-merchant-miniapp`）
- `pages/cards/cards.js` / `cards.wxml` 重写：
  - 列表行**可点击** → 展开卡详情（概览 + 凭证摘要 + 逐笔核销明细，含「已撤销」标记）。
  - 新增「**导出凭证 PDF / Excel**」按钮 → `wx.downloadFile` + `wx.openDocument`（`showMenu: true` 支持转发/保存）。
  - 新增「**异常核销告警**」面板：列 `/api/merchant/alerts?resolved=false`，支持「查看卡片」「标记已处理」。
  - 单卡「销卡 / 延期」从「取第一张演示」改为**随选中卡实例**操作。
- `utils/api.js` 新增 `download(path, fileType)` 与 `webBase` 导出。

### 验证
- 后端 8 个新用例（detail 聚合 / 前端契约字段 / 权限 403 / 跨商户 404 ×2 / records 鉴权 ×4）。
- 前端 `node --check` 通过；未上传（受「不动新 AppID 发布」约束，见收口清单 B-2）。

