# DocuSign-Keys 商业化优化建议与系统评审报告

**报告日期：2026年07月09日**
**评审范围**：`/home/wang/wk/code/docusign-keys/` 全代码库
**评审维度**：架构 / 代码质量 / 数据库 / 安全与隔离
**数据库策略**：保留 SQLite（本报告基于该约束给出优化建议）

---

## 执行摘要

当前 `docusign-keys` 已完成一轮基于架构审查的重构，建立了 `docusign_lib/` 共享库作为目标架构，PRD 只读守卫、DEV 邮件覆盖、SQLite 增量存储等核心机制已经落地并通过验证。

但距商用仍有明确差距：

- **迁移完成度仅 29%**：24 个脚本中仅 7 个接入 `docusign_lib`，16 个文件仍直接引用已弃用的 `docusign_auth.py`。
- **PRD 只读保护存在"旁路"**：应用层守卫不覆盖已弃用 `PRD/docusign_auth.api_post()`（无守卫），且非网络层隔离，遗忘守卫的调用点可直接写 PRD。
- **数据库存在 3 套互相分歧的 schema 定义**，且 `upsert_envelope` 在冲突时会把 `created_at` 覆盖为 `NULL`（静默数据损坏）。
- **无 `.gitignore`**：`.env`、`.pem`、`access_token.json` 一旦 `git add .` 即泄露。
- **DEV 邮件覆盖不统一**：部分脚本从 CSV 读取真实邮箱且不做覆盖。
- **零测试、无重试、用 `print` 代替 `logging`**。

下方按 P0/P1/P2 给出具体、可执行的优化建议，附文件:行号定位。

---

## 一、架构评审

### 1.1 目标架构（正确方向）

```
docusign_lib/          ← 唯一可信源（共享库）
  ├── config.py        ← 环境/账户映射、邮箱覆盖、只读标志
  ├── auth.py          ← 统一 JWT OAuth，post/put 在 PRD 抛 RuntimeError
  ├── tracking_db.py   ← 统一 SQLite 访问层（含增量追踪）
  └── __init__.py
PRD/                   ← 生产环境，严格只读
DEV/                   ← 演示环境，可写、邮箱强制覆盖
```

`docusign_lib/auth.py` 的核心设计——`post()`/`put()` 在 `read_only=True` 时抛 `RuntimeError`（`auth.py:294-298, 311-314`）——方向正确，是系统最重要的安全闸门。

### 1.2 迁移状态（关键短板）

| 层 | 脚本总数 | 已接入 `docusign_lib` | 未迁移 | 完成度 |
|---|---|---|---|---|
| PRD | 10 | 6 | 4 | 60% |
| DEV | 14 | 1 | 13 | 7% |
| **合计** | **24** | **7** | **17** | **29%** |

**17 个文件仍 import 已弃用的 `docusign_auth`**（PRD 3 个 + DEV 13 个），包括全部 DEV 业务脚本（`docusign_bulk_send.py` 1482 行、`send_laird_test.py` 781 行、`onboarding_send.py` 677 行等）。这些脚本绕过了统一的只读守卫与邮箱覆盖逻辑。

### 1.3 重复与冗余

- **Webhook 几乎完全重复**：`PRD/docusign_webhook.py` 与 `DEV/docusign_webhook.py` 均为 574 行，仅 `datetime.now()` 时区写法不同（PRD 用 `timezone.utc`，DEV 用 `datetime.UTC`）。共享逻辑应下沉到 `docusign_lib`。
- **CSV/XLSX 解析重复 6 处**：`PRD/docusign_bulk_send.py`、`DEV/docusign_bulk_send.py` / `_v2.py`、`DEV/docusign_test_send.py`、`DEV/send_laird_test.py`、`DEV/onboarding/onboarding_send.py` 各自实现一套解析，细微差异导致行为漂移。
- **两个已弃用 auth 库并存**：`PRD/docusign_auth.py`（446 行，用 `requests`）与 `DEV/docusign_auth.py`（577 行，用 `urllib`），`docusign_lib/auth.py` 已统一二者。
- **死代码**：`PRD/test_pipeline.py`（50 行）import 了 `docusign_bulk_export` 中根本不存在的函数（`list_templates`、`list_completed_envelopes` 等），运行时直接 `ImportError`。
- **孤立文件**：根目录 `docusign-keys/tracking.db` 已被旧版硬编码路径遗留，当前无人使用。

