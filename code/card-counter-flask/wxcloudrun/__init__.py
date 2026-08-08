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

# 轻量迁移：MySQL 已有表补充新增列（SQLite 用 PRAGMA 检查）
if os.environ.get('USE_MYSQL', '').lower() == 'true' and config.db_address:
    try:
        with db.engine.connect() as _conn:
            _cols = {r[0] for r in _conn.execute(
                "SELECT COLUMN_NAME FROM information_schema.COLUMNS "
                "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'checkins'")}
            if 'date_edit_logs' not in _cols:
                _conn.execute("ALTER TABLE checkins ADD COLUMN date_edit_logs JSON NULL")
                _conn.commit()
    except Exception as _e:  # noqa: BLE001 - 迁移失败不阻塞启动
        import logging
        logging.getLogger(__name__).warning('checkins 表迁移失败: %s', _e)

# 加载控制器
from wxcloudrun import views

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
