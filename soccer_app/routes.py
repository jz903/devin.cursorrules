from flask import render_template, request, jsonify, redirect, url_for, flash
from soccer_app import app
import os
import markdown
import logging
import sys
from datetime import datetime

# 导入自定义工具
from soccer_app.utils.data_manager import DataManager
from soccer_app.utils.scheduler import TaskScheduler

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)
logger = logging.getLogger(__name__)

# 初始化数据管理器
data_manager = DataManager(data_dir="data")

# 初始化任务调度器
scheduler = TaskScheduler(
    interval_minutes=int(os.environ.get('SCHEDULER_INTERVAL_MINUTES', 60)),
    post_limit=int(os.environ.get('POST_LIMIT', 5)),
    comment_limit=int(os.environ.get('COMMENT_LIMIT', 20)),
    llm_provider=os.environ.get('LLM_PROVIDER', 'openai'),
    data_dir="data"
)

# 确保数据目录存在
os.makedirs("data/posts", exist_ok=True)
os.makedirs("data/analyses", exist_ok=True)

# 启动任务调度器
@app.before_first_request
def start_scheduler():
    """在第一个请求之前启动任务调度器"""
    scheduler.start()
    logger.info("任务调度器已启动")

@app.route('/')
def index():
    """首页，显示最新的帖子列表"""
    posts = data_manager.get_all_posts(limit=10, sort_by_date=True)
    return render_template('index.html', posts=posts)

@app.route('/post/<post_id>')
def view_post(post_id):
    """查看帖子详情和分析结果"""
    # 获取帖子和评论
    post_data = data_manager.get_post(post_id)
    if not post_data:
        flash('帖子不存在', 'error')
        return redirect(url_for('index'))
    
    # 获取分析结果
    analysis_data = data_manager.get_analysis(post_id)
    
    # 如果分析结果存在，将 Markdown 转换为 HTML
    if analysis_data and 'analysis' in analysis_data:
        analysis_html = markdown.markdown(analysis_data['analysis'])
    else:
        analysis_html = '<p>暂无分析结果</p>'
    
    return render_template(
        'post.html',
        post=post_data['post'],
        comments=post_data['comments'],
        analysis_html=analysis_html,
        analyzed_at=analysis_data.get('analyzed_at') if analysis_data else None
    )

@app.route('/refresh', methods=['POST'])
def refresh_data():
    """手动刷新数据"""
    try:
        success = scheduler.run_once()
        if success:
            flash('数据刷新成功', 'success')
        else:
            flash('数据刷新失败', 'error')
    except Exception as e:
        logger.error(f"手动刷新数据失败: {str(e)}")
        flash(f'数据刷新失败: {str(e)}', 'error')
    
    return redirect(url_for('index'))

@app.route('/api/posts')
def api_posts():
    """API: 获取帖子列表"""
    limit = request.args.get('limit', 10, type=int)
    posts = data_manager.get_all_posts(limit=limit, sort_by_date=True)
    return jsonify(posts)

@app.route('/api/post/<post_id>')
def api_post(post_id):
    """API: 获取帖子详情"""
    post_data = data_manager.get_post(post_id)
    if not post_data:
        return jsonify({'error': '帖子不存在'}), 404
    
    analysis_data = data_manager.get_analysis(post_id)
    
    return jsonify({
        'post': post_data,
        'analysis': analysis_data
    })

@app.errorhandler(404)
def page_not_found(e):
    """404 页面"""
    return render_template('404.html'), 404

@app.errorhandler(500)
def server_error(e):
    """500 页面"""
    return render_template('500.html'), 500 