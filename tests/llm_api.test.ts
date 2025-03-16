import { loadEnvironment, createLlmClient, queryLlm, encodeImageFile } from '../src/tools/llm_api';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

jest.mock('fs');
jest.mock('dotenv');
jest.mock('openai');
jest.mock('@anthropic-ai/sdk');
jest.mock('@google/generative-ai');

describe('LLM API 测试', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('loadEnvironment', () => {
        it('应该按照优先级顺序加载环境变量', () => {
            // 模拟文件存在
            (fs.existsSync as jest.Mock).mockImplementation((path) => {
                return path.includes('.env.local') || path.includes('.env');
            });

            // 模拟文件内容
            (fs.readFileSync as jest.Mock).mockImplementation((path) => {
                if (path.includes('.env.local')) {
                    return 'TEST_VAR=local_value';
                } else if (path.includes('.env')) {
                    return 'TEST_VAR=default_value\nOTHER_VAR=other_value';
                }
                return '';
            });

            loadEnvironment();

            // 验证按照正确的顺序加载了环境变量
            expect(dotenv.config).toHaveBeenCalledTimes(2);
            const calls = (dotenv.config as jest.Mock).mock.calls;
            expect(calls[0][0].path).toContain('.env.local');
            expect(calls[1][0].path).toContain('.env');
        });
    });

    describe('encodeImageFile', () => {
        it('应该正确编码图像文件', () => {
            const testBuffer = Buffer.from('test image data');
            (fs.readFileSync as jest.Mock).mockReturnValue(testBuffer);

            const [encodedString, mimeType] = encodeImageFile('test.png');

            expect(fs.readFileSync).toHaveBeenCalledWith('test.png');
            expect(encodedString).toBe(testBuffer.toString('base64'));
            expect(mimeType).toBe('image/png');
        });
    });

    describe('createLlmClient', () => {
        beforeEach(() => {
            process.env.OPENAI_API_KEY = 'test-openai-key';
            process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
            process.env.GOOGLE_API_KEY = 'test-google-key';
        });

        afterEach(() => {
            delete process.env.OPENAI_API_KEY;
            delete process.env.ANTHROPIC_API_KEY;
            delete process.env.GOOGLE_API_KEY;
        });

        it('应该创建OpenAI客户端', () => {
            const client = createLlmClient('openai');
            expect(client).toBeDefined();
        });

        it('应该创建Anthropic客户端', () => {
            const client = createLlmClient('anthropic');
            expect(client).toBeDefined();
        });

        it('如果API密钥未设置，应该抛出错误', () => {
            delete process.env.OPENAI_API_KEY;
            expect(() => createLlmClient('openai')).toThrow('环境变量中未找到OPENAI_API_KEY');
        });
    });

    // 注意：queryLlm的测试需要更复杂的模拟，这里只是一个简单的示例
    describe('queryLlm', () => {
        it('应该调用正确的API', async () => {
            const mockClient = {
                chat: {
                    completions: {
                        create: jest.fn().mockResolvedValue({
                            choices: [{ message: { content: 'test response' } }]
                        })
                    }
                }
            };

            const response = await queryLlm('test prompt', mockClient, 'gpt-4o', 'openai');

            expect(mockClient.chat.completions.create).toHaveBeenCalled();
            expect(response).toBe('test response');
        });
    });
}); 