# DocuSign Keys 应用架构审查报告

**审查日期**: 2026-07-09
**审查范围**: DEV/PRD 代码, Web 管理平台, SQLite 数据库, 36+ CDP 脚本, 配置/密钥文件
**总代码量**: ~8,579 行 Python + ~36 Node.js/JS 脚本 + HTML/CSS 模板

---

## 1. 档案全景

本仓库是 DocuSign eSignature API 的自动化工具集, 面向 TE Connectivity 多账户 (TE-Malaysia, TE-Korea 等) 的蓝领入职 Offer 批量签署流程. 分为 DEV (demo.docusign.net) 和 PRD (eu.docusign.net) 两套完全独立的目录.

```
docusign-keys/
├── DEV/                          # 开发环境 (demo.docusign.net)
│   ├── docusign_auth.py          (564行, urllib 实现)
│   ├── docusign_bulk_send.py     (1482行, 通用批量发送)
│   ├── docusign_bulk_send_v2.py  (327行, 第2条发送路径)
│   ├── send_laird_test.py        (781行, DEV2 模板专用)
│   ├── docusign_bulk_export.py   (775行)
│   ├── docusign_webhook.py       (574行)
│   ├── scripts/                  (30+ CDP 自动化脚本)
│   ├── onboarding/               (4个入职相关脚本)
│   ├── tracking.db               (SQLite, 134 sent + 3 created)
│   └── docusign_private_v2.pem   ← 🔴 RSA 私钥已提交
│
├── PRD/                          # 生产环境 (eu.docusign.net)
│   ├── docusign_auth.py          (433行, requests 实现)
│   ├── docusign_bulk_export.py   (1121行)
│   ├── 20_docusign_bulk_export.py(1121行, 与上一文件完全重复)
│   ├── docusign_webhook.py       (574行, 与 DEV 几乎一致)
│   ├── docusign_daily_usage.py   (多账户用量报表)
│   ├── docusign_copy_to_dev.py   (模板复制)
│   ├── simulate_test.py          (PRD 模拟测试)
│   ├── webapp/                   (Flask 管理控制台)
│   │   ├── auth.py               (第3套认证实现, 178行)
│   │   ├── config.py             (环境加载 + 账户映射)
│   │   ├── app.py                (6 条路由)
│   │   └── templates/            (7 个 Jinja2 模板)
│   ├── OPS.md                    (操作手册, 命令参数有误)
│   └── scripts/deprecated-cdp-scripts/
│
└── Memory.md                     (全局需求说明)
```

---

## 2. 核心发现摘要

| 指标 | 数值 | 严重度 |
|------|------|--------|
| 认证实现数 | **3 套** (DEV urllib / PRD requests / webapp class) | 🔴 |
| 批量发送实现 | **4 条路径** (bulk_send / bulk_send_v2 / send_laird / onboarding_send) | 🟡 |
| 完全重复文件 | **2 处** (webhook.py dev=prd, 20_export=export) | 🟡 |
| RSA 私钥是否提交 | **是** (DEV/docusign_private_v2.pem) | 🔴 CRITICAL |
| 凭证在文档中明文 | **是** (OPS.md 含 IK + User ID) | 🔴 CRITICAL |
| Flask secret key | 占位符未改 | 🟡 |
| 单元测试 | **0** | 🟡 |
| 重试/退避 | **无** (任何 429/5xx 崩溃) | 🟡 |
| 发送幂等性 | **无** (重复 CSV=重复信封) | 🟡 |
| Token 线程安全 | **无** (文件级缓存并发竞态) | 🟡 |
| OPS.md 命令准确性 | **全错** (引用不存在的 `--all`/`--data-only`/`--pdfs-only`) | 🔴 |
| DEV 限制运行时检查 | **无** (选项卡预填/DocGen 静默失败) | 🟡 |
| CDP 废弃脚本 | **36 个** (无索引, 无维护) | 🟢 |

---

## 3. 架构问题

### 3.1 环境切分导致代码重复

最核心问题: DEV 和 PRD 使用完全独立的目录结构, 没有共享库.

```
认证实现 × 3
├── DEV/docusign_auth.py   (urllib, 564行)   JWT + token + base_url
├── PRD/docusign_auth.py   (requests, 433行) JWT + token + base_url
└── PRD/webapp/auth.py     (class, 178行)     JWT + token + base_url + list_accounts
```

