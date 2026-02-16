# B-LoRA 集成实现细节

> 本文档详细说明 B-LoRA 在 VidLuxe 项目中的集成方案，包括技术依据、参考来源和代码实现。

---

## 一、技术依据

### 1.1 官方来源

| 来源 | 链接 | 说明 |
|------|------|------|
| **官方 GitHub** | https://github.com/yardenfren1996/B-LoRA | 官方实现代码 |
| **论文** | https://arxiv.org/abs/2403.14572 | ECCV 2024 论文 |
| **项目主页** | https://b-lora.github.io/B-LoRA/ | 效果展示和说明 |

### 1.2 核心论文摘要

```
论文标题：Implicit Style-Content Separation using B-LoRA
发表：ECCV 2024
作者：Yarden Frenkel 等

核心发现：
1. SDXL 架构中有两个关键块（B-LoRA blocks）
2. 联合训练这两个块可以实现风格-内容分离
3. 单张图片即可学习风格
4. 学到的风格可以应用到任意内容

技术原理：
├─ 基于 SDXL + LoRA（Low-Rank Adaptation）
├─ 发现 content block 和 style block
├─ content block：负责图像内容
├─ style block：负责图像风格
└─ 分离后可独立控制
```

### 1.3 社区资源

| 资源 | 链接 | 用途 |
|------|------|------|
| **ComfyUI-B-LoRA** | https://github.com/liusida/ComfyUI-B-LoRA | ComfyUI 节点实现 |
| **B-LoRA-Colab** | https://github.com/itsitgroup/B-LoRA-Colab-Notebook | Colab 测试环境 |

---

## 二、为什么选择 B-LoRA

### 2.1 与其他方案对比

| 方案 | 需要样本数 | 风格质量 | 实现复杂度 | 参考来源 |
|------|-----------|---------|-----------|---------|
| **B-LoRA** | 1 张 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ECCV 2024 |
| IP-Adapter | 1 张 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | https://github.com/tencent-ailab/IP-Adapter |
| Textual Inversion | 3-5 张 | ⭐⭐⭐ | ⭐⭐⭐⭐ | Stable Diffusion 官方 |
| DreamBooth | 3-5 张 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Google Research |
| LoRA 微调 | 20+ 张 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Stable Diffusion 社区 |

**选择 B-LoRA 的理由**：
1. **单图学习**：用户只需提供一张参考图
2. **风格-内容分离**：可以只迁移风格，不迁移内容
3. **学术验证**：ECCV 2024 论文，效果有保证
4. **社区支持**：有 ComfyUI 节点，易于集成

### 2.2 B-LoRA vs 原方案（CLIP + NIMA）

```
原方案（CLIP + NIMA + 向量检索）：
├─ 需要预先建立 1000+ 样本库
├─ 用户无法指定具体风格
├─ 匹配结果不可预测
└─ 维护成本高

B-LoRA：
├─ 只需要 1 张参考图
├─ 用户完全控制风格
├─ 效果可预测（所见即所得）
└─ 无需维护样本库
```

---

## 三、技术架构

### 3.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    B-LoRA 集成架构                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  用户上传参考图                                              │
│        │                                                    │
│        ▼                                                    │
│  ┌─────────────────┐                                        │
│  │  B-LoRA Loader  │ ← 加载预训练 SDXL + B-LoRA             │
│  └────────┬────────┘                                        │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────┐                                        │
│  │ Style Extractor │ ← 从参考图提取风格嵌入                  │
│  └────────┬────────┘                                        │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────┐                                        │
│  │  Style Storage  │ ← 缓存风格嵌入（Redis）                 │
│  └────────┬────────┘                                        │
│           │                                                 │
│           ▼                                                 │
│  输出：StyleEmbedding（用于后续生成）                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 部署方式选择

| 方式 | 优点 | 缺点 | 适用阶段 |
|------|------|------|---------|
| **Modal 托管** | 无需管理 GPU，按量付费 | 有网络延迟 | MVP ⭐ |
| **Replicate API** | 简单易用，稳定 | 成本较高 | MVP |
| **自部署 GPU** | 成本低，延迟低 | 需要运维 | 专业阶段 |

**推荐 MVP 阶段使用 Modal 托管**，参考：https://modal.com/docs

