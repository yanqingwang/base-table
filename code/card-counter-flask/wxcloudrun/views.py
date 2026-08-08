import json
from datetime import datetime, date
from functools import wraps

import jwt as pyjwt
import requests
from flask import render_template, request, redirect
from werkzeug.security import generate_password_hash, check_password_hash

import config
from wxcloudrun import app, db
from wxcloudrun.dao import (
    get_user_by_openid, get_user_by_id, get_user_by_username,
    create_user, update_user, update_user_profile, change_user_password,
    list_quotas, get_quota, get_quota_by_local_id, create_quota,
    update_quota, delete_quota,
    list_checkins, get_checkin, get_checkin_by_local_id,
    create_checkin, update_checkin,
    list_ratings, get_rating_by_local_id, create_rating, delete_rating,
    reset_user_data,
)
from wxcloudrun.model import User, Quota, Checkin, Rating
from wxcloudrun.response import make_succ_empty_response, make_succ_response, make_err_response


# ──────────────────────────────────────────────
# JWT helpers
# ──────────────────────────────────────────────

def generate_token(user):
    payload = {
        'user_id': user.id,
        'openid': user.openid or '',
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
        'dateEditLogs': c.date_edit_logs or [],
        'note': c.note or '',
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

@app.route('/api/auth/wechat-login', methods=['GET'])
def auth_wechat_login():
    """小程序 web-view 内自动登录：读取微信云托管传递的用户身份头"""
    openid = request.headers.get('X-WX-OPENID', '')
    nickname = request.headers.get('X-WX-NICKNAME', '')
    avatar_url = request.headers.get('X-WX-AVATAR', '')

    if not openid:
        return make_err_response('未检测到微信身份，请通过小程序访问', 401)

    user = get_user_by_openid(openid)
    if user:
        if nickname:
            user.nickname = nickname
        if avatar_url:
            user.avatar_url = avatar_url
        update_user(user)
    else:
        user = create_user(openid, nickname, avatar_url)

    token = generate_token(user)
    return make_succ_response({
        'token': token,
        'user': {'id': user.id, 'nickname': user.nickname, 'avatar_url': user.avatar_url},
    })


@app.route('/api/auth/wx-login', methods=['POST'])
def auth_wx_login():
    """小程序 wx.login() 登录：code 换 openid（不依赖云托管环境归属）"""
    data = request.get_json() or {}
    code = data.get('code', '')
    if not code:
        return make_err_response('缺少登录凭证 code', 400)

    if not config.WECHAT_APP_SECRET:
        return make_err_response('服务端未配置 WECHAT_APP_SECRET', 500)

    try:
        resp = requests.get('https://api.weixin.qq.com/sns/jscode2session', params={
            'appid': config.WECHAT_APP_ID,
            'secret': config.WECHAT_APP_SECRET,
            'js_code': code,
            'grant_type': 'authorization_code',
        }, timeout=10)
        result = resp.json()
    except Exception as e:
        return make_err_response('微信登录服务异常: ' + str(e), 502)

    if result.get('errcode'):
        return make_err_response('微信登录失败: ' + result.get('errmsg', ''), 401)

    openid = result.get('openid', '')
    if not openid:
        return make_err_response('未获取到用户身份', 401)

    nickname = data.get('nickname', '')
    avatar_url = data.get('avatarUrl', '')

    user = get_user_by_openid(openid)
    if user:
        if nickname:
            user.nickname = nickname
        if avatar_url:
            user.avatar_url = avatar_url
        update_user(user)
    else:
        user = create_user(openid, nickname, avatar_url)

    token = generate_token(user)
    return make_succ_response({
        'token': token,
        'user': {'id': user.id, 'nickname': user.nickname, 'avatar_url': user.avatar_url},
    })


@app.route('/api/auth/me', methods=['GET'])
@require_auth
def auth_me():
    user = request.current_user
    login_methods = []
    if user.openid:
        login_methods.append('wechat')
    if user.username:
        login_methods.append('password')
    return make_succ_response({
        'id': user.id,
        'openid': user.openid or '',
        'username': user.username or '',
        'nickname': user.nickname or '',
        'avatarUrl': user.avatar_url or '',
        'loginMethods': login_methods,
        'createdAt': user.created_at.timestamp() * 1000 if user.created_at else 0,
    })


# ── Username / Password Registration & Login ──

@app.route('/api/auth/register', methods=['POST'])
def auth_register():
    data = request.get_json()
    if not data:
        return make_err_response('请求体为空')

    username = (data.get('username') or '').strip()
    password = data.get('password', '')
    nickname = (data.get('nickname') or '').strip()

    if len(username) < 3:
        return make_err_response('用户名至少3个字符')
    if len(password) < 6:
        return make_err_response('密码至少6个字符')

    if get_user_by_username(username):
        return make_err_response('用户名已被注册')

    pw_hash = generate_password_hash(password)
    user = create_user(username=username, password_hash=pw_hash, nickname=nickname or username)
    token = generate_token(user)
    return make_succ_response({
        'token': token,
        'user': {'id': user.id, 'username': user.username, 'nickname': user.nickname or ''},
    })


@app.route('/api/auth/login', methods=['POST'])
def auth_login():
    data = request.get_json()
    if not data:
        return make_err_response('请求体为空')

    username = (data.get('username') or '').strip()
    password = data.get('password', '')

    if not username or not password:
        return make_err_response('用户名和密码不能为空')

    user = get_user_by_username(username)
    if not user or not user.password_hash:
        return make_err_response('用户名或密码错误', 401)

    if not check_password_hash(user.password_hash, password):
        return make_err_response('用户名或密码错误', 401)

    token = generate_token(user)
    return make_succ_response({
        'token': token,
        'user': {'id': user.id, 'username': user.username, 'nickname': user.nickname or ''},
    })


# ── WeChat Official Account OAuth ──

@app.route('/api/auth/official-login-url', methods=['GET'])
def auth_official_login_url():
    redirect_uri = config.OFFICIAL_REDIRECT_URI
    appid = config.OFFICIAL_APP_ID
    state = request.args.get('state', 'card_counter')
    url = (
        'https://open.weixin.qq.com/connect/oauth2/authorize'
        f'?appid={appid}&redirect_uri={redirect_uri}'
        f'&response_type=code&scope=snsapi_userinfo&state={state}#wechat_redirect'
    )
    return make_succ_response({'url': url})


@app.route('/api/auth/official-callback', methods=['GET'])
def auth_official_callback():
    code = request.args.get('code', '')
    if not code:
        return make_err_response('缺少授权码')

    appid = config.OFFICIAL_APP_ID
    secret = config.OFFICIAL_APP_SECRET

    # Exchange code for access_token
    token_resp = requests.get(
        'https://api.weixin.qq.com/sns/oauth2/access_token',
        params={'appid': appid, 'secret': secret, 'code': code, 'grant_type': 'authorization_code'},
    )
    token_data = token_resp.json()
    if 'errcode' in token_data and token_data['errcode'] != 0:
        return make_err_response(f"获取access_token失败: {token_data.get('errmsg', 'unknown')}")

    access_token = token_data['access_token']
    openid = token_data['openid']

    # Get user info
    user_resp = requests.get(
        'https://api.weixin.qq.com/sns/userinfo',
        params={'access_token': access_token, 'openid': openid, 'lang': 'zh_CN'},
    )
    user_data = user_resp.json()
    if 'errcode' in user_data and user_data['errcode'] != 0:
        return make_err_response(f"获取用户信息失败: {user_data.get('errmsg', 'unknown')}")

    nickname = user_data.get('nickname', '')
    avatar_url = user_data.get('headimgurl', '')

    user = get_user_by_openid(openid)
    if user:
        if nickname:
            user.nickname = nickname
        if avatar_url:
            user.avatar_url = avatar_url
        update_user(user)
    else:
        user = create_user(openid=openid, nickname=nickname, avatar_url=avatar_url)

    token = generate_token(user)
    return redirect(f'/#token={token}')


# ── Profile & Password Management ──

@app.route('/api/auth/profile', methods=['GET', 'PUT'])
@require_auth
def auth_profile():
    user = request.current_user

    if request.method == 'GET':
        login_methods = []
        if user.openid:
            login_methods.append('wechat')
        if user.username:
            login_methods.append('password')
        return make_succ_response({
            'id': user.id,
            'username': user.username or '',
            'nickname': user.nickname or '',
            'avatarUrl': user.avatar_url or '',
            'loginMethods': login_methods,
            'createdAt': user.created_at.timestamp() * 1000 if user.created_at else 0,
        })

    # PUT
    data = request.get_json()
    if not data:
        return make_err_response('请求体为空')
    nickname = (data.get('nickname') or '').strip()
    avatar_url = (data.get('avatarUrl') or data.get('avatar_url') or '').strip()
    if not nickname:
        return make_err_response('昵称不能为空')
    update_user_profile(user, nickname)
    if avatar_url:
        user.avatar_url = avatar_url
        db.session.commit()
    return make_succ_response({'nickname': user.nickname, 'avatarUrl': user.avatar_url or ''})


@app.route('/api/auth/change-password', methods=['POST'])
@require_auth
def auth_change_password():
    user = request.current_user
    data = request.get_json()
    if not data:
        return make_err_response('请求体为空')

    old_password = data.get('old_password', '')
    new_password = data.get('new_password', '')

    if not user.password_hash:
        return make_err_response('该账号未设置密码，无法修改')

    if not check_password_hash(user.password_hash, old_password):
        return make_err_response('原密码错误', 401)

    if len(new_password) < 6:
        return make_err_response('新密码至少6个字符')

    change_user_password(user, generate_password_hash(new_password))
    return make_succ_empty_response()


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

    # check if updating existing by local_id (仅当前用户)
    existing = None
    if local_id:
        existing = get_quota_by_local_id(local_id, user.id)

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
    is_revoked = bool(data.get('isRevoked', False))

    # localId 去重：已存在则更新（防重复推送创建重复签到），仅当前用户
    existing = None
    if data.get('localId'):
        existing = get_checkin_by_local_id(data['localId'], user.id)

    quota = None
    if quota_local_id:
        quota = get_quota_by_local_id(quota_local_id, user.id)
        # 仅新记录且未撤销时累加 used_times（重复推送/已撤销不重复扣减）
        if quota and quota.user_id == user.id and not existing and not is_revoked:
            quota.used_times = (quota.used_times or 0) + deduct
            db.session.commit()

    if existing:
        existing.merchant = data.get('merchant', existing.merchant or '')
        existing.deduct_times = deduct
        existing.checkin_date = checkin_date
        existing.checkin_time = data.get('checkinTime', existing.checkin_time or '')
        existing.note = data.get('note', existing.note or '')
        if data.get('isRevoked') is not None:
            existing.is_revoked = is_revoked
        existing.quota_local_id = quota_local_id
        existing.quota_id = quota.id if quota else existing.quota_id
        db.session.commit()
        return make_succ_response(checkin_to_dict(existing))

    ci_data = {
        'local_id': data.get('localId', ''),
        'user_id': user.id,
        'quota_id': quota.id if quota_local_id and quota else None,
        'quota_local_id': quota_local_id,
        'merchant': data.get('merchant', ''),
        'deduct_times': deduct,
        'checkin_date': checkin_date,
        'checkin_time': data.get('checkinTime', ''),
        'note': data.get('note', ''),
        'is_revoked': is_revoked,
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
        quota = get_quota_by_local_id(ci.quota_local_id, user.id)
        if quota and quota.user_id == user.id:
            quota.used_times = max(0, (quota.used_times or 0) - ci.deduct_times)
            db.session.commit()

    return make_succ_response(checkin_to_dict(ci))


@app.route('/api/checkins/<int:cid>/date', methods=['PUT'])
@require_auth
def update_checkin_date(cid):
    """修改签到日期，记录更改日志（30天限制为软性提示，不强制）"""
    user = request.current_user
    ci = get_checkin(cid)
    if not ci or ci.user_id != user.id:
        return make_err_response('签到记录不存在', 404)

    data = request.get_json() or {}
    new_date_str = (data.get('checkinDate') or '').strip()
    if not new_date_str:
        return make_err_response('缺少日期')

    try:
        new_date = datetime.strptime(new_date_str, '%Y-%m-%d').date()
    except ValueError:
        return make_err_response('日期格式错误，应为 YYYY-MM-DD')

    old_date = ci.checkin_date
    if old_date == new_date:
        return make_succ_response(checkin_to_dict(ci))

    logs = ci.date_edit_logs or []
    log_entry = {
        'from': old_date.isoformat() if old_date else '',
        'to': new_date_str,
        'changedAt': datetime.utcnow().isoformat(),
    }
    today = date.today()
    delta = (new_date - today).days
    if abs(delta) > 30:
        log_entry['outOfRange'] = True
    logs.append(log_entry)
    ci.checkin_date = new_date
    ci.date_edit_logs = logs
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
        existing = get_rating_by_local_id(local_id, user.id)

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
    r = get_rating_by_local_id(str(rid), user.id) or Rating.query.get(rid)
    if not r or r.user_id != user.id:
        return make_err_response('评价不存在', 404)

    delete_rating(r)
    return make_succ_empty_response()


# ──────────────────────────────────────────────
# Reset (清空当前用户业务数据 + 同步记录)
# ──────────────────────────────────────────────

@app.route('/api/reset', methods=['POST'])
@require_auth
def reset_data():
    """重置当前用户的所有业务数据（次卡/签到/评价），并清空同步状态。

    用于「重置数据，删除同步记录」：云端数据清空后，客户端本地数据
    与 _synced 同步标记一并清除，下次打开将从空白重新同步。
    仅删除当前登录用户的数据，不影响账号本身。
    """
    user = request.current_user
    reset_user_data(user.id)
    return make_succ_response({'reset': True})

