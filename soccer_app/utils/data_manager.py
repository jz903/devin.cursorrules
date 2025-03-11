import os
import json
import logging
import sys
from datetime import datetime

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)
logger = logging.getLogger(__name__)

class DataManager:
    """数据管理器，用于存储和检索帖子和分析结果"""
    
    def __init__(self, data_dir="data"):
        """初始化数据管理器
        
        Args:
            data_dir (str): 数据存储目录
        """
        self.data_dir = data_dir
        self.posts_dir = os.path.join(data_dir, "posts")
        self.analyses_dir = os.path.join(data_dir, "analyses")
        
        # 确保目录存在
        os.makedirs(self.posts_dir, exist_ok=True)
        os.makedirs(self.analyses_dir, exist_ok=True)
        
        logger.info(f"数据管理器初始化成功，数据存储目录: {data_dir}")
    
    def save_post(self, post, comments):
        """保存帖子和评论
        
        Args:
            post (dict): 帖子信息
            comments (list): 评论列表
            
        Returns:
            bool: 是否保存成功
        """
        try:
            post_id = post['id']
            file_path = os.path.join(self.posts_dir, f"{post_id}.json")
            
            data = {
                "post": post,
                "comments": comments,
                "saved_at": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
            
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            logger.info(f"帖子 {post_id} 保存成功")
            return True
            
        except Exception as e:
            logger.error(f"保存帖子失败: {str(e)}")
            return False
    
    def save_analysis(self, post_id, analysis):
        """保存分析结果
        
        Args:
            post_id (str): 帖子 ID
            analysis (dict): 分析结果
            
        Returns:
            bool: 是否保存成功
        """
        try:
            file_path = os.path.join(self.analyses_dir, f"{post_id}.json")
            
            data = {
                "post_id": post_id,
                "analysis": analysis,
                "analyzed_at": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
            
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            logger.info(f"帖子 {post_id} 的分析结果保存成功")
            return True
            
        except Exception as e:
            logger.error(f"保存分析结果失败: {str(e)}")
            return False
    
    def get_post(self, post_id):
        """获取帖子和评论
        
        Args:
            post_id (str): 帖子 ID
            
        Returns:
            dict: 帖子和评论信息，如果不存在则返回 None
        """
        try:
            file_path = os.path.join(self.posts_dir, f"{post_id}.json")
            
            if not os.path.exists(file_path):
                logger.warning(f"帖子 {post_id} 不存在")
                return None
            
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            logger.info(f"帖子 {post_id} 获取成功")
            return data
            
        except Exception as e:
            logger.error(f"获取帖子失败: {str(e)}")
            return None
    
    def get_analysis(self, post_id):
        """获取分析结果
        
        Args:
            post_id (str): 帖子 ID
            
        Returns:
            dict: 分析结果，如果不存在则返回 None
        """
        try:
            file_path = os.path.join(self.analyses_dir, f"{post_id}.json")
            
            if not os.path.exists(file_path):
                logger.warning(f"帖子 {post_id} 的分析结果不存在")
                return None
            
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            logger.info(f"帖子 {post_id} 的分析结果获取成功")
            return data
            
        except Exception as e:
            logger.error(f"获取分析结果失败: {str(e)}")
            return None
    
    def get_all_posts(self, limit=10, sort_by_date=True):
        """获取所有帖子
        
        Args:
            limit (int): 获取的帖子数量
            sort_by_date (bool): 是否按日期排序
            
        Returns:
            list: 帖子列表
        """
        try:
            posts = []
            
            for filename in os.listdir(self.posts_dir):
                if filename.endswith('.json'):
                    file_path = os.path.join(self.posts_dir, filename)
                    
                    with open(file_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    
                    posts.append(data)
            
            # 按日期排序
            if sort_by_date:
                posts.sort(key=lambda x: x.get('saved_at', ''), reverse=True)
            
            logger.info(f"获取所有帖子成功，共 {len(posts)} 个")
            return posts[:limit]
            
        except Exception as e:
            logger.error(f"获取所有帖子失败: {str(e)}")
            return [] 