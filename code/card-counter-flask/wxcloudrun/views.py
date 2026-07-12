import json
from datetime import datetime, date
from functools import wraps

import jwt as pyjwt
import requests
from flask import render_template, request, redirect

import config
from wxcloudrun import app, db
from wxcloudrun.dao import (
    get_user_by_openid, get_user_by_id, create_user, update_user,
    list_quotas, get_quota, get_quota_by_local_id, create_quota,
    update_quota, delete_quota,
    list_checkins, get_checkin, get_checkin_by_local_id,
    create_checkin, update_checkin,
    list_ratings, get_rating_by_local_id, create_rating, delete_rating,
)
from wxcloudrun.model import User, Quota, Checkin, Rating
from wxcloudrun.response import make_succ_empty_response, make_succ_response, make_err_response


# ──────────────────────────────────────────────
# JWT helpers
# ──────────────────────────────────────────────

def generate_token(user):
    payload = {
        'user_id': user.id,
        'openid': user.openid,
        'exp': datetime.utcnow().timestamp() + config.JWT_EXPIRY_HOURS * 3600,
        'iat': datetime.utcnow().timestamp(),
    }
    return pyjwt.encode(payload, config.JWT_SECRET, algorithm='HS256')


def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        header = request.headers.get('Authorization', '')
        token = header.replace('Bearer ', '') if header.startswith('Bearer ') else header
        if not token:
            return make_err_response('未登录', 401)
        try:
            payload = pyjwt.decode(token, config.JWT_SECRET, algorithms=['HS256'])
            user = get_user_by_id(payload['user_id'])
            if not user:
                return make_err_response('用户不存在', 401)
            # attach user to request context
            request.current_user = user
        except pyjwt.ExpiredSignatureError:
            return make_err_response('登录已过期', 401)
        except pyjwt.InvalidTokenError:
            return make_err_response('无效的登录Token', 401)
        return f(*args, **kwargs)
    return decorated


# ──────────────────────────────────────────────
# model -> dict serializers
# ──────────────────────────────────────────────

def quota_to_dict(q):
    return {
        'localId': q.local_id or str(q.id),
        'id': q.id,
        'merchant': q.merchant,
        'item': q.item,
        'amount': float(q.amount) if q.amount else 0,
        'totalTimes': q.total_times,
        'usedTimes': q.used_times or 0,
        'expireDate': q.expire_date.isoformat() if q.expire_date else '',
        'note': q.note or '',
        'preferences': q.preferences or {'days': ['weekend']},
        'createdAt': q.created_at.timestamp() * 1000 if q.created_at else 0,
        'updatedAt': q.updated_at.timestamp() * 1000 if q.updated_at else 0,
    }


def checkin_to_dict(c):
    return {
        'localId': c.local_id or str(c.id),
        'id': c.id,
        'quotaId': c.quota_local_id or '',
        'merchant': c.merchant or '',
        'deductTimes': c.deduct_times,
        'checkinDate': c.checkin_date.isoformat() if c.checkin_date else '',
        'checkinTime': c.checkin_time or '',
        'isRevoked': bool(c.is_revoked),
        'createdAt': c.created_at.timestamp() * 1000 if c.created_at else 0,
        'updatedAt': c.updated_at.timestamp() * 1000 if c.updated_at else 0,
    }


def rating_to_dict(r):
    return {
        'localId': r.local_id or str(r.id),
        'id': r.id,
        'merchant': r.merchant,
        'score': r.score,
        'comment': r.comment or '',
        'createdAt': r.created_at.timestamp() * 1000 if r.created_at else 0,
    }


# ──────────────────────────────────────────────
# Pages
# ──────────────────────────────────────────────

@app.route('/')
def index():
    return render_template('index.html')


# ──────────────────────────────────────────────
# Auth
# ──────────────────────────────────────────────

@app.route('/api/auth/login-url', methods=['GET'])
def auth_login_url():
    """返回微信扫码登录 URL"""
    state = request.args.get('state', 'card_counter')
    redirect_uri = config.WECHAT_REDIRECT_URI
    url = (
        'https://open.weixin.qq.com/connect/qrconnect'
        '?appid={}&redirect_uri={}&response_type=code'
        '&scope=snsapi_login&state={}'
        '#wechat_redirect'
    ).format(config.WECHAT_APP_ID, redirect_uri, state)
    return make_succ_response({'url': url})


