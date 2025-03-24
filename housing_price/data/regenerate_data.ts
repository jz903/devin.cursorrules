#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// 主工具路径
const SCRAPER_TOOL_PATH = path.resolve(__dirname, '../../src/tools/housing_price_scraper.ts');
const SCREENSHOT_TOOL_PATH = path.resolve(__dirname, '../../src/tools/screenshot_utils.ts');

interface MonthData {
    folder: string;
    url: string | null;
}

// 从README文件中提取URL
async function extractUrlFromReadme(folderPath: string): Promise<string | null> {
    const readmePath = path.join(folderPath, 'README.md');

    try {
        if (fs.existsSync(readmePath)) {
            const content = fs.readFileSync(readmePath, 'utf8');
            const urlMatch = content.match(/原始数据链接[：:]\s*(https?:\/\/[^\s\n]+)/);
            if (urlMatch && urlMatch[1]) {
                return urlMatch[1];
            }
        }
        return null;
    } catch (error) {
        console.error(`读取 ${readmePath} 时出错:`, error);
        return null;
    }
}

// 获取所有月份文件夹
async function getAllMonthFolders(): Promise<MonthData[]> {
    const dataDir = __dirname;
    const allItems = fs.readdirSync(dataDir);

    // 筛选出格式为YYYYMM的文件夹
    const monthFolders = allItems.filter(item => {
        const fullPath = path.join(dataDir, item);
        return fs.statSync(fullPath).isDirectory() && /^\d{6}$/.test(item);
    });

    // 收集每个文件夹的URL
    const results: MonthData[] = [];
    for (const folder of monthFolders) {
        const folderPath = path.join(dataDir, folder);
        const url = await extractUrlFromReadme(folderPath);
        results.push({ folder, url });
    }

    return results;
}

// 为指定月份生成数据
async function generateDataForMonth(monthData: MonthData): Promise<void> {
    if (!monthData.url) {
        console.error(`未找到 ${monthData.folder} 的原始数据链接`);
        return;
    }

    const folderPath = path.join(__dirname, monthData.folder);
    const csvPath = path.join(folderPath, 'housing_price_index.csv');
    const screenshotPath = path.join(folderPath, 'screenshot.png');

    try {
        // 确保目录存在
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }

        // // 1. 生成截图
        // console.log(`正在为 ${monthData.folder} 生成截图...`);
        // await execAsync(`npx tsx ${SCREENSHOT_TOOL_PATH} "${monthData.url}" --output "${screenshotPath}"`);
        // console.log(`截图已保存到: ${screenshotPath}`);

        // 2. 生成CSV
        console.log(`正在为 ${monthData.folder} 生成CSV数据...`);
        await execAsync(`npx tsx ${SCRAPER_TOOL_PATH} "${monthData.url}" --output "${csvPath}"`);
        console.log(`CSV已保存到: ${csvPath}`);
    } catch (error) {
        console.error(`处理 ${monthData.folder} 时出错:`, error);
    }
}

// 主函数
async function main() {
    try {
        console.log('开始重新生成所有月份的房价数据...');

        // 获取所有月份
        const allMonths = await getAllMonthFolders();
        console.log(`找到 ${allMonths.length} 个月份文件夹`);

        // 遍历处理每个月份
        for (const monthData of allMonths) {
            console.log(`\n处理 ${monthData.folder}...`);
            await generateDataForMonth(monthData);
        }

        console.log('\n所有数据重新生成完成!');
    } catch (error) {
        console.error('执行过程中出错:', error);
        process.exit(1);
    }
}

// 执行主函数
main(); 