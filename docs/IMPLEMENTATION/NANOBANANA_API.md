# Nano Banana API 封装实现细节

> 本文档详细说明 Nano Banana API 在 VidLuxe 项目中的封装方案，包括技术依据、参考来源和代码实现。

---

## 一、技术依据

### 1.1 官方来源

| 来源 | 链接 | 说明 |
|------|------|------|
| **官网** | https://www.nano-banana.com/ | 产品介绍和文档 |
| **Gemini API** | https://ai.google.dev/gemini-api/docs/image-generation | 底层 API 文档 |
| **定价页面** | https://www.nano-banana.com/pricing | 价格方案 |

### 1.2 为什么选择 Nano Banana

```
Nano Banana 是基于 Google Gemini 的图像生成服务

核心优势：
├─ 速度：1-2 秒/图，比 Midjourney 快 5-10 倍
├─ 质量：4K 超高清输出
├─ 文字渲染：高保真文字渲染（做高级感设计的关键）
├─ API 支持：直接调用，无需浏览器自动化
└─ 价格：$0.02/图，成本可控
```

### 1.3 与其他方案对比

| 方案 | 速度 | 文字渲染 | API | 成本/图 | 适用场景 |
|------|------|---------|-----|--------|---------|
| **Nano Banana** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ | $0.02 | **MVP 首选** |
| Midjourney | ⭐⭐ | ⭐⭐⭐ | ❌ | $0.05 | 创意设计 |
| DALL-E 3 | ⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ | $0.04 | 通用场景 |
| Ideogram | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⚠️ | $0.03 | 文字设计 |
| Stable Diffusion | ⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ | $0.01* | 自部署 |
| SDXL + B-LoRA | ⭐⭐⭐ | ⭐⭐⭐ | ✅ | $0.01* | 标准阶段 |

*自部署成本，不包括 GPU 费用

---

## 二、API 设计

### 2.1 核心功能

```
┌─────────────────────────────────────────────────────────────┐
│                  Nano Banana API 封装                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  功能1：背景图生成                                           │
│  ├─ 输入：风格嵌入 + 内容描述                                │
│  ├─ 输出：3-5 张高级感背景图                                │
│  └─ 规格：1080×1920 (9:16 垂直视频)                         │
│                                                             │
│  功能2：文字卡片生成                                         │
│  ├─ 输入：金句文本 + 风格嵌入                                │
│  ├─ 输出：带高级感排版的文字卡片                            │
│  └─ 规格：1080×600 (卡片比例)                               │
│                                                             │
│  功能3：封面图生成                                           │
│  ├─ 输入：视频摘要 + 风格嵌入                                │
│  ├─ 输出：小红书/抖音封面图                                  │
│  └─ 规格：1080×1440 (3:4 小红书封面)                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 包结构

```
packages/generator/
├── src/
│   ├── nano-banana/
│   │   ├── index.ts           # 导出
│   │   ├── client.ts          # API 客户端
│   │   ├── types.ts           # 类型定义
│   │   ├── prompts.ts         # Prompt 模板
│   │   ├── cache.ts           # 缓存层
│   │   └── errors.ts          # 错误处理
│   │
│   └── index.ts
│
├── tests/
│   └── nano-banana.test.ts
│
└── package.json
```

---

## 三、代码实现

### 3.1 类型定义

```typescript
// packages/generator/src/nano-banana/types.ts

/**
 * Nano Banana API 配置
 *
 * 参考文档：https://www.nano-banana.com/docs/api
 */
export interface NanoBananaConfig {
  apiKey: string;

  // API 端点
  baseUrl?: string;  // 默认: https://api.nano-banana.com/v1

  // 重试配置
  retry?: {
    maxAttempts: number;
    backoffMs: number;
  };

  // 超时配置
  timeout?: number;  // 毫秒

  // 缓存配置
  cache?: {
    enabled: boolean;
    ttl: number;  // 秒
  };
}

/**
 * 图像生成请求
 *
 * 参考：https://ai.google.dev/gemini-api/docs/image-generation
 */
export interface ImageGenerationRequest {
  // Prompt
  prompt: string;

  // 负面 Prompt（排除不想要的元素）
  negativePrompt?: string;

  // 图片数量
  count: number;

  // 尺寸
  size: {
    width: number;
    height: number;
  };

