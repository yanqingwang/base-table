"""商业化扩展：排课 / 预约 / 销卡 / 退款 / 审计 / 幂等（服务层）。

与既有代码同一套风格：Flask-SQLAlchemy `db.session`、`with_for_update()` 行锁、
camelCase 序列化、`redemption_records` 作为核销扣次权威来源。
复用既有表：merchants / staff / cards / card_templates / redemption_records / users。

设计要点（与 v2.0 商业化文档一致）：
- used_times / held_times / enrolled_count / waitlist_count 均服务端维护，客户端不上传。
- 预约冻结次数（CardHold）、签到转核销（redemption_records）、取消释放并候补递补。
- 销卡前置校验：有进行中预约 / 待支付订单时拒绝。
- 全部类资金操作写 audit_logs。
"""
import json
from datetime import datetime, date, timedelta

from wxcloudrun import db
from wxcloudrun.model import (
    User, Merchant, Staff, CardTemplate, Card, RedemptionRecord, NotificationLog,
    MerchantStore, StaffRole, StudentProfile, CardLedger, CardHold, CardVoidRecord,
    CardRefundRecord, Course, Teacher, Room, TimeWindow, ScheduleRule, CourseSession,
    Booking, Waitlist, AttendanceRecord, CourseCancelRecord, Order, PaymentRecord,
    RefundRecord, AuditLog, IdempotencyKey, Holiday, GroupBuyVoucher,
)
from wxcloudrun.dao import (
    get_card, recompute_card_used_times, create_redemption, get_staff,
)

import threading
from functools import wraps

# SQLite 演示态并发保护：单进程内 RLock 串行化所有类资金写操作
# （SQLite 的 with_for_update() 是空操作，并发预约/核销可能超卖/双扣）
_WRITE_LOCK = threading.RLock()


def _is_mysql():
    """当前引擎是否 MySQL（MySQL 依赖 SELECT ... FOR UPDATE 行锁）。"""
    return db.engine.dialect.name == 'mysql'


def _write_locked(f):
    """并发写保护装饰器：MySQL 走行锁；SQLite 用进程内互斥锁串行化。

    与独立版(wechat/src)的 atomic() 思路一致；生产 MySQL 下自动失效（零开销）。
    """
    @wraps(f)
    def wrapper(*args, **kwargs):
        if _is_mysql():
            return f(*args, **kwargs)
        with _WRITE_LOCK:
            return f(*args, **kwargs)
    return wrapper


# ────────────────────────────── 异常与通用工具 ──────────────────────────────

class BizError(Exception):
    def __init__(self, msg, code=400):
        super().__init__(msg)
        self.msg = msg
        self.code = code


class NotFound(BizError):
    def __init__(self, msg='资源不存在'):
        super().__init__(msg, 404)


class Forbidden(BizError):
    def __init__(self, msg='无权限'):
        super().__init__(msg, 403)


class Conflict(BizError):
    def __init__(self, msg='状态冲突'):
        super().__init__(msg, 409)


def _ms(dt):
    return int(dt.timestamp() * 1000) if dt else 0


def _parse_dt(v):
    """解析 'YYYY-MM-DD[ T]HH:MM[:SS]' 或毫秒时间戳 → naive datetime(utc)。"""
    if v is None or v == '':
        return None
    if isinstance(v, (int, float)):
        return datetime.fromtimestamp(v / 1000)
    if isinstance(v, datetime):
        return v
    s = str(v).replace('T', ' ').strip()
    for fmt in ('%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M'):
        try:
            return datetime.strptime(s[:len(s)], fmt)
        except ValueError:
            continue
    try:
        return datetime.fromisoformat(str(v)[:19])
    except ValueError:
        raise BizError('时间格式无效: %s' % v)


def _d(v):
    if v in (None, ''):
        return None
    if isinstance(v, date) and not isinstance(v, datetime):
        return v
    return _parse_dt(v).date() if _parse_dt(v) else None


def audit(merchant_id, actor_id, action, entity_type=None, entity_id=None, detail=None):
    db.session.add(AuditLog(
        merchant_id=merchant_id, actor_id=actor_id, action=action,
        entity_type=entity_type, entity_id=entity_id, detail=detail or {},
    ))


# 幂等：同 key 只处理一次，重复请求返回首次结果
def idem_fetch(key):
    if not key:
        return None
    return IdempotencyKey.query.filter_by(key=key).first()


def idem_save(key, result):
    if not key:
        return
    db.session.add(IdempotencyKey(key=key, response=json.dumps(result, ensure_ascii=False)))


# ────────────────────────────── 序列化 ──────────────────────────────

def store_to_dict(m):
    return {'id': m.id, 'merchantId': m.merchant_id, 'name': m.name,
            'address': m.address, 'createdAt': _ms(m.created_at)}


def student_to_dict(s):
    return {'id': s.id, 'guardianUserId': s.guardian_user_id, 'name': s.name,
            'birthday': s.birthday.isoformat() if s.birthday else None, 'note': s.note}


def course_to_dict(c):
    return {'id': c.id, 'merchantId': c.merchant_id, 'name': c.name,
            'description': c.description or '', 'durationMinutes': c.duration_minutes,
            'defaultCapacity': c.default_capacity, 'minOpenCount': c.min_open_count,
            'applicableCardTemplateIds': c.applicable_card_template_ids or [],
            'priceCents': c.price_cents, 'status': c.status, 'coverImage': c.cover_image or ''}


def teacher_to_dict(t):
    return {'id': t.id, 'merchantId': t.merchant_id, 'name': t.name,
            'phone': t.phone or '', 'note': t.note or ''}


def room_to_dict(r):
    return {'id': r.id, 'merchantId': r.merchant_id, 'storeId': r.store_id,
            'name': r.name, 'capacity': r.capacity, 'note': r.note or ''}


def window_to_dict(w):
    return {'id': w.id, 'merchantId': w.merchant_id, 'targetType': w.target_type,
            'targetId': w.target_id, 'weekday': w.weekday,
            'startTime': w.start_time, 'endTime': w.end_time,
            'slotMinutes': w.slot_minutes,
            'validFrom': w.valid_from.isoformat() if w.valid_from else None,
            'validTo': w.valid_to.isoformat() if w.valid_to else None,
            'isAvailable': w.is_available, 'priority': w.priority, 'note': w.note or ''}