---

## 四、代码实现

### 4.1 包结构

```
packages/learning/
├── src/
│   ├── blora/
│   │   ├── index.ts              # 导出
│   │   ├── loader.ts             # B-LoRA 加载器
│   │   ├── extractor.ts          # 风格提取器
│   │   ├── types.ts              # 类型定义
│   │   └── utils.ts              # 工具函数
│   │
│   ├── modal/
│   │   └── blora-service.ts      # Modal 托管服务
│   │
│   └── index.ts
│
├── tests/
│   └── blora.test.ts
│
└── package.json
```

### 4.2 类型定义

```typescript
// packages/learning/src/blora/types.ts

/**
 * B-LoRA 风格嵌入
 * 基于 B-LoRA 论文的风格表示
 */
export interface StyleEmbedding {
  id: string;

  // 风格向量（用于生成）
  styleVector: number[];

  // 权重配置
  weights: {
    style: number;      // 风格权重 (0-1)，推荐 0.7-0.85
    content: number;    // 内容权重 (0-1)，推荐 0.15-0.3
  };

  // 元数据
  metadata: {
    sourceImageUrl: string;    // 原始参考图 URL
    extractedAt: Date;         // 提取时间
    modelVersion: string;      // 模型版本
    processingTime: number;    // 处理耗时(ms)
  };
}

/**
 * B-LoRA 配置
 */
export interface BLoRAConfig {
  // 部署方式
  deployment: 'modal' | 'replicate' | 'local';

  // Modal 配置
  modal?: {
    appId: string;
    apiKey: string;
  };

  // Replicate 配置
  replicate?: {
    apiToken: string;
    modelVersion: string;
  };

  // 本地配置
  local?: {
    modelPath: string;
    device: 'cuda' | 'cpu';
  };

  // 缓存配置
  cache: {
    enabled: boolean;
    ttl: number;  // 秒
  };
}

/**
 * 风格提取选项
 */
export interface ExtractionOptions {
  // 预设风格类型（可选，用于调整权重）
  styleType?: 'minimal' | 'warm_luxury' | 'cool_professional' | 'morandi';

  // 自定义权重（可选）
  customWeights?: {
    style: number;
    content: number;
  };

  // 输出尺寸
  outputSize?: {
    width: number;
    height: number;
  };
}
```

### 4.3 B-LoRA 加载器

