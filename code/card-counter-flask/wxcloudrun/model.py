from datetime import datetime

from wxcloudrun import db


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    openid = db.Column(db.String(64), unique=True, nullable=True, index=True)
    username = db.Column(db.String(64), unique=True, nullable=True, index=True)
    password_hash = db.Column(db.String(256), nullable=True)
    nickname = db.Column(db.String(128), default='')
    avatar_url = db.Column(db.String(512), default='')
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class Quota(db.Model):
    __tablename__ = 'quotas'

    id = db.Column(db.Integer, primary_key=True)
    local_id = db.Column(db.String(64), default='', index=True)
    user_id = db.Column(db.Integer, nullable=False, index=True)
    merchant = db.Column(db.String(128), nullable=False)
    item = db.Column(db.String(128), nullable=False)
    amount = db.Column(db.Float, default=0)
    total_times = db.Column(db.Integer, nullable=False, default=1)
    used_times = db.Column(db.Integer, default=0)
    default_deduct = db.Column(db.Integer, default=1)
    expire_date = db.Column(db.Date, nullable=True)
    note = db.Column(db.Text, nullable=True)
    preferences = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow,
                           onupdate=datetime.utcnow)


class Checkin(db.Model):
    __tablename__ = 'checkins'

    id = db.Column(db.Integer, primary_key=True)
    local_id = db.Column(db.String(64), default='', index=True)
    user_id = db.Column(db.Integer, nullable=False, index=True)
    quota_id = db.Column(db.Integer, nullable=True)
    quota_local_id = db.Column(db.String(64), default='')
    merchant = db.Column(db.String(128), default='')
    deduct_times = db.Column(db.Integer, nullable=False, default=1)
    checkin_date = db.Column(db.Date, nullable=True)
    checkin_time = db.Column(db.String(32), default='')
    is_revoked = db.Column(db.Boolean, default=False)
    date_edit_logs = db.Column(db.JSON, nullable=True)
    note = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow,
                           onupdate=datetime.utcnow)


class Rating(db.Model):
    __tablename__ = 'ratings'

    id = db.Column(db.Integer, primary_key=True)
    local_id = db.Column(db.String(64), default='', index=True)
    user_id = db.Column(db.Integer, nullable=False, index=True)
    merchant = db.Column(db.String(128), nullable=False)
    score = db.Column(db.Integer, nullable=False, default=5)
    comment = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class LoginSession(db.Model):
    """网页版扫码登录会话：网页生成 scene → 小程序扫码确认 → 网页轮询取 token"""
    __tablename__ = 'login_sessions'

    id = db.Column(db.Integer, primary_key=True)
    scene = db.Column(db.String(64), nullable=False, unique=True, index=True)
    user_id = db.Column(db.Integer, nullable=True, index=True)
    status = db.Column(db.String(16), nullable=False, default='pending')  # pending / confirmed / expired
    mode = db.Column(db.String(16), nullable=False, default='login')  # 'login' | 'bind'
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    confirmed_at = db.Column(db.DateTime, nullable=True)


# ──────────────────────────────────────────────
# B 端商户 / 卡体系（与现有 quota 体系共存，不直接替换 quota）
# 客户端的次卡/签到流程保持不变；B 端在 Card 模型上做发卡/核销强一致业务。
# ──────────────────────────────────────────────

class Merchant(db.Model):
    __tablename__ = 'merchants'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), nullable=False)
    logo_url = db.Column(db.String(512), default='')
    contact_phone = db.Column(db.String(32), default='')
    status = db.Column(db.String(16), default='active')  # active / disabled
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class Staff(db.Model):
    __tablename__ = 'staff'

    id = db.Column(db.Integer, primary_key=True)
    merchant_id = db.Column(db.Integer, nullable=False, index=True)
    openid = db.Column(db.String(64), nullable=False, index=True)
    role = db.Column(db.String(16), nullable=False, default='cashier')  # owner / cashier
    name = db.Column(db.String(64), default='')
    invited_by = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class CardTemplate(db.Model):
    __tablename__ = 'card_templates'

    id = db.Column(db.Integer, primary_key=True)
    merchant_id = db.Column(db.Integer, nullable=False, index=True)
    name = db.Column(db.String(128), nullable=False)
    total_times = db.Column(db.Integer, nullable=False, default=1)
    price_cents = db.Column(db.Integer, default=0)
    valid_days = db.Column(db.Integer, default=0)
    default_deduct = db.Column(db.Integer, default=1)
    status = db.Column(db.String(16), default='active')  # active / disabled
    refund_rule = db.Column(db.Text, nullable=True)                       # 退费规则明示文本
    refund_rule_type = db.Column(db.String(16), default='prorata_by_used')  # no/full/deduct_per_used/prorata_by_used
    deduct_per_use_cents = db.Column(db.Integer, nullable=True)           # deduct_per_used 时单次扣减额
    max_refund_cents = db.Column(db.Integer, nullable=True)               # 应退封顶金额（可空）


