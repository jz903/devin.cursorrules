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
exports.loadEnvironment = loadEnvironment;
exports.encodeImageFile = encodeImageFile;
exports.createLlmClient = createLlmClient;
exports.queryLlm = queryLlm;
const openai_1 = require("openai");
const sdk_1 = require("@anthropic-ai/sdk");
const genai = __importStar(require("@google/generative-ai"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const dotenv = __importStar(require("dotenv"));
const mime = __importStar(require("mime-types"));
const commander_1 = require("commander");
/**
 * 加载环境变量，按照优先级顺序
 */
function loadEnvironment() {
    // 优先级顺序:
    // 1. 系统环境变量 (已加载)
    // 2. .env.local (用户特定覆盖)
    // 3. .env (项目默认)
    // 4. .env.example (示例配置)
    const envFiles = ['.env.local', '.env', '.env.example'];
    let envLoaded = false;
    console.error(`当前工作目录: ${path.resolve('.')}`);
    console.error(`查找环境文件: ${envFiles}`);
    for (const envFile of envFiles) {
        const envPath = path.resolve(envFile);
        console.error(`检查 ${envPath}`);
        if (fs.existsSync(envPath)) {
            console.error(`找到 ${envFile}，加载变量...`);
            dotenv.config({ path: envPath });
            envLoaded = true;
            console.error(`从 ${envFile} 加载环境变量`);
            // 打印加载的键（出于安全考虑不打印值）
            const content = fs.readFileSync(envPath, 'utf8');
            const keys = content
                .split('\n')
                .filter(line => line.includes('=') && !line.startsWith('#'))
                .map(line => line.split('=')[0].trim());
            console.error(`从 ${envFile} 加载的键: ${keys}`);
        }
    }
    if (!envLoaded) {
        console.error("警告: 未找到 .env 文件。仅使用系统环境变量。");
        console.error("可用的系统环境变量:", Object.keys(process.env));
    }
}
// 在模块导入时加载环境变量
loadEnvironment();
/**
 * 将图像文件编码为base64并确定其MIME类型
 * @param imagePath 图像文件路径
 * @returns [base64编码字符串, mime类型]
 */
function encodeImageFile(imagePath) {
    let mimeType = mime.lookup(imagePath) || 'image/png';
    const imageBuffer = fs.readFileSync(imagePath);
    const encodedString = imageBuffer.toString('base64');
    return [encodedString, mimeType];
}
/**
 * 创建LLM客户端
 * @param provider 提供商名称
 * @returns LLM客户端实例
 */
function createLlmClient(provider = "openai") {
    if (provider === "openai") {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error("环境变量中未找到OPENAI_API_KEY");
        }
        return new openai_1.OpenAI({
            apiKey
        });
    }
    else if (provider === "azure") {
        const apiKey = process.env.AZURE_OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error("环境变量中未找到AZURE_OPENAI_API_KEY");
        }
        return new openai_1.OpenAI({
            apiKey,
            baseURL: "https://msopenai.openai.azure.com/openai/deployments",
            defaultQuery: { "api-version": "2024-08-01-preview" },
            defaultHeaders: { "api-key": apiKey }
        });
    }
    else if (provider === "deepseek") {
        const apiKey = process.env.DEEPSEEK_API_KEY;
        if (!apiKey) {
            throw new Error("环境变量中未找到DEEPSEEK_API_KEY");
        }
        return new openai_1.OpenAI({
            apiKey,
            baseURL: "https://api.deepseek.com/v1",
        });
    }
    else if (provider === "siliconflow") {
        const apiKey = process.env.SILICONFLOW_API_KEY;
        if (!apiKey) {
            throw new Error("环境变量中未找到SILICONFLOW_API_KEY");
        }
        return new openai_1.OpenAI({
            apiKey,
            baseURL: "https://api.siliconflow.cn/v1"
        });
    }
    else if (provider === "anthropic") {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            throw new Error("环境变量中未找到ANTHROPIC_API_KEY");
        }
        return new sdk_1.Anthropic({
            apiKey
        });
    }
    else if (provider === "gemini") {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            throw new Error("环境变量中未找到GOOGLE_API_KEY");
        }
        const genModel = new genai.GoogleGenerativeAI(apiKey);
        return genModel;
    }
    else if (provider === "local") {
        return new openai_1.OpenAI({
            baseURL: "http://192.168.180.137:8006/v1",
            apiKey: "not-needed"
        });
    }
    else {
        throw new Error(`不支持的提供商: ${provider}`);
    }
}
/**
 * 使用提示查询LLM，可选附加图像
 * @param prompt 文本提示
 * @param client LLM客户端实例
 * @param model 模型名称
 * @param provider API提供商
 * @param imagePath 图像文件路径（可选）
 * @returns LLM的响应或错误时返回null
 */
