# VidLuxe API 设计规范

## 设计原则

### 核心原则

1. **类型安全**：使用 tRPC 实现端到端类型安全
2. **RESTful 兼容**：对外提供标准 RESTful API
3. **版本化**：API 版本控制，保证向后兼容
4. **错误标准化**：统一的错误响应格式

### API 风格

| 场景 | 推荐方式 |
|------|----------|
| 内部调用 | tRPC |
| 第三方集成 | RESTful |
| Webhook | POST JSON |

---

## tRPC Router 设计

### 完整 Router 结构

```typescript
// packages/api/src/router/index.ts
import { router } from '@trpc/server';
import { analyzeRouter } from './analyze';
import { enhanceRouter } from './enhance';
import { profileRouter } from './profile';
import { projectRouter } from './project';
import { userRouter } from './user';

export const appRouter = router({
  analyze: analyzeRouter,
  enhance: enhanceRouter,
  profile: profileRouter,
  project: projectRouter,
  user: userRouter,
  learning: learningRouter,  // 🆕 AI 学习路由
});

export type AppRouter = typeof appRouter;
```

### Analyze Router

```typescript
// packages/api/src/router/analyze.ts
import { router, procedure } from '../trpc';
import { z } from 'zod';
import { ColorAnalyzer } from '@vidluxe/core';

const analyzeInputSchema = z.object({
  videoUrl: z.string().url(),
  options: z.object({
    sampleFrames: z.number().min(10).max(100).optional(),
    dimensions: z.array(z.enum([
      'color', 'typography', 'composition', 'motion', 'audio', 'detail'
    ])).optional(),
  }).optional(),
});

export const analyzeRouter = router({
  // 提交分析任务
  submit: procedure
    .input(analyzeInputSchema)
    .mutation(async ({ input, ctx }) => {
      const analysisId = await ctx.analysisQueue.add({
        videoUrl: input.videoUrl,
        options: input.options,
        userId: ctx.user.id,
      });

      return {
        analysisId,
        status: 'processing',
        estimatedTime: 30, // seconds
      };
    }),

  // 获取分析结果
  getResult: procedure
    .input(z.object({ analysisId: z.string() }))
    .query(async ({ input, ctx }) => {
      const result = await ctx.db.analysis.findUnique({
        where: { id: input.analysisId },
      });

      if (!result) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Analysis not found',
        });
      }

      return result;
    }),

  // 分析单帧（实时）
  analyzeFrame: procedure
    .input(z.object({
      frameData: z.string(), // Base64 ImageData
    }))
    .mutation(async ({ input }) => {
      const analyzer = new ColorAnalyzer();
      const imageData = base64ToImageData(input.frameData);
      return analyzer.analyzeFrame(imageData);
    }),
});
```

### Enhance Router

```typescript
// packages/api/src/router/enhance.ts
import { router, procedure } from '../trpc';
import { z } from 'zod';

const enhancementInputSchema = z.object({
  analysisId: z.string(),
  options: z.object({
    style: z.enum(['minimal', 'warm_luxury', 'cool_professional', 'morandi']),
    intensity: z.enum(['light', 'medium', 'strong']),
    dimensions: z.array(z.enum([
      'color', 'typography', 'composition', 'motion', 'audio', 'detail'
    ])),
  }),
});

export const enhanceRouter = router({
  // 提交增强任务
  submit: procedure
    .input(enhancementInputSchema)
    .mutation(async ({ input, ctx }) => {
      const enhanceId = await ctx.enhanceQueue.add({
        analysisId: input.analysisId,
        options: input.options,
        userId: ctx.user.id,
      });

      return {
        enhanceId,
        status: 'pending',
        estimatedTime: 120, // seconds
      };
    }),

  // 获取增强状态
  getStatus: procedure
    .input(z.object({ enhanceId: z.string() }))
    .query(async ({ input, ctx }) => {
      const job = await ctx.enhanceQueue.getJob(input.enhanceId);

      return {
        status: job.status,
        progress: job.progress,
        message: job.message,
      };
    }),

  // 获取增强结果
  getResult: procedure
    .input(z.object({ enhanceId: z.string() }))
    .query(async ({ input, ctx }) => {
      const result = await ctx.db.enhancement.findUnique({
        where: { id: input.enhanceId },
        include: { analysis: true },
      });

      return result;
    }),
});
```