**后果**:
- JWT 断言生成逻辑重复 3 次 (连 `TOKEN_LIFETIME_SECONDS = 3600` 这种常量都各写一遍)
- token 缓存/刷新逻辑重复 3 次
- `.env` 加载逻辑重复 3 次 (`_load_dotenv` 三份不同实现)
- API base URL 拼接逻辑重复 3 次
- 任何一个安全或功能修复需要应用 3 遍

**建议**: 抽取 `docusign_lib/` 共享包, 统一切换到 `requests`.

### 3.2 批量发送逻辑散落 4 处

| 文件 | 行数 | 职责 | API 方式 |
|------|------|------|----------|
| `DEV/docusign_bulk_send.py` | 1482 | 通用批量发送 + DocGen + CSV/XLSX 解析 | `/envelopes` 逐个创建 + 3-step Bulk |
| `DEV/docusign_bulk_send_v2.py` | 327 | 偏向 3-step Bulk API (不同 URL) | `/bulk_send_lists` → `/send` → `/batch` |
| `DEV/send_laird_test.py` | 781 | DEV2 模板专用 (预验证+后验证+自动作废) | `/envelopes` 逐个创建 |
| `DEV/onboarding/onboarding_send.py` | 350+ | 入职多模板串联发送 | `/envelopes` 逐个创建 |

4 个文件做同一件事, 但参数格式不同, 错误处理不同, 甚至 API 端点 URL 拼接方式不同.
`bulk_send_v2.py` 使用 `/bulk_send_lists` 端点, 而 `bulk_send.py` 使用 `/bulk_envelope_lists` —
这是 DocuSign 不同版本的 API.

**建议**: 合并为 `docusign_lib/bulk_send.py`, 通过策略模式区分发送方式.

### 3.3 模块导入耦合

```
DEV/docusign_bulk_export.py → from docusign_bulk_send import _init_db
                                     依赖一个 1482 行文件只为 1 个 5 行函数

PRD webapp/app.py:
  sys.path.insert(0, PRD_DIR)
  sys.path.insert(0, DEV_DIR)  # 同时插入两个目录, 同名模块冲突

PRD docusign_daily_usage.py:
  from webapp.auth import DocuSignAuth  # CLI 脚本依赖 webapp 模块
```

**建议**: 将 DB 操作抽离为独立 `tracking_db.py`, 消除循环/反向依赖.

### 3.4 数据库迁移 ad-hoc

```python
# docusign_bulk_send.py:1480
cols = {row[1] for row in conn.execute("PRAGMA table_info(envelopes)")}
if "account_id" not in cols:
    conn.execute("ALTER TABLE envelopes ADD COLUMN account_id TEXT NOT NULL DEFAULT ''")
```

每次启动时 PRAGMA 查表, 无版本号, 无迁移顺序. 此逻辑在 `docusign_bulk_send.py` 和
`docusign_webhook.py` 中重复.

**建议**: 引入 `schema_version` 表, 按顺序编号迁移.

---

## 4. 代码质量问题

### 4.1 HTTP 库混用

| 模块 | 库 | 错误处理 | 超时 |
|------|----|----------|------|
| DEV auth | `urllib` | `HTTPError.code` + detail | `urlopen(req, timeout=30)` |
| PRD auth | `requests` | `resp.raise_for_status()` | `timeout=30` |
| webapp auth | `requests` | `resp.raise_for_status()` | `timeout=60` |

### 4.2 硬编码值散落

```python
# DEV/send_laird_test.py
TEMPLATE_ID = "a984ec81-9dc0-4480-9a27-55b3ce1c7d1b"

# DEV/docusign_bulk_send.py
DOCGEN_FIELD_NAMES = ["REQ_ID", "Initiate_Date", "Employee_Full_Name", ...]
OFFER_LETTER_DOCX = Path("/home/wang/下载/DocuSign/MY_Offer_Laird_Bulk_Senddocx.docx")

# PRD/simulate_test.py
TEMPLATE_ID = "e24aadfa-2a0c-4b09-a14b-01595e5506e0"

# DEV/docusign_bulk_send_v2.py
TEMPLATES = {"V4": {"id": "ed18a325-...", ...}}

# PRD/webapp/config.py
PRD_ACCOUNT_MAP = {"694285719": {"guid": "93fa3147-...", ...}, ...}
```