async function queryLlm(prompt, client = null, model = null, provider = "openai", imagePath = null) {
    if (client === null) {
        client = createLlmClient(provider);
    }
    try {
        // 设置默认模型
        if (model === null) {
            if (provider === "openai") {
                model = "gpt-4o";
            }
            else if (provider === "azure") {
                model = process.env.AZURE_OPENAI_MODEL_DEPLOYMENT || 'gpt-4o-ms';
            }
            else if (provider === "deepseek") {
                model = "deepseek-chat";
            }
            else if (provider === "siliconflow") {
                model = "deepseek-ai/DeepSeek-R1";
            }
            else if (provider === "anthropic") {
                model = "claude-3-7-sonnet-20250219";
            }
            else if (provider === "gemini") {
                model = "gemini-2.0-flash-exp";
            }
            else if (provider === "local") {
                model = "Qwen/Qwen2.5-32B-Instruct-AWQ";
            }
        }
        if (["openai", "local", "deepseek", "azure", "siliconflow"].includes(provider)) {
            const messages = [{ role: "user", content: [] }];
            // 添加文本内容
            messages[0].content.push({
                type: "text",
                text: prompt
            });
            // 如果提供了图像，则添加图像内容
            if (imagePath) {
                if (provider === "openai") {
                    const [encodedImage, mimeType] = encodeImageFile(imagePath);
                    messages[0].content = [
                        { type: "text", text: prompt },
                        { type: "image_url", image_url: { url: `data:${mimeType};base64,${encodedImage}` } }
                    ];
                }
            }
            const kwargs = {
                model,
                messages,
                temperature: 0.7,
            };
            // 添加o1特定参数
            if (model === "o1") {
                kwargs.response_format = { type: "text" };
                kwargs.reasoning_effort = "low";
                delete kwargs.temperature;
            }
            const response = await client.chat.completions.create(kwargs);
            return response.choices[0].message.content;
        }
        else if (provider === "anthropic") {
            const messages = [{ role: "user", content: [] }];
            // 添加文本内容
            messages[0].content.push({
                type: "text",
                text: prompt
            });
            // 如果提供了图像，则添加图像内容
            if (imagePath) {
                const [encodedImage, mimeType] = encodeImageFile(imagePath);
                messages[0].content.push({
                    type: "image",
                    source: {
                        type: "base64",
                        media_type: mimeType,
                        data: encodedImage
                    }
                });
            }
            const response = await client.messages.create({
                model,
                max_tokens: 1000,
                messages
            });
            return response.content[0].text;
        }
        else if (provider === "gemini") {
            const genModel = client.getGenerativeModel({ model });
            if (imagePath) {
                const imageData = fs.readFileSync(imagePath);
                const mimeType = mime.lookup(imagePath) || 'image/png';
                const imagePart = {
                    inlineData: {
                        data: imageData.toString('base64'),
                        mimeType
                    }
                };
                const result = await genModel.generateContent([prompt, imagePart]);
                const response = await result.response;
                return response.text();
            }
            else {
                const result = await genModel.generateContent(prompt);
                const response = await result.response;
                return response.text();
            }
        }
        return null;
    }
    catch (e) {
        console.error(`查询LLM时出错: ${e}`);
        return null;
    }
}
/**
 * 主函数，处理命令行参数
 */
async function main() {
    const program = new commander_1.Command();
    program
        .description('使用提示查询LLM')
        .requiredOption('--prompt <string>', 'LLM的提示')
        .option('--provider <string>', 'API提供商', 'openai')
        .option('--model <string>', '要使用的模型（默认取决于提供商）')
        .option('--image <string>', '附加到提示的图像文件路径');
    program.parse(process.argv);
    const options = program.opts();
    if (!options.model) {
        if (options.provider === "openai") {
            options.model = "gpt-4o";
        }
        else if (options.provider === "azure") {
            options.model = process.env.AZURE_OPENAI_MODEL_DEPLOYMENT || 'gpt-4o-ms';
        }
        else if (options.provider === "deepseek") {
            options.model = "deepseek-chat";
        }
        else if (options.provider === "siliconflow") {
            options.model = "deepseek-ai/DeepSeek-R1";
        }
        else if (options.provider === "anthropic") {
            options.model = "claude-3-7-sonnet-20250219";
        }
        else if (options.provider === "gemini") {
            options.model = "gemini-2.0-flash-exp";
        }
        else if (options.provider === "local") {
            options.model = "Qwen/Qwen2.5-32B-Instruct-AWQ";
        }
    }
    try {
        const client = createLlmClient(options.provider);
        const response = await queryLlm(options.prompt, client, options.model, options.provider, options.image);
        if (response) {
            console.log(response);
        }
        else {
            console.error("查询LLM失败");
            process.exit(1);
        }
    }
    catch (e) {
        console.error(`错误: ${e}`);
        process.exit(1);
    }
}
// 如果直接运行此文件，则执行main函数
if (require.main === module) {
    main();
}