def rule_to_dict(r):
    return {'id': r.id, 'merchantId': r.merchant_id, 'courseId': r.course_id,
            'storeId': r.store_id, 'teacherId': r.teacher_id, 'roomId': r.room_id,
            'weekdays': r.weekdays or [], 'startTime': r.start_time, 'endTime': r.end_time,
            'startDate': r.start_date.isoformat() if r.start_date else None,
            'endDate': r.end_date.isoformat() if r.end_date else None,
            'skipHolidays': r.skip_holidays, 'planCapacity': r.plan_capacity,
            'seriesKey': r.series_key, 'createdAt': _ms(r.created_at)}


def session_to_dict(s):
    """课次视图：含 计划人数 / 已报名 / 候补 / 剩余。"""
    plan = s.plan_capacity or 0
    enrolled = s.enrolled_count or 0
    wait = s.waitlist_count or 0
    return {'id': s.id, 'courseId': s.course_id, 'merchantId': s.merchant_id,
            'storeId': s.store_id, 'teacherId': s.teacher_id, 'roomId': s.room_id,
            'ruleId': s.rule_id, 'startAt': _ms(s.start_at), 'endAt': _ms(s.end_at),
            'planCapacity': plan, 'enrolledCount': enrolled,
            'waitlistCount': wait, 'remaining': max(0, plan - enrolled),
            'status': s.status, 'bookingEndAt': _ms(s.booking_end_at),
            'cancelDeadlineAt': _ms(s.cancel_deadline_at), 'note': s.note or ''}


def booking_to_dict(b):
    return {'id': b.id, 'sessionId': b.session_id, 'userId': b.user_id,
            'studentId': b.student_id, 'cardId': b.card_id, 'status': b.status,
            'cancelType': b.cancel_type, 'cancelReason': b.cancel_reason or '',
            'cancelledAt': _ms(b.cancelled_at), 'createdAt': _ms(b.created_at)}


def waitlist_to_dict(w):
    return {'id': w.id, 'sessionId': w.session_id, 'userId': w.user_id,
            'studentId': w.student_id, 'cardId': w.card_id, 'status': w.status,
            'createdAt': _ms(w.created_at)}


def card_full_to_dict(c):
    """扩展卡视图：含 heldTimes / effectiveMode / 剩余次数。"""
    remaining = max(0, (c.total_times or 0) - (c.used_times or 0) - (c.held_times or 0))
    return {'id': c.id, 'merchantId': c.merchant_id, 'templateId': c.template_id,
            'ownerOpenid': c.owner_openid or '', 'ownerUserId': c.owner_user_id,
            'totalTimes': c.total_times, 'usedTimes': c.used_times or 0,
            'heldTimes': c.held_times or 0, 'remaining': remaining,
            'status': c.status, 'effectiveMode': c.effective_mode or 'claim',
            'issueCode': c.issue_code or '', 'issueNote': c.issue_note or '',
            'version': c.version or 0,
            'expireDate': c.expire_date.isoformat() if c.expire_date else None,
            'createdAt': _ms(c.created_at)}


# ────────────────────────────── 排课：基础资料 ──────────────────────────────

def create_store(merchant_id, data):
    name = (data.get('name') or '').strip()
    if not name:
        raise BizError('门店名不能为空')
    m = MerchantStore(merchant_id=merchant_id, name=name, address=data.get('address', '') or '')
    db.session.add(m)
    db.session.commit()
    return m


def list_stores(merchant_id):
    return MerchantStore.query.filter_by(merchant_id=merchant_id).all()


def create_course(merchant_id, data):
    name = (data.get('name') or '').strip()
    if not name:
        raise BizError('课程名不能为空')
    c = Course(merchant_id=merchant_id, name=name,
               description=data.get('description', '') or '',
               duration_minutes=int(data.get('durationMinutes') or 60),
               default_capacity=int(data.get('defaultCapacity') or 10),
               min_open_count=int(data.get('minOpenCount') or 1),
               applicable_card_template_ids=data.get('applicableCardTemplateIds') or [],
               price_cents=int(data.get('priceCents') or 0),
               cover_image=data.get('coverImage', '') or '')
    db.session.add(c)
    db.session.commit()
    return c


def list_courses(merchant_id):
    return Course.query.filter(Course.merchant_id == merchant_id,
                               Course.status != 'disabled').all()


def create_teacher(merchant_id, data):
    name = (data.get('name') or '').strip()
    if not name:
        raise BizError('老师姓名不能为空')
    t = Teacher(merchant_id=merchant_id, name=name,
                phone=data.get('phone', '') or '', note=data.get('note', '') or '')
    db.session.add(t)
    db.session.commit()
    return t


def list_teachers(merchant_id):
    return Teacher.query.filter_by(merchant_id=merchant_id).all()


def create_room(merchant_id, data):
    name = (data.get('name') or '').strip()
    if not name:
        raise BizError('教室名不能为空')
    r = Room(merchant_id=merchant_id, name=name,
             store_id=data.get('storeId'),
             capacity=int(data.get('capacity') or 0) or None,
             note=data.get('note', '') or '')
    db.session.add(r)
    db.session.commit()
    return r


def list_rooms(merchant_id):
    return Room.query.filter_by(merchant_id=merchant_id).all()


def create_student(merchant_id, user, data):
    """学员档案（监护人=当前用户）。"""
    name = (data.get('name') or '').strip()
    if not name:
        raise BizError('学员姓名不能为空')
    s = StudentProfile(guardian_user_id=user.id, name=name,
                       birthday=_d(data.get('birthday')), note=data.get('note', '') or '')
    db.session.add(s)
    db.session.commit()
    return s


def list_students(user):
    return StudentProfile.query.filter_by(guardian_user_id=user.id).all()


# ────────────────────────────── 时间窗格 ──────────────────────────────

def create_time_window(merchant_id, data):
    target_type = data.get('targetType')
    if target_type not in ('merchant', 'store', 'teacher', 'room', 'course'):
        raise BizError('targetType 无效')
    tw = TimeWindow(merchant_id=merchant_id, target_type=target_type,
                    target_id=data.get('targetId'),
                    weekday=data.get('weekday'),
                    start_time=data.get('startTime') or '',
                    end_time=data.get('endTime') or '',
                    slot_minutes=int(data.get('slotMinutes') or 30),
                    valid_from=_d(data.get('validFrom')), valid_to=_d(data.get('validTo')),
                    is_available=bool(data.get('isAvailable', True)),
                    priority=int(data.get('priority') or 0),
                    note=data.get('note', '') or '')
    if not tw.start_time or not tw.end_time:
        raise BizError('起止时间不能为空')
    db.session.add(tw)
    db.session.commit()
    return tw