@app.route('/api/auth/callback', methods=['GET'])
def auth_callback():
    """微信回调：用 code 换用户信息，生成 JWT，重定向回首页"""
    code = request.args.get('code')
    if not code:
        return make_err_response('缺少 code 参数')

    # 用 code 换 access_token
    token_url = (
        'https://api.weixin.qq.com/sns/oauth2/access_token'
        '?appid={}&secret={}&code={}&grant_type=authorization_code'
    ).format(config.WECHAT_APP_ID, config.WECHAT_APP_SECRET, code)

    try:
        resp = requests.get(token_url, timeout=10)
        token_data = resp.json()
    except Exception as e:
        app.logger.error('wechat token error: %s', e)
        return make_err_response('获取微信 token 失败')

    if 'errcode' in token_data and token_data['errcode'] != 0:
        app.logger.error('wechat token err: %s', token_data)
        return make_err_response('微信登录失败: ' + token_data.get('errmsg', ''))

    access_token = token_data['access_token']
    openid = token_data['openid']

    # 获取用户信息
    userinfo_url = (
        'https://api.weixin.qq.com/sns/userinfo'
        '?access_token={}&openid={}'
    ).format(access_token, openid)

    try:
        resp = requests.get(userinfo_url, timeout=10)
        user_info = resp.json()
    except Exception as e:
        app.logger.error('wechat userinfo error: %s', e)
        user_info = {}

    nickname = user_info.get('nickname', '')
    avatar_url = user_info.get('headimgurl', '')

    # 查找或创建用户
    user = get_user_by_openid(openid)
    if user:
        if nickname:
            user.nickname = nickname
        if avatar_url:
            user.avatar_url = avatar_url
        update_user(user)
    else:
        user = create_user(openid, nickname, avatar_url)

    # 生成 JWT
    token = generate_token(user)

    # 重定向到首页，JWT 放在 hash 中
    return redirect('/#token=' + token)


@app.route('/api/auth/me', methods=['GET'])
@require_auth
def auth_me():
    user = request.current_user
    return make_succ_response({
        'id': user.id,
        'openid': user.openid,
        'nickname': user.nickname or '',
        'avatarUrl': user.avatar_url or '',
    })


# ──────────────────────────────────────────────
# Quotas
# ──────────────────────────────────────────────

@app.route('/api/quotas', methods=['GET', 'POST'])
@require_auth
def quotas():
    user = request.current_user

    if request.method == 'GET':
        items = list_quotas(user.id)
        return make_succ_response([quota_to_dict(q) for q in items])

    # POST
    data = request.get_json()
    if not data:
        return make_err_response('请求体为空')

    local_id = data.get('localId', '')
    expire_date = None
    if data.get('expireDate'):
        try:
            expire_date = datetime.strptime(data['expireDate'], '%Y-%m-%d').date()
        except ValueError:
            pass

    quota_data = {
        'local_id': local_id,
        'user_id': user.id,
        'merchant': data.get('merchant', ''),
        'item': data.get('item', ''),
        'amount': float(data.get('amount', 0)),
        'total_times': int(data.get('totalTimes', 1)),
        'used_times': int(data.get('usedTimes', 0)),
        'expire_date': expire_date,
        'note': data.get('note', ''),
        'preferences': data.get('preferences', {'days': ['weekend']}),
    }

    # check if updating existing by local_id
    existing = None
    if local_id:
        existing = get_quota_by_local_id(local_id)

    if existing:
        update_quota(existing, quota_data)
        return make_succ_response(quota_to_dict(existing))
    else:
        q = create_quota(quota_data)
        if not q.local_id:
            q.local_id = str(q.id)
            db.session.commit()
        return make_succ_response(quota_to_dict(q))


@app.route('/api/quotas/<int:qid>', methods=['PUT', 'DELETE'])
@require_auth
def quota_detail(qid):
    user = request.current_user
    q = get_quota(qid)
    if not q or q.user_id != user.id:
        return make_err_response('配额不存在', 404)

    if request.method == 'DELETE':
        delete_quota(q)
        return make_succ_empty_response()

    # PUT
    data = request.get_json()
    if not data:
        return make_err_response('请求体为空')

    expire_date = None
    if data.get('expireDate'):
        try:
            expire_date = datetime.strptime(data['expireDate'], '%Y-%m-%d').date()
        except ValueError:
            pass

    update_data = {
        'merchant': data.get('merchant', q.merchant),
        'item': data.get('item', q.item),
        'amount': float(data.get('amount', q.amount or 0)),
        'total_times': int(data.get('totalTimes', q.total_times)),
        'used_times': int(data.get('usedTimes', q.used_times or 0)),
        'expire_date': expire_date or q.expire_date,
        'note': data.get('note', q.note or ''),
        'preferences': data.get('preferences', q.preferences),
    }
    update_quota(q, update_data)
    return make_succ_response(quota_to_dict(q))


