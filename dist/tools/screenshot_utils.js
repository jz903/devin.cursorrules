#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.takeScreenshot = takeScreenshot;
exports.takeScreenshotSync = takeScreenshotSync;
const playwright_1 = require("playwright");
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const commander_1 = require("commander");
/**
 * 使用Playwright截取网页截图
 *
 * @param url 要截图的URL
 * @param outputPath 保存截图的路径。如果为null，则保存到临时文件
 * @param width 视口宽度，默认为1280
 * @param height 视口高度，默认为720
 * @returns 保存的截图路径
 */
async function takeScreenshot(url, outputPath = null, width = 1280, height = 720) {
    if (outputPath === null) {
        // 创建带.png扩展名的临时文件
        const tempDir = os.tmpdir();
        outputPath = path.join(tempDir, `screenshot-${Date.now()}.png`);
    }
    const browser = await playwright_1.chromium.launch({ headless: true });
    const page = await browser.newPage({
        viewport: { width, height }
    });
    try {
        await page.goto(url, { waitUntil: 'networkidle' });
        await page.screenshot({ path: outputPath, fullPage: true });
    }
    finally {
        await browser.close();
    }
    return outputPath;
}
/**
 * takeScreenshot的同步包装器
 */
function takeScreenshotSync(url, outputPath = null, width = 1280, height = 720) {
    return takeScreenshot(url, outputPath, width, height);
}
/**
 * 主函数，处理命令行参数
 */
async function main() {
    const program = new commander_1.Command();
    program
        .description('截取网页截图')
        .argument('<url>', '要截图的URL')
        .option('-o, --output <path>', '截图的输出路径')
        .option('-w, --width <number>', '视口宽度', '1280')
        .option('-H, --height <number>', '视口高度', '720')
        .action(async (url, options) => {
        try {
            const width = parseInt(options.width);
            const height = parseInt(options.height);
            const outputPath = await takeScreenshot(url, options.output || null, width, height);
            console.log(`截图已保存到: ${outputPath}`);
        }
        catch (error) {
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