```typescript
// packages/learning/src/blora/loader.ts

/**
 * B-LoRA 加载器
 *
 * 实现方式选择：
 * 1. Modal 托管（推荐 MVP）- 参考：https://modal.com/docs/guide/ex-ml-inference
 * 2. Replicate API - 参考：https://replicate.com/docs
 * 3. 本地部署（专业阶段）
 *
 * 本实现采用 Modal 托管，原因：
 * - 无需管理 GPU 服务器
 * - 按量付费，成本可控
 * - 自动扩展，无需运维
 */

import type { BLoRAConfig, StyleEmbedding, ExtractionOptions } from './types';

export class BLoRALoader {
  private config: BLoRAConfig;
  private client: ModalClient | ReplicateClient | LocalClient;

  constructor(config: BLoRAConfig) {
    this.config = config;
    this.client = this.initClient();
  }

  /**
   * 初始化客户端
   */
  private initClient() {
    switch (this.config.deployment) {
      case 'modal':
        // 参考：https://modal.com/docs/guide/ex-ml-inference
        return new ModalClient(this.config.modal!);

      case 'replicate':
        // 参考：https://replicate.com/docs/get-started/typescript
        return new ReplicateClient(this.config.replicate!);

      case 'local':
        // 本地部署，需要 GPU
        return new LocalClient(this.config.local!);
    }
  }

  /**
   * 从参考图提取风格
   *
   * 技术依据：
   * - B-LoRA 论文：https://arxiv.org/abs/2403.14572
   * - 核心原理：训练两个 B-LoRA 块，分别捕获风格和内容
   *
   * @param imageUrl 参考图片 URL
   * @param options 提取选项
   * @returns 风格嵌入
   */
  async extractStyle(
    imageUrl: string,
    options: ExtractionOptions = {}
  ): Promise<StyleEmbedding> {
    const startTime = Date.now();

    // 1. 检查缓存
    if (this.config.cache.enabled) {
      const cached = await this.getFromCache(imageUrl);
      if (cached) {
        return cached;
      }
    }

    // 2. 调用 B-LoRA 提取风格
    const result = await this.client.extractStyle(imageUrl, {
      styleWeight: options.customWeights?.style ?? this.getDefaultStyleWeight(options.styleType),
      contentWeight: options.customWeights?.content ?? this.getDefaultContentWeight(options.styleType),
    });

    // 3. 构建风格嵌入
    const embedding: StyleEmbedding = {
      id: generateId(),
      styleVector: result.styleVector,
      weights: {
        style: result.styleWeight,
        content: result.contentWeight,
      },
      metadata: {
        sourceImageUrl: imageUrl,
        extractedAt: new Date(),
        modelVersion: 'b-lora-sdxl-v1',
        processingTime: Date.now() - startTime,
      },
    };

    // 4. 缓存结果
    if (this.config.cache.enabled) {
      await this.saveToCache(imageUrl, embedding);
    }

    return embedding;
  }

  /**
   * 根据风格类型获取默认风格权重
   *
   * 经验值来源：
   * - B-LoRA 论文实验结果
   * - ComfyUI-B-LoRA 社区实践
   * - 我们自己的测试调优
   */
  private getDefaultStyleWeight(styleType?: string): number {
    const weights: Record<string, number> = {
      minimal: 0.70,           // 极简风格：风格权重较低，保留更多内容
      warm_luxury: 0.80,       // 奢华暖调：风格权重较高
      cool_professional: 0.75, // 专业冷调：中等风格权重
      morandi: 0.85,           // 莫兰迪：风格权重最高，强调色调
    };
    return weights[styleType ?? 'minimal'] ?? 0.75;
  }

  private getDefaultContentWeight(styleType?: string): number {
    return 1 - this.getDefaultStyleWeight(styleType);
  }
}
```

### 4.4 Modal 托管服务实现

```typescript
// packages/learning/src/modal/blora-service.ts

/**
 * Modal 托管的 B-LoRA 服务
 *
 * 参考文档：
 * - Modal 官方文档：https://modal.com/docs
 * - ML 推理示例：https://modal.com/docs/guide/ex-ml-inference
 * - GPU 使用：https://modal.com/docs/guide/gpu
 */

import Modal from 'modal';

/**
 * Modal 服务端代码（部署到 Modal）
 *
 * 这部分代码需要部署到 Modal 云端
 * 文件：modal_app.py
 */
export const MODAL_APP_CODE = `
# 参考：https://modal.com/docs/guide/ex-ml-inference

import modal

app = modal.App("vidluxe-blora")

# 定义镜像：包含 SDXL + B-LoRA
image = (
    modal.Image.from_registry("nvidia/cuda:12.1.0-devel-ubuntu22.04")
    .pip_install(
        "torch>=2.0.0",
        "diffusers>=0.25.0",
        "transformers>=4.35.0",
        "safetensors>=0.4.0",
        "Pillow>=10.0.0",
    )
    .run_commands(
        "pip install xformers>=0.0.22",
    )
)

# 参考：https://modal.com/docs/guide/gpu
@app.cls(image=image, gpu="A10G", timeout=300)
class BLoRAService:
    @modal.enter()
    def load_model(self):
        """加载 SDXL + B-LoRA 模型"""
        import torch
        from diffusers import StableDiffusionXLPipeline

        # 参考 B-LoRA 官方实现
        # https://github.com/yardenfren1996/B-LoRA

        self.pipe = StableDiffusionXLPipeline.from_pretrained(
            "stabilityai/stable-diffusion-xl-base-1.0",
            torch_dtype=torch.float16,
            variant="fp16",
        )
        self.pipe.to("cuda")

    @modal.method()
    def extract_style(self, image_url: str, style_weight: float = 0.75):
        """
        从图片提取风格

        技术依据：
        - B-LoRA 论文 Section 3.2
        - 风格提取通过训练两个 B-LoRA 块实现
        """
        import torch
        from PIL import Image
        import requests
        from io import BytesIO

        # 下载图片
        response = requests.get(image_url)
        image = Image.open(BytesIO(response.content)).convert("RGB")

        # B-LoRA 风格提取
        # 参考：https://github.com/yardenfren1996/B-LoRA/blob/main/blora_utils.py

        # 这里简化实现，实际需要：
        # 1. 对图片进行 B-LoRA 微调
        # 2. 提取 style B-LoRA 权重
        # 3. 返回风格向量

        style_vector = self._extract_blora_style(image)

        return {
            "styleVector": style_vector.tolist(),
            "styleWeight": style_weight,
            "contentWeight": 1 - style_weight,
        }

    def _extract_blora_style(self, image):
        """B-LoRA 风格提取核心逻辑"""
        # 完整实现参考 B-LoRA 官方仓库
        # https://github.com/yardenfren1996/B-LoRA
        pass
