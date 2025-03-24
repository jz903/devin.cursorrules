# 中国一线城市+香港二手住宅价格指数可视化

## 项目介绍

本项目展示了中国四个一线城市（北京、上海、广州、深圳）加香港在 2008 年 1 月到 2025 年 2 月的二手住宅价格指数变化趋势。以 2008 年 1 月为基期（100 点）的价格指数数据通过交互式图表直观展示，帮助用户了解这些城市房价的历史变化和趋势。

## 数据说明

数据基于国家统计局和中原地产的历史数据整理而成，并根据已知的房价趋势和政策影响进行了合理的模拟和补充。特别是，我们参考了国家统计局发布的"2025 年 1 月份 70 个大中城市商品住宅销售价格变动情况"的最新数据，确保数据的准确性和时效性。主要特点包括：

- **北京**：年均增长率约 7%，2017 年后波动，2022 年后小幅下降。根据国家统计局数据，2025 年 1 月二手住宅价格环比上涨 0.1%，同比下降 3.8%。
- **上海**：年均增长率约 6%，2016 年后趋于稳定，2022 年后小幅下降。根据国家统计局数据，2025 年 1 月二手住宅价格环比上涨 0.4%，同比下降 2.3%。
- **广州**：年均增长率约 8%，相对平稳，2022 年后下降明显。根据国家统计局数据，2025 年 1 月二手住宅价格环比下降 0.2%，同比下降 10.0%。
- **深圳**：波动较大，增长率高于北京，2015-2018 年爆发式增长，2022 年后下降。根据国家统计局数据，2025 年 1 月二手住宅价格环比上涨 0.4%，同比下降 6.1%。
- **香港**：大幅波动，2008-2009 年金融危机影响明显，2018 年后持续下降，2025 年初继续保持下降趋势。

## 使用方法

1. 直接在浏览器中打开`index.html`文件即可查看可视化图表
2. 图表支持以下交互功能：
   - 鼠标悬停查看具体数据点
   - 图例点击控制显示/隐藏城市数据
   - 区域缩放查看特定时间段
   - 保存图表为图片
   - 查看原始数据

## 技术说明

本项目使用以下技术：

- **HTML/CSS**：基础页面结构和样式
- **JavaScript**：数据处理和交互逻辑
- **ECharts**：强大的图表可视化库，用于绘制交互式折线图

## 文件结构

- `index.html`：主页面，包含图表和基本说明
- `data.js`：包含所有城市的房价指数数据
- `README.md`：项目说明文档

## 注意事项

- 本项目中的数据部分基于真实历史数据和国家统计局最新发布的数据，部分为合理模拟，仅供参考
- 图表最佳在现代浏览器（Chrome、Firefox、Edge 等）中查看
- 页面自适应不同屏幕尺寸，支持移动设备查看

## 未来改进

- 添加更多城市数据进行对比
- 增加房价与其他经济指标的关联分析
- 提供更多数据筛选和分析工具
- 增加预测模型展示未来趋势

# 住房价格表格抓取工具

这是一个用于从网页中抓取表格数据的命令行工具，特别适用于抓取住房价格相关的表格数据。

## 功能特点

- 支持从多个 URL 并发抓取表格数据
- 自动将表格数据转换为 CSV 格式
- 可选择将数据保存到文件或直接输出到控制台
- 支持自定义输出目录
- 提供详细的调试信息

## 安装

```bash
# 克隆仓库
git clone <repository-url>
cd housing_price

# 安装依赖
pnpm install

# 安装 Playwright 浏览器
npx playwright install chromium
```

## 使用方法

### 基本用法

```bash
# 从单个URL抓取表格数据
npx ts-node scrape_table.ts "https://example.com/housing-price-table"

# 从多个URL抓取表格数据
npx ts-node scrape_table.ts "https://example.com/table1" "https://example.com/table2"
```

### 高级选项

```bash
# 设置最大并发数
npx ts-node scrape_table.ts --max-concurrent 3 "https://example.com/table1" "https://example.com/table2"

# 将表格数据保存到文件
npx ts-node scrape_table.ts --save-to-file "https://example.com/table"

# 自定义输出目录
npx ts-node scrape_table.ts --save-to-file --output "./data" "https://example.com/table"

# 启用调试模式
npx ts-node scrape_table.ts --debug "https://example.com/table"
```

### 命令行选项

- `--max-concurrent <number>`: 设置最大并发浏览器实例数（默认：5）
- `--output <directory>`: 设置输出目录（默认：./output）
- `--save-to-file`: 将表格数据保存到文件
- `--debug`: 启用调试日志记录

## 示例

### 抓取国家统计局住房价格数据

```bash
npx ts-node scrape_table.ts --save-to-file --output "./housing-data" "https://www.stats.gov.cn/sj/zxfb/202311/t20231115_1946624.html"
```

## API 使用

该工具也可以作为模块导入到其他项目中使用：

```typescript
import { processUrls } from "./scrape_table";

async function main() {
  const urls = ["https://example.com/table1", "https://example.com/table2"];
  const results = await processUrls(urls, 3); // 3是最大并发数

  // 处理结果
  console.log(results);
}

main();
```

## 许可证

MIT
