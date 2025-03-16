#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchWithRetry = searchWithRetry;
exports.formatResults = formatResults;
exports.search = search;
const commander_1 = require("commander");
const duckduckgo_search_1 = require("duckduckgo-search");
/**
 * 使用DuckDuckGo搜索并返回带有URL和文本片段的结果
 *
 * @param query 搜索查询
 * @param maxResults 返回的最大结果数
 * @param maxRetries 最大重试次数
 * @returns 搜索结果数组
 */
async function searchWithRetry(query, maxResults = 10, maxRetries = 3) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            console.error(`调试: 搜索查询: ${query} (尝试 ${attempt + 1}/${maxRetries})`);
            // 使用duckduckgo-search库进行搜索
            const results = await (0, duckduckgo_search_1.duckDuckGoSearch)(query, {
                safeSearch: 'moderate',
                time: 'y',
                maxResults: maxResults
            });
            if (!results || results.length === 0) {
                console.error("调试: 未找到结果");
                return [];
            }
            // 将结果转换为我们的SearchResult格式
            const formattedResults = results.map((r) => ({
                href: r.url,
                title: r.title,
                body: r.description
            }));
            console.error(`调试: 找到 ${formattedResults.length} 个结果`);
            return formattedResults;
        }
        catch (e) {
            console.error(`错误: 尝试 ${attempt + 1}/${maxRetries} 失败: ${e}`);
            if (attempt < maxRetries - 1) { // 如果不是最后一次尝试
                console.error(`调试: 等待1秒后重试...`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒后重试
            }
            else {
                console.error(`错误: 所有 ${maxRetries} 次尝试都失败`);
                throw e;
            }
        }
    }
    return []; // 如果所有尝试都失败，返回空数组
}
/**
 * 格式化并打印搜索结果
 */
function formatResults(results) {
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
 */
async function search(query, maxResults = 10, maxRetries = 3) {
    try {
        const results = await searchWithRetry(query, maxResults, maxRetries);
        if (results.length > 0) {
            formatResults(results);
        }
    }
    catch (e) {
        console.error(`错误: 搜索失败: ${e}`);
        process.exit(1);
    }
}
/**
 * 主函数，处理命令行参数
 */
async function main() {
    const program = new commander_1.Command();
    program
        .description('使用DuckDuckGo API搜索')
        .argument('<query>', '搜索查询')
        .option('--max-results <number>', '最大结果数（默认：10）', '10')
        .option('--max-retries <number>', '最大重试次数（默认：3）', '3')
        .action(async (query, options) => {
        const maxResults = parseInt(options.maxResults);
        const maxRetries = parseInt(options.maxRetries);
        await search(query, maxResults, maxRetries);
    });
    await program.parseAsync(process.argv);
}
// 如果直接运行此文件，则执行main函数
if (require.main === module) {
    main();
}