class Card(db.Model):
    __tablename__ = 'cards'

    id = db.Column(db.Integer, primary_key=True)
    local_id = db.Column(db.String(64), default='', index=True)
    merchant_id = db.Column(db.Integer, nullable=False, index=True)
    template_id = db.Column(db.Integer, nullable=True, index=True)
    owner_openid = db.Column(db.String(64), default='', index=True)  # 领卡前为空
    owner_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True, index=True)  # 领卡顾客(users)
    total_times = db.Column(db.Integer, nullable=False, default=1)
    used_times = db.Column(db.Integer, default=0)  # 服务端由核销记录派生/事务维护，客户端不上传
    held_times = db.Column(db.Integer, default=0)  # 预约冻结次数（服务端维护）
    status = db.Column(db.String(16), default='unclaimed')  # unclaimed/active/used_up/expired/voided/refunded
    effective_mode = db.Column(db.String(16), default='claim')  # claim / immediate
    issue_code = db.Column(db.String(16), default='', index=True)  # 一次性领取码
    issue_note = db.Column(db.Text, nullable=True)
    version = db.Column(db.Integer, default=0)  # 乐观锁
    expire_date = db.Column(db.Date, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow,
                           onupdate=datetime.utcnow)


class RedemptionRecord(db.Model):
    __tablename__ = 'redemption_records'

    id = db.Column(db.Integer, primary_key=True)
    card_id = db.Column(db.Integer, nullable=False, index=True)
    staff_id = db.Column(db.Integer, nullable=True)
    deduct_times = db.Column(db.Integer, nullable=False, default=1)
    verify_token = db.Column(db.String(128), default='', index=True)  # 幂等键（核销令牌）
    is_revoked = db.Column(db.Boolean, default=False)
    revoke_reason = db.Column(db.String(256), default='')
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class NotificationLog(db.Model):
    __tablename__ = 'notification_logs'

    id = db.Column(db.Integer, primary_key=True)
    openid = db.Column(db.String(64), default='', index=True)
    scene = db.Column(db.String(32), default='')
    template_id = db.Column(db.String(64), default='')
    payload = db.Column(db.JSON, nullable=True)
    status = db.Column(db.String(16), default='pending')  # pending / sent / failed
    sent_at = db.Column(db.DateTime, nullable=True)


# ──────────────────────────────────────────────
# 商业化扩展（排课 / 预约 / 销卡 / 退款 / 审计）
# 复用现有 merchants / staff / cards / card_templates / redemption_records / users
# 命名约定与现有一致：snake_case 列名 + 复数表名 + Flask-SQLAlchemy db.Model
# ──────────────────────────────────────────────

