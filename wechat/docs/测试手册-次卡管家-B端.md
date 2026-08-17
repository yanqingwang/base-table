# 次卡管家 · 测试手册（Bug 修复 + B 端最小闭环）

> 适用版本：v2.5.x + B 端 Phase 1-5（后端 `card-counter-flask`，小程序 `card-counter-miniapp`）
> 编写日期：2026-08-17（Phase 4/5 补充于同日晚）
> 范围：P0/P1 Bug 修复验证、B 端「发卡→领卡→动态码核销」闭环 + Phase 4 云事件/订阅消息 + Phase 5 实时看板/微信支付 的后端自动化测试与小程序手动验证。

---

## 一、后端自动化测试（推荐，可重复执行）

后端使用 Flask `test_client`，不依赖微信环境，可在本地直接跑。所有断言已在开发中验证通过。

### 1.1 准备
```bash
cd code/card-counter-flask
# 用系统 python 或 .venv；依赖：flask / flask-sqlalchemy / pyjwt / requests
PYTHONPATH=$(pwd) python - <<'PY'
from wxcloudrun import app
# 仅验证导入与建表成功即可
print('app import ok, tables:', [t for t in __import__('wxcloudrun', fromlist=['db']).db.metadata.tables])
PY
```

### 1.2 Bug 修复相关（小程序侧为主，后端无需改）
后端 `used_times` 早已由签到记录派生（`recompute_quota_used_times`），`POST /api/quotas` 忽略客户端传入的 `usedTimes`，故无后端改动。小程序侧修复见第三节手动验证。

### 1.3 B 端闭环自动化用例

把以下脚本保存为 `test_b_end.py` 后执行（仓库根已包含该文件，可直接运行）：

```python
"""次卡管家 B 端闭环自动化测试（Phase 1-5）。
运行：cd code/card-counter-flask && PYTHONPATH=$(pwd) python test_b_end.py
依赖：flask / flask-sqlalchemy / pyjwt / requests
"""
import time
import hashlib
import hmac as _h

from wxcloudrun import app
from wxcloudrun import config

c = app.test_client()
SECRET = config.CARD_TOKEN_SECRET.encode()


def login(openid):
    return {'Authorization': 'Bearer ' +
            c.get('/api/auth/wechat-login', headers={'X-WX-OPENID': openid}).get_json()['data']['token']}


owner, cashier, customer = login('o_t'), login('c_t'), login('u_t')


def ok(r, m):
    b = r.get_json()
    assert r.status_code == 200 and b.get('code') == 0, (m, r.status_code, b)
    return b['data']


def err(r, m):
    b = r.get_json()
    assert r.status_code != 200 and b.get('code') == -1, (m, r.status_code, b)
    print('  ✓', m, '->', b.get('errorMsg'))
    return b


# —— 商户与权限 ——
mid = ok(c.post('/api/merchant/create', headers=owner, json={'name': '测试店'}), '建商户')['merchantId']
ok(c.post('/api/merchant/staff/invite?merchantId=%d' % mid, headers=owner,
          json={'openid': 'c_t', 'role': 'cashier'}), '邀请店员')
intruder = login('intruder_t')  # 非本商户员工
err(c.get('/api/merchant/staff/list?merchantId=%d' % mid, headers=intruder), '非本商户越权(403)')

# —— 发卡 / 领卡 ——
tpl = ok(c.post('/api/merchant/templates?merchantId=%d' % mid, headers=owner,
                json={'name': '3次卡', 'totalTimes': 3, 'validDays': 30, 'priceCents': 9900}), '建卡种(含价)')
code = ok(c.post('/api/merchant/cards/issue?merchantId=%d' % mid, headers=owner,
                json={'templateId': tpl['id']}), '发卡')['issueCode']
card = ok(c.post('/api/cards/claim', headers=customer, json={'issueCode': code}), '领卡')
cid = card['id']
err(c.post('/api/cards/claim', headers=login('other'), json={'issueCode': code}), '重复领取(拒)')


# —— 动态码核销（含幂等/过期/篡改/跨商户/用满）——
def fresh():
    time.sleep(1.1)  # 令牌为秒级，避免碰撞
    return ok(c.get('/api/cards/%d/redeem-token' % cid, headers=customer), '取令牌')['token']


r1 = ok(c.post('/api/merchant/redeem?merchantId=%d' % mid, headers=cashier,
               json={'token': fresh()}), '核销1')
assert r1['remaining'] == 2
time.sleep(1.1)  # 令牌为秒级，确保令牌A 与 核销1 不同秒，避免碰撞命中幂等
tok = ok(c.get('/api/cards/%d/redeem-token' % cid, headers=customer), '令牌A')['token']
ok(c.post('/api/merchant/redeem?merchantId=%d' % mid, headers=cashier, json={'token': tok}), '核销A')
idem = ok(c.post('/api/merchant/redeem?merchantId=%d' % mid, headers=cashier, json={'token': tok}), '幂等')
assert idem.get('idempotent') and idem['remaining'] == 1, idem
ok(c.post('/api/merchant/redeem?merchantId=%d' % mid, headers=cashier, json={'token': fresh()}), '核销2(用满)')

err(c.post('/api/merchant/redeem?merchantId=%d' % mid, headers=cashier, json={'token': fresh()}), '用满后再核销(拒)')
old = '%d.%d' % (cid, int(time.time()) - 200)
sig = _h.new(SECRET, old.encode(), hashlib.sha256).hexdigest()[:12]
err(c.post('/api/merchant/redeem?merchantId=%d' % mid, headers=cashier,
           json={'token': old + '.' + sig}), '过期令牌(拒)')
err(c.post('/api/merchant/redeem?merchantId=%d' % mid, headers=cashier,
           json={'token': tok + 'z'}), '篡改令牌(拒)')
other_mid = ok(c.post('/api/merchant/create', headers=login('o2'), json={'name': '别店'}), '建别店')['merchantId']
time.sleep(1.1)
cross = ok(c.get('/api/cards/%d/redeem-token' % cid, headers=customer), '跨店令牌')['token']
err(c.post('/api/merchant/redeem?merchantId=%d' % other_mid, headers=login('o2'),
           json={'token': cross}), '跨商户核销(拒)')

# —— 列表端点 + 商户核销 feed（看板实时数据源）——
assert any(x['id'] == cid for x in ok(c.get('/api/cards', headers=customer), '我的卡包'))
assert any(x['id'] == cid for x in ok(c.get('/api/merchant/cards?merchantId=%d' % mid, headers=cashier), '商户卡列表'))
feed = ok(c.get('/api/merchant/redemptions?merchantId=%d' % mid, headers=cashier), '商户核销feed')
assert len(feed) == 3, feed  # 3 次成功核销
assert feed[0]['cardId'] == cid
assert any(x['recordId'] for x in feed)

# —— 内部事件接口（无 INTERNAL_API_TOKEN 时仅本进程可调用，test_client 视为本地）——
exp = ok(c.get('/api/internal/expiring-cards?merchantId=%d&days=30' % mid), '内部-即将到期卡')
assert isinstance(exp, list)
feed2 = ok(c.get('/api/internal/redemption-feed?merchantId=%d' % mid), '内部-核销事件流')
assert isinstance(feed2, list) and len(feed2) == 3, feed2

# —— 微信支付准备（环境守卫：未配置凭证应明确拒绝）——
pay = c.post('/api/merchant/pay/prepare?merchantId=%d' % mid, headers=owner,
             json={'templateId': tpl['id']})
assert pay.status_code == 503, (pay.status_code, pay.get_json())
print('  ✓ 微信支付未配置凭证时拒绝(503) ->', pay.get_json().get('errorMsg'))
config.WECHAT_PAY_MOCK = True
pay_mock = ok(c.post('/api/merchant/pay/prepare?merchantId=%d' % mid, headers=owner,
                     json={'templateId': tpl['id']}), '微信支付mock预下单')
assert pay_mock.get('mock') is True and pay_mock.get('outTradeNo')
config.WECHAT_PAY_MOCK = False

print('ALL B-END TESTS PASSED')
```

