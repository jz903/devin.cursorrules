#!/usr/bin/env node

import { chromium } from 'playwright';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Command } from 'commander';

/**
 * 使用Playwright截取网页截图
 * 
 * @param url 要截图的URL
 * @param outputPath 保存截图的路径。如果为null，则保存到临时文件
 * @param width 视口宽度，默认为1280
 * @param height 视口高度，默认为720
 * @returns 保存的截图路径
 */
export async function takeScreenshot(
    url: string,
    outputPath: string | null = null,
    width: number = 1280,
    height: number = 720
): Promise<string> {
    if (outputPath === null) {
        // 创建带.png扩展名的临时文件
        const tempDir = os.tmpdir();
        outputPath = path.join(tempDir, `screenshot-${Date.now()}.png`);
    }

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
        viewport: { width, height }
    });

    try {
        await page.goto(url, { waitUntil: 'networkidle' });
        await page.screenshot({ path: outputPath, fullPage: true });
    } finally {
        await browser.close();
    }

    return outputPath;
}

/**
 * takeScreenshot的同步包装器
 */
export function takeScreenshotSync(
    url: string,
    outputPath: string | null = null,
    width: number = 1280,
    height: number = 720
): Promise<string> {
    return takeScreenshot(url, outputPath, width, height);
}

/**
 * 主函数，处理命令行参数
 */
async function main() {
    const program = new Command();

    program
        .description('截取网页截图')
        .argument('<url>', '要截图的URL')
        .option('-o, --output <path>', '截图的输出路径')
        .option('-w, --width <number>', '视口宽度', '1280')
        .option('-H, --height <number>', '视口高度', '720')
        .action(async (url: string, options: { output?: string; width: string; height: string }) => {
            try {
                const width = parseInt(options.width);
                const height = parseInt(options.height);
                const outputPath = await takeScreenshot(url, options.output || null, width, height);
                console.log(`截图已保存到: ${outputPath}`);
            } catch (error) {
                console.error(`错误: ${error}`);
                process.exit(1);
            }
        });

    await program.parseAsync(process.argv);
}

// 如果直接运行此文件，则执行main函数
if (require.main === module) {
    main();
} 