def list_time_windows(merchant_id, target_type=None, target_id=None):
    q = TimeWindow.query.filter_by(merchant_id=merchant_id)
    if target_type:
        q = q.filter_by(target_type=target_type)
    if target_id is not None:
        q = q.filter_by(target_id=target_id)
    return q.order_by(TimeWindow.priority.desc(), TimeWindow.id.asc()).all()


# ────────────────────────────── 排课：课次 ──────────────────────────────

def is_holiday(merchant_id, d):
    return Holiday.query.filter_by(merchant_id=merchant_id, holiday_date=d).first() is not None


def check_session_conflicts(merchant_id, start_at, end_at,
                            teacher_id=None, room_id=None, exclude_id=None):
    """老师/教室在同一时段冲突检查（不检查则跳过）。"""
    q = CourseSession.query.filter(
        CourseSession.merchant_id == merchant_id,
        CourseSession.status != 'cancelled',
        CourseSession.start_at < end_at,
        CourseSession.end_at > start_at,
    )
    if exclude_id:
        q = q.filter(CourseSession.id != exclude_id)
    if teacher_id:
        t = q.filter(CourseSession.teacher_id == teacher_id).first()
        if t:
            raise Conflict('老师在该时段已有课次 #%s' % t.id)
    if room_id:
        r = q.filter(CourseSession.room_id == room_id).first()
        if r:
            raise Conflict('教室在该时段已被占用 #%s' % r.id)


def _window_ok(merchant_id, target_type, target_id, weekday, start_at):
    """时间窗格交集检查：营业∩老师∩教室。未配置窗格视为允许（宽松接入）。"""
    if not target_id:
        return True
    rows = TimeWindow.query.filter_by(
        merchant_id=merchant_id, target_type=target_type, target_id=target_id).all()
    if not rows:
        return True
    hm = start_at.strftime('%H:%M')
    covered = False
    for w in rows:
        if w.weekday is not None and w.weekday != weekday:
            continue
        if w.valid_from and start_at.date() < w.valid_from:
            continue
        if w.valid_to and start_at.date() > w.valid_to:
            continue
        if w.start_time <= hm < w.end_time:
            if not w.is_available:
                return False  # 黑名单（请假/闭店）拦截
            covered = True
    return True if covered or not covered else False  # 无可用窗格不强制拦截


@_write_locked
def create_single_session(merchant_id, data):
    start_at = _parse_dt(data.get('startAt'))
    end_at = _parse_dt(data.get('endAt'))
    if not start_at or not end_at or end_at <= start_at:
        raise BizError('起止时间无效')
    course = Course.query.filter_by(id=int(data.get('courseId') or 0),
                                    merchant_id=merchant_id).first()
    if not course:
        raise NotFound('课程不存在')
    teacher_id = data.get('teacherId')
    room_id = data.get('roomId')
    check_session_conflicts(merchant_id, start_at, end_at,
                            teacher_id=teacher_id, room_id=room_id)
    s = CourseSession(
        course_id=course.id, merchant_id=merchant_id,
        store_id=data.get('storeId'), teacher_id=teacher_id, room_id=room_id,
        start_at=start_at, end_at=end_at,
        plan_capacity=int(data.get('planCapacity') or course.default_capacity),
        status='open',
        booking_end_at=_parse_dt(data.get('bookingEndAt')),
        cancel_deadline_at=_parse_dt(data.get('cancelDeadlineAt')),
        note=data.get('note', '') or '')
    db.session.add(s)
    audit(merchant_id, None, 'session_create', 'course_session', None,
          {'courseId': course.id, 'startAt': start_at.isoformat(), 'endAt': end_at.isoformat()})
    db.session.commit()
    return s


@_write_locked
def create_schedule_rule(merchant_id, data):
    course = Course.query.filter_by(id=int(data.get('courseId') or 0),
                                    merchant_id=merchant_id).first()
    if not course:
        raise NotFound('课程不存在')
    weekdays = data.get('weekdays') or []
    if not weekdays or not data.get('startTime') or not data.get('endTime'):
        raise BizError('weekdays/startTime/endTime 必填')
    r = ScheduleRule(
        merchant_id=merchant_id, course_id=course.id,
        store_id=data.get('storeId'), teacher_id=data.get('teacherId'),
        room_id=data.get('roomId'), weekdays=weekdays,
        start_time=data.get('startTime'), end_time=data.get('endTime'),
        start_date=_d(data.get('startDate')) or date.today(),
        end_date=_d(data.get('endDate')),
        skip_holidays=bool(data.get('skipHolidays', True)),
        plan_capacity=data.get('planCapacity'),
        series_key='%s-%s-%s' % (course.id, data.get('startTime'), data.get('endTime')))
    db.session.add(r)
    db.session.commit()
    return r


@_write_locked
def generate_sessions(rule_id):
    """按规则生成课次：跳过节假日；与老师/教室冲突的日期跳过。"""
    rule = ScheduleRule.query.get(rule_id)
    if not rule:
        raise NotFound('排课规则不存在')
    cur = rule.start_date
    end = rule.end_date or (cur + timedelta(days=365))
    created = 0
    weekdays = set(rule.weekdays or [])
    while cur <= end:
        if cur.weekday() in weekdays and not (rule.skip_holidays and is_holiday(rule.merchant_id, cur)):
            start_at = datetime.combine(cur, datetime.strptime(rule.start_time, '%H:%M').time())
            end_at = datetime.combine(cur, datetime.strptime(rule.end_time, '%H:%M').time())
            dup = CourseSession.query.filter_by(rule_id=rule.id, start_at=start_at).first()
            if not dup:
                try:
                    check_session_conflicts(rule.merchant_id, start_at, end_at,
                                            teacher_id=rule.teacher_id, room_id=rule.room_id)
                except Conflict:
                    cur += timedelta(days=1)
                    continue
                s = CourseSession(course_id=rule.course_id, merchant_id=rule.merchant_id,
                                  store_id=rule.store_id, teacher_id=rule.teacher_id,
                                  room_id=rule.room_id, rule_id=rule.id,
                                  start_at=start_at, end_at=end_at,
                                  plan_capacity=rule.plan_capacity or 10, status='open')
                db.session.add(s)
                created += 1
        cur += timedelta(days=1)
    db.session.commit()
    return created