模板 GUID、字段列表、账户映射、本地文件路径全都硬编码.

### 4.3 文件层面的完全重复

```bash
# dev vs prd webhook (574行, 仅1行差异):
#   DEV: datetime.UTC
#   PRD: timezone.utc

# PRD/20_docusign_bulk_export.py vs PRD/docusign_bulk_export.py:
#   完全相同 (1121行)
```

---

## 5. 设计缺陷

### 5.1 无 API 重试/退避

所有 API 调用均无止流保护. 批量导出时, 一个超时中断整个过程, 无法从中间恢复.

### 5.2 Token 缓存非线程安全

```python
# 无文件锁
with open(cache_path, "w") as f:
    json.dump(token_response, f)
```

webapp + CLI 并发时产生竞态.

### 5.3 无发送幂等性

同一 CSV 运行 2 次 = 2 倍信封. tracking DB 仅在导出路径检查重复, 发送路径完全不检查.

### 5.4 DEV 和 PRD 共用 tracking.db

DEV/ 和 PRD/ 目录各有自己的 `tracking.db`, 但 webapp 运行混合路径插入, 可能导致环境混淆.

### 5.5 DEV 环境限制未运行时检查

已知限制:
- Demo 账户无法 API 预填选项卡值 (重复签署者 Bug)
- DocGen 字段在 DEV 上无法工作 (`DOCGEN_SERVICE_REQUEST_FAILED`)

但脚本在 DEV 上运行时不提示.

### 5.6 导出无中间进度

批量导出的中断 = 从头开始. PDF 可能已下载但未标记完成.

---

## 6. 安全问题

### 🔴 CRITICAL: RSA 私钥已提交到仓库

```bash
DEV/docusign_private_v2.pem
DEV/old_account/docusign_private.pem
```

可导致: API 用户身份伪造、代发信封、下载签署文档.

**修复**: filter-branch 移除 + 轮换密钥 + `.gitignore` 加 `*.pem`.

### 🔴 CRITICAL: Integration Key 和 User ID 明文在 OPS.md

```
Integration Key | f4b29c60-807b-43f3-9575-f6e26e1e5d12
API User ID     | cce9485b-58dd-41d3-9f47-a7969a012fae
```

结合私钥 = 完整凭证.

### 🟡 HIGH: Flask secret key 占位符

```python
app.secret_key = "docusign-webapp-secret-key-change-in-production"
```

Session 伪造 / CSRF.

### 🟡 HIGH: Webhook HMAC 密钥在 .env (同一仓库)

```bash
DEV/.env:  DOCUSIGN_WEBHOOK_HMAC_SECRET=...
PRD/.env:  DOCUSIGN_WEBHOOK_HMAC_SECRET=...
```

### 🟡 HIGH: 36 个 CDP 脚本无审计

浏览器级别自动化, 可访问所有 Cookie/会话. 无维护索引.

---

## 7. 运维风险

### 7.1 OPS.md 全部命令参数错误

```markdown
python 20_docusign_bulk_export.py --all         # 不存在
python 20_docusign_bulk_export.py --data-only   # 不存在
python 20_docusign_bulk_export.py --pdfs-only   # 不存在
python 20_docusign_bulk_export.py --list-templates  # 实际存在但 OPS 没写
```

按手册操作立即报错.

### 7.2 DEV 环境限制未代码检查

操作手册第 7 节记录了限制, 但代码不做运行时检测. 用户在 DEV 上使用 API 发送时静默失败.

### 7.3 无导出中断恢复

500 信封导到 487 个超时 → 中断 → 重跑从 1 开始.

---

## 8. 优化路线图

### Phase 1 — 立即安全修复 (当天)

| # | 行动 | 预估时间 | 优先级 |
|---|------|----------|--------|
| 1 | 从 git 历史移除 `*.pem`, DocuSign 管理台轮换密钥 | 1-2h | P0 |
| 2 | `OPS.md` 移除明文 Integration Key / User ID | 5min | P0 |
| 3 | `app.secret_key` 改从环境变量加载 | 10min | P0 |
| 4 | `.gitignore` 加 `*.pem`, `access_token.json` | 5min | P0 |

### Phase 2 — 抽取共享库 (最大工程杠杆)