执行：`PYTHONPATH=$(pwd) python test_b_end.py`
预期：全部打印 `ALL B-END TESTS PASSED`，无 AssertionError。

### 1.4 关键断言说明
| 用例 | 验证点 |
|---|---|
| 重复领取 | 行锁 + `status=unclaimed` 校验，已领码不可二次绑定 |
| 幂等重核销 | 同 `verify_token` 只扣一次，返回 `idempotent:true` |
| 过期令牌 | `time.time()-ts>90` 拒绝 |
| 篡改令牌 | HMAC 签名校验失败拒绝 |
| 跨商户核销 | `merchant_id` 归属校验（含幂等分支）拒绝 |
| 用满后再核销 | `status=used_up` 拒绝 |
| 列表端点 | 客户只看自己 `owner_openid` 的卡；商户只看本店卡 |

---

## 二、小程序 Bug 修复手动验证（P0/P1）

> 验证前请先用 `NODE_PATH=$(npm root -g) node scripts/upload_ci.js <ver> <desc>` 上传开发版（或真机预览）。

### 2.1 P0#1 `usedTimes` 权威源
- 设备 A 对某次卡签到一次 → 等待同步（或下拉刷新）。
- 设备 B（同一微信）打开该次卡，确认「已用次数」与 A 一致，**不会被旧值覆盖回退**。
- 网页端（云托管）删除一条签到 → 小程序下拉刷新后该签到消失且剩余次数回升。

### 2.2 P0#2 静默登录不再报错
- 清除小程序缓存后首次进入：登录静默完成，控制台**不再**出现 `getUserProfile` 相关报错（`app.js` 已移除该调用）。
- 资料完善仍在「我的 → 编辑」用 `chooseAvatar` / 昵称输入框完成。

### 2.3 P0#3 写入即同步
- 新建一张次卡 → 不点「我的」也不切后台，直接杀进程重进 → 数据已在云端（另一设备可拉到），说明 `storage` 写入后已 debounce 触发 `push`。

