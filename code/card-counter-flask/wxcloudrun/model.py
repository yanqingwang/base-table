from datetime import datetime

from wxcloudrun import db


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    openid = db.Column(db.String(64), unique=True, nullable=False, index=True)
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
