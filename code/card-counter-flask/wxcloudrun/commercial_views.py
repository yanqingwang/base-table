"""商业化扩展路由：排课 / 预约 / 销卡 / 退款 / 时间窗格 / 学员档案。

鉴权与既有代码一致：
- 商户侧：@require_staff_auth()（请求需带 merchantId，见 wxcloudrun/views.py）
- 顾客侧：@require_auth（JWT → request.current_user）
响应：make_succ_response / make_err_response（camelCase）。
"""
import logging
from datetime import datetime, timedelta

from flask import request

from wxcloudrun import app, db
from wxcloudrun.response import make_succ_response, make_err_response
from wxcloudrun.views import require_auth, require_staff_auth
from wxcloudrun.model import Card, Course, CourseSession, Holiday
from wxcloudrun import commercial as C

logger = logging.getLogger(__name__)


def _run(f):
    """统一异常→错误响应。"""
    try:
        return make_succ_response(f())
    except C.BizError as e:
        return make_err_response(e.msg, e.code)
    except Exception as e:  # noqa: BLE001
        logger.exception('commercial route error')
        return make_err_response('服务器错误: %s' % e, 500)


def _dt(v):
    return C._parse_dt(v) if v else None


def _mid():
    """顾客侧获取 merchantId（query/body，与 require_staff_auth 一致）。"""
    data = request.get_json(silent=True) or {}
    raw = request.args.get('merchantId') or data.get('merchantId') or data.get('merchant_id')
    if not raw:
        raise C.BizError('缺少 merchantId')
    try:
        return int(raw)
    except (ValueError, TypeError):
        raise C.BizError('merchantId 无效')


# ────────────────────────────── 商户：基础资料 ──────────────────────────────

@app.route('/api/merchant/stores', methods=['GET', 'POST'])
@require_staff_auth()
def merchant_stores():
    mid = request.current_merchant_id
    if request.method == 'POST':
        return _run(lambda: C.store_to_dict(C.create_store(mid, request.get_json() or {})))
    return _run(lambda: [C.store_to_dict(m) for m in C.list_stores(mid)])


@app.route('/api/merchant/courses', methods=['GET', 'POST'])
@require_staff_auth()
def merchant_courses():
    mid = request.current_merchant_id
    if request.method == 'POST':
        return _run(lambda: C.course_to_dict(C.create_course(mid, request.get_json() or {})))
    return _run(lambda: [C.course_to_dict(c) for c in C.list_courses(mid)])


@app.route('/api/merchant/teachers', methods=['GET', 'POST'])
@require_staff_auth()
def merchant_teachers():
    mid = request.current_merchant_id
    if request.method == 'POST':
        return _run(lambda: C.teacher_to_dict(C.create_teacher(mid, request.get_json() or {})))
    return _run(lambda: [C.teacher_to_dict(t) for t in C.list_teachers(mid)])


@app.route('/api/merchant/rooms', methods=['GET', 'POST'])
@require_staff_auth()
def merchant_rooms():
    mid = request.current_merchant_id
    if request.method == 'POST':
        return _run(lambda: C.room_to_dict(C.create_room(mid, request.get_json() or {})))
    return _run(lambda: [C.room_to_dict(r) for r in C.list_rooms(mid)])


@app.route('/api/merchant/time-windows', methods=['GET', 'POST'])
@require_staff_auth()
def merchant_time_windows():
    mid = request.current_merchant_id
    if request.method == 'POST':
        return _run(lambda: C.window_to_dict(
            C.create_time_window(mid, request.get_json() or {})))
    q = request.args
    return _run(lambda: [C.window_to_dict(w) for w in C.list_time_windows(
        mid, target_type=q.get('targetType'), target_id=q.get('targetId'))])