### 1.4 优化建议（架构）

1. **完成迁移**：优先迁移 DEV 业务脚本到 `docusign_lib`（13 个）；PRD 剩余 4 个中 2 个是 setup 工具、1 个死代码、1 个是 PRD→DEV 复制器，风险可控。
2. **下沉 Webhook**：合并两版 webhook 到 `docusign_lib`，通过 `env` 参数区分。
3. **统一文件解析**：在 `docusign_lib` 提供 `parse_recipients_csv/xlsx()`，所有脚本复用。
4. **删除死代码与孤立文件**：`PRD/test_pipeline.py`、根目录 `tracking.db`。

---

## 二、代码质量评审

### 2.1 PRD 只读守卫违例

- `PRD/docusign_copy_to_dev.py:180` 直接用 `requests.post(...)` 发往 DEV——目标安全，但**完全绕过共享库**，未来改动可能误写 PRD。
- `PRD/docusign_auth.py:329-365` 的 `api_post()` **无只读检查**。任何仍引用它的脚本均可无阻碍写 PRD。
- `PRD/scripts/deprecated-cdp-scripts/cdp_setup_prd.py`（599 行）对 PRD Web UI 做破坏性操作（创建 Integration Key、生成 RSA、改模板），属高危 setup 工具，不应留在 PRD 目录。

### 2.2 硬编码敏感信息与邮箱

| 文件:行 | 问题 |
|---|---|
| `PRD/scripts/deprecated-cdp-scripts/cdp_setup_prd.py:376` | 硬编码 `ross.wang@te.com` |
| `DEV/scripts/docusign_void_ross_related.py:13` | 硬编码 `ross.wang@te.com` |
| `DEV/scripts/docusign_void_envelopes.py:61` | 硬编码 `ross.wang@te.com` |
| `DEV/docusign_bulk_send_v2.py:47` | 硬编码 `DEFAULT_EMAIL = "wangyantsing@qq.com"` |
| `DEV/send_esign_method2.py:116` | 硬编码 `default="wangyantsing@qq.com"` |
| `DEV/send_laird_test.py:43` | 硬编码 `DEFAULT_EMAIL` |

`docusign_lib/config.py:79` 的 `DEV_EMAIL_OVERRIDE` 集中定义是正确的；其余脚本各自硬编码，维护风险高。

### 2.3 错误处理

| 问题 | 位置 | 严重度 |
|---|---|---|
| **裸 `except:`**（吞掉 `KeyboardInterrupt`/`SystemExit`） | `DEV/scripts/docusign_void_ross_related.py:35` | 高 |
| **`except Exception: pass` 静默吞错**（表单数据抽取） | `PRD/docusign_bulk_export.py:72,109,121,139,163` | 中 |
| **无任何 API 重试/退避** | 全部 API 调用 | 中 |
| **`print()` 代替 `logging`** | `docusign_lib/*`、`DEV/*` 等 | 中 |
| Webhook 处理出错仍返回 200 | `PRD/docusign_webhook.py:500` | 低（有意但丢数据风险） |

### 2.4 测试缺失

**全代码库零测试**，没有 `test_*.py`、没有 `pytest` 配置。共享库、导出/发送/webhook 逻辑、只读守卫均无单元测试覆盖。

### 2.5 优化建议（代码质量）

1. 删除/守卫已弃用的 `PRD/docusign_auth.py`（P0）。
2. 全量 API 调用加指数退避重试（建议 `tenacity`）。
3. 统一 `logging` 替代 `print`。
4. 消除裸 `except`，至少 `except Exception` 并记日志。
5. 至少补充烟雾测试：只读守卫、邮箱覆盖、`TrackingDb` 迁移。
6. 移除各脚本硬编码邮箱，统一走 `config.get_email_override("dev")`。

---

## 三、数据库评审（SQLite 保留）

### 3.1 三套分歧的 schema 定义