def list_sessions(merchant_id, from_dt=None, to_dt=None, course_id=None):
    q = CourseSession.query.filter(CourseSession.merchant_id == merchant_id)
    if from_dt:
        q = q.filter(CourseSession.start_at >= from_dt)
    if to_dt:
        q = q.filter(CourseSession.start_at < to_dt)
    if course_id:
        q = q.filter(CourseSession.course_id == course_id)
    return q.order_by(CourseSession.start_at.asc()).all()


@_write_locked
def patch_session(merchant_id, session_id, data):
    s = CourseSession.query.filter_by(id=session_id, merchant_id=merchant_id).with_for_update().first()
    if not s:
        raise NotFound('课次不存在')
    if data.get('startAt') or data.get('endAt'):
        start_at = _parse_dt(data.get('startAt')) or s.start_at
        end_at = _parse_dt(data.get('endAt')) or s.end_at
        if end_at <= start_at:
            raise BizError('起止时间无效')
        check_session_conflicts(merchant_id, start_at, end_at,
                                teacher_id=data.get('teacherId') or s.teacher_id,
                                room_id=data.get('roomId') or s.room_id,
                                exclude_id=s.id)
        s.start_at, s.end_at = start_at, end_at
    if data.get('planCapacity') is not None:
        s.plan_capacity = int(data['planCapacity'])
    if data.get('teacherId') is not None:
        s.teacher_id = data['teacherId']
    if data.get('roomId') is not None:
        s.room_id = data['roomId']
    if data.get('note') is not None:
        s.note = data['note']
    if data.get('bookingEndAt') is not None:
        s.booking_end_at = _parse_dt(data['bookingEndAt'])
    if data.get('status') in ('open', 'closed'):
        s.status = data['status']
    db.session.commit()
    return s


@_write_locked
def cancel_session(merchant_id, session_id, reason='', operator_id=None):
    """取消课次：取消全部 confirmed 预约、释放冻结、扣减人数（幂等）。"""
    s = CourseSession.query.filter_by(id=session_id, merchant_id=merchant_id).with_for_update().first()
    if not s:
        raise NotFound('课次不存在')
    if s.status == 'cancelled':
        return {'sessionId': s.id, 'status': 'cancelled', 'cancelledBookings': 0}
    s.status = 'cancelled'
    cancelled = 0
    for b in Booking.query.filter_by(session_id=s.id, status='confirmed').all():
        b.status = 'cancelled'
        b.cancel_type = 'system'
        b.cancel_reason = reason or '课次取消'
        b.cancelled_at = datetime.utcnow()
        cancelled += 1
        if b.card_id:
            card = Card.query.filter_by(id=b.card_id).with_for_update().first()
            if card and (card.held_times or 0) > 0:
                card.held_times -= 1
            hold = CardHold.query.filter_by(booking_id=b.id, status='held').first()
            if hold:
                hold.status = 'released'
    db.session.add(CourseCancelRecord(session_id=s.id, reason=reason or '课次取消',
                                      operator_id=operator_id, notify_count=cancelled))
    audit(merchant_id, operator_id, 'session_cancel', 'course_session', s.id,
          {'cancelledBookings': cancelled})
    db.session.commit()
    return {'sessionId': s.id, 'status': 'cancelled', 'cancelledBookings': cancelled}


# ────────────────────────────── 预约 / 候补 / 考勤 ──────────────────────────────

def _promote_waitlist(s, wl):
    """候补递补：冻结其卡、转成 confirmed 预约。"""
    nb = Booking(session_id=s.id, user_id=wl.user_id, student_id=wl.student_id,
                 card_id=wl.card_id, status='confirmed')
    db.session.add(nb)
    db.session.flush()
    if wl.card_id:
        card = Card.query.filter_by(id=wl.card_id).with_for_update().first()
        if card:
            card.held_times = (card.held_times or 0) + 1
        db.session.add(CardHold(card_id=wl.card_id, booking_id=nb.id,
                                hold_times=1, status='held'))
    wl.status = 'promoted'
    s.enrolled_count = (s.enrolled_count or 0) + 1
    s.waitlist_count = max(0, (s.waitlist_count or 0) - 1)
    if s.enrolled_count >= (s.plan_capacity or 10):
        s.status = 'full'
    return {'bookingId': nb.id, 'userId': wl.user_id}


@_write_locked
def create_booking(merchant_id, session_id, user, data, idempotency_key=None):
    """预约：确认时冻结卡次数；满员进候补；幂等 key 防重复。"""
    ex = idem_fetch(idempotency_key)
    if ex:
        return json.loads(ex.response or '{}'), True

    s = CourseSession.query.filter(
        CourseSession.id == session_id, CourseSession.merchant_id == merchant_id
    ).with_for_update().first()
    if not s:
        raise NotFound('课次不存在')
    if s.status in ('cancelled', 'closed'):
        raise Conflict('课次不可预约')
    if s.booking_end_at and datetime.utcnow() > s.booking_end_at:
        raise Conflict('预约已截止')

    dup = Booking.query.filter_by(session_id=s.id, user_id=user.id, status='confirmed').first()
    if dup:
        raise Conflict('已预约该课次')

    card = None
    if data.get('cardId'):
        card = Card.query.filter(Card.id == int(data['cardId']),
                                 Card.merchant_id == merchant_id).with_for_update().first()
        if not card:
            raise NotFound('卡不存在')
        if card.owner_openid and card.owner_openid != user.openid:
            raise Forbidden('卡不属于当前用户')
        if card.status != 'active':
            raise Conflict('卡状态异常：' + card.status)
        if (card.total_times or 0) - (card.used_times or 0) - (card.held_times or 0) <= 0:
            raise Conflict('卡可用次数不足')

    student_id = data.get('studentId')
    full = (s.enrolled_count or 0) >= (s.plan_capacity or 10)
    if full:
        wl = Waitlist(session_id=s.id, user_id=user.id, student_id=student_id,
                      card_id=card.id if card else None, status='waiting')
        db.session.add(wl)
        s.waitlist_count = (s.waitlist_count or 0) + 1
        db.session.commit()
        result = {'status': 'waitlisted', 'waitlistId': wl.id, 'sessionId': s.id,
                  'planCapacity': s.plan_capacity, 'enrolledCount': s.enrolled_count,
                  'waitlistCount': s.waitlist_count}
        idem_save(idempotency_key, result)
        db.session.commit()
        return result, False

    b = Booking(session_id=s.id, user_id=user.id, student_id=student_id,
                card_id=card.id if card else None, status='confirmed')
    db.session.add(b)
    db.session.flush()
    if card:
        card.held_times = (card.held_times or 0) + 1
        db.session.add(CardHold(card_id=card.id, booking_id=b.id, hold_times=1, status='held'))
    s.enrolled_count = (s.enrolled_count or 0) + 1
    if s.enrolled_count >= (s.plan_capacity or 10):
        s.status = 'full'
    audit(merchant_id, user.id, 'booking_create', 'booking', b.id,
          {'sessionId': s.id, 'cardId': card.id if card else None})
    result = {'status': 'confirmed', 'bookingId': b.id, 'sessionId': s.id,
              'planCapacity': s.plan_capacity, 'enrolledCount': s.enrolled_count,
              'waitlistCount': s.waitlist_count, 'remaining': max(0, (s.plan_capacity or 10) - s.enrolled_count)}
    idem_save(idempotency_key, result)
    db.session.commit()
    return result, False


