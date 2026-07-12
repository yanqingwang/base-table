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

# 设定数据库链接：有 MySQL 地址用 MySQL，否则用 SQLite 本地兜底
if config.db_address and config.username:
    app.config['SQLALCHEMY_DATABASE_URI'] = \
        'mysql://{}:{}@{}/{}?charset=utf8mb4'.format(
            config.username, config.password,
            config.db_address, config.db_name)
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///{}'.format(config.SQLITE_PATH)

# 初始化 DB 操作对象
db = SQLAlchemy(app)

# 加载控制器
from wxcloudrun import views

# 加载配置
app.config.from_object('config')