class MerchantStore(db.Model):
    __tablename__ = 'merchant_stores'

    id = db.Column(db.Integer, primary_key=True)
    merchant_id = db.Column(db.Integer, db.ForeignKey('merchants.id'), nullable=False, index=True)
    name = db.Column(db.String(128), nullable=False)
    address = db.Column(db.String(255), default='')
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class StaffRole(db.Model):
    """可选 RBAC：细化到权限位（issue_card/schedule/redeem/void_card/refund...）。"""
    __tablename__ = 'staff_roles'

    id = db.Column(db.Integer, primary_key=True)
    merchant_id = db.Column(db.Integer, db.ForeignKey('merchants.id'), nullable=False, index=True)
    name = db.Column(db.String(64), nullable=False)
    permissions = db.Column(db.JSON, nullable=False, default=list)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class StudentProfile(db.Model):
    """学员档案：一个监护人(users)可管理多名学员。"""
    __tablename__ = 'student_profiles'

    id = db.Column(db.Integer, primary_key=True)
    guardian_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    name = db.Column(db.String(128), nullable=False)
    birthday = db.Column(db.Date, nullable=True)
    note = db.Column(db.String(255), default='')
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class CardLedger(db.Model):
    """卡流水：发卡/调整/延期/销卡/退款等全部卡片状态变更（类资金审计）。"""
    __tablename__ = 'card_ledgers'

    id = db.Column(db.Integer, primary_key=True)
    card_id = db.Column(db.Integer, db.ForeignKey('cards.id'), nullable=False, index=True)
    action = db.Column(db.String(24), nullable=False)  # issue/claim/adjust/extend/void/refund
    operator_id = db.Column(db.Integer, nullable=True)
    delta_times = db.Column(db.Integer, default=0)
    detail = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class CardHold(db.Model):
    """预约冻结次数（预约时冻结、签到转核销、迟到取消/未到扣减）。"""
    __tablename__ = 'card_holds'

    id = db.Column(db.Integer, primary_key=True)
    card_id = db.Column(db.Integer, db.ForeignKey('cards.id'), nullable=False, index=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id'), nullable=False, index=True)
    hold_times = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(16), default='held')  # held / released / consumed
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class CardVoidRecord(db.Model):
    __tablename__ = 'card_void_records'

    id = db.Column(db.Integer, primary_key=True)
    card_id = db.Column(db.Integer, db.ForeignKey('cards.id'), nullable=False, index=True)
    void_type = db.Column(db.String(24), default='')  # unclaimed/claimed/refund/abnormal/auto
    reason = db.Column(db.String(255), default='')
    operator_id = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class CardRefundRecord(db.Model):
    __tablename__ = 'card_refund_records'

    id = db.Column(db.Integer, primary_key=True)
    card_id = db.Column(db.Integer, db.ForeignKey('cards.id'), nullable=False, index=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=True, index=True)
    paid_cents = db.Column(db.Integer, default=0)
    refund_cents = db.Column(db.Integer, default=0)
    used_deduction_cents = db.Column(db.Integer, default=0)
    fee_cents = db.Column(db.Integer, default=0)
    operator_id = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class Course(db.Model):
    __tablename__ = 'courses'

    id = db.Column(db.Integer, primary_key=True)
    merchant_id = db.Column(db.Integer, db.ForeignKey('merchants.id'), nullable=False, index=True)
    name = db.Column(db.String(128), nullable=False)
    description = db.Column(db.Text, nullable=True)
    duration_minutes = db.Column(db.Integer, default=60)
    default_capacity = db.Column(db.Integer, default=10)
    min_open_count = db.Column(db.Integer, default=1)
    applicable_card_template_ids = db.Column(db.JSON, nullable=True)  # 空=全部模板可用
    price_cents = db.Column(db.Integer, default=0)  # 单次购买价
    status = db.Column(db.String(16), default='active')  # active / disabled
    cover_image = db.Column(db.String(255), default='')
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class Teacher(db.Model):
    __tablename__ = 'teachers'

    id = db.Column(db.Integer, primary_key=True)
    merchant_id = db.Column(db.Integer, db.ForeignKey('merchants.id'), nullable=False, index=True)
    name = db.Column(db.String(128), nullable=False)
    phone = db.Column(db.String(32), default='')
    note = db.Column(db.String(255), default='')
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class Room(db.Model):
    __tablename__ = 'rooms'

    id = db.Column(db.Integer, primary_key=True)
    merchant_id = db.Column(db.Integer, db.ForeignKey('merchants.id'), nullable=False, index=True)
    store_id = db.Column(db.Integer, db.ForeignKey('merchant_stores.id'), nullable=True)
    name = db.Column(db.String(128), nullable=False)
    capacity = db.Column(db.Integer, nullable=True)
    note = db.Column(db.String(255), default='')
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class TimeWindow(db.Model):
    """时间窗格：营业 / 老师可授课 / 教室可用 / 黑名单(请假闭店节假日)。"""
    __tablename__ = 'time_windows'

    id = db.Column(db.Integer, primary_key=True)
    merchant_id = db.Column(db.Integer, db.ForeignKey('merchants.id'), nullable=False, index=True)
    target_type = db.Column(db.String(16), nullable=False)  # merchant/store/teacher/room/course
    target_id = db.Column(db.Integer, nullable=True, index=True)
    weekday = db.Column(db.Integer, nullable=True)  # 0=周一 ... 6=周日；null=每天
    start_time = db.Column(db.String(8), default='')  # "18:00"
    end_time = db.Column(db.String(8), default='')  # "21:30"
    slot_minutes = db.Column(db.Integer, default=30)
    valid_from = db.Column(db.Date, nullable=True)
    valid_to = db.Column(db.Date, nullable=True)
    is_available = db.Column(db.Boolean, default=True)  # False 表示黑名单(不可用)
    priority = db.Column(db.Integer, default=0)
    note = db.Column(db.String(255), default='')
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class ScheduleRule(db.Model):
    """循环排课规则。"""
    __tablename__ = 'schedule_rules'

    id = db.Column(db.Integer, primary_key=True)
    merchant_id = db.Column(db.Integer, db.ForeignKey('merchants.id'), nullable=False, index=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    store_id = db.Column(db.Integer, db.ForeignKey('merchant_stores.id'), nullable=True)
    teacher_id = db.Column(db.Integer, db.ForeignKey('teachers.id'), nullable=True)
    room_id = db.Column(db.Integer, db.ForeignKey('rooms.id'), nullable=True)
    weekdays = db.Column(db.JSON, nullable=False)  # [0,2,4]
    start_time = db.Column(db.String(8), nullable=False)  # "19:00"
    end_time = db.Column(db.String(8), nullable=False)  # "20:00"
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=True)
    skip_holidays = db.Column(db.Boolean, default=True)
    plan_capacity = db.Column(db.Integer, nullable=True)
    series_key = db.Column(db.String(40), nullable=True, index=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class CourseSession(db.Model):
    __tablename__ = 'course_sessions'

    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False, index=True)
    merchant_id = db.Column(db.Integer, db.ForeignKey('merchants.id'), nullable=False, index=True)
    store_id = db.Column(db.Integer, db.ForeignKey('merchant_stores.id'), nullable=True)
    teacher_id = db.Column(db.Integer, db.ForeignKey('teachers.id'), nullable=True, index=True)
    room_id = db.Column(db.Integer, db.ForeignKey('rooms.id'), nullable=True, index=True)
    rule_id = db.Column(db.Integer, db.ForeignKey('schedule_rules.id'), nullable=True, index=True)
    start_at = db.Column(db.DateTime, nullable=False, index=True)
    end_at = db.Column(db.DateTime, nullable=False)
    plan_capacity = db.Column(db.Integer, default=10)
    enrolled_count = db.Column(db.Integer, default=0)  # 服务端维护=已预约(confirmed)数
    waitlist_count = db.Column(db.Integer, default=0)
    status = db.Column(db.String(16), default='open')  # open/full/closed/cancelled/completed
    booking_start_at = db.Column(db.DateTime, nullable=True)
    booking_end_at = db.Column(db.DateTime, nullable=True)
    cancel_deadline_at = db.Column(db.DateTime, nullable=True)
    series_edit_mode = db.Column(db.String(16), nullable=True)  # this / this_and_future / all
    note = db.Column(db.String(255), default='')
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class Booking(db.Model):
    __tablename__ = 'bookings'

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('course_sessions.id'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)  # 预约顾客
    student_id = db.Column(db.Integer, db.ForeignKey('student_profiles.id'), nullable=True, index=True)
    card_id = db.Column(db.Integer, db.ForeignKey('cards.id'), nullable=True, index=True)
    status = db.Column(db.String(16), default='confirmed')  # confirmed/cancelled
    cancel_type = db.Column(db.String(16), nullable=True)  # self/merchant/system/late/abnormal
    cancel_reason = db.Column(db.String(120), nullable=True)
    cancelled_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    __table_args__ = (
        db.UniqueConstraint('session_id', 'user_id', name='uq_session_user'),
    )