@_write_locked
def cancel_booking(merchant_id, booking_id, user, cancel_type='self', reason=''):
    """取消预约：释放冻结、扣减人数、候补自动递补。"""
    b = Booking.query.filter_by(id=booking_id, user_id=user.id).with_for_update().first()
    if not b:
        raise NotFound('预约不存在')
    if b.status == 'cancelled':
        return {'status': 'cancelled', 'bookingId': b.id}, True
    s = CourseSession.query.filter_by(id=b.session_id, merchant_id=merchant_id).with_for_update().first()
    b.status = 'cancelled'
    b.cancel_type = cancel_type
    b.cancel_reason = reason or ''
    b.cancelled_at = datetime.utcnow()
    if s and (s.enrolled_count or 0) > 0:
        s.enrolled_count -= 1
    if s:
        s.status = 'open'
    if b.card_id:
        card = Card.query.filter_by(id=b.card_id).with_for_update().first()
        if card and (card.held_times or 0) > 0:
            card.held_times -= 1
        hold = CardHold.query.filter_by(booking_id=b.id, status='held').first()
        if hold:
            hold.status = 'released'
    promoted = None
    if s:
        wl = Waitlist.query.filter_by(session_id=s.id, status='waiting'
                                      ).order_by(Waitlist.id.asc()).first()
        if wl:
            promoted = _promote_waitlist(s, wl)
    audit(merchant_id, user.id, 'booking_cancel', 'booking', b.id,
          {'cancelType': cancel_type, 'promoted': promoted})
    db.session.commit()
    return {'status': 'cancelled', 'bookingId': b.id, 'promoted': promoted}, False


@_write_locked
def merchant_cancel_booking(merchant_id, booking_id, operator, reason=''):
    """商户取消预约（迟到/异常等）。"""
    b = Booking.query.filter_by(id=booking_id).with_for_update().first()
    if not b:
        raise NotFound('预约不存在')
    s = CourseSession.query.filter_by(id=b.session_id, merchant_id=merchant_id).with_for_update().first()
    if not s:
        raise NotFound('课次不存在')
    if b.status == 'cancelled':
        return {'status': 'cancelled', 'bookingId': b.id}, True
    b.status = 'cancelled'
    b.cancel_type = 'merchant'
    b.cancel_reason = reason or '商户取消'
    b.cancelled_at = datetime.utcnow()
    if (s.enrolled_count or 0) > 0:
        s.enrolled_count -= 1
    s.status = 'open'
    if b.card_id:
        card = Card.query.filter_by(id=b.card_id).with_for_update().first()
        if card and (card.held_times or 0) > 0:
            card.held_times -= 1
        hold = CardHold.query.filter_by(booking_id=b.id, status='held').first()
        if hold:
            hold.status = 'released'
    promoted = None
    wl = Waitlist.query.filter_by(session_id=s.id, status='waiting'
                                  ).order_by(Waitlist.id.asc()).first()
    if wl:
        promoted = _promote_waitlist(s, wl)
    audit(merchant_id, operator.id if operator else None, 'booking_merchant_cancel',
          'booking', b.id, {'reason': reason, 'promoted': promoted})
    db.session.commit()
    return {'status': 'cancelled', 'bookingId': b.id, 'promoted': promoted}, False


@_write_locked
def checkin(merchant_id, booking_id, operator):
    """签到：冻结转核销（写 redemption_records 幂等）、重算 used_times。"""
    b = Booking.query.filter_by(id=booking_id, status='confirmed').with_for_update().first()
    if not b:
        raise NotFound('预约不存在或已取消')
    s = CourseSession.query.filter_by(id=b.session_id, merchant_id=merchant_id).first()
    if not s:
        raise NotFound('课次不存在')
    deduct = 1
    remaining = None
    if b.card_id:
        card = Card.query.filter_by(id=b.card_id).with_for_update().first()
        if not card:
            raise BizError('卡不存在')
        if card.status != 'active':
            raise Conflict('卡状态异常：' + card.status)
        hold = CardHold.query.filter_by(booking_id=b.id, status='held').first()
        if hold:
            hold.status = 'consumed'
            if (card.held_times or 0) > 0:
                card.held_times -= 1
        token = 'checkin:%s' % b.id
        if not RedemptionRecord.query.filter_by(verify_token=token).first():
            create_redemption({'card_id': card.id,
                               'staff_id': operator.id if operator else None,
                               'deduct_times': deduct, 'verify_token': token})
        recompute_card_used_times(card.id)
        remaining = max(0, (card.total_times or 0) - (card.used_times or 0) - (card.held_times or 0))
    db.session.add(AttendanceRecord(booking_id=b.id, session_id=s.id,
                                    status='present', deduct_times=deduct))
    audit(merchant_id, operator.id if operator else None, 'checkin', 'booking', b.id,
          {'deduct': deduct})
    db.session.commit()
    return {'bookingId': b.id, 'deductTimes': deduct, 'remaining': remaining, 'status': 'present'}


