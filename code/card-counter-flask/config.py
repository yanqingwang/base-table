import os

# 是否开启debug模式
DEBUG = os.environ.get('FLASK_DEBUG', 'true').lower() == 'true'

# MySQL 环境变量（云托管部署时使用）
username = os.environ.get('MYSQL_USERNAME', 'root')
password = os.environ.get('MYSQL_PASSWORD', '')
db_address = os.environ.get('MYSQL_ADDRESS', '')  # host:port
db_name = os.environ.get('MYSQL_DATABASE', 'card_counter')

# WeChat Open Platform
WECHAT_APP_ID = os.environ.get('WECHAT_APP_ID', 'wx9c5974ab24d057c3')
WECHAT_APP_SECRET = os.environ.get('WECHAT_APP_SECRET', '')
# 回调地址：本地开发时用 localhost，云托管部署时改为云托管域名
WECHAT_REDIRECT_URI = os.environ.get('WECHAT_REDIRECT_URI', 'http://localhost:5000/api/auth/callback')

# JWT
JWT_SECRET = os.environ.get('JWT_SECRET', 'card-counter-dev-secret-change-in-production')
JWT_EXPIRY_HOURS = int(os.environ.get('JWT_EXPIRY_HOURS', '72'))

# SQLite 本地兜底
import os.path as osp
BASE_DIR = osp.dirname(osp.abspath(__file__))
SQLITE_PATH = osp.join(BASE_DIR, 'card_counter.db')