# ──────────────────────────────────────────────
# Checkins
# ──────────────────────────────────────────────

@app.route('/api/checkins', methods=['GET', 'POST'])
@require_auth
def checkins():
    user = request.current_user

    if request.method == 'GET':
        items = list_checkins(user.id)
        return make_succ_response([checkin_to_dict(c) for c in items])

    # POST
    data = request.get_json()
    if not data:
        return make_err_response('请求体为空')

    checkin_date = None
    if data.get('checkinDate'):
        try:
            checkin_date = datetime.strptime(data['checkinDate'], '%Y-%m-%d').date()
        except ValueError:
            checkin_date = date.today()
    else:
        checkin_date = date.today()

    # 同时更新对应 quota 的 used_times
    quota_local_id = data.get('quotaId', '')
    deduct = int(data.get('deductTimes', 1))
    if quota_local_id:
        quota = get_quota_by_local_id(quota_local_id)
        if quota and quota.user_id == user.id:
            quota.used_times = (quota.used_times or 0) + deduct
            db.session.commit()

    ci_data = {
        'local_id': data.get('localId', ''),
        'user_id': user.id,
        'quota_id': quota.id if quota_local_id and quota else None,
        'quota_local_id': quota_local_id,
        'merchant': data.get('merchant', ''),
        'deduct_times': deduct,
        'checkin_date': checkin_date,
        'checkin_time': data.get('checkinTime', ''),
        'is_revoked': False,
    }
    ci = create_checkin(ci_data)
    if not ci.local_id:
        ci.local_id = str(ci.id)
        db.session.commit()
    return make_succ_response(checkin_to_dict(ci))


@app.route('/api/checkins/<int:cid>/revoke', methods=['POST'])
@require_auth
def revoke_checkin(cid):
    user = request.current_user
    ci = get_checkin(cid)
    if not ci or ci.user_id != user.id:
        return make_err_response('签到记录不存在', 404)

    if ci.is_revoked:
        return make_err_response('该签到已撤销')

    ci.is_revoked = True
    db.session.commit()

    # 恢复 quota 次数
    if ci.quota_local_id:
        quota = get_quota_by_local_id(ci.quota_local_id)
        if quota and quota.user_id == user.id:
            quota.used_times = max(0, (quota.used_times or 0) - ci.deduct_times)
            db.session.commit()

    return make_succ_response(checkin_to_dict(ci))


# ──────────────────────────────────────────────
# Ratings
# ──────────────────────────────────────────────

@app.route('/api/ratings', methods=['GET', 'POST'])
@require_auth
def ratings():
    user = request.current_user

    if request.method == 'GET':
        items = list_ratings(user.id)
        return make_succ_response([rating_to_dict(r) for r in items])

    # POST
    data = request.get_json()
    if not data:
        return make_err_response('请求体为空')

    local_id = data.get('localId', '')

    rating_data = {
        'local_id': local_id,
        'user_id': user.id,
        'merchant': data.get('merchant', ''),
        'score': int(data.get('score', 5)),
        'comment': data.get('comment', ''),
    }

    existing = None
    if local_id:
        existing = get_rating_by_local_id(local_id)

    if existing:
        existing.score = rating_data['score']
        existing.comment = rating_data['comment']
        db.session.commit()
        return make_succ_response(rating_to_dict(existing))
    else:
        r = create_rating(rating_data)
        if not r.local_id:
            r.local_id = str(r.id)
            db.session.commit()
        return make_succ_response(rating_to_dict(r))


@app.route('/api/ratings/<int:rid>', methods=['DELETE'])
@require_auth
def rating_detail(rid):
    user = request.current_user
    r = get_rating_by_local_id(str(rid)) or Rating.query.get(rid)
    if not r or r.user_id != user.id:
        return make_err_response('评价不存在', 404)

    delete_rating(r)
    return make_succ_empty_response()