@_write_locked
def no_show(merchant_id, booking_id, operator):
    """未到：冻结转为扣减（写核销记录，reason=no_show）。"""
    b = Booking.query.filter_by(id=booking_id, status='confirmed').with_for_update().first()
    if not b:
        raise NotFound('预约不存在或已取消')
    s = CourseSession.query.filter_by(id=b.session_id, merchant_id=merchant_id).first()
    if not s:
        raise NotFound('课次不存在')
    deduct = 1
    if b.card_id:
        card = Card.query.filter_by(id=b.card_id).with_for_update().first()
        if card and card.status == 'active':
            hold = CardHold.query.filter_by(booking_id=b.id, status='held').first()
            if hold:
                hold.status = 'consumed'
                if (card.held_times or 0) > 0:
                    card.held_times -= 1
            token = 'noshow:%s' % b.id
            if not RedemptionRecord.query.filter_by(verify_token=token).first():
                create_redemption({'card_id': card.id,
                                   'staff_id': operator.id if operator else None,
                                   'deduct_times': deduct, 'verify_token': token})
            recompute_card_used_times(card.id)
    db.session.add(AttendanceRecord(booking_id=b.id, session_id=s.id,
                                    status='no_show', deduct_times=deduct))
    audit(merchant_id, operator.id if operator else None, 'no_show', 'booking', b.id,
          {'deduct': deduct})
    db.session.commit()
    return {'bookingId': b.id, 'deductTimes': deduct, 'status': 'no_show'}


def session_roster(session_id):
    s = CourseSession.query.get(session_id)
    if not s:
        raise NotFound('课次不存在')
    bookings = Booking.query.filter_by(session_id=s.id, status='confirmed'
                                       ).order_by(Booking.id.asc()).all()
    waitlist = Waitlist.query.filter_by(session_id=s.id, status='waiting'
                                        ).order_by(Waitlist.id.asc()).all()
    return s, [booking_to_dict(b) for b in bookings], [waitlist_to_dict(w) for w in waitlist]


def my_bookings(user, status='confirmed'):
    q = Booking.query.filter_by(user_id=user.id)
    if status:
        q = q.filter_by(status=status)
    return q.order_by(Booking.created_at.desc()).all()


def my_waitlist(user):
    return Waitlist.query.filter_by(user_id=user.id, status='waiting'
                                    ).order_by(Waitlist.id.asc()).all()


# ────────────────────────────── 销卡 / 退款 ──────────────────────────────

@_write_locked
def void_card(merchant_id, card_id, void_type='claimed', reason='', operator_id=None,
              idempotency_key=None):
    """销卡：前置校验（无进行中预约 / 待支付订单）；幂等。"""
    ex = idem_fetch(idempotency_key)
    if ex:
        return json.loads(ex.response or '{}'), True
    card = Card.query.filter(Card.id == card_id,
                             Card.merchant_id == merchant_id).with_for_update().first()
    if not card:
        raise NotFound('卡不存在或不属于本商户')
    if card.status == 'voided':
        result = {'cardId': card.id, 'status': 'voided'}
        idem_save(idempotency_key, result)
        db.session.commit()
        return result, True
    if card.status not in ('unclaimed', 'active', 'expired', 'used_up'):
        raise Conflict('卡状态不可销卡：' + card.status)
    held = CardHold.query.filter_by(card_id=card.id, status='held').first()
    if held:
        raise Conflict('该卡有进行中预约（#%s），需先处理' % held.booking_id)
    pending = Order.query.filter_by(ref_card_id=card.id, status='pending').first()
    if pending:
        raise Conflict('该卡有待支付订单（#%s）' % pending.id)
    card.status = 'voided'
    card.version = (card.version or 0) + 1
    db.session.add(CardVoidRecord(card_id=card.id, void_type=void_type or 'claimed',
                                  reason=reason or '', operator_id=operator_id))
    db.session.add(CardLedger(card_id=card.id, action='void', operator_id=operator_id,
                              delta_times=0, detail={'voidType': void_type, 'reason': reason}))
    audit(merchant_id, operator_id, 'card_void', 'card', card.id,
          {'voidType': void_type, 'reason': reason})
    result = {'cardId': card.id, 'status': 'voided'}
    idem_save(idempotency_key, result)
    db.session.commit()
    return result, False


@_write_locked
def create_refund(merchant_id, card_id, reason='', operator_id=None, idempotency_key=None):
    """退款（演示规则）：按未用次数占总量比例退还实付金额；已用≥1/3 不予退。"""
    ex = idem_fetch(idempotency_key)
    if ex:
        return json.loads(ex.response or '{}'), True
    card = Card.query.filter(Card.id == card_id,
                             Card.merchant_id == merchant_id).with_for_update().first()
    if not card:
        raise NotFound('卡不存在或不属于本商户')
    if card.status in ('voided', 'refunded'):
        raise Conflict('卡已销/已退')
    tpl = CardTemplate.query.get(card.template_id) if card.template_id else None
    price = tpl.price_cents if tpl else 0
    total = card.total_times or 1
    used = (card.used_times or 0) + (card.held_times or 0)
    if used >= total / 3.0:
        raise Conflict('已用次数超过 1/3，按规则不予退款')
    refund_cents = int(price * (total - used) / total)
    order = Order(merchant_id=merchant_id, user_id=card.owner_user_id,
                  type='refund', ref_card_id=card.id, amount_cents=refund_cents,
                  paid_amount=refund_cents, status='refunded')
    db.session.add(order)
    db.session.flush()
    db.session.add(RefundRecord(order_id=order.id, card_id=card.id,
                                amount_cents=refund_cents, success=True))
    db.session.add(CardRefundRecord(card_id=card.id, order_id=order.id,
                                    refund_cents=refund_cents, operator_id=operator_id))
    card.status = 'refunded'
    db.session.add(CardLedger(card_id=card.id, action='refund', operator_id=operator_id,
                              delta_times=0, detail={'refundCents': refund_cents, 'reason': reason}))
    audit(merchant_id, operator_id, 'card_refund', 'card', card.id,
          {'refundCents': refund_cents, 'reason': reason})
    result = {'cardId': card.id, 'status': 'refunded', 'refundCents': refund_cents}
    idem_save(idempotency_key, result)
    db.session.commit()
    return result, False


# ────────────────────────────── C 任务：订单 / 支付闭环 ──────────────────────────────

import secrets as _secrets  # noqa: E402  (模块尾部补充导入，避免与既有顶部导入冲突)


def _gen_code(n=8):
    """生成一次性领取码（去歧义字符）。与 views.gen_short_code 同源。"""
    _abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    return ''.join(_secrets.choice(_abc) for _ in range(n))


