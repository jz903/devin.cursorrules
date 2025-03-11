import praw
import os
import logging
from datetime import datetime
import sys

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)
logger = logging.getLogger(__name__)

class RedditScraper:
    """Reddit 爬虫类，用于获取 r/soccer 热门话题和评论"""
    
    def __init__(self):
        """初始化 Reddit API 客户端"""
        try:
            self.reddit = praw.Reddit(
                client_id=os.environ.get('REDDIT_CLIENT_ID'),
                client_secret=os.environ.get('REDDIT_CLIENT_SECRET'),
                user_agent=os.environ.get('REDDIT_USER_AGENT', 'soccer-trends-app v1.0')
            )
            logger.info("Reddit API 客户端初始化成功")
        except Exception as e:
            logger.error(f"Reddit API 客户端初始化失败: {str(e)}")
            raise
    
    def get_hot_posts(self, limit=10):
        """获取 r/soccer 热门帖子
        
        Args:
            limit (int): 获取的帖子数量
            
        Returns:
            list: 热门帖子列表
        """
        try:
            logger.info(f"正在获取 r/soccer 热门帖子，数量: {limit}")
            subreddit = self.reddit.subreddit('soccer')
            hot_posts = []
            
            for post in subreddit.hot(limit=limit):
                # 跳过置顶帖子
                if post.stickied:
                    continue
                    
                hot_posts.append({
                    'id': post.id,
                    'title': post.title,
                    'url': post.url,
                    'permalink': f"https://www.reddit.com{post.permalink}",
                    'score': post.score,
                    'num_comments': post.num_comments,
                    'created_utc': datetime.fromtimestamp(post.created_utc).strftime('%Y-%m-%d %H:%M:%S'),
                    'author': post.author.name if post.author else '[deleted]',
                    'selftext': post.selftext
                })
            
            logger.info(f"成功获取 {len(hot_posts)} 个热门帖子")
            return hot_posts
            
        except Exception as e:
            logger.error(f"获取热门帖子失败: {str(e)}")
            return []
    
    def get_post_comments(self, post_id, limit=20):
        """获取指定帖子的热门评论
        
        Args:
            post_id (str): 帖子 ID
            limit (int): 获取的评论数量
            
        Returns:
            list: 热门评论列表
        """
        try:
            logger.info(f"正在获取帖子 {post_id} 的热门评论，数量: {limit}")
            submission = self.reddit.submission(id=post_id)
            submission.comment_sort = 'top'  # 按热门排序
            submission.comments.replace_more(limit=0)  # 移除 "load more comments" 链接
            
            comments = []
            for comment in submission.comments[:limit]:
                comments.append({
                    'id': comment.id,
                    'body': comment.body,
                    'score': comment.score,
                    'created_utc': datetime.fromtimestamp(comment.created_utc).strftime('%Y-%m-%d %H:%M:%S'),
                    'author': comment.author.name if comment.author else '[deleted]'
                })
            
            logger.info(f"成功获取 {len(comments)} 条评论")
            return comments
            
        except Exception as e:
            logger.error(f"获取评论失败: {str(e)}")
            return [] 