@app.route('/api/merchant/holidays', methods=['GET', 'POST'])
@require_staff_auth()
def merchant_holidays():
    mid = request.current_merchant_id
    if request.method == 'POST':
        data = request.get_json() or {}
        d = C._d(data.get('holidayDate'))
        if not d:
            return make_err_response('holidayDate 无效')
        if not Holiday.query.filter_by(merchant_id=mid, holiday_date=d).first():
            db.session.add(Holiday(merchant_id=mid, holiday_date=d,
                                   name=data.get('name', '') or ''))
            db.session.commit()
        return _run(lambda: {'holidayDate': d.isoformat(), 'name': data.get('name', '') or ''})
    return _run(lambda: [{'holidayDate': h.holiday_date.isoformat(), 'name': h.name or ''}
                         for h in Holiday.query.filter_by(merchant_id=mid).all()])


# ────────────────────────────── 商户：排课 ──────────────────────────────

@app.route('/api/merchant/schedule-rules', methods=['POST'])
@require_staff_auth()
def merchant_schedule_rules():
    """创建循环排课规则并自动生成课次。"""
    mid = request.current_merchant_id

    def f():
        rule = C.create_schedule_rule(mid, request.get_json() or {})
        created = C.generate_sessions(rule.id)
        return {'rule': C.rule_to_dict(rule), 'generatedSessions': created}
    return _run(f)


@app.route('/api/merchant/schedule-rules/<int:rid>/generate', methods=['POST'])
@require_staff_auth()
def merchant_schedule_generate(rid):
    return _run(lambda: {'generatedSessions': C.generate_sessions(rid)})


@app.route('/api/merchant/sessions', methods=['GET', 'POST'])
@require_staff_auth()
def merchant_sessions():
    mid = request.current_merchant_id
    if request.method == 'POST':
        return _run(lambda: C.session_to_dict(
            C.create_single_session(mid, request.get_json() or {})))
    q = request.args
    return _run(lambda: [C.session_to_dict(s) for s in C.list_sessions(
        mid, from_dt=_dt(q.get('from')), to_dt=_dt(q.get('to')),
        course_id=q.get('courseId'))])


@app.route('/api/merchant/sessions/<int:sid>', methods=['PATCH'])
@require_staff_auth()
def merchant_session_patch(sid):
    return _run(lambda: C.session_to_dict(
        C.patch_session(request.current_merchant_id, sid, request.get_json() or {})))


@app.route('/api/merchant/sessions/<int:sid>/cancel', methods=['POST'])
@require_staff_auth()
def merchant_session_cancel(sid):
    data = request.get_json() or {}
    return _run(lambda: C.cancel_session(
        request.current_merchant_id, sid, reason=data.get('reason', ''),
        operator_id=request.current_staff.id))


@app.route('/api/merchant/sessions/<int:sid>/roster', methods=['GET'])
@require_staff_auth()
def merchant_session_roster(sid):
    return _run(lambda: _roster_payload(sid))


def _roster_payload(sid):
    s, bookings, waitlist = C.session_roster(sid)
    return {'session': C.session_to_dict(s), 'bookings': bookings,
            'waitlist': waitlist}


# ────────────────────────────── 商户：预约处理 / 考勤 / 销卡 / 退款 ──────────────────────────────

@app.route('/api/merchant/bookings/<int:bid>/checkin', methods=['POST'])
@require_staff_auth()
def merchant_booking_checkin(bid):
    return _run(lambda: C.checkin(request.current_merchant_id, bid,
                                  request.current_staff))


@app.route('/api/merchant/bookings/<int:bid>/no-show', methods=['POST'])
@require_staff_auth()
def merchant_booking_no_show(bid):
    return _run(lambda: C.no_show(request.current_merchant_id, bid,
                                  request.current_staff))


@app.route('/api/merchant/bookings/<int:bid>/cancel', methods=['POST'])
@require_staff_auth()
def merchant_booking_cancel(bid):
    data = request.get_json() or {}
    return _run(lambda: C.merchant_cancel_booking(
        request.current_merchant_id, bid, request.current_staff,
        reason=data.get('reason', '')))