  // 质量
  quality: 'standard' | 'high' | 'ultra';

  // 风格（Nano Banana 特有）
  style?: 'photorealistic' | 'artistic' | 'minimal' | 'cinematic';

  // 种子（可复现）
  seed?: number;
}

/**
 * 图像生成响应
 */
export interface ImageGenerationResponse {
  images: Array<{
    id: string;
    url: string;
    width: number;
    height: number;
    seed: number;
  }>;

  // 用量信息
  usage: {
    promptTokens: number;
    totalCost: number;
  };

  // 元数据
  metadata: {
    model: string;
    processingTime: number;
  };
}

/**
 * VidLuxe 资产生成请求
 */
export interface AssetGenerationRequest {
  // 风格嵌入（来自 B-LoRA）
  styleEmbedding: {
    id: string;
    styleVector: number[];
    weights: { style: number; content: number };
  };

  // 内容描述
  content: {
    type: 'background' | 'text_card' | 'cover';
    keywords: string[];
    text?: string;  // 文字卡片时的金句
  };

  // 预设风格
  styleType: 'minimal' | 'warm_luxury' | 'cool_professional' | 'morandi';

  // 数量
  count: number;
}

/**
 * VidLuxe 资产生成响应
 */
export interface AssetGenerationResponse {
  assets: Array<{
    id: string;
    type: 'background' | 'text_card' | 'cover';
    url: string;
    width: number;
    height: number;
    prompt: string;  // 使用的 Prompt
  }>;
}
```

### 3.2 API 客户端实现

```typescript
// packages/generator/src/nano-banana/client.ts

/**
 * Nano Banana API 客户端
 *
 * 参考文档：
 * - Nano Banana 官方：https://www.nano-banana.com/docs/api
 * - Gemini Image Generation：https://ai.google.dev/gemini-api/docs/image-generation
 *
 * 实现 note：
 * - Nano Banana 是基于 Gemini API 的封装
 * - 底层调用 Gemini 的 imagen 模型
 */

import type {
  NanoBananaConfig,
  ImageGenerationRequest,
  ImageGenerationResponse,
} from './types';

export class NanoBananaClient {
  private config: Required<NanoBananaConfig>;
  private cache: CacheManager;

  constructor(config: NanoBananaConfig) {
    this.config = {
      baseUrl: config.baseUrl ?? 'https://api.nano-banana.com/v1',
      retry: config.retry ?? { maxAttempts: 3, backoffMs: 1000 },
      timeout: config.timeout ?? 60000,
      cache: config.cache ?? { enabled: true, ttl: 3600 },
      ...config,
    };
    this.cache = new CacheManager(this.config.cache);
  }

