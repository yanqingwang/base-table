"""商业化扩展集成验证（本地 SQLite，temp 库，不污染开发库）。

流程覆盖：
商户建卡种 → 发卡 → 顾客领卡 → 课程/老师/教室 → 循环排课生成课次 →
预约(冻结) → 名单(计划/已报名/候补) → 签到(转核销扣次) →
销卡前置拦截(有冻结预约→409) → 取消后销卡成功 → 退款 → 候补满员递补。

运行：
    python test_commercial_integration.py
"""
import os
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 指向临时 SQLite，避免污染开发库 card_counter.db
_tmp = tempfile.mktemp(suffix='.db', prefix='cc_integ_')
if os.path.exists(_tmp):
    os.remove(_tmp)
import config
config.SQLITE_PATH = _tmp

from wxcloudrun import app, db  # noqa: E402
from wxcloudrun.dao import create_user  # noqa: E402
from wxcloudrun.views import generate_token  # noqa: E402

PASS = []
FAIL = []


def check(name, cond, extra=''):
    (PASS if cond else FAIL).append(name)
    print(('  [OK]  ' if cond else '  [FAIL] ') + name + (('  ' + str(extra)) if extra else ''))


c = app.test_client()


def auth(user):
    return {'Authorization': 'Bearer ' + generate_token(user)}


def j(resp):
    body = resp.get_json() or {}
    return body.get('data', body)


