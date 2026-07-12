import logging

from wxcloudrun import db
from wxcloudrun.model import User, Quota, Checkin, Rating

logger = logging.getLogger('log')


# ── User ──

def get_user_by_openid(openid):
    return User.query.filter(User.openid == openid).first()


def get_user_by_id(uid):
    return User.query.get(uid)


def create_user(openid, nickname='', avatar_url=''):
    user = User(openid=openid, nickname=nickname, avatar_url=avatar_url)
    db.session.add(user)
    db.session.commit()
    return user


def update_user(user):
    db.session.commit()
    return user


# ── Quota ──

def list_quotas(user_id):
    return Quota.query.filter(Quota.user_id == user_id).order_by(Quota.created_at.desc()).all()


def get_quota(qid):
    return Quota.query.get(qid)


def get_quota_by_local_id(local_id):
    return Quota.query.filter(Quota.local_id == local_id).first()


def create_quota(data):
    q = Quota(**data)
    db.session.add(q)
    db.session.commit()
    return q


def update_quota(q, data):
    for key, val in data.items():
        setattr(q, key, val)
    db.session.commit()
    return q


def delete_quota(q):
    db.session.delete(q)
    db.session.commit()


# ── Checkin ──

def list_checkins(user_id):
    return Checkin.query.filter(Checkin.user_id == user_id)\
        .order_by(Checkin.checkin_date.desc(), Checkin.checkin_time.desc()).all()


def get_checkin(cid):
    return Checkin.query.get(cid)


def get_checkin_by_local_id(local_id):
    return Checkin.query.filter(Checkin.local_id == local_id).first()


def create_checkin(data):
    c = Checkin(**data)
    db.session.add(c)
    db.session.commit()
    return c


def update_checkin(c, data):
    for key, val in data.items():
        setattr(c, key, val)
    db.session.commit()
    return c


# ── Rating ──

def list_ratings(user_id):
    return Rating.query.filter(Rating.user_id == user_id)\
        .order_by(Rating.created_at.desc()).all()


def get_rating(rid):
    return Rating.query.get(rid)


def get_rating_by_local_id(local_id):
    return Rating.query.filter(Rating.local_id == local_id).first()


def create_rating(data):
    r = Rating(**data)
    db.session.add(r)
    db.session.commit()
    return r


def update_rating(r, data):
    for key, val in data.items():
        setattr(r, key, val)
    db.session.commit()
    return r


def delete_rating(r):
    db.session.delete(r)
    db.session.commit()
