import { takeScreenshot, takeScreenshotSync } from '../src/tools/screenshot_utils';
import { chromium } from 'playwright';
import * as os from 'os';
import * as path from 'path';

jest.mock('playwright', () => ({
    chromium: {
        launch: jest.fn()
    }
}));

jest.mock('os', () => ({
    tmpdir: jest.fn()
}));

jest.mock('path', () => ({
    join: jest.fn()
}));

describe('Screenshot Utils 测试', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('takeScreenshot', () => {
        it('应该使用提供的输出路径', async () => {
            // 模拟浏览器和页面
            const mockScreenshot = jest.fn();
            const mockClose = jest.fn();
            const mockGoto = jest.fn();
            const mockWaitForLoadState = jest.fn();
            const mockPage = {
                goto: mockGoto,
                waitForLoadState: mockWaitForLoadState,
                screenshot: mockScreenshot,
                close: mockClose
            };
            const mockNewPage = jest.fn().mockResolvedValue(mockPage);
            const mockBrowser = {
                newPage: mockNewPage,
                close: jest.fn()
            };
            (chromium.launch as jest.Mock).mockResolvedValue(mockBrowser);

            const outputPath = '/path/to/screenshot.png';
            const result = await takeScreenshot('https://example.com', outputPath);

            expect(chromium.launch).toHaveBeenCalledWith({ headless: true });
            expect(mockNewPage).toHaveBeenCalledWith({ viewport: { width: 1280, height: 720 } });
            expect(mockGoto).toHaveBeenCalledWith('https://example.com', { waitUntil: 'networkidle' });
            expect(mockScreenshot).toHaveBeenCalledWith({ path: outputPath, fullPage: true });
            expect(mockBrowser.close).toHaveBeenCalled();
            expect(result).toBe(outputPath);
        });

        it('应该在未提供输出路径时创建临时文件', async () => {
            // 模拟浏览器和页面
            const mockScreenshot = jest.fn();
            const mockClose = jest.fn();
            const mockGoto = jest.fn();
            const mockWaitForLoadState = jest.fn();
            const mockPage = {
                goto: mockGoto,
                waitForLoadState: mockWaitForLoadState,
                screenshot: mockScreenshot,
                close: mockClose
            };
            const mockNewPage = jest.fn().mockResolvedValue(mockPage);
            const mockBrowser = {
                newPage: mockNewPage,
                close: jest.fn()
            };
            (chromium.launch as jest.Mock).mockResolvedValue(mockBrowser);

            // 模拟临时目录和路径
            const tempDir = '/tmp';
            const tempPath = '/tmp/screenshot-123456.png';
            (os.tmpdir as jest.Mock).mockReturnValue(tempDir);
            (path.join as jest.Mock).mockReturnValue(tempPath);

            // 模拟Date.now()
            const realDateNow = Date.now;
            global.Date.now = jest.fn(() => 123456);

            const result = await takeScreenshot('https://example.com', null);

            expect(os.tmpdir).toHaveBeenCalled();
            expect(path.join).toHaveBeenCalledWith(tempDir, 'screenshot-123456.png');
            expect(mockScreenshot).toHaveBeenCalledWith({ path: tempPath, fullPage: true });
            expect(result).toBe(tempPath);

            // 恢复Date.now
            global.Date.now = realDateNow;
        });
    });

    describe('takeScreenshotSync', () => {
        it('应该调用takeScreenshot', async () => {
            // 模拟浏览器和页面
            const mockScreenshot = jest.fn();
            const mockClose = jest.fn();
            const mockGoto = jest.fn();
            const mockWaitForLoadState = jest.fn();
            const mockPage = {
                goto: mockGoto,
                waitForLoadState: mockWaitForLoadState,
                screenshot: mockScreenshot,
                close: mockClose
            };
            const mockNewPage = jest.fn().mockResolvedValue(mockPage);
            const mockBrowser = {
                newPage: mockNewPage,
                close: jest.fn()
            };
            (chromium.launch as jest.Mock).mockResolvedValue(mockBrowser);

            const outputPath = '/path/to/screenshot.png';
            const promise = takeScreenshotSync('https://example.com', outputPath);

            expect(promise).toBeInstanceOf(Promise);
            const result = await promise;
            expect(result).toBe(outputPath);
        });
    });
}); 