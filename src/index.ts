#!/usr/bin/env node

import { Command } from 'commander';
import * as llmApi from './tools/llm_api';
import * as screenshotUtils from './tools/screenshot_utils';
import * as searchEngine from './tools/search_engine';
import * as webScraper from './tools/web_scraper';

const program = new Command();

program
    .name('devin-tools')
    .description('TypeScript implementation of tools for Devin')
    .version('1.0.0');

program
    .command('llm')
    .description('使用提示查询LLM')
    .requiredOption('--prompt <string>', 'LLM的提示')
    .option('--provider <string>', 'API提供商', 'openai')
    .option('--model <string>', '要使用的模型（默认取决于提供商）')
    .option('--image <string>', '附加到提示的图像文件路径')
    .action(async (options: { prompt: string; provider: string; model?: string; image?: string }) => {
        try {
            const client = llmApi.createLlmClient(options.provider);
            const response = await llmApi.queryLlm(
                options.prompt,
                client,
                options.model || null,
                options.provider,
                options.image || null
            );

            if (response) {
                console.log(response);
            } else {
                console.error("查询LLM失败");
                process.exit(1);
            }
        } catch (e) {
            console.error(`错误: ${e}`);
            process.exit(1);
        }
    });

program
    .command('screenshot')
    .description('截取网页截图')
    .argument('<url>', '要截图的URL')
    .option('-o, --output <path>', '截图的输出路径')
    .option('-w, --width <number>', '视口宽度', '1280')
    .option('-H, --height <number>', '视口高度', '720')
    .action(async (url: string, options: { output?: string; width: string; height: string }) => {
        try {
            const width = parseInt(options.width);
            const height = parseInt(options.height);
            const outputPath = await screenshotUtils.takeScreenshot(url, options.output || null, width, height);
            console.log(`截图已保存到: ${outputPath}`);
        } catch (error) {
            console.error(`错误: ${error}`);
            process.exit(1);
        }
    });

program
    .command('search')
    .description('使用DuckDuckGo API搜索')
    .argument('<query>', '搜索查询')
    .option('--max-results <number>', '最大结果数（默认：10）', '10')
    .option('--max-retries <number>', '最大重试次数（默认：3）', '3')
    .action(async (query: string, options: { maxResults: string; maxRetries: string }) => {
        try {
            const maxResults = parseInt(options.maxResults);
            const maxRetries = parseInt(options.maxRetries);
            await searchEngine.search(query, maxResults, maxRetries);
        } catch (error) {
            console.error(`错误: ${error}`);
            process.exit(1);
        }
    });

program
    .command('scrape')
    .description('获取并提取网页的文本内容')
    .argument('<urls...>', 'URL列表')
    .option('--max-concurrent <number>', '最大并发浏览器实例数（默认：5）', '5')
    .option('--debug', '启用调试日志记录')
    .action(async (urls: string[], options: { maxConcurrent: string; debug?: boolean }) => {
        try {
            const maxConcurrent = parseInt(options.maxConcurrent);

            // 验证URL
            const validUrls: string[] = [];
            for (const url of urls) {
                if (webScraper.validateUrl(url)) {
                    validUrls.push(url);
                } else {
                    console.error(`无效的URL: ${url}`);
                }
            }

            if (validUrls.length === 0) {
                console.error("未提供有效的URL");
                process.exit(1);
            }

            const startTime = Date.now();
            const results = await webScraper.processUrls(validUrls, maxConcurrent);

            // 将结果打印到stdout
            for (let i = 0; i < validUrls.length; i++) {
                console.log(`\n=== 来自 ${validUrls[i]} 的内容 ===`);
                console.log(results[i]);
                console.log("=".repeat(80));
            }

            console.error(`总处理时间: ${(Date.now() - startTime) / 1000}s`);
        } catch (error) {
            console.error(`错误: ${error}`);
            process.exit(1);
        }
    });

program.parse(process.argv); 