### Profile Router

```typescript
// packages/api/src/router/profile.ts
import { router, procedure } from '../trpc';
import { z } from 'zod';
import { PREMIUM_PROFILES } from '@vidluxe/types';

export const profileRouter = router({
  // 获取所有预设风格
  list: procedure
    .query(() => {
      return Object.values(PREMIUM_PROFILES);
    }),

  // 获取单个风格
  get: procedure
    .input(z.object({ name: z.enum(['minimal', 'warm_luxury', 'cool_professional', 'morandi']) }))
    .query(({ input }) => {
      return PREMIUM_PROFILES[input.name];
    }),

  // 创建自定义风格（Pro 功能）
  createCustom: procedure
    .input(z.object({
      name: z.string(),
      baseOn: z.enum(['minimal', 'warm_luxury', 'cool_professional', 'morandi']),
      adjustments: z.object({
        saturation: z.number().min(0).max(1).optional(),
        contrast: z.number().min(0).max(1).optional(),
        temperature: z.number().min(3000).max(8000).optional(),
        highlights: z.number().min(-100).max(100).optional(),
        shadows: z.number().min(-100).max(100).optional(),
      }),
    }))
    .mutation(async ({ input, ctx }) => {
      // Pro 用户验证
      if (ctx.user.plan !== 'pro') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Custom profiles require Pro plan',
        });
      }

      const baseProfile = PREMIUM_PROFILES[input.baseOn];
      const customProfile = {
        ...baseProfile,
        name: `custom_${input.name}`,
        displayName: input.name,
        ...input.adjustments,
      };

      return await ctx.db.customProfile.create({
        data: {
          userId: ctx.user.id,
          ...customProfile,
        },
      });
    }),
});
```

### Project Router

```typescript
// packages/api/src/router/project.ts
import { router, procedure } from '../trpc';
import { z } from 'zod';

export const projectRouter = router({
  // 创建项目
  create: procedure
    .input(z.object({
      name: z.string().min(1).max(100),
      videoUrl: z.string().url(),
    }))
    .mutation(async ({ input, ctx }) => {
      return await ctx.db.project.create({
        data: {
          userId: ctx.user.id,
          name: input.name,
          videoUrl: input.videoUrl,
          status: 'UPLOADED',
        },
      });
    }),

  // 获取项目列表
  list: procedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(20),
      cursor: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const items = await ctx.db.project.findMany({
        where: { userId: ctx.user.id },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: 'desc' },
      });

      return {
        items: items.slice(0, input.limit),
        nextCursor: items.length > input.limit ? items[items.length - 1].id : null,
      };
    }),

  // 获取单个项目
  get: procedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input, ctx }) => {
      return await ctx.db.project.findFirst({
        where: { id: input.projectId, userId: ctx.user.id },
        include: {
          analyses: { orderBy: { createdAt: 'desc' }, take: 1 },
          enhancements: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      });
    }),

  // 删除项目
  delete: procedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return await ctx.db.project.deleteMany({
        where: { id: input.projectId, userId: ctx.user.id },
      });
    }),
});
```

### Learning Router 🆕