同一逻辑库 `tracking.db` 存在三套不同的 `CREATE TABLE envelopes`：

| 列 | TrackingDb(lib) | PRD webhook `_init_db` | DEV bulk_send `_init_db` |
|---|---|---|---|
| email_subject / envelope_type / raw_recipients_json / batch_id / sent_at / updated_at | ✅ | ❌ 缺失 | ❌ 缺失 |
| pdf_path | ❌（用 documents 表） | ✅ | ✅ |

**风险**：PRD webhook（`PRD/docusign_webhook.py:160-176`）只建 11 列的 envelopes。当 `TrackingDb.upsert_envelope()` 随后执行 `ON CONFLICT DO UPDATE SET email_subject = excluded.email_subject`，若列不存在则**运行时 `OperationalError` 崩溃**（`tracking_db.py:181`）。

**迁移缺口**：`SCHEMA_VERSION=2` 只加 `updated_at`，未补 `email_subject`/`envelope_type`/`raw_recipients_json`/`batch_id`/`sent_at`。Webhook 从不调用 `TrackingDb.init_schema()`，而是自建 schema，无补列路径。

### 3.2 缺失约束与索引

- `documents` 表无 `UNIQUE(envelope_id, document_id)`：`record_document()` 用 `INSERT OR REPLACE`（按自增 `doc_id` 替换），重复调用会产生**重复行**（`tracking_db.py:47-57, 279-284`）。
- 增量查询缺复合索引 `(account_id, created_at)`（envelopes）与 `(export_batch, exported_at)`（export_tracking）；当前按账户过滤会全表扫描，规模上来后是 O(n²)。
- 外键无 `ON DELETE CASCADE`，删除 envelope 会留孤儿行。
- `export_tracking.pdf_exported` 为 `INTEGER` 无 `CHECK`。

### 3.3 增量逻辑正确性

- `get_unexported_envelopes()`（`tracking_db.py:253-263`）的 `LEFT JOIN ... WHERE et.envelope_id IS NULL` **正确**，能找出未导出项。
- **竞态（漏导）**：webhook 在 `get_unexported_envelopes()` 之后、`处理循环` 之前插入新 envelope，则该 envelope 本次跳过、下次补导——**无数据丢失，仅延迟一个周期**。
- **竞态（重导）**：API 拉取后逐条 `is_exported()` 过滤，期间若 webhook 标记完成则会被重导；因 `mark_exported()` 是 upsert、PDF 检查 `if not pdf_path.exists()`，**幂等、无损坏，仅浪费 API 调用**。

### 3.4 数据完整性 Bug（P0）

`upsert_envelope`（`tracking_db.py:165-182`）冲突时 `ON CONFLICT DO UPDATE SET` 更新**除 envelope_id 外的所有列**，包括 `created_at = data.get("created_at", None)`。任何未带 `created_at` 的重 upsert 都会把原始创建时间**静默置空**。

### 3.5 并发与连接管理

- `PRD/webapp/app.py:363` 用 Waitress `threads=8`，但 `TrackingDb` 仅**单连接**（`tracking_db.py:109-115`）。Webapp 只读故仅性能问题；WAL 模式保证读写共存安全。
- PRD webhook 与 bulk export **同时写**同一 `PRD/tracking.db`：webhook 每请求新连接，export 全程单连接，WAL 下正确。
- **无重连逻辑**：连接一旦失效，后续全失败。
- **Token 缓存无文件锁**（`auth.py:41-67`）：TOCTOU 竞态，两进程同时判定过期会双写；因凭据相同故无功能故障，但降级到重新取 token。

### 3.6 优化建议（数据库，P0/P1/P2）