class Waitlist(db.Model):
    __tablename__ = 'waitlists'

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('course_sessions.id'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    student_id = db.Column(db.Integer, db.ForeignKey('student_profiles.id'), nullable=True, index=True)
    card_id = db.Column(db.Integer, db.ForeignKey('cards.id'), nullable=True, index=True)
    status = db.Column(db.String(16), default='waiting')  # waiting/promoted/expired/cancelled
    auto_confirm = db.Column(db.Boolean, default=True)
    confirm_deadline_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class AttendanceRecord(db.Model):
    __tablename__ = 'attendance_records'

    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id'), nullable=False, index=True)
    session_id = db.Column(db.Integer, db.ForeignKey('course_sessions.id'), nullable=True, index=True)
    status = db.Column(db.String(16), nullable=True)  # present/late/no_show
    deduct_times = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class CourseCancelRecord(db.Model):
    __tablename__ = 'course_cancel_records'

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('course_sessions.id'), nullable=False, index=True)
    reason = db.Column(db.Text, nullable=True)
    operator_id = db.Column(db.Integer, nullable=True)
    notify_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class Order(db.Model):
    __tablename__ = 'orders'

    id = db.Column(db.Integer, primary_key=True)
    merchant_id = db.Column(db.Integer, db.ForeignKey('merchants.id'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True, index=True)
    type = db.Column(db.String(16), default='buy_card')  # buy_card/single_class/renew/refund
    ref_card_id = db.Column(db.Integer, db.ForeignKey('cards.id'), nullable=True, index=True)
    ref_session_id = db.Column(db.Integer, db.ForeignKey('course_sessions.id'), nullable=True, index=True)
    ref_template_id = db.Column(db.Integer, db.ForeignKey('card_templates.id'), nullable=True, index=True)
    amount_cents = db.Column(db.Integer, default=0)
    paid_amount = db.Column(db.Integer, default=0)
    status = db.Column(db.String(16), default='pending')  # pending/paid/refunded/closed
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class PaymentRecord(db.Model):
    __tablename__ = 'payment_records'

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False, index=True)
    amount_cents = db.Column(db.Integer, nullable=False)
    channel = db.Column(db.String(16), default='offline')  # offline/wechat
    transaction_id = db.Column(db.String(64), default='')
    success = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class RefundRecord(db.Model):
    __tablename__ = 'refund_records'

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=True, index=True)
    card_id = db.Column(db.Integer, db.ForeignKey('cards.id'), nullable=True, index=True)
    amount_cents = db.Column(db.Integer, default=0)
    success = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class GroupBuyVoucher(db.Model):
    """团购券（美团/抖音等平台券码）落私域占位模型。

    真实核销前需经 _fetch_voucher_from_platform 校验平台券状态（待接入凭证）；
    此处仅做本地占位 + 直发次卡，打通私域留存闭环。
    """
    __tablename__ = 'group_buy_vouchers'

    id = db.Column(db.Integer, primary_key=True)
    merchant_id = db.Column(db.Integer, nullable=False, index=True)
    code = db.Column(db.String(32), unique=True, nullable=False, index=True)  # 平台券码
    platform = db.Column(db.String(16), default='meituan')  # meituan / douyin
    ref_template_id = db.Column(db.Integer, db.ForeignKey('card_templates.id'), nullable=True, index=True)
    status = db.Column(db.String(16), default='unused')  # unused / redeemed
    redeemed_by_user_id = db.Column(db.Integer, nullable=True, index=True)
    redeemed_card_id = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    redeemed_at = db.Column(db.DateTime, nullable=True)