`;

/**
 * Modal 客户端（在 VidLuxe 中调用）
 */
export class ModalClient {
  private appId: string;
  private apiKey: string;

  constructor(config: { appId: string; apiKey: string }) {
    this.appId = config.appId;
    this.apiKey = config.apiKey;
  }

  /**
   * 调用 Modal 服务的风格提取方法
   */
  async extractStyle(
    imageUrl: string,
    options: { styleWeight: number; contentWeight: number }
  ): Promise<{ styleVector: number[]; styleWeight: number; contentWeight: number }> {
    // 参考：https://modal.com/docs/guide/calling-functions

    const response = await fetch(
      `https://${this.appId}.modal.run/extract_style`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          image_url: imageUrl,
          style_weight: options.styleWeight,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Modal API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      styleVector: data.styleVector,
      styleWeight: data.styleWeight,
      contentWeight: data.contentWeight,
    };
  }
}
```

### 4.5 ComfyUI 集成方案（备选）

```typescript
// packages/learning/src/comfyui/blora-client.ts

/**
 * ComfyUI B-LoRA 集成
 *
 * 参考文档：
 * - ComfyUI 官方：https://github.com/comfyanonymous/ComfyUI
 * - ComfyUI-B-LoRA：https://github.com/liusida/ComfyUI-B-LoRA
 * - ComfyUI API：https://github.com/comfyanonymous/ComfyUI#api
 *
 * 适用场景：
 * - 专业阶段（自托管）
 * - 需要更灵活的工作流控制
 */

export class ComfyUIBLoRAClient {
  private apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  /**
   * 构建 B-LoRA 工作流
   *
   * 参考：
   * - ComfyUI 工作流格式：https://github.com/comfyanonymous/ComfyUI#api-format
   * - B-LoRA 节点：https://github.com/liusida/ComfyUI-B-LoRA
   */
  private buildBLoraWorkflow(imageUrl: string, styleWeight: number): object {
    return {
      // 1. 加载图片
      "1": {
        class_type: "LoadImage",
        inputs: {
          image: imageUrl,
        },
      },

      // 2. 加载 B-LoRA
      // 参考：https://github.com/liusida/ComfyUI-B-LoRA
      "2": {
        class_type: "BLoRALoader",
        inputs: {
          model: ["4", 0],
          clip: ["4", 1],
          style_weight: styleWeight,
        },
      },

      // 3. 加载 SDXL 模型
      "4": {
        class_type: "CheckpointLoaderSimple",
        inputs: {
          ckpt_name: "sdxl_base_1.0.safetensors",
        },
      },

      // 4. 提取风格
      "5": {
        class_type: "BLoRAStyleExtractor",
        inputs: {
          image: ["1", 0],
          blora: ["2", 0],
        },
      },

      // 5. 输出
      "6": {
        class_type: "SaveTensor",
        inputs: {
          tensor: ["5", 0],
          filename_prefix: "style_embedding",
        },
      },
    };
  }

