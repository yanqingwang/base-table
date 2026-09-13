# E3 · 多 worker 并发压测（MySQL 行锁路径）

> 目标：验证生产 gunicorn workers>1 场景下，次卡/储值卡并发核销 **不双扣、不超卖、不超额**。
> 状态：**已完成本地可复现验证（含负向反证）**；MySQL 正例需在有 MySQL 的环境执行（脚本已就绪）。

## 1. 为什么需要独立压测
- 演示/本地用 **SQLite + 进程内 RLock(MUTEX)**，仅能单进程（workers=1）串行化。
- 生产用 **MySQL**，跨 worker 串行化靠 `SELECT ... FOR UPDATE` 行锁（`services/lock()` 在 `is_mysql()` 时生效）。进程内 MUTEX 跨进程无效。
- 故必须起 **多个独立进程连同一 MySQL 库** 才能真实复现多 worker 竞争。

## 2. 已交付的测试与脚本
仓库 `card-counter-commercial`：

| 产物 | 作用 | 状态 |
|---|---|---|
| `src/backend/tests/test_concurrency.py` | 线程级（单进程 MUTEX）不变量 | ✅ 通过 |
| `src/backend/tests/test_concurrency_mysql.py` | 多进程级（真 MySQL 行锁），`MYSQL_TEST_URL` 未设则整类 skip | ⏸ 待有 MySQL 环境执行 |
| `scripts/load_redeem_http.py` | **HTTP 端到端并发压测**（纯标准库，可打本地也可打线上） | ✅ 新增 |

配套改动：`/api/merchant/redeem` 现在会把请求体 `idempotencyKey` 透传给服务层
（此前被忽略 → 并发请求会共用 5s 默认幂等键而被短路，掩盖超卖）。

## 3. 运行 —— MySQL 多进程（真行锁，正例）
```bash
# 起一个 MySQL（docker 最快）
docker run -d --name cc-mysql -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=cardcounter_test mysql:8.0

export MYSQL_TEST_URL="mysql+pymysql://root:root@127.0.0.1:3306/cardcounter_test"
cd card-counter-commercial
PYTHONPATH=src python -m unittest backend.tests.test_concurrency_mysql -v
# 期望：times 4×20=80 并发 → 仅 10 成功/70 拦截；stored 4×20=80 → 仅 20 成功/60 拦截
```
> 已把 `PyMySQL==1.1.1` 装进仓内 `.venv`，脚本可直接运行。

## 4. 运行 —— HTTP 端到端（本地或线上）
```bash
# A) 本地单 worker（SQLite，期望安全）
PORT=8090 WEB_CONCURRENCY=1 DB_URL=sqlite:////home/wang/wk/tmp/load1.db SEED=1 \
  .venv/bin/gunicorn -c gunicorn.conf.py wsgi:app &
.venv/bin/python scripts/load_redeem_http.py --base http://127.0.0.1:8090 --kind times --capacity 10 --concurrency 40
.venv/bin/python scripts/load_redeem_http.py --base http://127.0.0.1:8090 --kind stored --capacity 20 --concurrency 80

# B) 线上（真 MySQL，期望安全）—— 需先手动重发布 cardcount-web
.venv/bin/python scripts/load_redeem_http.py --base https://cardcount-web-... --kind times --capacity 10 --concurrency 40
```
脚本行为：发一张全新测试卡（容量=capacity）→ 并发打 N 次核销（每次唯一 `idempotencyKey`）
→ 断言 `HTTP 200 数 == capacity`、其余 409、终态 `usedTimes/balanceCents` 与容量一致。
退出码 0=符合预期，1=不符合。

> ⚠️ 两个部署硬约束（本次实测踩到）：
> 1. `redeem` 默认幂等键为 `redeem:manual:{card}:{staff}:{ts//5}`，**压测/并发必须带唯一 `idempotencyKey`**，否则被幂等缓存短路。
> 2. **多 worker 时 `SEED` 必须为 0**。`SEED=1` 会让 N 个 worker 并发 seed，撞
>    `UNIQUE constraint failed: merchant.id` 导致 **worker 无法启动**（实测 4 worker 全部 boot 失败）。
>    正确做法：先单进程 `SEED=1` 建库种子一次，再以 `SEED=0` 起多 worker。

## 5. 实测结果（2026-09-11，本地）
| 场景 | 并发 | 容量 | 成功(200) | 拦截(409) | 终态 | 结论 |
|---|---|---|---|---|---|---|
| 单 worker + SQLite · 次数卡 | 40 | 10 | 10 | 30 | usedTimes=10 | ✅ 正确 |
| 单 worker + SQLite · 储值卡 | 80 | 20(¥2000) | 20 | 60 | balanceCents=0 | ✅ 正确 |
| **4 worker + SQLite · 次数卡** | 40 | 10 | **13** | 27 | usedTimes=**13** | ❌ **超卖 3 次** |
| **4 worker + SQLite · 储值卡** | 80 | 20(¥2000) | **23** | 57 | balanceCents=**-300** | ❌ **超支 ¥3** |

**这组负向结果是最有价值的产出**：它用可复现的数据证明了「SQLite 多 worker 会真实超卖」，
即 `gunicorn.conf.py` 默认 `workers=1` 不是保守选择而是**正确性约束**；要放开 worker 数必须切 MySQL 行锁。

## 6. 验收门槛
- [x] 脚本能复现「单 worker 安全」（次数卡/储值卡各 1 例）。
- [x] 脚本能检出「多 worker + SQLite 不安全」（超卖/负数余额各 1 例）。
- [ ] 多进程并发下 `ok` 计数严格等于卡容量（需 MySQL 环境执行 `test_concurrency_mysql`）。
- [ ] 终态 `usedTimes`/`balanceCents` 与容量一致（同上）。
- [ ] 无 `database is locked` / 死锁 / 重复扣减（同上）。