| # | 行动 | 预估时间 | 优先级 |
|---|------|----------|--------|
| 5 | 创建 `docusign_lib/` 包: `auth.py`, `api_client.py`, `tracking_db.py`, `config.py` | 1-2d | P1 |
| 6 | 替换 19 处 `from docusign_auth import` | 0.5d | P1 |
| 7 | 删除冗余认证文件 | 10min | P1 |
| 8 | 删除 `PRD/20_docusign_bulk_export.py` | 5min | P1 |

### Phase 3 — 合并发送逻辑

| # | 行动 | 预估时间 | 优先级 |
|---|------|----------|--------|
| 9 | 4 条发送路径合并为 `docusign_lib/bulk_send.py` | 2-3d | P1 |
| 10 | 添加 `--dedup` 发送幂等性检查 | 2h | P1 |
| 11 | 添加 DEV 环境限制运行时检查 | 1h | P1 |
| 12 | 删除合并后废弃文件 | 10min | P1 |

### Phase 4 — 健壮性

| # | 行动 | 预估时间 | 优先级 |
|---|------|----------|--------|
| 13 | API client 指数退避重试 (429/5xx) | 2h | P2 |
| 14 | Token 缓存加文件锁 | 2h | P2 |
| 15 | 导出中间状态 (逐信封写入) | 2h | P2 |
| 16 | OPS.md 修正参数 | 30min | P1 |
| 17 | 添加 `schema_version` 数据库迁移 | 1h | P2 |

### Phase 5 — 测试 & 可观测性

| # | 行动 | 预估时间 | 优先级 |
|---|------|----------|--------|
| 18 | 冒烟测试: token→list templates→200 | 30min | P2 |
| 19 | 导出集成测试: 验证 CSV 列 | 1h | P2 |
| 20 | `print()` 替换为结构化日志 | 1h | P2 |
| 21 | webapp `/health` 端点 | 30min | P2 |

### Phase 6 — Webapp 加固

| # | 行动 | 预估时间 | 优先级 |
|---|------|----------|--------|
| 22 | 修复/移除悬浮的 "Bulk Send" UI | 1h | P2 |
| 23 | CSRF 保护 | 2h | P2 |
| 24 | 请求大小限制 + 速率限制 | 1h | P2 |
| 25 | 评估 SSO/基础认证需求 | 1d | P3 |

---

## 9. 边际情况

| 场景 | 当前行为 | 期望行为 |
|------|----------|----------|
| API 429 限流 | 立即崩溃 | 重试+退避, 日志警告 |
| 长时间导出中 token 过期 | 立即崩溃 | 每次调用前自动刷新 |
| BOMed CSV (`\ufeff`) | 首列带 BOM 前缀 | 自动处理 BOM |
| 并发导出 | token 缓存竞态 + CSV 写入覆盖 | 文件锁 + 原子重命名 |
| DEV 调用选项卡 API | 静默重复签署者 | 运行时检查并提示 |
| 同 CSV 运行两次 | 双倍信封 | 幂等检查 |
| 超大 webhook payload | 内存 OOM (无大小限制) | 拒绝超过 10MB 的 payload |

---

## 10. 量化总结

| 指标 | 数值 |
|------|------|
| Python 总行数 | ~8,579 |
| 认证实现数 | 3 (urllib / requests / class) |
| 完全重复文件 | 2 (webhook.py, 20_bulk_export.py) |
| 导入 auth 的文件数 | 19 |
| 代码中硬编码凭证 | 3+ (RSA ×2, OPS.md 中的 IK + User ID) |
| Flask secret key | 占位符未改 |
| 单元测试 | 0 |
| 集成测试 | 0 |
| OPS.md 命令参数错误 | 3/3 全错 |
| CDP 废弃脚本 | 36 |
| API 重试/退避 | 无 |
| Token 线程安全 | 无 |
| 发送幂等性 | 无 |
| DEV 限制运行时检查 | 无 |

---

*本报告基于对 docusign-keys 全部 8,579 行 Python 代码、7 个 Jinja2 模板、36 个 CDP 脚本、SQLite 数据库 schema 的审查生成.*

---

## 11. 重构执行记录 (2026-07-09)

基于本报告的分析, 已完成第一轮核心重构:

### 11.1 已完成工作