| 优先级 | 修复项 | 复杂度 |
|---|---|---|
| **P0** | `upsert_envelope` 冲突时保留 `created_at`（不覆盖为 NULL） | 1 行 |
| **P0** | 新增迁移：补齐 webhook 建表缺失列（email_subject/envelope_type/raw_recipients_json/batch_id/sent_at/updated_at） | ~10 行 |
| **P0** | `documents` 加 `UNIQUE(envelope_id, document_id)`，或用 `ON CONFLICT(envelope_id, document_id) DO UPDATE` | 3 行 |
| **P1** | 加复合索引 `(account_id, created_at)`、`(export_batch, exported_at)` | 2 行 |
| **P1** | Webapp 改用每请求 `TrackingDb`（Flask `g`）而非共享连接 | 5 行 |
| **P1** | Token 缓存加文件锁，或改进程内缓存 + 环境变量 TTL | 15 行 |
| **P2** | `CHECK(pdf_exported IN (0,1))` 等约束；外键 `ON DELETE CASCADE` | 5 行 |
| **P2** | `init_schema()` 用显式 `BEGIN/COMMIT` 替代 `executescript` 隐式提交 | 5 行 |

---

## 四、安全与隔离评审

### 4.1 机密加载与存储

- `.env`、`access_token.json`（600 权限）、`.pem` 均**未被 git 追踪**（`git log -- '*.pem'` / `'.env'` 为空）——历史干净。
- **高危**：`docusign-keys/` **无任何 `.gitignore`**。一旦 `git add .`，上述机密即被暂存、泄露。
- `cdp_setup_prd.py:519-521` 这种已弃用脚本会把生成的 RSA 私钥写入 `PRD/docusign_private_prd.pem`，并写 `app_info.json`（含 Integration Key）——若重新启用或误 add，风险极高。

### 4.2 邮箱覆盖机制

`apply_email_override()`（`config.py:142-159`）递归替换键名含 `"email"` 的字符串值，设计合理，但：

- **仅 `DEV/docusign_test_send.py`（68、145 行）真正调用**；其余 DEV 脚本只设 `DEFAULT_EMAIL` 常量或用 `--email` 参数，**不强制覆盖**。
- **`DEV/send_laird_test.py:43,612,615` 从 CSV/XLSX 读取真实邮箱直发 API，无覆盖**——若对含真实数据的 PRD 模板运行，DEV 账户会向真实员工发邮件。
- 非标准键（如 `"recipient": "John <john@x.com>"`）不会被字符串级捕获。

### 4.3 只读守卫——应用层而非网络层

- 守卫在 `docusign_lib` 的 Python 代码中，HTTP 调用前检查（`auth.py:294-298, 311-314`）。**无网络层隔离**（如 PRD 专用 API Key、防火墙规则），遗忘守卫的调用点可直写 PRD。
- 已弃用 `PRD/docusign_auth.py:340-365` 的 `api_post()` **无只读检查**，是可直接写 PRD 的旁路。
- PRD `docusign_bulk_send.py:138`（断言 `auth.read_only`，仅 GET）、`simulate_test.py:34,74-86`（显式验证守卫）安全。

### 4.4 意外 PRD 写入路径

- `PRD/docusign_copy_to_dev.py:22-40` 干净隔离：清 `os.environ`、分目录加载 `.env`、PRD 只读，仅 POST 到 DEV——安全。
- `PRD/docusign_webhook.py:462-507` 仅收 Connect POST、写本地 SQLite，不对外调 DocuSign——安全。
- `DEV/scripts/docusign_copy_template.py:15-17` 把 DEMO 账户 `45445035` 误标为 "PRD account"——无害但误导。

### 4.5 PII 与日志泄露

| 风险 | 位置 | 级别 |
|---|---|---|
| Webhook 把完整 Connect 负载（含收件人姓名/邮箱/签名 URL）逐字写入 `webhook_events.raw_payload` | `PRD/DEV docusign_webhook.py:380,390` | 中 |
| `form_data_json`/`raw_recipients_json` 存 PII 到 SQLite | `tracking_db.py:299` | 中 |
| DEV 脚本 `print()` 员工姓名/邮箱到 stdout，容器化后入日志系统 | `send_esign_method2.py:95`、`send_laird_test.py:357-364` 等 | 中 |
| Webapp CSV 导出含 `姓名 <邮箱>` | `webapp/app.py:108-121` | 低（功能所需） |

### 4.6 优化建议（安全，P0/P1）