class AuditLog(db.Model):
    """全部类资金操作的审计日志。"""
    __tablename__ = 'audit_logs'

    id = db.Column(db.Integer, primary_key=True)
    merchant_id = db.Column(db.Integer, db.ForeignKey('merchants.id'), nullable=True, index=True)
    actor_id = db.Column(db.Integer, nullable=True)
    action = db.Column(db.String(32), nullable=False)
    entity_type = db.Column(db.String(24), nullable=True)
    entity_id = db.Column(db.Integer, nullable=True)
    detail = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class IdempotencyKey(db.Model):
    """幂等控制：同一 key 只处理一次，重复请求直接返回首次结果。"""
    __tablename__ = 'idempotency_keys'

    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(120), unique=True, nullable=False, index=True)
    response = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class Holiday(db.Model):
    """节假日/闭店黑名单日期（循环排课跳过用）。"""
    __tablename__ = 'holidays'

    id = db.Column(db.Integer, primary_key=True)
    merchant_id = db.Column(db.Integer, db.ForeignKey('merchants.id'), nullable=True, index=True)
    holiday_date = db.Column(db.Date, nullable=False)
    name = db.Column(db.String(60), default='')
    __table_args__ = (
        db.UniqueConstraint('merchant_id', 'holiday_date', name='uq_merchant_holiday'),
    )
