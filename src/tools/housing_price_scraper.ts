#!/usr/bin/env node

import { chromium } from 'playwright';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 表格数据接口
 */
export interface TableData {
    headers: string[];
    rows: string[][];
}

/**
 * 抓取住房价格表格数据
 * @param url 要抓取的URL
 * @returns 表格数据数组，每个元素代表一个表格
 */
export async function scrapeHousingPriceTables(url: string): Promise<TableData[]> {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const tables: TableData[] = [];

    try {
        console.error(`正在访问 ${url}`);
        await page.goto(url, { timeout: 60000 });
        await page.waitForLoadState('domcontentloaded');

        // 获取页面标题
        const title = await page.title();
        console.error(`页面标题: ${title}`);

        // 获取表格数据
        const tableElements = await page.$$('table');
        console.error(`找到 ${tableElements.length} 个表格`);

        for (let i = 0; i < tableElements.length; i++) {
            console.error(`处理表格 ${i + 1}`);

            // 获取表头
            const headers = await tableElements[i].$$eval('tr:first-child td, tr:first-child th', cells =>
                cells.map(cell => cell.textContent?.trim() || '')
            );

            // 获取表格行
            const rows = await tableElements[i].$$eval('tr:not(:first-child)', rows =>
                rows.map(row =>
                    Array.from(row.querySelectorAll('td')).map(cell => cell.textContent?.trim() || '')
                )
            );

            tables.push({ headers, rows });
        }

        return tables;
    } catch (error) {
        console.error('抓取过程中出错:', error);
        return [];
    } finally {
        await browser.close();
    }
}

/**
 * 将表格数据转换为CSV格式
 * @param table 表格数据
 * @returns CSV格式的字符串
 */
export function convertTableToCsv(table: TableData): string {
    const lines = [table.headers.join(',')];

    for (const row of table.rows) {
        lines.push(row.join(','));
    }

    return lines.join('\n');
}

/**
 * 合并新建商品住宅和二手住宅数据
 * @param tables 表格数据数组
 * @returns 合并后的CSV数据
 */
export function mergeHousingPriceData(tables: TableData[]): string {
    if (tables.length < 2) {
        throw new Error('需要至少两个表格：新建商品住宅和二手住宅');
    }

    // 假设第一个表格是新建商品住宅，第二个表格是二手住宅
    const newHousingTable = tables[0];
    const secondHandHousingTable = tables[1];

    // 第 2个【城市】位于 header 第几个
    const cityIndex = newHousingTable.headers.indexOf('城市', 1);
    // 创建合并后的表头
    const headers = ['城市', '新建商品住宅销售价格环比指数', '新建商品住宅销售价格同比指数',
        '二手住宅销售价格环比指数', '二手住宅销售价格同比指数'];

    // 创建城市到数据的映射
    const cityDataMap = new Map<string, string[]>();

    // 处理新建商品住宅数据
    for (const row of newHousingTable.rows.slice(1)) {
        const subRow1 = row.slice(0, 3);
        const subRow2 = row.slice(cityIndex, cityIndex + 3);

        [subRow1, subRow2].forEach(subRow => {
            // 去除空格
            const city = subRow[0].replace(/\s+/g, '');
            const monthOnMonthIndex = subRow[1];
            const yearOnYearIndex = subRow[2];

            cityDataMap.set(city, [monthOnMonthIndex, yearOnYearIndex]);
        });
    }

    // 处理二手住宅数据并合并
    const mergedRows: string[][] = [];

    for (const row of secondHandHousingTable.rows.slice(1)) {
        const subRow1 = row.slice(0, 3);
        const subRow2 = row.slice(cityIndex, cityIndex + 3);

        [subRow1, subRow2].forEach(subRow => {
            // 去除空格
            const city = subRow[0].replace(/\s+/g, '');
            const monthOnMonthIndex = subRow[1];
            const yearOnYearIndex = subRow[2];

            const newHousingData = cityDataMap.get(city) || ['', ''];
            mergedRows.push([
                city,
                newHousingData[0],
                newHousingData[1],
                monthOnMonthIndex,
                yearOnYearIndex
            ]);
        });
    }

    // 转换为CSV
    const lines = [headers.join(',')];
    for (const row of mergedRows) {
        lines.push(row.join(','));
    }

    return lines.join('\n');
}

/**
 * 保存数据到CSV文件
 * @param data CSV格式的数据
 * @param outputPath 输出文件路径
 */
export function saveToFile(data: string, outputPath: string): void {
    // 确保目录存在
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, data, 'utf8');
    console.error(`数据已保存到 ${outputPath}`);
}

/**
 * 主函数，处理命令行参数
 */
async function main() {
    const program = new Command();

    program
        .description('抓取住房价格表格数据并转换为CSV格式')
        .arguments('<url>')
        .option('-o, --output <path>', '输出文件路径', '@housing_price_index.csv')
        .action(async (url: string, options: { output: string }) => {
            try {
                // 抓取表格数据
                const tables = await scrapeHousingPriceTables(url);

                if (tables.length < 2) {
                    console.error('未找到足够的表格数据');
                    process.exit(1);
                }

                // 合并数据
                const mergedData = mergeHousingPriceData(tables);

                // 输出结果
                if (options.output.startsWith('@')) {
                    // 直接输出到控制台，以@开头的文件名表示输出到控制台
                    console.log(mergedData);
                } else {
                    // 保存到文件
                    saveToFile(mergedData, options.output);
                }

                console.error('处理完成');
            } catch (error) {
                console.error('执行过程中出错:', error);
                process.exit(1);
            }
        });

    await program.parseAsync(process.argv);
}

// 如果直接运行此文件，则执行main函数
if (require.main === module) {
    main();
}