1. **[P0] 加 `.gitignore`**：`.env`、`*.pem`、`access_token.json`、`*.db`、`app_info.json`、`exports/`。
2. **[P0] 删除或守卫已弃用 `PRD/docusign_auth.py`**（移除无守卫的 `api_post`）。
3. **[P0] 统一 DEV 邮箱覆盖**：让 `apply_email_override()` 成为所有 DEV 发送的强制包装（最好在 API client 层自动套用），并对 `send_laird_test.py` 等从数据文件读邮箱的脚本强制作覆盖。
4. **[P1] 网络层加固**：PRD 账户使用独立 Integration Key / 最小权限 API Key，或加防火墙规则，使即便代码绕过守卫也无法写 PRD。
5. **[P1] Webhook PII**：评估是否需保留 `raw_payload`，不需要则停止记录，或加自动过期清理（数据保留政策）。
6. **[P1] 统一日志**：DEV 脚本 stdout PII 在清理期一并处理，避免泄露到日志基础设施。

---

## 五、商业化优化路线图（分级）

### P0 — 上线前必须（阻塞项）

| # | 行动 | 定位 |
|---|---|---|
| 1 | 加 `.gitignore` | `docusign-keys/.gitignore`（新建） |
| 2 | 删除/守卫 `PRD/docusign_auth.py` 的 `api_post` | `PRD/docusign_auth.py:340-365` |
| 3 | 统一 DEV 邮箱覆盖（client 层强制） | `docusign_lib/auth.py` / `config.py:142-159` + 调用点 |
| 4 | 修 `upsert_envelope` 覆盖 `created_at` 为 NULL | `tracking_db.py:165-182` |
| 5 | DB 迁移补齐 webhook 建表缺失列 | `tracking_db.py:91-93` + `PRD/docusign_webhook.py:160-176` |
| 6 | `documents` 加唯一约束防重复行 | `tracking_db.py:47-57` |

### P1 — 商用首月内

| # | 行动 | 定位 |
|---|---|---|
| 7 | 全量 API 加指数退避重试 | `docusign_lib/auth.py` |
| 8 | 统一 `logging` 替换 `print` | `docusign_lib/*`、`DEV/*`、`PRD/*` |
| 9 | 复合索引 `(account_id, created_at)`、`(export_batch, exported_at)` | `tracking_db.py:79-89` |
| 10 | Webapp 每请求连接（Flask `g`） | `PRD/webapp/app.py:363` |
| 11 | Token 缓存文件锁 | `auth.py:41-67` |
| 12 | Webhook PII 保留政策 | `PRD/DEV docusign_webhook.py:380,390` |
| 13 | 网络层 PRD 隔离（独立 Key/防火墙） | 部署层 |
| 14 | 完成 DEV 脚本迁移到 `docusign_lib` | 13 个 DEV 脚本 |
| 15 | 合并两版 webhook 到 `docusign_lib` | `PRD/DEV docusign_webhook.py` |

### P2 — 持续打磨

| # | 行动 |
|---|---|
| 16 | 删死代码 `PRD/test_pipeline.py`、根目录 `tracking.db` |
| 17 | 统一 CSV/XLSX 解析到 `docusign_lib` |
| 18 | 补充单元测试（守卫/覆盖/迁移） + CI |
| 19 | 外键 `ON DELETE CASCADE`、CHECK 约束 |
| 20 | `init_schema()` 显式事务 |

---

## 六、结论

系统已具备正确的安全与数据架构**骨架**：共享库、PRD 只读守卫、DEV 邮箱覆盖、SQLite 增量存储均已落地且通过验证。但**落地完成度（29%）与健壮性（守卫旁路、DB schema 分歧、零测试、无 `.gitignore`）尚达不到商用门槛**。

优先解决 P0 六项（尤其 `.gitignore`、已弃用 auth 守卫、DB 列补齐与 `created_at` 静默损坏），可在短期内将系统提升到"可受控商用"状态；P1 完成后具备规模化与审计能力。SQLite 作为存储完全可行，重点在 schema 收敛、索引与并发治理。

---

*本报告基于代码静态评审与探索代理证据（含 file:line 定位）。建议在执行 P0 前先对现有 `PRD/tracking.db` 运行 `PRAGMA integrity_check` 以排除已有损坏。*