@app.route('/api/merchant/cards/<int:cid>/void', methods=['POST'])
@require_staff_auth()
def merchant_card_void(cid):
    data = request.get_json() or {}
    return _run(lambda: C.void_card(
        request.current_merchant_id, cid,
        void_type=data.get('voidType', 'claimed'),
        reason=data.get('reason', ''),
        operator_id=request.current_staff.id,
        idempotency_key=data.get('idempotencyKey'))[0])


@app.route('/api/merchant/cards/<int:cid>/refund', methods=['POST'])
@require_staff_auth()
def merchant_card_refund(cid):
    data = request.get_json() or {}
    return _run(lambda: C.create_refund(
        request.current_merchant_id, cid,
        reason=data.get('reason', ''),
        operator_id=request.current_staff.id,
        idempotency_key=data.get('idempotencyKey'))[0])


# ────────────────────────────── 顾客：课程 / 课次 / 预约 ──────────────────────────────

@app.route('/api/courses', methods=['GET'])
@require_auth
def student_courses():
    mid = request.args.get('merchantId')
    if not mid:
        return make_err_response('缺少 merchantId')
    return _run(lambda: [C.course_to_dict(c) for c in C.list_courses(int(mid))])


@app.route('/api/sessions', methods=['GET'])
@require_auth
def student_sessions():
    mid = request.args.get('merchantId')
    if not mid:
        return make_err_response('缺少 merchantId')
    q = request.args
    return _run(lambda: [C.session_to_dict(s) for s in C.list_sessions(
        int(mid), from_dt=_dt(q.get('from')), to_dt=_dt(q.get('to')),
        course_id=q.get('courseId'))])


@app.route('/api/sessions/<int:sid>', methods=['GET'])
@require_auth
def student_session_detail(sid):
    return _run(lambda: _roster_payload(sid) if request.args.get('withRoster') else
                C.session_to_dict(CourseSession.query.get_or_404(sid)))


@app.route('/api/sessions/<int:sid>/book', methods=['POST'])
@require_auth
def student_session_book(sid):
    data = request.get_json() or {}
    result, _idem = C.create_booking(
        _mid(), sid, request.current_user, data,
        idempotency_key=data.get('idempotencyKey'))
    return make_succ_response(result)


@app.route('/api/my/bookings', methods=['GET'])
@require_auth
def student_my_bookings():
    return _run(lambda: [C.booking_to_dict(b) for b in C.my_bookings(request.current_user)])


@app.route('/api/my/waitlist', methods=['GET'])
@require_auth
def student_my_waitlist():
    return _run(lambda: [C.waitlist_to_dict(w) for w in C.my_waitlist(request.current_user)])


@app.route('/api/bookings/<int:bid>/cancel', methods=['POST'])
@require_auth
def student_booking_cancel(bid):
    data = request.get_json() or {}
    return _run(lambda: C.cancel_booking(
        _mid(), bid, request.current_user,
        cancel_type='self', reason=data.get('reason', ''))[0])


@app.route('/api/my/cards', methods=['GET'])
@require_auth
def student_my_cards():
    """当前顾客的全部卡（含冻结次数与剩余，供预约选择）。"""
    user = request.current_user
    return _run(lambda: [C.card_full_to_dict(c) for c in Card.query.filter(
        (Card.owner_openid == user.openid) | (Card.owner_user_id == user.id)
    ).order_by(Card.created_at.desc()).all()])


@app.route('/api/students', methods=['GET', 'POST'])
@require_auth
def student_profiles():
    user = request.current_user
    if request.method == 'POST':
        return _run(lambda: C.student_to_dict(C.create_student(
            _mid(), user, request.get_json() or {})))
    return _run(lambda: [C.student_to_dict(s) for s in C.list_students(user)])


# ────────────────────────────── C 任务：订单 / 支付闭环（顾客端） ──────────────────────────────

