import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import config

# Optional: pymysql for MySQL
try:
    import pymysql
    pymysql.install_as_MySQLdb()
except ImportError:
    pass

# 初始化 web 应用
app = Flask(__name__, instance_relative_config=True)
app.config['DEBUG'] = config.DEBUG
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JSON_AS_ASCII'] = False  # 支持中文 JSON 响应

# 默认用 SQLite。设置 USE_MYSQL=true 环境变量可切换到 MySQL
if os.environ.get('USE_MYSQL', '').lower() == 'true' and config.db_address:
    # 确保 MySQL 数据库存在（云托管 MySQL 不会自动建库）
    try:
        import pymysql as _pymysql
        _host, _port = config.db_address.rsplit(':', 1)
        _conn = _pymysql.connect(
            host=_host, port=int(_port),
            user=config.username, password=config.password,
            charset='utf8mb4')
        with _conn.cursor() as _cur:
            _cur.execute(
                'CREATE DATABASE IF NOT EXISTS `{}` DEFAULT CHARACTER SET utf8mb4'
                .format(config.db_name))
        _conn.commit()
        _conn.close()
    except Exception as _e:  # noqa: BLE001 - 建库失败不阻塞启动，后续连接会报错提示
        import logging
        logging.getLogger(__name__).warning('MySQL auto-create db failed: %s', _e)
    app.config['SQLALCHEMY_DATABASE_URI'] = \
        'mysql://{}:{}@{}/{}?charset=utf8mb4'.format(
            config.username, config.password,
            config.db_address, config.db_name)
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///{}'.format(config.SQLITE_PATH)

# 初始化 DB 操作对象
db = SQLAlchemy(app)

# 自动建表（幂等，MySQL/SQLite 通用）
from wxcloudrun import model as _model  # noqa: E402,F401
with app.app_context():
    db.create_all()

