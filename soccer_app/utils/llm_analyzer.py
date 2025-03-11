import sys
import logging
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from tools.llm_api import query_llm

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)
logger = logging.getLogger(__name__)

class LLMAnalyzer:
    """LLM 分析器，用于分析 Reddit 评论并总结舆论风向"""
    
    def __init__(self, provider="volcengine"):
        """初始化 LLM 分析器
        
        Args:
            provider (str): LLM 提供商，默认为 "volcengine"
        """
        self.provider = provider
        logger.info(f"LLM 分析器初始化成功，使用提供商: {provider}")
    
    def analyze_post_sentiment(self, post, comments):
        """分析帖子和评论的情感倾向
        
        Args:
            post (dict): 帖子信息
            comments (list): 评论列表
            
        Returns:
            dict: 分析结果
        """
        try:
            logger.info(f"正在分析帖子 {post['id']} 的情感倾向")
            
            # 准备提示词
            prompt = self._prepare_sentiment_prompt(post, comments)
            
            # 调用 LLM API
            response = query_llm(prompt, provider=self.provider)
            
            if not response:
                logger.error("LLM 分析失败，返回空结果")
                return {
                    "success": False,
                    "error": "LLM 分析失败，返回空结果"
                }
            
            logger.info("LLM 分析成功")
            return {
                "success": True,
                "analysis": response
            }
            
        except Exception as e:
            logger.error(f"LLM 分析失败: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _prepare_sentiment_prompt(self, post, comments):
        """准备情感分析提示词
        
        Args:
            post (dict): 帖子信息
            comments (list): 评论列表
            
        Returns:
            str: 提示词
        """
        # 构建评论文本
        comments_text = "\n\n".join([
            f"评论 {i+1} (得分: {comment['score']}):\n{comment['body']}"
            for i, comment in enumerate(comments[:10])  # 只分析前 10 条评论
        ])
        
        # 构建提示词
        prompt = f"""
你是一位足球评论分析专家，请分析以下来自 Reddit r/soccer 的帖子及其评论，总结舆论风向。

帖子标题: {post['title']}
帖子内容: {post['selftext'] if post['selftext'] else '(无正文内容)'}
帖子得分: {post['score']}
评论数量: {post['num_comments']}

热门评论:
{comments_text}

请提供以下分析:
1. 帖子主题概述（简要说明这个帖子讨论的是什么）
2. 主要观点（列出 3-5 个评论中出现的主要观点）
3. 情感倾向（积极、消极或中立，并解释原因）
4. 争议点（如果有的话，指出评论中的主要争议点）
5. 总体舆论风向总结（200字以内）

请用中文回答，确保分析客观、全面且有洞察力。
"""
        return prompt 