### 2.4 P0#4 401 重登录上限
- 后端临时改 `JWT_SECRET` 使旧 token 失效 → 小程序触发一次重登录；若重登录后仍 401，最多再试 1 次即停，不再死循环（界面提示「登录状态异常，请重新进入小程序」）。

### 2.5 P1 删除同步 / 双 finish / 多环境 / 容量
- **删除同步**：网页端删除某条签到/评价 → 小程序下拉刷新后本地同步消失（checkins/ratings 已补 `_cloudKnown` 墓碑）。
- **多环境**：`utils/config.js` 按 `envVersion` 选环境；开发版/体验版/正式版自动切换 `env`/`service`，不再硬编码。
- **容量兜底**：本地存储写满时 `storage.set` 捕获异常并 `wx.showToast('本地存储已满，请及时清理')`，不再静默失败。

---

## 三、B 端最小闭环手动验证（小程序）

入口：小程序「我的」→ **我的卡包** / **我是商户**。

### 3.1 商户侧（我是商户）
1. 首次进入 → 填写商户名称 → 创建商户（当前微信成为 `owner`）。
2. 「+ 发卡」→ 选择卡种（先建卡种：名称/次数/有效期）→ 确认发卡 → 得到**领取码**。
3. 把领取码发给顾客；「已发卡」列表实时显示该卡状态与剩余次数。

### 3.2 顾客侧（我的卡包）
1. 「+ 领卡」→ 输入领取码 → 绑定成功，进入卡详情。
2. 卡详情每 ~60s 刷新一次**动态核销码**（90s 时效，一次性）。
3. 点「复制核销码」交给店员，或出示给店员扫码。

### 3.3 核销（商户端）
1. 「我是商户」→「核销」→ 扫顾客动态码 / 粘贴核销码 → 核销成功，显示剩余次数。
2. 同一核销码重复核销 → 不重复扣次（幂等）。
3. 次数用满后再核销 → 提示「卡状态异常：used_up」。

### 3.4 网页版实时看板手动验证（Phase 5）
1. 商户小程序「我是商户」→ 点「电脑看板」→ 复制看板链接（含登录 token）。
2. 电脑浏览器打开链接 → 看板展示「发卡总数 / 在售 / 已用满 / 今日核销」概览。
3. 商户核销一笔 → 看板「实时核销记录」5 秒内出现该笔；概览「今日核销」+1。
4. 越权：把链接的 `token` 换成非本商户员工的 token → 跳回首页提示「无该商户的看板权限」。

### 3.5 已知限制（本手册适用范围外）
- **动态核销码当前以文本展示**，未渲染二维码（仓库无 QR 库）。真实部署建议接入 `weapp-qrcode` 等库，或让后端提供二维码图片接口；扫码核销的 `wx.scanCode` 已就绪。
- **Phase 4 云事件 / 订阅消息** 已可配置接线：`emit_cloud_event` / `send_subscribe_message` 在配置 `CLOUDBASE_EVENT_URL` / `CLOUDBASE_SUBSCRIBE_URL` 时 POST 到云函数，未配置则安全 no-op（仍落库 `NotificationLog`）。需部署 `cloudfunctions/checkExpiringCards` + `cloudfunctions/notifySubscribe` 并配 `INTERNAL_API_TOKEN` / 订阅模板 ID 才真正发消息。
- **Phase 5 微信支付** 已留准备接口 `POST /api/merchant/pay/prepare`（受 env 守卫）：未配 `WECHAT_PAY_MCH_ID/API_KEY` 返回明确 503；`WECHAT_PAY_MOCK=1` 返回占位 prepay 联调；真实下单（微信支付 v3 + 证书）待补全。
- 商户端 UI 暂与顾客端同包（同一小程序内「我是商户」入口）；如需独立商户小程序，可迁移 `pages/merchant/*`。

---

## 四、回归清单（每次发布前）
- [ ] 后端：`test_b_end.py` 全绿（Phase 1-5：商户/权限/发卡/领卡/动态码核销/内部接口/核销feed/微信支付守卫）
- [ ] 后端：原 quota/checkin 流程回归（`used_times` 由签到派生不变）
- [ ] 后端：**内容安全**：`WECHAT_APP_SECRET` 缺失时 UGC 写入放行（no-op）；配置后对评价/签到备注/配额商家·事项·备注调用 `msgSecCheck v2`，命中 risky/review 返回 400 拦截（已用 mock 验证放行/拦截两条路径）
- [ ] 小程序：`node --check` 全绿；P0#1~#4 手动用例通过
- [ ] 小程序：B 端「建商户→发卡→领卡→核销」走通；「电脑看板」链接可复制
- [ ] 网页：看板 `/merchant/<id>?token=` 正常渲染、5s 轮询刷新
- [ ] `git` 提交：后端只 `git add` 指定文件（勿 `add -A`，避免 `card_counter.db`/`__pycache__` 入库）；新文件 `test_b_end.py`、`cloudfunctions/*` 需纳入
