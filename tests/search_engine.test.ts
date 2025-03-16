import { searchWithRetry, formatResults, search } from '../src/tools/search_engine';

// 模拟duckduckgo-search模块
jest.mock('duckduckgo-search', () => ({
    duckDuckGoSearch: jest.fn()
}));

// 导入模拟后的模块
import { duckDuckGoSearch } from 'duckduckgo-search';

describe('Search Engine 测试', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // 重定向控制台输出，防止测试输出过多
        jest.spyOn(console, 'log').mockImplementation(() => { });
        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('searchWithRetry', () => {
        it('应该返回搜索结果', async () => {
            const mockResults = [
                { url: 'https://example.com/1', title: 'Example 1', description: 'Description 1' },
                { url: 'https://example.com/2', title: 'Example 2', description: 'Description 2' }
            ];
            (duckDuckGoSearch as jest.Mock).mockResolvedValue(mockResults);

            const results = await searchWithRetry('test query');

            expect(duckDuckGoSearch).toHaveBeenCalledWith('test query', {
                safeSearch: 'moderate',
                time: 'y',
                maxResults: 10
            });
            expect(results).toHaveLength(2);
            expect(results[0]).toEqual({
                href: 'https://example.com/1',
                title: 'Example 1',
                body: 'Description 1'
            });
        });

        it('应该在没有结果时返回空数组', async () => {
            (duckDuckGoSearch as jest.Mock).mockResolvedValue([]);

            const results = await searchWithRetry('test query');

            expect(results).toEqual([]);
        });

        it('应该在出错时重试', async () => {
            // 第一次调用失败，第二次成功
            (duckDuckGoSearch as jest.Mock)
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce([
                    { url: 'https://example.com', title: 'Example', description: 'Description' }
                ]);

            // 模拟setTimeout
            jest.useFakeTimers();
            const promise = searchWithRetry('test query');
            jest.runAllTimers();
            const results = await promise;

            expect(duckDuckGoSearch).toHaveBeenCalledTimes(2);
            expect(results).toHaveLength(1);
            jest.useRealTimers();
        });

        it('应该在所有重试都失败后抛出错误', async () => {
            const error = new Error('Network error');
            (duckDuckGoSearch as jest.Mock).mockRejectedValue(error);

            // 模拟setTimeout
            jest.useFakeTimers();
            const promise = searchWithRetry('test query', 10, 2);

            // 运行所有定时器
            jest.runAllTimers();

            await expect(promise).rejects.toThrow('Network error');
            expect(duckDuckGoSearch).toHaveBeenCalledTimes(2);
            jest.useRealTimers();
        });
    });

    describe('formatResults', () => {
        it('应该格式化搜索结果', () => {
            const results = [
                { href: 'https://example.com/1', title: 'Example 1', body: 'Description 1' },
                { href: 'https://example.com/2', title: 'Example 2', body: 'Description 2' }
            ];

            formatResults(results);

            expect(console.log).toHaveBeenCalledTimes(6); // 每个结果3行输出
        });
    });

    describe('search', () => {
        it('应该调用searchWithRetry和formatResults', async () => {
            const mockResults = [
                { href: 'https://example.com', title: 'Example', body: 'Description' }
            ];

            // 模拟searchWithRetry
            const originalSearchWithRetry = searchWithRetry;
            jest.spyOn({ searchWithRetry }, 'searchWithRetry').mockResolvedValue(mockResults);

            // 模拟formatResults
            const originalFormatResults = formatResults;
            jest.spyOn({ formatResults }, 'formatResults').mockImplementation(() => { });

            await search('test query');

            expect(jest.spyOn({ searchWithRetry }, 'searchWithRetry')).toHaveBeenCalledWith('test query', 10, 3);
            expect(jest.spyOn({ formatResults }, 'formatResults')).toHaveBeenCalledWith(mockResults);
        });

        it('应该在出错时退出', async () => {
            const error = new Error('Search failed');
            jest.spyOn({ searchWithRetry }, 'searchWithRetry').mockRejectedValue(error);

            const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
                throw new Error('process.exit called');
            });

            await expect(search('test query')).rejects.toThrow('process.exit called');
            expect(mockExit).toHaveBeenCalledWith(1);
        });
    });
}); 