  /**
   * 生成图片
   *
   * 参考：https://ai.google.dev/gemini-api/docs/image-generation#generate_image
   */
  async generateImages(
    request: ImageGenerationRequest
  ): Promise<ImageGenerationResponse> {
    const startTime = Date.now();

    // 1. 检查缓存
    const cacheKey = this.getCacheKey(request);
    if (this.config.cache.enabled) {
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // 2. 调用 API（带重试）
    const response = await this.callWithRetry(async () => {
      return await this.callGenerateAPI(request);
    });

    // 3. 计算成本
    const cost = this.calculateCost(request);

    // 4. 构建响应
    const result: ImageGenerationResponse = {
      images: response.images.map((img, i) => ({
        id: `img_${Date.now()}_${i}`,
        url: img.url,
        width: request.size.width,
        height: request.size.height,
        seed: img.seed,
      })),
      usage: {
        promptTokens: response.prompt_tokens ?? 0,
        totalCost: cost,
      },
      metadata: {
        model: 'nano-banana-v1',
        processingTime: Date.now() - startTime,
      },
    };

    // 5. 缓存结果
    if (this.config.cache.enabled) {
      await this.cache.set(cacheKey, result, this.config.cache.ttl);
    }

    return result;
  }

  /**
   * 调用 Nano Banana API
   *
   * API 格式参考：https://www.nano-banana.com/docs/api#generate
   */
  private async callGenerateAPI(
    request: ImageGenerationRequest
  ): Promise<any> {
    const response = await fetch(`${this.config.baseUrl}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        prompt: request.prompt,
        negative_prompt: request.negativePrompt,
        n: request.count,
        size: `${request.size.width}x${request.size.height}`,
        quality: request.quality,
        style: request.style,
        seed: request.seed,
        response_format: 'url',  // 返回 URL 而非 base64
      }),
      signal: AbortSignal.timeout(this.config.timeout),
    });

    if (!response.ok) {
      throw new NanoBananaAPIError(
        response.status,
        await response.text()
      );
    }

    return response.json();
  }

  /**
   * 带重试的 API 调用
   *
   * 参考：https://cloud.google.com/iam/docs/retry-strategy
   * 使用指数退避策略
   */
  private async callWithRetry<T>(
    fn: () => Promise<T>,
    attempt: number = 1
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= this.config.retry.maxAttempts) {
        throw error;
      }

      // 检查是否可重试
      if (!this.isRetryableError(error)) {
        throw error;
      }

      // 指数退避
      const backoff = this.config.retry.backoffMs * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, backoff));

      return this.callWithRetry(fn, attempt + 1);
    }
  }

  /**
   * 判断是否可重试
   *
   * 参考：https://cloud.google.com/storage/docs/retry-strategy
   */
  private isRetryableError(error: any): boolean {
    // 5xx 服务端错误可重试
    if (error instanceof NanoBananaAPIError) {
      return error.status >= 500 || error.status === 429;
    }

    // 网络错误可重试
    if (error.name === 'NetworkError' || error.name === 'TimeoutError') {
      return true;
    }

    return false;
  }

  /**
   * 计算成本
   *
   * 定价参考：https://www.nano-banana.com/pricing
   *
   * Basic Plan: $9.99/月，500 次生成
   * Pro Plan: $29.99/月，2000 次生成
   * 按量付费: ~$0.02/图
   */
  private calculateCost(request: ImageGenerationRequest): number {
    // 简化计算：按张数
    const costPerImage = 0.02;  // USD
    return request.count * costPerImage;
  }

  private getCacheKey(request: ImageGenerationRequest): string {
    // 基于请求内容生成缓存 key
    return `nano-banana:${request.prompt}:${request.size.width}x${request.size.height}:${request.count}`;
  }
}
```

### 3.3 错误处理

```typescript
// packages/generator/src/nano-banana/errors.ts

/**
 * Nano Banana API 错误
 *
 * 参考错误码：
 * - 400: 请求格式错误
 * - 401: API Key 无效
 * - 429: 请求频率限制
 * - 500: 服务端错误
 */
export class NanoBananaAPIError extends Error {
  constructor(
    public status: number,
    public body: string
  ) {
    super(`Nano Banana API error: ${status} - ${body}`);
    this.name = 'NanoBananaAPIError';
  }

  /**
   * 是否为临时性错误（可重试）
   */
  get isTransient(): boolean {
    return this.status >= 500 || this.status === 429;
  }

  /**
   * 是否为认证错误
   */
  get isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }

  /**
   * 是否为配额错误
   */
  get isQuotaError(): boolean {
    return this.status === 429;
  }

  /**
   * 获取用户友好的错误消息
   */
  get userMessage(): string {
    switch (this.status) {
      case 401:
      case 403:
        return 'API 密钥无效，请联系管理员';
      case 429:
        return '请求过于频繁，请稍后再试';
      case 500:
      case 502:
      case 503:
        return '服务暂时不可用，正在重试...';
      default:
        return `生成失败：${this.body}`;
    }
  }
}

/**
 * 内容策略违规错误
 *
 * 参考：https://ai.google.dev/gemini-api/docs/image-generation#safety
 */
export class ContentPolicyError extends Error {
  constructor(
    public reason: string,
    public suggestion: string
  ) {
    super(`内容策略违规: ${reason}`);
    this.name = 'ContentPolicyError';
  }
}
```

### 3.4 VidLuxe 资产生成器

```typescript
// packages/generator/src/nano-banana/generator.ts

/**
 * VidLuxe 资产生成器
 *
 * 将 Nano Banana API 封装为 VidLuxe 专用的高层接口
 */

import { NanoBananaClient } from './client';
import { PromptBuilder, PREMIUM_PROMPTS } from './prompts';
import type { AssetGenerationRequest, AssetGenerationResponse } from './types';

export class AssetGenerator {
  private client: NanoBananaClient;
  private promptBuilder: PromptBuilder;

  constructor(apiKey: string) {
    this.client = new NanoBananaClient({ apiKey });
    this.promptBuilder = new PromptBuilder();
  }

  /**
   * 生成高级感背景图
   *
   * 技术依据：
   * - Prompt 工程参考：Midjourney 最佳实践
   * - 尺寸参考：小红书/抖音竖屏标准 (9:16)
   */
  async generateBackgrounds(params: {
    styleEmbedding: AssetGenerationRequest['styleEmbedding'];
    keywords: string[];
    styleType: AssetGenerationRequest['styleType'];
    count: number;
  }): Promise<AssetGenerationResponse['assets']> {
    // 1. 构建 Prompt
    const prompt = this.promptBuilder.buildBackgroundPrompt({
      styleType: params.styleType,
      keywords: params.keywords,
      styleWeight: params.styleEmbedding.weights.style,
    });

    // 2. 调用 Nano Banana
    const response = await this.client.generateImages({
      prompt,
      negativePrompt: PREMIUM_PROMPTS[params.styleType].negativePrompt,
      count: params.count,
      size: { width: 1080, height: 1920 },  // 9:16 竖屏
      quality: 'high',
      style: this.mapStyleType(params.styleType),
    });

    // 3. 转换为资产格式
    return response.images.map((img, i) => ({
      id: img.id,
      type: 'background' as const,
      url: img.url,
      width: img.width,
      height: img.height,
      prompt,
    }));
  }

  /**
   * 生成文字卡片
   *
   * 技术依据：
   * - Nano Banana 的文字渲染能力
   * - 参考：https://www.nano-banana.com/features/text-rendering
   */
  async generateTextCards(params: {
    texts: string[];  // 金句列表
    styleType: AssetGenerationRequest['styleType'];
  }): Promise<AssetGenerationResponse['assets']> {
    const assets: AssetGenerationResponse['assets'] = [];

    for (const text of params.texts) {
      // 构建 Prompt
      const prompt = this.promptBuilder.buildTextCardPrompt({
        text,
        styleType: params.styleType,
      });

      const response = await this.client.generateImages({
        prompt,
        count: 1,
        size: { width: 1080, height: 600 },  // 卡片比例
        quality: 'high',
      });

      assets.push({
        id: response.images[0].id,
        type: 'text_card',
        url: response.images[0].url,
        width: 1080,
        height: 600,
        prompt,
      });
    }

    return assets;
  }

  /**
   * 生成封面图
   */
  async generateCover(params: {
    keywords: string[];
    styleType: AssetGenerationRequest['styleType'];
  }): Promise<AssetGenerationResponse['assets'][0]> {
    const prompt = this.promptBuilder.buildCoverPrompt({
      keywords: params.keywords,
      styleType: params.styleType,
    });

    const response = await this.client.generateImages({
      prompt,
      count: 1,
      size: { width: 1080, height: 1440 },  // 3:4 小红书封面
      quality: 'ultra',  // 封面用最高质量
    });

    const img = response.images[0];
    return {
      id: img.id,
      type: 'cover',
      url: img.url,
      width: 1080,
      height: 1440,
      prompt,
    };
  }

  /**
   * 映射风格类型到 Nano Banana 风格
   */
  private mapStyleType(
    styleType: AssetGenerationRequest['styleType']
  ): 'photorealistic' | 'artistic' | 'minimal' | 'cinematic' {
    const mapping: Record<string, typeof styleType> = {
      minimal: 'minimal',
      warm_luxury: 'cinematic',
      cool_professional: 'photorealistic',
      morandi: 'artistic',
    };
    return mapping[styleType] ?? 'artistic';
  }
}
```

---

## 四、使用示例

### 4.1 基本使用

```typescript
import { AssetGenerator } from '@vidluxe/generator';

// 初始化
const generator = new AssetGenerator(process.env.NANO_BANANA_API_KEY!);

// 生成背景图
const backgrounds = await generator.generateBackgrounds({
  styleEmbedding: {
    id: 'style_xxx',
    styleVector: [...],
    weights: { style: 0.7, content: 0.3 },
  },
  keywords: ['理财', '投资', '成长'],
  styleType: 'minimal',
  count: 3,
});

// 生成文字卡片
const cards = await generator.generateTextCards({
  texts: [
    '投资是一场长跑',
    '复利是世界第八大奇迹',
    '时间是最好的朋友',
  ],
  styleType: 'minimal',
});

// 生成封面
const cover = await generator.generateCover({
  keywords: ['理财', '投资'],
  styleType: 'minimal',
});
```

### 4.2 在 tRPC 中使用

```typescript
export const generateRouter = router({
  generateAssets: procedure
    .input(z.object({
      styleEmbeddingId: z.string(),
      keywords: z.array(z.string()),
      texts: z.array(z.string()),
      styleType: z.enum(['minimal', 'warm_luxury', 'cool_professional', 'morandi']),
    }))
    .mutation(async ({ input, ctx }) => {
      // 1. 获取风格嵌入
      const embedding = await ctx.db.styleEmbedding.findUnique({
        where: { id: input.styleEmbeddingId },
      });

      // 2. 生成资产
      const generator = new AssetGenerator(process.env.NANO_BANANA_API_KEY!);

      const [backgrounds, textCards, cover] = await Promise.all([
        generator.generateBackgrounds({
          styleEmbedding: embedding!,
          keywords: input.keywords,
          styleType: input.styleType,
          count: 3,
        }),
        generator.generateTextCards({
          texts: input.texts,
          styleType: input.styleType,
        }),
        generator.generateCover({
          keywords: input.keywords,
          styleType: input.styleType,
        }),
      ]);

      // 3. 保存到数据库
      await ctx.db.generatedAsset.createMany({
        data: [...backgrounds, ...textCards, cover].map(asset => ({
          id: asset.id,
          type: asset.type,
          url: asset.url,
          prompt: asset.prompt,
        })),
      });

      return { backgrounds, textCards, cover };
    }),
});
```

---

## 五、成本控制

### 5.1 成本估算

```
每个视频的生成成本：

背景图：3 张 × $0.02 = $0.06
文字卡片：5 张 × $0.02 = $0.10
封面图：1 张 × $0.02 = $0.02
────────────────────────────
总计：$0.18 ≈ ¥1.3/视频

月度成本（1000 用户，每用户 20 视频）：
1000 × 20 × $0.18 = $3,600/月
```

### 5.2 成本优化策略

| 策略 | 说明 | 节省 |
|------|------|------|
| **缓存相同 Prompt** | 相同参数不重复生成 | 30-50% |
| **减少生成数量** | 默认 3 张背景，用户可选择更多 | 20-30% |
| **批量请求** | 合并多个请求 | 5-10% |
| **降级到 SDXL** | 标准阶段自部署 | 80% |

---

## 六、监控与告警

### 6.1 关键指标

```typescript
// 监控指标
const metrics = {
  // 性能
  generation_latency: response.metadata.processingTime,
  api_success_rate: successfulCalls / totalCalls,
  cache_hit_rate: cacheHits / totalCalls,

  // 成本
  cost_per_image: totalCost / imagesGenerated,
  monthly_spend: monthlyTotal,

  // 质量
  user_satisfaction: averageRating,  // 用户评分
  rejection_rate: rejectedImages / totalImages,  // 拒收率
};
```

### 6.2 告警规则

| 指标 | 阈值 | 告警级别 |
|------|------|---------|
| API 成功率 | < 95% | 警告 |
| API 成功率 | < 90% | 严重 |
| 单图成本 | > $0.05 | 警告 |
| 月度支出 | > 预算 80% | 警告 |
| 平均延迟 | > 10s | 警告 |

---

## 七、参考资料汇总

| 类型 | 链接 | 用途 |
|------|------|------|
| **官网** | https://www.nano-banana.com/ | 产品介绍 |
| **API 文档** | https://www.nano-banana.com/docs/api | 接口规范 |
| **定价** | https://www.nano-banana.com/pricing | 成本估算 |
| **Gemini API** | https://ai.google.dev/gemini-api/docs/image-generation | 底层原理 |
| **安全策略** | https://ai.google.dev/gemini-api/docs/image-generation#safety | 内容审核 |

---

## 下一步

- [Prompt 工程设计](./PROMPT_ENGINEERING.md)
- [MODNet 抠像集成](./MODNET_INTEGRATION.md)
- [整体工作流设计](./WORKFLOW.md)