def _calc_expire(valid_days):
    if not valid_days or valid_days <= 0:
        return None
    return date.today() + timedelta(days=valid_days)


def create_order(user, template_id, idempotency_key=None):
    """顾客下单买卡：生成待支付订单（金额取自卡模板售价）。

    商户由模板归属决定，不信任客户端传入，避免越权跨商户下单。
    """
    ex = idem_fetch(idempotency_key)
    if ex:
        return json.loads(ex.response or '{}'), True
    tpl = CardTemplate.query.get(template_id)
    if not tpl or tpl.merchant_id is None:
        raise NotFound('卡种不存在')
    if tpl.status != 'active':
        raise Conflict('卡种已下架')
    order = Order(merchant_id=tpl.merchant_id, user_id=user.id,
                  type='buy_card', ref_template_id=tpl.id,
                  amount_cents=tpl.price_cents or 0, paid_amount=0,
                  status='pending')
    db.session.add(order)
    db.session.flush()
    result = {
        'orderId': order.id, 'merchantId': order.merchant_id,
        'templateId': tpl.id, 'amountCents': order.amount_cents,
        'status': order.status, 'createdAt': order.created_at.timestamp() * 1000,
    }
    idem_save(idempotency_key, result)
    db.session.commit()
    return result, False


def pay_order(order_id, user, idempotency_key=None):
    """支付成功（演示态直接标记已付并直发次卡）。重复支付幂等返回 alreadyPaid。"""
    ex = idem_fetch(idempotency_key)
    if ex:
        return json.loads(ex.response or '{}'), True
    order = Order.query.filter(Order.id == order_id,
                               Order.user_id == user.id).with_for_update().first()
    if not order:
        raise NotFound('订单不存在或不属于本人')
    if order.status == 'paid':
        return {'orderId': order.id, 'status': 'paid',
                'paidAmountCents': order.paid_amount, 'cardId': order.ref_card_id,
                'alreadyPaid': True}, True
    if order.status != 'pending':
        raise Conflict('订单状态不可支付: %s' % order.status)
    tpl = CardTemplate.query.get(order.ref_template_id)
    if not tpl:
        raise NotFound('关联卡种不存在')
    card = Card(merchant_id=order.merchant_id, template_id=tpl.id,
                owner_openid=user.openid or '', owner_user_id=user.id,
                total_times=tpl.total_times, used_times=0, held_times=0,
                status='active', effective_mode='immediate',
                issue_code=_gen_code(8), expire_date=_calc_expire(tpl.valid_days))
    db.session.add(card)
    db.session.flush()
    order.ref_card_id = card.id
    order.paid_amount = order.amount_cents
    order.status = 'paid'
    db.session.add(PaymentRecord(order_id=order.id, amount_cents=order.amount_cents,
                                 channel='wechat', transaction_id='', success=True))
    db.session.add(CardLedger(card_id=card.id, action='issue', operator_id=user.id,
                              delta_times=0, detail={'via': 'order', 'templateId': tpl.id}))
    audit(order.merchant_id, user.id, 'issue_card', 'card', card.id,
          {'templateId': tpl.id, 'via': 'order', 'orderId': order.id})
    db.session.flush()
    result = {'orderId': order.id, 'status': 'paid',
              'paidAmountCents': order.paid_amount, 'cardId': card.id}
    idem_save(idempotency_key, result)
    db.session.commit()
    return result, False


def my_orders(user):
    """当前顾客的订单列表（含买卡/续费）。"""
    rows = Order.query.filter(Order.user_id == user.id).order_by(
        Order.created_at.desc()).all()
    return [{
        'orderId': o.id, 'type': o.type, 'merchantId': o.merchant_id,
        'refTemplateId': o.ref_template_id, 'refCardId': o.ref_card_id,
        'amountCents': o.amount_cents, 'paidAmount': o.paid_amount,
        'status': o.status, 'createdAt': o.created_at.timestamp() * 1000,
    } for o in rows]


# ────────────────────────────── D 任务：退费规则结构化 + 应退估算 ──────────────────────────────

def estimate_refund(card_id):
    """应退金额估算（只读，不执行退款）。规则由卡模板 refund_rule_type 决定。"""
    card = Card.query.get(card_id)
    if not card:
        raise NotFound('卡不存在')
    tpl = CardTemplate.query.get(card.template_id) if card.template_id else None
    price = tpl.price_cents if tpl else 0
    rule = (tpl.refund_rule_type if tpl else None) or 'prorata_by_used'
    total = card.total_times or 1
    used = (card.used_times or 0) + (card.held_times or 0)
    if rule == 'no':
        return {'refundCents': 0, 'refundable': False, 'rule': rule,
                'reason': '该卡种不支持退款'}
    if used >= total / 3.0:
        return {'refundCents': 0, 'refundable': False, 'rule': rule,
                'reason': '已用次数超过 1/3，按规则不予退款'}
    if rule == 'full':
        rc = price
    elif rule == 'deduct_per_used':
        rc = max(0, (price or 0) - (tpl.deduct_per_use_cents or 0) * used)
    else:  # prorata_by_used
        rc = int((price or 0) * (total - used) / total)
    maxr = tpl.max_refund_cents if tpl and tpl.max_refund_cents else None
    if maxr is not None:
        rc = min(rc, maxr)
    return {'refundCents': rc, 'refundable': True, 'rule': rule,
            'maxRefundCents': maxr}


# ────────────────────────────── A 任务：RFM 客群分层（纯读取，本地计算） ──────────────────────────────

def _pct_thresholds(values, qs=(0.2, 0.4, 0.6, 0.8)):
    if not values:
        return [0, 0, 0, 0]
    s = sorted(values)
    n = len(s)
    return [s[min(n - 1, int(q * n))] for q in qs]


def _score(value, thresholds, higher_better=True):
    t = thresholds
    if higher_better:
        if value >= t[3]: return 5
        if value >= t[2]: return 4
        if value >= t[1]: return 3
        if value >= t[0]: return 2
        return 1
    if value <= t[3]: return 5
    if value <= t[2]: return 4
    if value <= t[1]: return 3
    if value <= t[0]: return 2
    return 1


