#!/usr/bin/env python
# -*- coding: utf-8 -*-

from soccer_app import app
import os
from datetime import datetime

# 添加模板全局变量
@app.context_processor
def inject_now():
    return {"now": datetime.now()}

if __name__ == "__main__":
    # 获取环境变量或使用默认值
    host = os.environ.get("FLASK_HOST", "0.0.0.0")
    port = int(os.environ.get("FLASK_PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "False").lower() == "true"
    
    # 启动应用
    app.run(host=host, port=port, debug=debug)