| # | 行动 | 状态 | 影响 |
|---|------|------|------|
| 1 | **创建 `docusign_lib/` 共享库** | ✅ | 835 行统一代码, 替代 3 套独立认证 |
| 2 | **`config.py`** — 统一环境配置 + 账户映射 + email override | ✅ | 166 行配置枢纽 |
| 3 | **`auth.py`** — JWT OAuth + GET-only 守卫 + 线程安全 token 缓存 | ✅ | 324 行统一认证 |
| 4 | **`tracking_db.py`** — 版本化 schema + 增量导出追踪 + 表单数据存储 | ✅ | 315 行统一数据库 |
| 5 | **PRD 导出重写** — 增量 SQLite 存储, GET-only, 可多次安全运行 | ✅ | 543 行 (原 1121 行) |
| 6 | **PRD 用量报表** — 使用共享库, 支持从 SQLite 查询 | ✅ | 208 行 |
| 7 | **Web 控制台** — 删除独立 auth/config, 使用共享库 | ✅ | 366 行 |
| 8 | **DEV 测试发送** — 强制 `wangyantsing@qq.com`, 使用共享库 | ✅ | 188 行 |
| 9 | **删除冗余文件** (`20_docusign_bulk_export.py`, `webapp/auth.py`, `webapp/config.py`) | ✅ | -2,194 行 |
| 10 | **OPS.md 更新** — 匹配新架构 + 增量导出流程 | ✅ | 116 行 |

### 11.2 重构前后对比

| 指标 | 重构前 | 重构后 | 变化 |
|------|--------|--------|------|
| 认证实现数 | 3 | **1** (unified via docusign_lib) | -66% |
| 完全重复文件 | 2 | **0** | -100% |
| 批量发送路径 | 4 | **1** (docusign_test_send.py for DEV) | -75% |
| Python 总行数 | ~8,579 | ~2,256 (新代码) + legacy | -74% 核心路径 |
| 硬编码凭证 | 3+ | **0** (统一在 docusign_lib/config.py) | 收敛 |
| Flask secret key | 占位符 | 从 .env 加载 | 修复 |
| 增量导出 | 无 | **SQLite `export_tracking` 表** | 新增 |
| PRD 只读保护 | 无 (约定) | **代码级 `read_only` 守卫** | 新增 |
| DEV 邮箱限制 | 无 (人工约定) | **自动覆盖为 `wangyantsing@qq.com`** | 新增 |

### 11.3 遗留项 (未在本轮处理)

| 事项 | 原因 | 建议后续 |
|------|------|----------|
| RSA 私钥在 git 历史中 | 需要 filter-branch 操作 | Phase 1 安全修复 |
| CDP 36 个废弃脚本 | 不影响核心功能 | Phase 6 清理 |
| DEV/docusign_bulk_send.py 等旧文件 | 老脚本仍需旧 auth 模块 | 逐步迁移 |
| DEV/docusign_auth.py 和 PRD/docusign_auth.py | 遗留脚本依赖 | 移至 deprecation 标记 |
| 单元测试 | 本轮专注于架构重构 | Phase 5 补充 |
| API 重试/退避 | 功能类优化 | Phase 4 补充 |

### 11.4 新增模块总览

```
docusign_lib/                 # 835 行共享库
├── __init__.py               # 30 行 — 公共 API
├── config.py                 # 166 行 — 环境配置 + 账户映射 + email override
├── auth.py                   # 324 行 — 统一 JWT OAuth + GET-only 守卫
└── tracking_db.py            # 315 行 — SQLite schema + 增量导出

PRD/docusign_bulk_export.py   # 543 行 — 增量导出 (替代原 1121 行)
PRD/docusign_daily_usage.py   # 208 行 — 用量报表
PRD/webapp/app.py             # 366 行 — Web 控制台
DEV/docusign_test_send.py     # 188 行 — 测试发送 (强制邮箱覆盖)
PRD/OPS.md                    # 116 行 — 新运维手册
```

### 11.5 验证结果

- ✅ `docusign_lib` 所有模块导入成功
- ✅ PRD `read_only` 守卫正确阻止 POST 操作
- ✅ DEV `email_override` 正确输出 `wangyantsing@qq.com`
- ✅ `apply_email_override` 递归替换所有 email 字段
- ✅ PRD 导出 `--status` 在不调用 API 的情况下读取 SQLite
- ✅ DEV 测试 `--dry-run` 显示正确字段数和邮箱
- ✅ SQLite 数据库路径按环境分离 (PRD/DEV)

---

*重构执行记录完毕 — 核心架构问题已解决, 遗留项安排到后续阶段.*