```typescript
// packages/api/src/router/learning.ts
import { router, procedure } from '../trpc';
import { z } from 'zod';
import {
  FeatureExtractor,
  AestheticScorer,
  StyleMatcher,
} from '@vidluxe/learning';

export const learningRouter = router({
  // 评估视频美学分数
  assessAesthetics: procedure
    .input(z.object({
      videoUrl: z.string().url(),
    }))
    .mutation(async ({ input }) => {
      const scorer = new AestheticScorer();
      await scorer.initialize();

      const frames = await extractFrames(input.videoUrl);
      const score = await scorer.scoreVideo(frames);

      return {
        mean: score.mean,
        std: score.std,
        grade: score.grade,
        distribution: score.distribution,
      };
    }),

  // 匹配相似风格
  matchStyle: procedure
    .input(z.object({
      videoUrl: z.string().url(),
      targetStyle: z.enum(['minimal', 'warm_luxury', 'cool_professional', 'morandi']).optional(),
      topK: z.number().min(1).max(20).default(5),
    }))
    .mutation(async ({ input }) => {
      const matcher = new StyleMatcher();

      const frames = await extractFrames(input.videoUrl);
      const match = await matcher.match(frames, {
        targetStyle: input.targetStyle,
        topK: input.topK,
      });

      return {
        reference: {
          id: match.reference.id,
          style: match.reference.metadata.style,
          aestheticsScore: match.reference.metadata.aestheticsScore,
          thumbnailUrl: match.reference.metadata.thumbnailUrl,
        },
        similarity: match.similarity,
        transferParams: match.transferParams,
        suggestions: match.suggestions,
      };
    }),

  // 搜索风格库
  searchStyles: procedure
    .input(z.object({
      query: z.string().optional(),
      style: z.enum(['minimal', 'warm_luxury', 'cool_professional', 'morandi']).optional(),
      category: z.enum(['luxury', 'fashion', 'tech', 'lifestyle']).optional(),
      minScore: z.number().min(1).max(10).optional(),
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ input, ctx }) => {
      return await ctx.db.styleVector.findMany({
        where: {
          ...(input.style && { 'metadata.style': input.style }),
          ...(input.category && { 'metadata.category': input.category }),
          ...(input.minScore && { 'metadata.aestheticsScore': { gte: input.minScore } }),
        },
        take: input.limit,
        orderBy: { 'metadata.aestheticsScore': 'desc' },
      });
    }),

  // 上传学习样本（管理员）
  uploadSample: procedure
    .input(z.object({
      videoUrl: z.string().url(),
      labels: z.object({
        style: z.enum(['minimal', 'warm_luxury', 'cool_professional', 'morandi']),
        category: z.enum(['luxury', 'fashion', 'tech', 'lifestyle']),
        brand: z.string().optional(),
        mood: z.array(z.string()),
        quality: z.number().min(1).max(10),
      }),
    }))
    .mutation(async ({ input, ctx }) => {
      // 管理员权限检查
      if (!ctx.user.isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Admin access required',
        });
      }

      const extractor = new FeatureExtractor();
      const scorer = new AestheticScorer();

      await extractor.initialize();
      await scorer.initialize();

      const frames = await extractFrames(input.videoUrl);
      const embedding = await extractor.extractFromFrames(frames);
      const aestheticsScore = await scorer.scoreVideo(frames);

      const vector = await ctx.db.styleVector.create({
        data: {
          embedding: embedding.vector,
          metadata: {
            ...input.labels,
            source: input.videoUrl,
            aestheticsScore: aestheticsScore.mean,
          },
        },
      });

      return { id: vector.id, aestheticsScore: aestheticsScore.mean };
    }),
});
```

---

## RESTful API 设计

### 端点规范

#### 视频分析 API

```yaml
POST /api/v1/analyze
  描述: 提交视频分析任务
  请求体:
    {
      "videoUrl": "https://example.com/video.mp4",
      "options": {
        "sampleFrames": 30,
        "dimensions": ["color"]
      }
    }
  响应:
    {
      "success": true,
      "data": {
        "analysisId": "ana_abc123",
        "status": "processing",
        "estimatedTime": 30
      }
    }

GET /api/v1/analyze/{analysisId}
  描述: 获取分析结果
  响应:
    {
      "success": true,
      "data": {
        "id": "ana_abc123",
        "status": "completed",
        "result": {
          "color": { ... },
          "score": {
            "total": 85,
            "grade": "S",
            "dimensions": { ... }
          }
        }
      }
    }
```

#### 视频增强 API

```yaml
POST /api/v1/enhance
  描述: 提交视频增强任务
  请求体:
    {
      "analysisId": "ana_abc123",
      "options": {
        "style": "minimal",
        "intensity": "medium",
        "dimensions": ["color"]
      }
    }
  响应:
    {
      "success": true,
      "data": {
        "enhanceId": "enh_xyz789",
        "status": "pending",
        "estimatedTime": 120
      }
    }

GET /api/v1/enhance/{enhanceId}/status
  描述: 获取增强任务状态
  响应:
    {
      "success": true,
      "data": {
        "status": "processing",
        "progress": 45,
        "message": "Processing frame 15 of 30"
      }
    }

GET /api/v1/enhance/{enhanceId}
  描述: 获取增强结果
  响应:
    {
      "success": true,
      "data": {
        "id": "enh_xyz789",
        "status": "completed",
        "outputUrl": "https://cdn.vidluxe.com/output/enh_xyz789.mp4",
        "beforeScore": 65,
        "afterScore": 85,
        "improvement": 20
      }
    }
```