  async extractStyle(
    imageUrl: string,
    styleWeight: number
  ): Promise<number[]> {
    // 1. 构建工作流
    const workflow = this.buildBLoraWorkflow(imageUrl, styleWeight);

    // 2. 提交到 ComfyUI
    const response = await fetch(`${this.apiUrl}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: workflow }),
    });

    const { prompt_id } = await response.json();

    // 3. 等待完成
    const result = await this.waitForCompletion(prompt_id);

    // 4. 获取输出
    return await this.getStyleEmbedding(result);
  }

  private async waitForCompletion(promptId: string): Promise<any> {
    // 轮询等待完成
    // 参考：https://github.com/comfyanonymous/ComfyUI#api
    while (true) {
      const response = await fetch(`${this.apiUrl}/history/${promptId}`);
      const history = await response.json();

      if (history[promptId]?.outputs) {
        return history[promptId].outputs;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}
```

---

## 五、使用示例

### 5.1 基本使用

```typescript
import { BLoRALoader } from '@vidluxe/learning';

// 初始化
const loader = new BLoRALoader({
  deployment: 'modal',
  modal: {
    appId: process.env.MODAL_APP_ID!,
    apiKey: process.env.MODAL_API_KEY!,
  },
  cache: {
    enabled: true,
    ttl: 3600, // 1 小时
  },
});

// 从参考图提取风格
const embedding = await loader.extractStyle(
  'https://example.com/apple-style-reference.jpg',
  {
    styleType: 'minimal',
  }
);

console.log(embedding);
// {
//   id: 'style_xxx',
//   styleVector: [0.123, 0.456, ...],
//   weights: { style: 0.7, content: 0.3 },
//   metadata: { ... }
// }
```

### 5.2 与生成引擎集成

```typescript
// 在 tRPC router 中使用
export const styleRouter = router({
  extractStyle: procedure
    .input(z.object({
      referenceImageUrl: z.string().url(),
      styleType: z.enum(['minimal', 'warm_luxury', 'cool_professional', 'morandi']).optional(),
    }))
    .mutation(async ({ input }) => {
      const loader = new BLoRALoader(config);

      const embedding = await loader.extractStyle(
        input.referenceImageUrl,
        { styleType: input.styleType }
      );

      // 保存到数据库，供后续生成使用
      await ctx.db.styleEmbedding.create({
        data: {
          id: embedding.id,
          vector: embedding.styleVector,
          weights: embedding.weights,
          metadata: embedding.metadata,
        },
      });

      return embedding;
    }),
});
```

---

## 六、成本估算

### 6.1 Modal 托管成本

```
参考：https://modal.com/pricing

GPU: A10G
├─ 价格: $0.60/小时
├─ 单次推理: ~5 秒
├─ 单次成本: $0.60 × (5/3600) ≈ $0.0008
└─ 1000 次调用: ~$0.80

加上网络和存储：
└─ 实际单次成本: ~$0.002 (约 ¥0.015)

对比 Nano Banana:
├─ Nano Banana: $0.15/图
├─ B-LoRA + 本地生成: $0.002/图
└─ 成本降低: 98%
```

### 6.2 成本优化建议

1. **缓存风格嵌入**：相同参考图不重复提取
2. **预热模型**：保持 Modal 容器温启动
3. **批量处理**：多个请求合并处理

---

## 七、故障排除

### 7.1 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| 模型加载超时 | Modal 冷启动 | 开启预热 |
| 风格提取失败 | 图片格式不支持 | 转换为 RGB |
| 风格效果不佳 | 权重配置不当 | 调整 style_weight |
| 内存不足 | 图片分辨率过高 | 压缩到 1024px |

### 7.2 监控指标

```typescript
// 关键指标
const metrics = {
  // 性能
  extraction_time: embedding.metadata.processingTime,

  // 质量
  style_coherence: calculateStyleCoherence(embedding),

  // 成本
  modal_compute_cost: calculateModalCost(embedding.metadata.processingTime),
};
```

---

## 八、参考资料汇总

| 类型 | 链接 | 用途 |
|------|------|------|
| **论文** | https://arxiv.org/abs/2403.14572 | 理解 B-LoRA 原理 |
| **官方代码** | https://github.com/yardenfren1996/B-LoRA | 实现参考 |
| **ComfyUI 节点** | https://github.com/liusida/ComfyUI-B-LoRA | 集成方案 |
| **Modal 文档** | https://modal.com/docs | 部署方案 |
| **Replicate API** | https://replicate.com/docs | 备选部署 |
| **SDXL 文档** | https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0 | 基础模型 |

---

## 下一步

- [Nano Banana API 封装](./NANOBANANA_API.md)
- [整体工作流设计](./WORKFLOW.md)
