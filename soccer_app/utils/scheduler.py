from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
import logging
import sys
from datetime import datetime
import os

# 导入自定义工具
from soccer_app.utils.reddit_scraper import RedditScraper
from soccer_app.utils.llm_analyzer import LLMAnalyzer
from soccer_app.utils.data_manager import DataManager

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)
logger = logging.getLogger(__name__)

class TaskScheduler:
    """定时任务管理器，用于定期获取 Reddit 热门话题并分析"""
    
    def __init__(self, interval_minutes=60, post_limit=5, comment_limit=20, llm_provider="openai", data_dir="data"):
        """初始化定时任务管理器
        
        Args:
            interval_minutes (int): 任务执行间隔（分钟）
            post_limit (int): 获取的帖子数量
            comment_limit (int): 每个帖子获取的评论数量
            llm_provider (str): LLM 提供商
            data_dir (str): 数据存储目录
        """
        self.interval_minutes = interval_minutes
        self.post_limit = post_limit
        self.comment_limit = comment_limit
        self.llm_provider = llm_provider
        self.data_dir = data_dir
        
        # 初始化工具
        self.reddit_scraper = None
        self.llm_analyzer = None
        self.data_manager = None
        
        # 初始化调度器
        self.scheduler = BackgroundScheduler()
        
        logger.info(f"定时任务管理器初始化成功，执行间隔: {interval_minutes} 分钟")
    
    def initialize_tools(self):
        """初始化工具"""
        try:
            self.reddit_scraper = RedditScraper()
            self.llm_analyzer = LLMAnalyzer(provider=self.llm_provider)
            self.data_manager = DataManager(data_dir=self.data_dir)
            logger.info("工具初始化成功")
            return True
        except Exception as e:
            logger.error(f"工具初始化失败: {str(e)}")
            return False
    
    def start(self):
        """启动定时任务"""
        if not self.initialize_tools():
            logger.error("工具初始化失败，无法启动定时任务")
            return False
        
        # 添加定时任务
        self.scheduler.add_job(
            self.fetch_and_analyze_task,
            IntervalTrigger(minutes=self.interval_minutes),
            id='fetch_and_analyze',
            replace_existing=True
        )
        
        # 启动调度器
        self.scheduler.start()
        logger.info(f"定时任务已启动，每 {self.interval_minutes} 分钟执行一次")
        
        # 立即执行一次任务
        self.fetch_and_analyze_task()
        
        return True
    
    def stop(self):
        """停止定时任务"""
        if self.scheduler.running:
            self.scheduler.shutdown()
            logger.info("定时任务已停止")
        else:
            logger.warning("定时任务未运行")
    
    def fetch_and_analyze_task(self):
        """获取 Reddit 热门话题并分析的任务"""
        try:
            logger.info(f"开始执行定时任务，时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            
            # 获取热门帖子
            hot_posts = self.reddit_scraper.get_hot_posts(limit=self.post_limit)
            
            if not hot_posts:
                logger.warning("未获取到热门帖子，任务结束")
                return
            
            logger.info(f"获取到 {len(hot_posts)} 个热门帖子")
            
            # 处理每个帖子
            for post in hot_posts:
                post_id = post['id']
                
                # 获取评论
                comments = self.reddit_scraper.get_post_comments(post_id, limit=self.comment_limit)
                
                if not comments:
                    logger.warning(f"帖子 {post_id} 未获取到评论，跳过")
                    continue
                
                # 保存帖子和评论
                self.data_manager.save_post(post, comments)
                
                # 分析评论
                analysis_result = self.llm_analyzer.analyze_post_sentiment(post, comments)
                
                if not analysis_result['success']:
                    logger.error(f"帖子 {post_id} 分析失败: {analysis_result.get('error', '未知错误')}")
                    continue
                
                # 保存分析结果
                self.data_manager.save_analysis(post_id, analysis_result['analysis'])
                
                logger.info(f"帖子 {post_id} 处理完成")
            
            logger.info(f"定时任务执行完成，时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            
        except Exception as e:
            logger.error(f"定时任务执行失败: {str(e)}")
    
    def run_once(self):
        """立即执行一次任务"""
        if not self.reddit_scraper or not self.llm_analyzer or not self.data_manager:
            if not self.initialize_tools():
                logger.error("工具初始化失败，无法执行任务")
                return False
        
        self.fetch_and_analyze_task()
        return True 