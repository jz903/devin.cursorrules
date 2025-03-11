# Reddit 足球热门话题分析

这是一个 Flask 应用程序，用于定期获取 Reddit r/soccer 板块的热门话题，并通过 LLM 分析评论，总结舆论风向。

## 功能特点

- 自动获取 Reddit r/soccer 板块的热门话题
- 获取每个话题的热门评论
- 使用 LLM 分析评论，总结舆论风向
- 定期更新数据
- 美观的 Web 界面展示结果

## 安装

1. 克隆仓库：

```bash
git clone https://github.com/yourusername/reddit-soccer-trends.git
cd reddit-soccer-trends
```

2. 创建并激活虚拟环境：

```bash
python -m venv venv
source venv/bin/activate  # 在 Windows 上使用 venv\Scripts\activate
```

3. 安装依赖：

```bash
pip install -r requirements.txt
```

4. 配置环境变量：

复制 `.env.example` 文件为 `.env`，并填写相应的配置：

```bash
cp .env.example .env
```

## 配置

在 `.env` 文件中，你需要配置以下内容：

- Reddit API 凭据（需要在 [Reddit 开发者页面](https://www.reddit.com/prefs/apps) 创建应用）
- LLM 提供商配置
- 应用程序配置
- 定时任务配置

## 运行

```bash
python run.py
```

应用将在 http://localhost:5000 上运行。

## 使用方法

1. 访问首页查看最新的热门话题
2. 点击"查看详情"查看话题详情、热门评论和舆论分析
3. 点击导航栏中的"刷新数据"手动更新数据

## 定时任务

应用程序会根据配置的时间间隔自动获取新数据。默认为每 60 分钟更新一次。

## 技术栈

- Python 3.8+
- Flask
- PRAW (Python Reddit API Wrapper)
- OpenAI/Anthropic API
- Bootstrap 5
- APScheduler

## 许可证

MIT