# 轻量迁移：已有表补充新增列（MySQL 用 information_schema，SQLite 用 PRAGMA）
try:
    from sqlalchemy import text as _text
    with app.app_context():
        with db.engine.connect() as _conn:
            if os.environ.get('USE_MYSQL', '').lower() == 'true' and config.db_address:
                _cols = {r[0] for r in _conn.execute(_text(
                    "SELECT COLUMN_NAME FROM information_schema.COLUMNS "
                    "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'checkins'"))}
                if 'date_edit_logs' not in _cols:
                    _conn.execute(_text("ALTER TABLE checkins ADD COLUMN date_edit_logs JSON NULL"))
                    _conn.commit()
                if 'note' not in _cols:
                    _conn.execute(_text("ALTER TABLE checkins ADD COLUMN note TEXT NULL"))
                    _conn.commit()
                # quotas 表补列：default_deduct
                _qcols = {r[0] for r in _conn.execute(_text(
                    "SELECT COLUMN_NAME FROM information_schema.COLUMNS "
                    "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'quotas'"))}
                if 'default_deduct' not in _qcols:
                    _conn.execute(_text("ALTER TABLE quotas ADD COLUMN default_deduct INT NULL DEFAULT 1"))
                    _conn.commit()
                # login_sessions 表补列：mode（账号绑定扫码会话）
                _scols = {r[0] for r in _conn.execute(_text(
                    "SELECT COLUMN_NAME FROM information_schema.COLUMNS "
                    "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'login_sessions'"))}
                if 'mode' not in _scols:
                    _conn.execute(_text(
                        "ALTER TABLE login_sessions ADD COLUMN mode VARCHAR(16) NOT NULL DEFAULT 'login'"))
                    _conn.commit()
                # cards 表补列：商业化扩展（预约冻结/生效模式/备注/归属用户）
                _ccols = {r[0] for r in _conn.execute(_text(
                    "SELECT COLUMN_NAME FROM information_schema.COLUMNS "
                    "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cards'"))}
                if 'held_times' not in _ccols:
                    _conn.execute(_text("ALTER TABLE cards ADD COLUMN held_times INT NULL DEFAULT 0"))
                    _conn.commit()
                if 'effective_mode' not in _ccols:
                    _conn.execute(_text(
                        "ALTER TABLE cards ADD COLUMN effective_mode VARCHAR(16) NULL DEFAULT 'claim'"))
                    _conn.commit()
                if 'issue_note' not in _ccols:
                    _conn.execute(_text("ALTER TABLE cards ADD COLUMN issue_note TEXT NULL"))
                    _conn.commit()
                if 'owner_user_id' not in _ccols:
                    _conn.execute(_text("ALTER TABLE cards ADD COLUMN owner_user_id INT NULL"))
                    _conn.commit()
                # card_templates 表补列：退费规则结构化（D 任务）
                _tcols = {r[0] for r in _conn.execute(_text(
                    "SELECT COLUMN_NAME FROM information_schema.COLUMNS "
                    "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'card_templates'"))}
                for _col, _ddl in (
                    ('refund_rule', "ALTER TABLE card_templates ADD COLUMN refund_rule TEXT NULL"),
                    ('refund_rule_type', "ALTER TABLE card_templates ADD COLUMN refund_rule_type VARCHAR(16) NULL DEFAULT 'prorata_by_used'"),
                    ('deduct_per_use_cents', "ALTER TABLE card_templates ADD COLUMN deduct_per_use_cents INT NULL"),
                    ('max_refund_cents', "ALTER TABLE card_templates ADD COLUMN max_refund_cents INT NULL"),
                ):
                    if _col not in _tcols:
                        _conn.execute(_text(_ddl))
                        _conn.commit()
                # orders 表补列：ref_template_id（C 任务 订单/支付闭环）
                _ocols = {r[0] for r in _conn.execute(_text(
                    "SELECT COLUMN_NAME FROM information_schema.COLUMNS "
                    "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders'"))}
                if 'ref_template_id' not in _ocols:
                    _conn.execute(_text("ALTER TABLE orders ADD COLUMN ref_template_id INT NULL"))
                    _conn.commit()
            else:
                # SQLite：PRAGMA 检查列，缺失则 ALTER TABLE 补列
                _cols = {r[1] for r in _conn.execute(_text("PRAGMA table_info(checkins)"))}
                if 'date_edit_logs' not in _cols:
                    _conn.execute(_text("ALTER TABLE checkins ADD COLUMN date_edit_logs JSON NULL"))
                    _conn.commit()
                if 'note' not in _cols:
                    _conn.execute(_text("ALTER TABLE checkins ADD COLUMN note TEXT NULL"))
                    _conn.commit()
                # quotas 表补列：default_deduct
                _qcols = {r[1] for r in _conn.execute(_text("PRAGMA table_info(quotas)"))}
                if 'default_deduct' not in _qcols:
                    _conn.execute(_text("ALTER TABLE quotas ADD COLUMN default_deduct INTEGER DEFAULT 1"))
                    _conn.commit()
                # login_sessions 表补列：mode
                _scols = {r[1] for r in _conn.execute(_text("PRAGMA table_info(login_sessions)"))}
                if 'mode' not in _scols:
                    _conn.execute(_text(
                        "ALTER TABLE login_sessions ADD COLUMN mode VARCHAR(16) NOT NULL DEFAULT 'login'"))
                    _conn.commit()
                # cards 表补列：商业化扩展
                _ccols = {r[1] for r in _conn.execute(_text("PRAGMA table_info(cards)"))}
                if 'held_times' not in _ccols:
                    _conn.execute(_text("ALTER TABLE cards ADD COLUMN held_times INTEGER DEFAULT 0"))
                    _conn.commit()
                if 'effective_mode' not in _ccols:
                    _conn.execute(_text(
                        "ALTER TABLE cards ADD COLUMN effective_mode VARCHAR(16) DEFAULT 'claim'"))
                    _conn.commit()
                if 'issue_note' not in _ccols:
                    _conn.execute(_text("ALTER TABLE cards ADD COLUMN issue_note TEXT"))
                    _conn.commit()
                if 'owner_user_id' not in _ccols:
                    _conn.execute(_text("ALTER TABLE cards ADD COLUMN owner_user_id INTEGER"))
                    _conn.commit()
                # card_templates 表补列：退费规则结构化（D 任务）
                _tcols = {r[1] for r in _conn.execute(_text("PRAGMA table_info(card_templates)"))}
                for _col, _ddl in (
                    ('refund_rule', "ALTER TABLE card_templates ADD COLUMN refund_rule TEXT"),
                    ('refund_rule_type', "ALTER TABLE card_templates ADD COLUMN refund_rule_type VARCHAR(16)"),
                    ('deduct_per_use_cents', "ALTER TABLE card_templates ADD COLUMN deduct_per_use_cents INTEGER"),
                    ('max_refund_cents', "ALTER TABLE card_templates ADD COLUMN max_refund_cents INTEGER"),
                ):
                    if _col not in _tcols:
                        _conn.execute(_text(_ddl))
                        _conn.commit()
                # orders 表补列：ref_template_id（C 任务 订单/支付闭环）
                _ocols = {r[1] for r in _conn.execute(_text("PRAGMA table_info(orders)"))}
                if 'ref_template_id' not in _ocols:
                    _conn.execute(_text("ALTER TABLE orders ADD COLUMN ref_template_id INTEGER"))
                    _conn.commit()
except Exception as _e:  # noqa: BLE001 - 迁移失败不阻塞启动
    import logging
    logging.getLogger(__name__).warning('checkins/quotas/login_sessions/cards 表迁移失败: %s', _e)

# 加载控制器
from wxcloudrun import views

# 商业化扩展路由（排课/预约/销卡/退款/时间窗格/学员档案）
try:
    from wxcloudrun import commercial_views  # noqa: E402,F401
except Exception as _e:  # noqa: BLE001 - 商业化扩展加载失败不阻塞主服务
    import logging
    logging.getLogger(__name__).warning('commercial_views 加载失败: %s', _e)

# 加载配置
app.config.from_object('config')


# ── PWA 支持（web manifest + service worker，根作用域）──
import os.path as _osp
from flask import send_file as _send_file

_STATIC = _osp.join(_osp.dirname(_osp.abspath(__file__)), 'static')

@app.route('/manifest.json')
def pwa_manifest():
    return _send_file(_osp.join(_STATIC, 'manifest.json'),
                      mimetype='application/manifest+json')

@app.route('/sw.js')
def pwa_sw():
    return _send_file(_osp.join(_STATIC, 'sw.js'),
                      mimetype='application/javascript')


# ── 微信域名归属校验（业务域名 / 网页授权域名验证）──
_VERIFY_DIR = _osp.join(_osp.dirname(_osp.abspath(__file__)), 'verify')

@app.route('/MP_verify_<fname>.txt')
def wechat_verify(fname):
    p = _osp.join(_VERIFY_DIR, 'MP_verify_{}.txt'.format(fname))
    if _osp.exists(p):
        return _send_file(p, mimetype='text/plain')
    return ('', 404)
