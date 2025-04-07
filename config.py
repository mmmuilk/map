import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 数据库配置
DB_CONFIG = {
    "host": "localhost",  # 本地数据库
    "port": 5432,  # PostgreSQL 默认端口
    "database": "xxx",  # 你的数据库名
    "user": "xxx",  # 你的数据库用户名
    "password": "xxx"  # 你的数据库密码
}

# 高德地图 API Key（请替换为web端Key）
AMAP_WEB_KEY = "xxx"

# 上传图片的存储路径
UPLOAD_FOLDER = os.path.join(BASE_DIR, "static", "img")

# 确保图片上传文件夹存在
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
