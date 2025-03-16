import { fetchPage, parseHtml, processUrls, validateUrl } from '../src/tools/web_scraper';
import { chromium, BrowserContext } from 'playwright';
import { parse } from 'node-html-parser';

// 模拟模块
jest.mock('playwright', () => ({
    chromium: {
        launch: jest.fn()
    }
}));

jest.mock('node-html-parser', () => ({
    parse: jest.fn()
}));

// 获取模拟的parse函数
const mockedParse = parse as jest.MockedFunction<typeof parse>;

describe('Web Scraper 测试', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // 重定向控制台输出，防止测试输出过多
        jest.spyOn(console, 'log').mockImplementation(() => { });
        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('fetchPage', () => {
        it('应该获取页面内容', async () => {
            // 模拟页面
            const mockContent = '<html><body><h1>Test Page</h1></body></html>';
            const mockGoto = jest.fn();
            const mockWaitForLoadState = jest.fn();
            const mockGetContent = jest.fn().mockResolvedValue(mockContent);
            const mockClose = jest.fn();
            const mockPage = {
                goto: mockGoto,
                waitForLoadState: mockWaitForLoadState,
                content: mockGetContent,
                close: mockClose
            };
            const mockNewPage = jest.fn().mockResolvedValue(mockPage);
            const mockContext = {
                newPage: mockNewPage
            } as unknown as BrowserContext;

            const result = await fetchPage('https://example.com', mockContext);

            expect(mockNewPage).toHaveBeenCalled();
            expect(mockGoto).toHaveBeenCalledWith('https://example.com');
            expect(mockWaitForLoadState).toHaveBeenCalledWith('networkidle');
            expect(mockGetContent).toHaveBeenCalled();
            expect(mockClose).toHaveBeenCalled();
            expect(result).toBe(mockContent);
        });

        it('应该在出错时返回null', async () => {
            // 模拟页面出错
            const mockGoto = jest.fn().mockRejectedValue(new Error('Failed to load'));
            const mockClose = jest.fn();
            const mockPage = {
                goto: mockGoto,
                close: mockClose
            };
            const mockNewPage = jest.fn().mockResolvedValue(mockPage);
            const mockContext = {
                newPage: mockNewPage
            } as unknown as BrowserContext;

            const result = await fetchPage('https://example.com', mockContext);

            expect(mockNewPage).toHaveBeenCalled();
            expect(mockGoto).toHaveBeenCalledWith('https://example.com');
            expect(mockClose).toHaveBeenCalled();
            expect(result).toBeNull();
        });
    });

    describe('parseHtml', () => {
        it('应该解析HTML内容', () => {
            // 模拟HTML解析
            const mockDocument = {
                querySelector: jest.fn().mockReturnValue({
                    tagName: 'body',
                    text: 'Test content',
                    childNodes: [],
                    getAttribute: jest.fn()
                }),
                text: 'Test content'
            };
            (parse as jest.Mock).mockReturnValue(mockDocument);

            const result = parseHtml('<html><body>Test content</body></html>');

            expect(parse).toHaveBeenCalledWith('<html><body>Test content</body></html>');
            expect(result).toBe('Test content');
        });

        it('应该处理null输入', () => {
            const result = parseHtml(null);
            expect(result).toBe('');
        });
    });

    describe('processUrls', () => {
        it('应该处理多个URL', async () => {
            // 模拟浏览器
            const mockClose = jest.fn();
            const mockNewContext = jest.fn().mockResolvedValue({});
            const mockBrowser = {
                newContext: mockNewContext,
                close: mockClose
            };
            (chromium.launch as jest.Mock).mockResolvedValue(mockBrowser);

            // 模拟fetchPage和parseHtml
            const mockFetchPage = jest.fn()
                .mockResolvedValueOnce('<html><body>Page 1</body></html>')
                .mockResolvedValueOnce('<html><body>Page 2</body></html>');
            const mockParseHtml = jest.fn()
                .mockReturnValueOnce('Parsed Page 1')
                .mockReturnValueOnce('Parsed Page 2');

            // 替换原始函数
            const originalFetchPage = global.fetchPage;
            const originalParseHtml = global.parseHtml;
            (global as any).fetchPage = mockFetchPage;
            (global as any).parseHtml = mockParseHtml;

            const urls = ['https://example.com/1', 'https://example.com/2'];
            const results = await processUrls(urls, 2);

            expect(chromium.launch).toHaveBeenCalled();
            expect(mockNewContext).toHaveBeenCalledTimes(2);
            expect(mockFetchPage).toHaveBeenCalledTimes(2);
            expect(mockParseHtml).toHaveBeenCalledTimes(2);
            expect(mockClose).toHaveBeenCalled();
            expect(results).toEqual(['Parsed Page 1', 'Parsed Page 2']);

            // 恢复原始函数
            (global as any).fetchPage = originalFetchPage;
            (global as any).parseHtml = originalParseHtml;
        });
    });

    describe('validateUrl', () => {
        it('应该验证有效的URL', () => {
            expect(validateUrl('https://example.com')).toBe(true);
            expect(validateUrl('http://example.com/path?query=value')).toBe(true);
        });

        it('应该拒绝无效的URL', () => {
            expect(validateUrl('not-a-url')).toBe(false);
            expect(validateUrl('')).toBe(false);
        });
    });
}); 