def _rfm_label(r, f, m):
    if r >= 4 and f >= 4 and m >= 4: return '高价值活跃'
    if r >= 4 and f >= 3: return '忠实常客'
    if r >= 4: return '新客潜力'
    if r <= 2 and f >= 4 and m >= 4: return '流失的高价值客(重点挽回)'
    if r <= 2 and f >= 3: return '有流失风险'
    if r <= 2: return '已流失沉睡'
    if f >= 3: return '一般活跃'
    return '普通'


def _assign_rfm(rows):
    r_ts = _pct_thresholds([x['recencyDays'] for x in rows])
    f_ts = _pct_thresholds([x['frequency'] for x in rows])
    m_ts = _pct_thresholds([x['monetaryCents'] for x in rows])
    for x in rows:
        x['rScore'] = _score(x['recencyDays'], r_ts, higher_better=False)
        x['fScore'] = _score(x['frequency'], f_ts, higher_better=True)
        x['mScore'] = _score(x['monetaryCents'], m_ts, higher_better=True)
        x['label'] = _rfm_label(x['rScore'], x['fScore'], x['mScore'])


def compute_segments(merchant_id, top=100):
    """RFM 客群分层：R=最近核销距今天数, F=核销次数, M=已支付买卡金额。"""
    from collections import Counter  # noqa: E402  (局部导入，避免顶部膨胀)

    cards = Card.query.filter(Card.merchant_id == merchant_id,
                              Card.owner_user_id.isnot(None)).all()
    user_ids = {c.owner_user_id for c in cards}
    if not user_ids:
        return {'total': 0, 'items': []}
    card_owner = {c.id: c.owner_user_id for c in cards}
    card_ids = set(card_owner)
    redemptions = RedemptionRecord.query.filter(
        RedemptionRecord.card_id.in_(card_ids),
        RedemptionRecord.is_revoked == False).all()
    freq = {}
    last_redeem = {}
    for r in redemptions:
        u = card_owner.get(r.card_id)
        if u is None:
            continue
        freq[u] = freq.get(u, 0) + 1
        if u not in last_redeem or r.created_at > last_redeem[u]:
            last_redeem[u] = r.created_at
    orders = Order.query.filter(Order.merchant_id == merchant_id,
                                Order.user_id.in_(user_ids),
                                Order.status == 'paid').all()
    monetary = {}
    for o in orders:
        monetary[o.user_id] = monetary.get(o.user_id, 0) + (o.paid_amount or 0)
    now = datetime.utcnow()
    rows = []
    for u in user_ids:
        recency_days = (now - last_redeem[u]).days if u in last_redeem else 999
        rows.append({'userId': u, 'recencyDays': recency_days,
                     'frequency': freq.get(u, 0), 'monetaryCents': monetary.get(u, 0)})
    _assign_rfm(rows)
    rows.sort(key=lambda x: (x['rScore'], x['fScore'], x['mScore']), reverse=True)
    users = {u.id: u for u in User.query.filter(User.id.in_(user_ids)).all()}
    items = [{
        'userId': x['userId'],
        'nickname': users[x['userId']].nickname if x['userId'] in users else '',
        'recencyDays': x['recencyDays'], 'frequency': x['frequency'],
        'monetaryCents': x['monetaryCents'],
        'rScore': x['rScore'], 'fScore': x['fScore'], 'mScore': x['mScore'],
        'rfmCell': '%d%d%d' % (x['rScore'], x['fScore'], x['mScore']),
        'label': x['label'],
    } for x in rows[:top]]
    return {'total': len(rows), 'items': items}


def segment_summary(merchant_id):
    """客群标签占比汇总。"""
    from collections import Counter  # noqa: E402

    data = compute_segments(merchant_id, top=100000)
    c = Counter(it['label'] for it in data['items'])
    total = data['total'] or 1
    segments = [{'label': k, 'count': v, 'pct': round(v * 100.0 / total, 1)}
                for k, v in c.most_common()]
    return {'total': data['total'], 'segments': segments}


# ────────────────────────────── B 任务：团购核销落私域（占位） ──────────────────────────────

def _fetch_voucher_from_platform(platform, code):
    """真实平台券状态校验接入点（待美团/抖音开放平台凭证）。

    返回 True 表示平台侧券有效可核销；当前占位直接返回 True（演示），
    接入时改为调用平台 API 校验券状态/金额并防重放。
    """
    return True


def redeem_voucher(code, user, idempotency_key=None):
    """团购券核销落私域：锁券 + 幂等 + 审计 + 直发次卡。

    商户由券本身归属决定（顾客无需也不应指定 merchantId），避免越权跨商户核销。
    """
    if not code:
        raise BizError('缺少券码')
    code = code.strip().upper()
    ex = idem_fetch(idempotency_key)
    if ex:
        return json.loads(ex.response or '{}'), True
    if not _fetch_voucher_from_platform('meituan', code):
        raise BizError('平台券校验失败或已失效')
    voucher = GroupBuyVoucher.query.filter(
        GroupBuyVoucher.code == code).with_for_update().first()
    if not voucher:
        raise NotFound('团购券不存在')
    merchant_id = voucher.merchant_id
    if voucher.status == 'redeemed':
        raise Conflict('团购券已核销')
    tpl = CardTemplate.query.get(voucher.ref_template_id)
    if not tpl or tpl.merchant_id != merchant_id:
        raise NotFound('关联卡种不存在或不属于本商户')
    card = Card(merchant_id=merchant_id, template_id=tpl.id,
                owner_openid=user.openid or '', owner_user_id=user.id,
                total_times=tpl.total_times, used_times=0, held_times=0,
                status='active', effective_mode='immediate',
                issue_code=_gen_code(8), expire_date=_calc_expire(tpl.valid_days))
    db.session.add(card)
    db.session.flush()
    voucher.status = 'redeemed'
    voucher.redeemed_by_user_id = user.id
    voucher.redeemed_card_id = card.id
    voucher.redeemed_at = datetime.utcnow()
    db.session.add(CardLedger(card_id=card.id, action='issue', operator_id=user.id,
                              delta_times=0, detail={'via': 'group_buy',
                                                     'voucherId': voucher.id}))
    audit(merchant_id, user.id, 'issue_card', 'card', card.id,
          {'templateId': tpl.id, 'via': 'group_buy',
           'voucherId': voucher.id, 'code': code})
    result = {'voucherId': voucher.id, 'code': code,
              'cardId': card.id, 'status': 'redeemed'}
    idem_save(idempotency_key, result)
    db.session.commit()
    return result, False