@app.route('/api/orders', methods=['POST'])
@require_auth
def student_create_order():
    """顾客下单买卡（金额由模板决定，商户不信任客户端）。"""
    data = request.get_json() or {}
    tid = data.get('templateId')
    if not tid:
        return make_err_response('缺少 templateId')
    try:
        tid = int(tid)
    except (ValueError, TypeError):
        return make_err_response('templateId 无效')
    result, _idem = C.create_order(request.current_user, tid,
                                   idempotency_key=data.get('idempotencyKey'))
    return make_succ_response(result)


@app.route('/api/orders/<int:oid>/pay', methods=['POST'])
@require_auth
def student_pay_order(oid):
    """支付成功：标记已付并直发次卡（重复支付幂等）。"""
    body = request.get_json(silent=True) or {}
    result, _idem = C.pay_order(oid, request.current_user,
                                idempotency_key=body.get('idempotencyKey'))
    return make_succ_response(result)


@app.route('/api/orders/mine', methods=['GET'])
@require_auth
def student_my_orders():
    """我的订单列表。"""
    return _run(lambda: {'items': C.my_orders(request.current_user)})


# ────────────────────────────── A 任务：RFM 客群分层（商户端） ──────────────────────────────

@app.route('/api/merchant/segments', methods=['GET'])
@require_staff_auth()
def merchant_segments():
    mid = request.current_merchant_id
    if request.args.get('summary') in ('1', 'true', 'True'):
        return _run(lambda: C.segment_summary(mid))
    top = request.args.get('top', default=100, type=int)
    return _run(lambda: C.compute_segments(mid, top=top))


# ────────────────────────────── D 任务：退费应退估算 ──────────────────────────────

@app.route('/api/merchant/cards/<int:cid>/refund-estimate', methods=['GET'])
@require_staff_auth()
def merchant_card_refund_estimate(cid):
    """商户侧查看某卡应退估算。"""
    return _run(lambda: C.estimate_refund(cid))


@app.route('/api/cards/<int:cid>/refund-estimate', methods=['GET'])
@require_auth
def student_card_refund_estimate(cid):
    """顾客侧查看本人卡的应退估算。"""
    user = request.current_user
    card = Card.query.get(cid)
    if not card:
        return make_err_response('卡不存在', 404)
    if card.owner_user_id != user.id and card.owner_openid != user.openid:
        return make_err_response('无权限', 403)
    return make_succ_response(C.estimate_refund(cid))


# ────────────────────────────── B 任务：团购核销落私域（顾客端，占位） ──────────────────────────────

@app.route('/api/group-buy/redeem', methods=['POST'])
@require_auth
def student_group_buy_redeem():
    data = request.get_json() or {}
    code = data.get('code') or data.get('voucherCode')

    def f():
        return C.redeem_voucher(code, request.current_user,
                                idempotency_key=data.get('idempotencyKey'))[0]

    return _run(f)


# ────────────────────────────── 顾客端：卡种详情（买卡落地页用） ──────────────────────────────

@app.route('/api/templates/<int:tid>', methods=['GET'])
@require_auth
def student_template_detail(tid):
    """顾客买卡落地页：返回卡种公开信息（不含敏感字段）。商户由模板归属决定。"""
    tpl = CardTemplate.query.get(tid)
    if not tpl:
        return make_err_response('卡种不存在', 404)
    if tpl.status != 'active':
        return make_err_response('卡种已下架', 410)
    return make_succ_response({
        'id': tpl.id, 'merchantId': tpl.merchant_id, 'name': tpl.name,
        'totalTimes': tpl.total_times, 'priceCents': tpl.price_cents,
        'validDays': tpl.valid_days, 'defaultDeduct': tpl.default_deduct,
        'refundRule': tpl.refund_rule or '',
        'refundRuleType': tpl.refund_rule_type or 'prorata_by_used',
    })
