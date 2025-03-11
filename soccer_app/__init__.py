from flask import Flask
from flask_wtf.csrf import CSRFProtect
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 创建 Flask 应用
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-key-for-testing')

# 启用 CSRF 保护
csrf = CSRFProtect(app)

# 导入路由
from soccer_app import routes 