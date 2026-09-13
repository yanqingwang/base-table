# wechat/ — 次卡管家（card-counter）工作区速查

> 本文件是微信云托管 / 小程序（次卡管家）的权威快速参考（AGENTS.md 约定）。
> 代码在 `/home/wang/wk/code/`；本目录只放工作记录（logs / memory / tasks / docs）。

## 项目地图
| 目录                                                                  | 说明                                                                                       |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `code/card-counter-flask/`                                          | **生产后端**（腾讯云托管服务 `card-counter`），Flask + Flask-SQLAlchemy + MySQL；已并入商业化（排课/预约/销卡/退款/审计） |
| `code/card-counter-miniapp/`                                        | 小程序前端                                                                                    |
| `code/card-counter-commercial/`                                     | 商业化独立参考/演示版（自包含，`python run.py`；含网页双端 Demo + v1.0/v2.0 设计文档）                             |
| `code/card-counter-cloudrun/` `-cloud/` `-harmony/` `card-counter/` | 旧变体（已弃用/参考）                                                                              |

## 部署机制（腾讯云托管）
- 服务：`card-counter` · 环境 envId：`cardcount-d4gjfjexz3097d803`（见 `code/card-counter-flask/cloudbaserc.json`）
- 镜像：`code/card-counter-flask/Dockerfile`（`gunicorn -c gunicorn.conf.py wsgi:app`，监听 `0.0.0.0:$PORT`）
- 数据库：容器文件系统临时 → **生产必须 MySQL**，禁 SQLite 持久
  ```bash
  USE_MYSQL=true
  MYSQL_USERNAME / MYSQL_PASSWORD / MYSQL_ADDRESS(host:port) / MYSQL_DATABASE
  SEED=1   # 首次初始化演示数据；之后置 0
  ```
  启动自动建表 + 增量补列迁移（老数据不动）。
- 并发约束：SQLite + 进程内 RLock 仅限单进程（`WEB_CONCURRENCY=1`）；MySQL 行锁可多 worker。
- 健康检查：`/api/health`（容器 `/` 亦可用）。

## AppID / 密钥（位置，不落库值）
| 配置 | 位置 |
|---|---|
| 小程序 AppID | `code/card-counter-flask/config.py` `WECHAT_APP_ID` |
| AppSecret / 公众号 / 支付凭证 / JWT / 核销令牌密钥 | 环境变量（`WECHAT_APP_SECRET`、`OFFICIAL_APP_*`、`WECHAT_PAY_*`、`JWT_SECRET`、`CARD_TOKEN_SECRET`、`INTERNAL_API_TOKEN`），见 `config.py` |
| 小程序上传密钥 | `private.wx9c5974ab24d057c3.key`（已入库，勿再添加新密钥文件） |
| 订阅消息 / 事件流 | `CLOUDBASE_SUBSCRIBE_URL` / `CLOUDBASE_EVENT_URL` + 模板 ID |

> ⚠️ SECRETS GOTCHA：不要把新密钥/`*.key`/`.env` 提交进 git；新增 `.env` 一律留在仓库外。

## 测试（`code/card-counter-flask/`）
```bash
python test_b_end.py                  # 既有 B 端闭环（发卡/核销/幂等/越权/支付守卫）
python test_commercial_integration.py # 商业化集成（发卡领卡→排课→预约→签到→销卡→退款→候补递补）22 项
python test_commercial_concurrency.py # 并发不变量（不超卖/不双扣/销卡幂等）7 项
```
`code/card-counter-commercial/`：`python run_tests.py`（22 单测）、`python run_smoke.py`（需同会话起 `python run.py`）。

## 商业化 API（并入后新增，见 `wxcloudrun/commercial_views.py`）
- 商户：`/api/merchant/courses|teachers|rooms|stores|time-windows|holidays|schedule-rules|sessions`、`/api/merchant/sessions/<id>/roster|cancel`、`/api/merchant/bookings/<id>/checkin|no-show|cancel`、`/api/merchant/cards/<id>/void|refund`
- 顾客：`/api/courses`、`/api/sessions`、`/api/sessions/<id>/book`、`/api/my/bookings|waitlist|cards`、`/api/bookings/<id>/cancel`、`/api/students`
- 鉴权：商户 `require_staff_auth`（请求带 `merchantId`）、顾客 `require_auth`（JWT Bearer）

## 合规闸门（上海，完成前不对真实客户收费）
预付卡备案 → 资金存管 → 微信支付类目资质 → 退费规则明示；小程序内容安全 msgSecCheck 已有。

## 详细记录
- 开发/进度/经验教训/下一步：`memory/work.md`（AGENTS.md 约定）
- AI 长期记忆：`.workbuddy/memory/MEMORY.md`