#### 风格配置 API

```yaml
GET /api/v1/profiles
  描述: 获取所有预设风格
  响应:
    {
      "success": true,
      "data": [
        {
          "name": "minimal",
          "displayName": "极简风格",
          "description": "Apple 风格，克制、干净",
          "saturation": 0.65,
          "contrast": 0.90,
          ...
        },
        ...
      ]
    }

POST /api/v1/profiles/custom
  描述: 创建自定义风格（需 Pro 订阅）
  请求体:
    {
      "name": "我的风格",
      "baseOn": "minimal",
      "adjustments": {
        "saturation": 0.55,
        "contrast": 0.85
      }
    }
  响应:
    {
      "success": true,
      "data": {
        "id": "profile_custom123",
        "name": "我的风格",
        ...
      }
    }
```

---

## 错误处理

### 错误响应格式

```typescript
interface APIError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

### 错误码定义

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| `INVALID_INPUT` | 400 | 请求参数无效 |
| `UNAUTHORIZED` | 401 | 未登录 |
| `FORBIDDEN` | 403 | 无权限 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `RATE_LIMITED` | 429 | 请求过于频繁 |
| `QUOTA_EXCEEDED` | 403 | 配额用尽 |
| `PROCESSING_ERROR` | 500 | 处理失败 |

### 错误示例

```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Invalid video URL",
    "details": {
      "field": "videoUrl",
      "reason": "Must be a valid URL ending with .mp4, .mov, or .webm"
    }
  }
}
```

---

## 认证与授权

### 认证方式

```typescript
// Bearer Token
Authorization: Bearer <token>

// API Key (用于第三方集成)
X-API-Key: <api_key>
```

### 权限级别

| 计划 | 分析次数/月 | 增强次数/月 | 自定义风格 |
|------|-------------|-------------|-----------|
| Free | 10 | 0 | ❌ |
| Pro | 100 | 50 | ✅ |
| Enterprise | Unlimited | Unlimited | ✅ |

---

## 请求限流

```typescript
// Rate Limit 配置
const rateLimits = {
  analyze: {
    free: { windowMs: 60000, max: 5 },
    pro: { windowMs: 60000, max: 30 },
  },
  enhance: {
    pro: { windowMs: 60000, max: 10 },
  },
};
```

---

## Webhook

### 事件类型

| 事件 | 说明 |
|------|------|
| `analysis.completed` | 分析完成 |
| `analysis.failed` | 分析失败 |
| `enhancement.completed` | 增强完成 |
| `enhancement.failed` | 增强失败 |

### Webhook 格式

```typescript
interface WebhookPayload {
  event: string;
  timestamp: string;
  data: {
    id: string;
    status: string;
    result?: VideoAnalysisOutput;
    error?: string;
  };
}
```

### 示例

```json
{
  "event": "analysis.completed",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "id": "ana_abc123",
    "status": "completed",
    "result": {
      "score": { "total": 85, "grade": "S" }
    }
  }
}
```

---

## OpenAPI 规范

```yaml
openapi: 3.1.0
info:
  title: VidLuxe API
  version: 1.0.0
  description: Premium Video Enhancement Engine API

servers:
  - url: https://api.vidluxe.com/v1
    description: Production

paths:
  /analyze:
    post:
      summary: Submit video analysis
      tags:
        - Analysis
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AnalyzeInput'
      responses:
        '200':
          description: Analysis submitted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AnalyzeResponse'

components:
  schemas:
    AnalyzeInput:
      type: object
      required:
        - videoUrl
      properties:
        videoUrl:
          type: string
          format: uri
        options:
          $ref: '#/components/schemas/AnalyzeOptions'

    AnalyzeOptions:
      type: object
      properties:
        sampleFrames:
          type: integer
          minimum: 10
          maximum: 100
        dimensions:
          type: array
          items:
            type: string
            enum: [color, typography, composition, motion, audio, detail]
```

---

## 下一步

- [数据模型设计](./DATA_MODELS.md)
- [分析模块设计](./MODULES/analyzer.md)
- [前端技术规范](./FRONTEND.md)
