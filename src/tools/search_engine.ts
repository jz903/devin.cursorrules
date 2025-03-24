#!/usr/bin/env node

import { Command } from 'commander';
import * as DDG from 'duck-duck-scrape';

// 设置环境变量代理
process.env.proxy = 'http://127.0.0.1:7890';

interface SearchResult {
    href: string;
    title: string;
    body: string;
}

/**
 * 随机延迟函数，生成一个在指定范围内的随机延迟（毫秒）
 * 
 * @param min 最小延迟（毫秒）
 * @param max 最大延迟（毫秒）
 * @returns 随机延迟时间（毫秒）
 */
function randomDelay(min: number = 1000, max: number = 3000): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 使用DuckDuckGo搜索并返回带有URL和文本片段的结果
 * 
 * @param query 搜索查询
 * @param maxResults 返回的最大结果数
 * @param maxRetries 最大重试次数
 * @param site 限制搜索的网站域名
 * @returns 搜索结果数组
 */
export async function searchWithRetry(
    query: string,
    maxResults: number = 10,
    maxRetries: number = 3,
    site?: string
): Promise<SearchResult[]> {
    // 我们不再在查询中添加site:操作符，而是在后续过滤结果
    const searchQuery = query;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            console.error(`调试: 搜索查询: ${searchQuery} (尝试 ${attempt + 1}/${maxRetries})`);

            // 在每次尝试之前添加随机延迟
            if (attempt > 0) {
                const delay = randomDelay(3000, 8000);
                console.error(`调试: 随机延迟 ${delay / 1000} 秒...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }

            // 配置needle选项
            const needleOptions = {
                open_timeout: 15000,         // 连接超时15秒
                response_timeout: 45000,     // 响应超时45秒
                follow_max: 5,               // 最多跟随5次重定向
                compressed: true,            // 支持压缩
                user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', // 模拟Chrome浏览器
                follow_set_cookies: true,    // 跟随设置的cookies
                parse_response: 'json',      // 自动解析JSON响应
                proxy: process.env.proxy     // 使用环境变量中的代理
            };

            const searchResults = await DDG.search(searchQuery, {
                safeSearch: DDG.SafeSearchType.MODERATE,
                time: DDG.SearchTimeType.YEAR,
                region: 'wt-wt'  // 全球区域
            }, needleOptions);

            if (!searchResults || searchResults.noResults || !searchResults.results || searchResults.results.length === 0) {
                console.error("调试: 未找到结果");
                return [];
            }

            // 将结果转换为我们的SearchResult格式
            let formattedResults: SearchResult[] = searchResults.results.map((r) => ({
                href: r.url || '',
                title: r.title || '',
                body: r.description || ''
            }));

            // 如果指定了站点，则过滤结果
            if (site) {
                const siteLowerCase = site.toLowerCase();
                formattedResults = formattedResults.filter(result =>
                    result.href.toLowerCase().includes(siteLowerCase)
                );
                console.error(`调试: 过滤后剩余 ${formattedResults.length} 个结果（来自 ${siteLowerCase}）`);
            }

            // 将搜索结果限制在指定数量
            formattedResults = formattedResults.slice(0, maxResults);

            console.error(`调试: 最终返回 ${formattedResults.length} 个结果`);
            return formattedResults;

        } catch (e) {
            console.error(`错误: 尝试 ${attempt + 1}/${maxRetries} 失败: ${e}`);
            if (attempt < maxRetries - 1) {  // 如果不是最后一次尝试
                // 使用指数退避增加等待时间，出错后等待更长时间
                const waitTime = Math.pow(2, attempt + 2) * 1000 + randomDelay(500, 2000);
                console.error(`调试: 等待${waitTime / 1000}秒后重试...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            } else {
                console.error(`错误: 所有 ${maxRetries} 次尝试都失败`);
                throw e;
            }
        }
    }

    return [];  // 如果所有尝试都失败，返回空数组
}

/**
 * 格式化并打印搜索结果
 */
export function formatResults(results: SearchResult[]): void {
    for (let i = 0; i < results.length; i++) {
        const r = results[i];
        console.log(`\n=== 结果 ${i + 1} ===`);
        console.log(`URL: ${r.href || 'N/A'}`);
        console.log(`标题: ${r.title || 'N/A'}`);
        console.log(`摘要: ${r.body || 'N/A'}`);
    }
}

/**
 * 主搜索函数，处理带有重试机制的搜索
 * 
 * @param query 搜索查询
 * @param maxResults 返回的最大结果数
 * @param maxRetries 最大重试次数
 * @param site 限制搜索的网站域名
 */
export async function search(
    query: string,
    maxResults: number = 10,
    maxRetries: number = 3,
    site?: string
): Promise<void> {
    try {
        console.log(`正在搜索: "${query}"${site ? ` (仅显示来自 ${site} 的结果)` : ''}...`);

        const results = await searchWithRetry(query, maxResults, maxRetries, site);
        if (results.length > 0) {
            formatResults(results);
        } else {
            console.log("未找到任何结果。");
        }
    } catch (e) {
        console.error(`错误: 搜索失败: ${e}`);
        process.exit(1);
    }
}

/**
 * 主函数，处理命令行参数
 */
async function main() {
    const program = new Command();

    program
        .description('使用DuckDuckGo API搜索')
        .argument('<query>', '搜索查询')
        .option('--max-results <number>', '最大结果数（默认：10）', '10')
        .option('--max-retries <number>', '最大重试次数（默认：3）', '3')
        .option('--site <domain>', '限制搜索的网站域名，例如：www.stats.gov.cn')
        .action(async (query: string, options: { maxResults: string; maxRetries: string; site?: string }) => {
            const maxResults = parseInt(options.maxResults);
            const maxRetries = parseInt(options.maxRetries);
            await search(query, maxResults, maxRetries, options.site);
        });

    await program.parseAsync(process.argv);
}

// 如果直接运行此文件，则执行main函数
if (require.main === module) {
    main();
} 