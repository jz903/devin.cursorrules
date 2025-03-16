#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchPage = fetchPage;
exports.parseHtml = parseHtml;
exports.processUrls = processUrls;
exports.validateUrl = validateUrl;
const playwright_1 = require("playwright");
const commander_1 = require("commander");
const node_html_parser_1 = require("node-html-parser");
const url_1 = require("url");
/**
 * 异步获取网页内容
 * @param url 要获取的URL
 * @param context 浏览器上下文
 * @returns 网页内容或null（如果出错）
 */
async function fetchPage(url, context) {
    const page = await context.newPage();
    try {
        console.error(`获取 ${url}`);
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        const content = await page.content();
        console.error(`成功获取 ${url}`);
        return content;
    }
    catch (e) {
        console.error(`获取 ${url} 时出错: ${e}`);
        return null;
    }
    finally {
        await page.close();
    }
}
/**
 * 解析HTML内容并提取文本，以markdown格式包含超链接
 * @param htmlContent HTML内容
 * @returns 提取的文本
 */
function parseHtml(htmlContent) {
    if (!htmlContent) {
        return "";
    }
    try {
        const document = (0, node_html_parser_1.parse)(htmlContent);
        const result = [];
        const seenTexts = new Set();
        /**
         * 检查元素是否应该被跳过
         */
        function shouldSkipElement(elem) {
            // 跳过script和style标签
            if (elem.tagName === 'script' || elem.tagName === 'style') {
                return true;
            }
            // 跳过空元素或只有空白的元素
            if (!elem.text.trim()) {
                return true;
            }
            return false;
        }
        /**
         * 递归处理元素及其子元素
         */
        function processElement(elem, depth = 0) {
            if (shouldSkipElement(elem)) {
                return;
            }
            // 处理文本内容
            if (elem.text) {
                const text = elem.text.trim();
                if (text && !seenTexts.has(text)) {
                    // 检查这是否是锚标签
                    if (elem.tagName === 'a') {
                        const href = elem.getAttribute('href');
                        if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
                            // 格式化为markdown链接
                            const linkText = `[${text}](${href})`;
                            result.push("  ".repeat(depth) + linkText);
                            seenTexts.add(text);
                        }
                    }
                    else {
                        result.push("  ".repeat(depth) + text);
                        seenTexts.add(text);
                    }
                }
            }
            // 处理子元素
            for (const child of elem.childNodes) {
                if (child.nodeType === 1) { // 元素节点
                    processElement(child, depth + 1);
                }
            }
        }
        // 从body标签开始处理
        const body = document.querySelector('body');
        if (body) {
            processElement(body);
        }
        else {
            // 回退到处理整个文档
            processElement(document);
        }
        // 过滤掉常见的不需要的模式
        const filteredResult = result.filter(line => {
            // 跳过可能是噪音的行
            return !['var ', 'function()', '.js', '.css', 'google-analytics', 'disqus', '{', '}']
                .some(pattern => line.toLowerCase().includes(pattern));
        });
        return filteredResult.join('\n');
    }
    catch (e) {
        console.error(`解析HTML时出错: ${e}`);
        return "";
    }
}
/**
 * 并发处理多个URL
 * @param urls 要处理的URL列表
 * @param maxConcurrent 最大并发数
 * @returns 处理结果列表
 */
async function processUrls(urls, maxConcurrent = 5) {
    const browser = await playwright_1.chromium.launch();
    try {
        // 创建浏览器上下文
        const nContexts = Math.min(urls.length, maxConcurrent);
        const contexts = [];
        for (let i = 0; i < nContexts; i++) {
            contexts.push(await browser.newContext());
        }
        // 为每个URL创建任务
        const tasks = urls.map((url, i) => {
            const context = contexts[i % contexts.length];
            return fetchPage(url, context);
        });
        // 收集结果
        const htmlContents = await Promise.all(tasks);
        // 并行解析HTML内容
        const results = htmlContents.map(content => parseHtml(content));
        return results;
    }
    finally {
        // 清理
        await browser.close();
    }
}
/**
 * 验证给定的字符串是否是有效的URL
 */
function validateUrl(url) {
    try {
        const result = new url_1.URL(url);
        return !!result.protocol && !!result.host;
    }
    catch {
        return false;
    }
}
/**
 * 主函数，处理命令行参数
 */
async function main() {
    const program = new commander_1.Command();
    program
        .description('获取并提取网页的文本内容')
        .arguments('<urls...>')
        .option('--max-concurrent <number>', '最大并发浏览器实例数（默认：5）', '5')
        .option('--debug', '启用调试日志记录')
        .action(async (urls, options) => {
        const maxConcurrent = parseInt(options.maxConcurrent);
        // 验证URL
        const validUrls = [];
        for (const url of urls) {
            if (validateUrl(url)) {
                validUrls.push(url);
            }
            else {
                console.error(`无效的URL: ${url}`);
            }
        }
        if (validUrls.length === 0) {
            console.error("未提供有效的URL");
            process.exit(1);
        }
        const startTime = Date.now();
        try {
            const results = await processUrls(validUrls, maxConcurrent);
            // 将结果打印到stdout
            for (let i = 0; i < validUrls.length; i++) {
                console.log(`\n=== 来自 ${validUrls[i]} 的内容 ===`);
                console.log(results[i]);
                console.log("=".repeat(80));
            }
            console.error(`总处理时间: ${(Date.now() - startTime) / 1000}s`);
        }
        catch (e) {
            console.error(`执行期间出错: ${e}`);
            process.exit(1);
        }
    });
    await program.parseAsync(process.argv);
}
// 如果直接运行此文件，则执行main函数
if (require.main === module) {
    main();
}