def main():
    print('== 1. 建商户(owner) / 顾客 ==')
    owner = create_user(openid='owner_openid_x', nickname='店主')
    cust = create_user(openid='cust_openid_x', nickname='张女士')
    r = c.post('/api/merchant/create', headers=auth(owner), json={'name': '上海活力星球运动馆'})
    mid = j(r).get('merchantId')
    check('创建商户', r.status_code == 200 and mid, mid)
    H = {'merchantId': mid}

    print('== 2. 卡种 / 发卡 / 领卡 ==')
    r = c.post('/api/merchant/templates', headers=auth(owner), json={**H, 'name': '10次卡',
              'totalTimes': 10, 'priceCents': 9900, 'validDays': 365, 'defaultDeduct': 1})
    tpl = j(r)
    check('创建卡种', r.status_code == 200 and tpl.get('id'), tpl.get('id'))
    r = c.post('/api/merchant/cards/issue', headers=auth(owner), json={**H, 'templateId': tpl['id']})
    issued = j(r)
    check('发卡', r.status_code == 200 and issued.get('issueCode'), issued)
    r = c.post('/api/cards/claim', headers=auth(cust), json={'issueCode': issued['issueCode']})
    check('领卡', r.status_code == 200 and j(r).get('status') == 'active', j(r).get('status'))
    my = j(c.get('/api/my/cards', headers=auth(cust)))
    card = my[0]
    check('我的卡(剩余10)', card['remaining'] == 10, card)

    print('== 3. 课程/老师/教室 ==')
    r = c.post('/api/merchant/courses', headers=auth(owner), json={**H, 'name': '少儿体适能', 'defaultCapacity': 3})
    cid_ = j(r).get('id')
    check('建课程', r.status_code == 200 and cid_, cid_)
    r = c.post('/api/merchant/teachers', headers=auth(owner), json={**H, 'name': '王教练'})
    tid = j(r).get('id')
    check('建老师', r.status_code == 200 and tid)
    r = c.post('/api/merchant/rooms', headers=auth(owner), json={**H, 'name': '教室A', 'capacity': 8})
    rid = j(r).get('id')
    check('建教室', r.status_code == 200 and rid)

    print('== 4. 循环排课生成课次 ==')
    r = c.post('/api/merchant/schedule-rules', headers=auth(owner), json={
        **H, 'courseId': cid_, 'teacherId': tid, 'roomId': rid,
        'weekdays': [0, 2, 4], 'startTime': '19:00', 'endTime': '20:00',
        'startDate': '2026-08-20', 'endDate': '2026-08-31', 'planCapacity': 3})
    body = j(r)
    check('排课规则+生成课次', r.status_code == 200 and body.get('generatedSessions', 0) >= 1,
          body.get('generatedSessions'))
    s = j(c.get('/api/merchant/sessions', headers=auth(owner),
              query_string={**H, 'from': '2026-08-20', 'to': '2026-09-01'}))
    check('课次列表(周视图)', len(s) >= 1, len(s))
    s1 = s[0]

    print('== 5. 预约(冻结) / 名单 / 签到 ==')
    r = c.post('/api/sessions/%d/book' % s1['id'], headers=auth(cust),
               json={**H, 'cardId': card['id'], 'idempotencyKey': 'book-1'})
    b1 = j(r)
    check('预约成功(计划3/已报名1)', r.status_code == 200 and b1['status'] == 'confirmed'
          and b1['enrolledCount'] == 1, b1)
    r = c.get('/api/merchant/sessions/%d/roster' % s1['id'], headers=auth(owner), query_string=H)
    roster = j(r)
    check('名单含1人', len(roster['bookings']) == 1 and roster['session']['enrolledCount'] == 1)
    bid = roster['bookings'][0]['id']
    r = c.post('/api/merchant/bookings/%d/checkin' % bid, headers=auth(owner), json=H)
    ck = j(r)
    check('签到扣次(剩余9)', r.status_code == 200 and ck['remaining'] == 9, ck)
    my2 = j(c.get('/api/my/cards', headers=auth(cust)))[0]
    check('卡维度 used=1/held=0', my2['usedTimes'] == 1 and my2['heldTimes'] == 0, my2)

    print('== 6. 销卡前置拦截 / 取消后销卡成功 ==')
    s2 = s[1]
    r = c.post('/api/sessions/%d/book' % s2['id'], headers=auth(cust),
               json={**H, 'cardId': card['id']})
    b2 = j(r)
    r = c.post('/api/merchant/cards/%d/void' % card['id'], headers=auth(owner),
               json={**H, 'voidType': 'claimed', 'reason': '退卡', 'idempotencyKey': 'void-1'})
    check('有冻结预约→销卡被拦截(409)', r.status_code == 409, (r.status_code, j(r)))
    r = c.post('/api/bookings/%d/cancel' % b2['bookingId'], headers=auth(cust), json=H)
    check('顾客取消预约', r.status_code == 200 and j(r)['status'] == 'cancelled')
    r = c.post('/api/merchant/cards/%d/void' % card['id'], headers=auth(owner),
               json={**H, 'voidType': 'claimed', 'reason': '退卡', 'idempotencyKey': 'void-2'})
    check('取消后销卡成功', r.status_code == 200 and j(r)['status'] == 'voided', j(r))

    print('== 7. 退款（新卡） ==')
    r = c.post('/api/merchant/cards/issue', headers=auth(owner), json={**H, 'templateId': tpl['id']})
    c2 = j(r)
    c.post('/api/cards/claim', headers=auth(cust), json={'issueCode': c2['issueCode']})
    r = c.post('/api/merchant/cards/%d/refund' % c2['cardId'], headers=auth(owner),
               json={**H, 'reason': '未使用退款'})
    check('退款成功(9900分)', r.status_code == 200 and j(r)['refundCents'] == 9900, j(r))

    print('== 8. 候补 + 递补 ==')
    s3 = s[2]
    # PATCH 容量为 1（require_staff_auth 需要 body 带 merchantId）
    r = c.patch('/api/merchant/sessions/%d' % s3['id'], headers=auth(owner), json={**H, 'planCapacity': 1})
    check('缩容到1', r.status_code == 200 and j(r)['planCapacity'] == 1, j(r))
    cust2 = create_user(openid='cust2_openid_x', nickname='李女士')
    # 给 cust 和 cust2 各发一张新卡（卡1已在第6步被销）
    r = c.post('/api/merchant/cards/issue', headers=auth(owner), json={**H, 'templateId': tpl['id']})
    c4 = j(r)
    c.post('/api/cards/claim', headers=auth(cust), json={'issueCode': c4['issueCode']})
    my4 = j(c.get('/api/my/cards', headers=auth(cust)))[0]
    r = c.post('/api/merchant/cards/issue', headers=auth(owner), json={**H, 'templateId': tpl['id']})
    c3 = j(r)
    c.post('/api/cards/claim', headers=auth(cust2), json={'issueCode': c3['issueCode']})
    my3 = j(c.get('/api/my/cards', headers=auth(cust2)))[0]
    r = c.post('/api/sessions/%d/book' % s3['id'], headers=auth(cust), json={**H, 'cardId': my4['id']})
    first = j(r)
    r = c.post('/api/sessions/%d/book' % s3['id'], headers=auth(cust2), json={**H, 'cardId': my3['id']})
    second = j(r)
    check('满员→候补', second['status'] == 'waitlisted', second)
    r = c.post('/api/bookings/%d/cancel' % first['bookingId'], headers=auth(cust), json=H)
    promoted = j(r).get('promoted')
    check('取消→候补自动递补', promoted is not None and promoted.get('userId') == cust2.id, j(r))
    r = c.get('/api/merchant/sessions/%d/roster' % s3['id'], headers=auth(owner), query_string=H)
    rs3 = j(r)
    check('递补后已报名1/候补0', rs3['session']['enrolledCount'] == 1
          and rs3['session']['waitlistCount'] == 0, rs3['session'])

    print('== 9. 订单/支付闭环（C 任务） ==')
    r = c.post('/api/orders', headers=auth(cust), json={'templateId': tpl['id']})
    order = j(r)
    check('下单买卡', r.status_code == 200 and order.get('orderId') and order.get('amountCents') == 9900, order)
    oid = order['orderId']
    r = c.post('/api/orders/%d/pay' % oid, headers=auth(cust), json={})
    paid = j(r)
    check('支付成功→直发次卡', r.status_code == 200 and paid.get('status') == 'paid' and paid.get('cardId'), paid)
    r = c.get('/api/orders/mine', headers=auth(cust))
    mine = j(r)
    check('我的订单列表', r.status_code == 200 and isinstance(mine.get('items'), list) and len(mine['items']) >= 1, mine)
    r = c.post('/api/orders/%d/pay' % oid, headers=auth(cust), json={})
    check('重复支付幂等(alreadyPaid)', r.status_code == 200 and j(r).get('alreadyPaid') is True, j(r))

    print('== 10. RFM 客群分层（A 任务） ==')
    r = c.get('/api/merchant/segments', headers=auth(owner), query_string={**H, 'summary': '1'})
    summ = j(r)
    check('客群汇总', r.status_code == 200 and isinstance(summ.get('segments'), list), summ)
    r = c.get('/api/merchant/segments', headers=auth(owner), query_string={**H, 'top': '50'})
    seg = j(r)
    check('客群明细', r.status_code == 200 and seg.get('total', 0) >= 1 and 'items' in seg, seg)

    print('== 11. 退费应退估算（D 任务） ==')
    r = c.post('/api/merchant/cards/issue', headers=auth(owner), json={**H, 'templateId': tpl['id']})
    rc = j(r)
    r = c.post('/api/cards/claim', headers=auth(cust), json={'issueCode': rc['issueCode']})
    rcid = j(r)['id']
    r = c.get('/api/cards/%d/refund-estimate' % rcid, headers=auth(cust))
    est = j(r)
    check('本人应退估算(0次用→全额9900)', r.status_code == 200 and est.get('refundCents') == 9900 and est.get('refundable') is True, est)

    print('== 12. 团购核销落私域（B 任务） ==')
    from wxcloudrun.model import GroupBuyVoucher  # noqa: E402
    db.session.add(GroupBuyVoucher(merchant_id=mid, code='GB-TEST-001',
                                   platform='meituan', ref_template_id=tpl['id'],
                                   status='unused'))
    db.session.commit()
    r = c.post('/api/group-buy/redeem', headers=auth(cust),
               json={'code': 'GB-TEST-001', **H})
    gb = j(r)
    check('团购券核销→直发次卡', r.status_code == 200 and gb.get('status') == 'redeemed' and gb.get('cardId'), gb)
    r = c.post('/api/group-buy/redeem', headers=auth(cust),
               json={'code': 'GB-TEST-001', **H})
    check('重复核销被拒', r.status_code not in (200,) and j(r).get('errorMsg'), (r.status_code, j(r)))

    print()
    print('通过 %d / %d' % (len(PASS), len(PASS) + len(FAIL)))
    if FAIL:
        print('失败项:', FAIL)
        sys.exit(1)
    os.remove(_tmp)


if __name__ == '__main__':
    with app.app_context():
        main()
