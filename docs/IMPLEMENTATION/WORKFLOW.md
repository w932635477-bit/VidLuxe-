# VidLuxe 整体工作流设计

> **版本**: 1.0
> **更新日期**: 2026-02-16
> **状态**: MVP 阶段

## 概述

本文档详细说明 VidLuxe 项目的端到端工作流设计，整合 B-LoRA 风格学习、Nano Banana 素材生成、MODNet 抠像和 Remotion 视频合成为完整的视频高级化处理流程。

---

## 1. 工作流架构

### 1.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        VidLuxe 视频高级化工作流                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│  │  用户    │───▶│ 风格    │───▶│ 素材    │───▶│  抠像   │───▶│  合成   │  │
│  │  输入    │    │  学习   │    │  生成   │    │  处理   │    │  输出   │  │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘  │
│       │              │              │              │              │        │
│       ▼              ▼              ▼              ▼              ▼        │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│  │ 视频+   │    │ B-LoRA  │    │ Nano    │    │ MODNet  │    │ Remotion│  │
│  │ 参考图  │    │ 风格提取 │    │ Banana  │    │ 人物抠像 │    │ Lambda  │  │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        数据存储层                                    │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │   │
│  │  │ Supabase │  │   R2/    │  │  Redis   │  │ pgvector │            │   │
│  │  │ (主数据)  │  │   S3     │  │  (缓存)  │  │ (向量)   │            │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 阶段划分

```yaml
阶段 1 - 风格学习:
  输入: 参考图片（用户上传或从视频提取）
  处理: B-LoRA 提取风格特征
  输出: 风格向量/LoRA 权重
  时间: ~5-10秒

阶段 2 - 素材生成:
  输入: 风格特征 + Prompt 模板
  处理: Nano Banana 生成背景/卡片
  输出: 背景图、文字卡片、装饰素材
  时间: ~5-15秒/张

阶段 3 - 人物抠像:
  输入: 原始视频帧
  处理: MODNet 逐帧抠像
  输出: 带透明通道的视频帧
  时间: ~30秒-2分钟（30秒视频）

阶段 4 - 视频合成:
  输入: 背景 + 抠像视频 + 文字卡片
  处理: Remotion Lambda 渲染
  输出: 最终高级化视频
  时间: ~1-3分钟
```

---

## 2. 详细工作流

### 2.1 场景一：口播视频高级化

```
┌──────────────────────────────────────────────────────────────────┐
│                    口播视频高级化工作流                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Step 1: 上传与预处理                                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 用户上传:                                                 │   │
│  │   - 原始口播视频 (MP4, MOV)                              │   │
│  │   - 参考风格图片 (可选)                                   │   │
│  │                                                           │   │
│  │ 预处理:                                                   │   │
│  │   - 视频格式转换                                          │   │
│  │   - 帧率标准化 (30fps)                                    │   │
│  │   - 分辨率调整 (1080x1920)                                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                      │
│                           ▼                                      │
│  Step 2: 风格学习                                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 如果有参考图:                                             │   │
│  │   → B-LoRA 提取风格                                      │   │
│  │   → 生成风格描述 (colorTone, lighting, mood)             │   │
│  │                                                           │   │
│  │ 如果没有参考图:                                           │   │
│  │   → 从视频关键帧提取风格                                  │   │
│  │   → 或使用预设风格模板                                    │   │
│  │                                                           │   │
│  │ 输出: StyleProfile { colors, lighting, mood, texture }   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                      │
│                           ▼                                      │
│  Step 3: 素材生成                                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 并行生成:                                                 │   │
│  │                                                           │   │
│  │ [A] 背景图                                                │   │
│  │     Prompt: buildBackgroundPrompt(style)                  │   │
│  │     → Nano Banana API                                     │   │
│  │     → 背景图 1080x1920                                    │   │
│  │                                                           │   │
│  │ [B] 文字卡片 (可选)                                       │   │
│  │     Prompt: buildTextCardPrompt(style)                    │   │
│  │     → Nano Banana API                                     │   │
│  │     → 文字卡片 1080x1920                                  │   │
│  │                                                           │   │
│  │ [C] 装饰元素 (可选)                                       │   │
│  │     → 渐变遮罩、边框等                                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                      │
│                           ▼                                      │
│  Step 4: 人物抠像                                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 处理流程:                                                 │   │
│  │                                                           │   │
│  │ [A] 视频抽帧 (每5帧取1帧)                                 │   │
│  │     → 降低处理量 80%                                      │   │
│  │                                                           │   │
│  │ [B] 批量抠像                                              │   │
│  │     → MODNet API / Modal                                  │   │
│  │     → 生成 Alpha 遮罩                                     │   │
│  │                                                           │   │
│  │ [C] 帧间平滑                                              │   │
│  │     → 光流插值填充                                        │   │
│  │     → 边缘优化                                            │   │
│  │                                                           │   │
│  │ 输出: 带透明通道的视频帧序列                              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                      │
│                           ▼                                      │
│  Step 5: 视频合成                                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Remotion 合成:                                            │   │
│  │                                                           │   │
│  │ 图层结构:                                                 │   │
│  │   ┌─────────────────────┐                                │   │
│  │   │  [Top] 效果层       │ ← 色彩调整、暗角               │   │
│  │   ├─────────────────────┤                                │   │
│  │   │  文字叠加层         │ ← 标题、字幕、引用             │   │
│  │   ├─────────────────────┤                                │   │
│  │   │  人物层             │ ← 抠像后的视频                 │   │
│  │   ├─────────────────────┤                                │   │
│  │   │  [Bottom] 背景层    │ ← Nano Banana 生成的背景       │   │
│  │   └─────────────────────┘                                │   │
│  │                                                           │   │
│  │ Lambda 渲染:                                              │   │
│  │   → 并行处理帧                                            │   │
│  │   → H.264 编码                                            │   │
│  │   → 上传到 R2/S3                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                      │
│                           ▼                                      │
│  Step 6: 输出与交付                                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 输出:                                                     │   │
│  │   - 高级化视频 MP4 (1080x1920)                           │   │
│  │   - 生成报告 (Before/After 对比)                         │   │
│  │   - 所用素材包 (可下载)                                  │   │
│  │                                                           │   │
│  │ 交付:                                                     │   │
│  │   - CDN 分发链接                                          │   │
│  │   - 社交媒体直出尺寸 (可选)                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 场景二：产品展示视频

```
┌──────────────────────────────────────────────────────────────────┐
│                    产品展示视频工作流                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Step 1: 产品信息输入                                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 输入:                                                     │   │
│  │   - 产品图片 (多角度)                                     │   │
│  │   - 产品文案                                              │   │
│  │   - 品牌风格指南 (可选)                                   │   │
│  │   - 目标平台 (小红书/抖音/Instagram)                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                      │
│                           ▼                                      │
│  Step 2: 场景设计                                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 基于产品类型选择场景:                                     │   │
│  │                                                           │   │
│  │ - 护肤品 → 自然清新场景                                   │   │
│  │ - 电子产品 → 现代科技场景                                 │   │
│  │ - 时尚配饰 → 奢华优雅场景                                 │   │
│  │ - 食品饮料 → 温暖诱人场景                                 │   │
│  │                                                           │   │
│  │ 输出: SceneTemplate { background, lighting, props }      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                      │
│                           ▼                                      │
│  Step 3: 素材生成                                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 生成内容:                                                 │   │
│  │                                                           │   │
│  │ [A] 产品背景                                              │   │
│  │     → 根据场景模板生成                                    │   │
│  │     → 预留产品位置（负空间）                              │   │
│  │                                                           │   │
│  │ [B] 装饰元素                                              │   │
│  │     → 渐变、光效、粒子等                                  │   │
│  │                                                           │   │
│  │ [C] 文字动画                                              │   │
│  │     → 产品名称、卖点、CTA                                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                      │
│                           ▼                                      │
│  Step 4: 产品抠像与合成                                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ [A] 产品抠像                                              │   │
│  │     → MODNet 或 RMBG-1.4                                  │   │
│  │     → 保留产品边缘细节                                    │   │
│  │                                                           │   │
│  │ [B] 合成到背景                                            │   │
│  │     → 匹配光照方向                                        │   │
│  │     → 添加阴影效果                                        │   │
│  │     → 调整透视关系                                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                      │
│                           ▼                                      │
│  Step 5: 动画与输出                                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 动画效果:                                                 │   │
│  │   - 产品入场动画                                          │   │
│  │   - 文字淡入淡出                                          │   │
│  │   - 光效扫过                                              │   │
│  │   - 整体微动 (呼吸感)                                     │   │
│  │                                                           │   │
│  │ 输出格式:                                                 │   │
│  │   - 主视频 1080x1920                                      │   │
│  │   - 方形版 1080x1080                                      │   │
│  │   - GIF 预览                                              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. 代码实现

### 3.1 工作流编排器

```typescript
// packages/core/src/workflow/orchestrator.ts

import { BLoRALoader } from '@vidluxe/learning';
import { NanoBananaClient, AssetGenerator } from '@vidluxe/generator';
import { SegmenterFactory } from '@vidluxe/generator';
import { RemotionLambdaClient } from '@vidluxe/generator';
import type { VideoTemplateConfig } from '@vidluxe/remotion-templates';

/**
 * 工作流配置
 */
export interface WorkflowConfig {
  // 风格学习配置
  styleLearning: {
    provider: 'blora' | 'preset';
    preset?: string;
  };

  // 素材生成配置
  assetGeneration: {
    provider: 'nano-banana' | 'sdxl';
    concurrency: number;
  };

  // 抠像配置
  segmentation: {
    provider: 'replicate' | 'modal';
    frameSkip: number; // 每 N 帧处理 1 帧
  };

  // 视频合成配置
  composition: {
    template: 'PremiumTalkingVideo' | 'ProductShowcase' | 'TextCardVideo';
    quality: 'standard' | 'high';
  };
}

/**
 * 工作流输入
 */
export interface WorkflowInput {
  // 原始视频
  videoUrl: string;

  // 参考图片（可选）
  referenceImageUrl?: string;

  // 风格预设（可选）
  stylePreset?: string;

  // 文字内容（可选）
  textContent?: {
    title?: string;
    subtitle?: string;
    quotes?: string[];
  };

  // 输出配置
  output: {
    width: number;
    height: number;
    fps: number;
    format: 'mp4' | 'webm';
  };
}

/**
 * 工作流输出
 */
export interface WorkflowOutput {
  // 最终视频
  videoUrl: string;

  // 素材包
  assets: {
    backgrounds: string[];
    cards: string[];
    masks: string[];
  };

  // 处理报告
  report: {
    processingTimeMs: number;
    stages: StageReport[];
  };
}

interface StageReport {
  name: string;
  durationMs: number;
  status: 'success' | 'failed';
  details?: Record<string, unknown>;
}

/**
 * VidLuxe 工作流编排器
 */
export class WorkflowOrchestrator {
  private bLoRALoader: BLoRALoader;
  private nanoBananaClient: NanoBananaClient;
  private assetGenerator: AssetGenerator;
  private segmenter: ReturnType<typeof SegmenterFactory.create>;
  private remotionClient: RemotionLambdaClient;

  constructor(config: WorkflowConfig) {
    // 初始化各组件
    this.bLoRALoader = new BLoRALoader({});

    this.nanoBananaClient = new NanoBananaClient({
      apiKey: process.env.NANO_BANANA_API_KEY!,
    });

    this.assetGenerator = new AssetGenerator({
      client: this.nanoBananaClient,
    });

    this.segmenter = SegmenterFactory.create({
      provider: config.segmentation.provider,
      apiKey: process.env.SEGMENTER_API_KEY!,
    });

    this.remotionClient = new RemotionLambdaClient({
      region: process.env.AWS_REGION!,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      functionName: process.env.REMOTION_FUNCTION_NAME!,
      bucketName: process.env.REMOTION_BUCKET_NAME!,
    });
  }

  /**
   * 执行完整工作流
   */
  async execute(
    input: WorkflowInput,
    onProgress?: (stage: string, progress: number) => void
  ): Promise<WorkflowOutput> {
    const startTime = Date.now();
    const stages: StageReport[] = [];

    // ========== Stage 1: 风格学习 ==========
    onProgress?.('style-learning', 0);
    const styleProfile = await this.executeStage(
      'style-learning',
      () => this.learnStyle(input),
      stages
    );
    onProgress?.('style-learning', 1);

    // ========== Stage 2: 素材生成 ==========
    onProgress?.('asset-generation', 0);
    const assets = await this.executeStage(
      'asset-generation',
      () => this.generateAssets(styleProfile, input),
      stages
    );
    onProgress?.('asset-generation', 1);

    // ========== Stage 3: 人物抠像 ==========
    onProgress?.('segmentation', 0);
    const segmentedVideo = await this.executeStage(
      'segmentation',
      () => this.segmentVideo(input.videoUrl, (p) => {
        onProgress?.('segmentation', p);
      }),
      stages
    );
    onProgress?.('segmentation', 1);

    // ========== Stage 4: 视频合成 ==========
    onProgress?.('composition', 0);
    const finalVideo = await this.executeStage(
      'composition',
      () => this.composeVideo(assets, segmentedVideo, input),
      stages
    );
    onProgress?.('composition', 1);

    return {
      videoUrl: finalVideo.url,
      assets: {
        backgrounds: assets.backgrounds.map(a => a.url),
        cards: assets.cards.map(a => a.url),
        masks: [],
      },
      report: {
        processingTimeMs: Date.now() - startTime,
        stages,
      },
    };
  }

  /**
   * 执行单个阶段
   */
  private async executeStage<T>(
    name: string,
    fn: () => Promise<T>,
    stages: StageReport[]
  ): Promise<T> {
    const stageStart = Date.now();

    try {
      const result = await fn();

      stages.push({
        name,
        durationMs: Date.now() - stageStart,
        status: 'success',
      });

      return result;
    } catch (error) {
      stages.push({
        name,
        durationMs: Date.now() - stageStart,
        status: 'failed',
        details: { error: String(error) },
      });

      throw error;
    }
  }

  /**
   * Stage 1: 风格学习
   */
  private async learnStyle(input: WorkflowInput): Promise<StyleProfile> {
    if (input.referenceImageUrl) {
      // 从参考图学习风格
      const styleVector = await this.bLoRALoader.extractStyle(
        input.referenceImageUrl
      );

      return {
        source: 'reference',
        colors: styleVector.colors,
        lighting: styleVector.lighting,
        mood: styleVector.mood,
        texture: styleVector.texture,
      };
    } else if (input.stylePreset) {
      // 使用预设风格
      return this.getPresetStyle(input.stylePreset);
    } else {
      // 默认风格
      return this.getDefaultStyle();
    }
  }

  /**
   * Stage 2: 素材生成
   */
  private async generateAssets(
    style: StyleProfile,
    input: WorkflowInput
  ): Promise<GeneratedAssets> {
    // 并行生成背景和卡片
    const [backgrounds, cards] = await Promise.all([
      // 背景图生成
      this.assetGenerator.generateBackground({
        style,
        count: 3,
        aspectRatio: '9:16',
      }),

      // 文字卡片生成（如果有文字内容）
      input.textContent?.quotes?.length
        ? this.assetGenerator.generateCards({
            style,
            texts: input.textContent.quotes,
            aspectRatio: '9:16',
          })
        : Promise.resolve([]),
    ]);

    return { backgrounds, cards };
  }

  /**
   * Stage 3: 视频抠像
   */
  private async segmentVideo(
    videoUrl: string,
    onProgress: (progress: number) => void
  ): Promise<SegmentedVideo> {
    // 1. 下载视频
    const videoBuffer = await this.downloadVideo(videoUrl);
    onProgress(0.1);

    // 2. 提取帧
    const frames = await this.extractFrames(videoBuffer);
    onProgress(0.2);

    // 3. 抽帧处理（每 5 帧处理 1 帧）
    const keyFrames = frames.filter((_, i) => i % 5 === 0);

    // 4. 批量抠像
    const masks = await this.segmenter.segmentBatch(
      keyFrames,
      4 // 并发数
    );
    onProgress(0.8);

    // 5. 插值填充中间帧
    const allMasks = this.interpolateMasks(masks, frames.length);
    onProgress(0.9);

    // 6. 合成带透明通道的视频
    const outputUrl = await this.composeTransparentVideo(frames, allMasks);
    onProgress(1.0);

    return { url: outputUrl, frames: frames.length };
  }

  /**
   * Stage 4: 视频合成
   */
  private async composeVideo(
    assets: GeneratedAssets,
    segmentedVideo: SegmentedVideo,
    input: WorkflowInput
  ): Promise<{ url: string }> {
    // 构建 Remotion 输入
    const compositionInput = {
      background: {
        type: 'image' as const,
        source: assets.backgrounds[0].url,
      },
      personLayer: {
        videoUrl: segmentedVideo.url,
        position: { x: 50, y: 50 },
        scale: 1.0,
      },
      textLayers: input.textContent?.quotes?.map((text, i) => ({
        content: text,
        style: {
          fontFamily: 'Inter',
          fontSize: 48,
          fontWeight: 400,
          color: '#FFFFFF',
        },
        animation: {
          type: 'fade' as const,
          duration: 30,
          easing: 'ease-out' as const,
        },
        timing: {
          startFrame: 30 + i * 60,
          endFrame: 90 + i * 60,
        },
      })) || [],
      effects: {
        colorGrade: { preset: 'cinematic' as const, intensity: 0.5 },
        lighting: {
          vignette: true,
          vignetteIntensity: 0.3,
          glowEffect: false,
          glowRadius: 0,
        },
        motion: {
          smoothCamera: true,
          parallaxLayers: false,
          depthOfField: false,
        },
      },
    };

    // 渲染视频
    const { renderId, bucketName } = await this.remotionClient.renderVideo(
      'PremiumTalkingVideo',
      { input: compositionInput, effects: compositionInput.effects },
      {
        fps: input.output.fps,
        durationInFrames: Math.ceil(30 * input.output.fps), // 30秒
        width: input.output.width,
        height: input.output.height,
      }
    );

    // 等待渲染完成
    const result = await this.waitForRender(renderId, bucketName);

    return { url: result.outputUrl! };
  }

  // 辅助方法
  private getPresetStyle(preset: string): StyleProfile {
    // 预设风格映射
    const presets: Record<string, StyleProfile> = {
      minimal: {
        source: 'preset',
        colors: ['#FFFFFF', '#F5F5F5', '#333333'],
        lighting: 'soft',
        mood: 'calm',
        texture: 'smooth',
      },
      cinematic: {
        source: 'preset',
        colors: ['#1A1A2E', '#16213E', '#E94560'],
        lighting: 'dramatic',
        mood: 'sophisticated',
        texture: 'film',
      },
      // 更多预设...
    };

    return presets[preset] || presets.minimal;
  }

  private getDefaultStyle(): StyleProfile {
    return this.getPresetStyle('minimal');
  }

  private async downloadVideo(url: string): Promise<Buffer> {
    const response = await fetch(url);
    return Buffer.from(await response.arrayBuffer());
  }

  private async extractFrames(videoBuffer: Buffer): Promise<Buffer[]> {
    // 使用 FFmpeg 提取帧
    // 实现略...
    return [];
  }

  private interpolateMasks(
    keyMasks: Buffer[],
    totalFrames: number
  ): Buffer[] {
    // 光流插值
    // 实现略...
    return [];
  }

  private async composeTransparentVideo(
    frames: Buffer[],
    masks: Buffer[]
  ): Promise<string> {
    // FFmpeg 合成
    // 实现略...
    return '';
  }

  private async waitForRender(
    renderId: string,
    bucketName: string
  ): Promise<{ outputUrl?: string }> {
    // 轮询等待
    let attempts = 0;
    const maxAttempts = 180; // 3 分钟超时

    while (attempts < maxAttempts) {
      const progress = await this.remotionClient.getProgress(
        renderId,
        bucketName
      );

      if (progress.status === 'done') {
        return { outputUrl: progress.outputUrl };
      }

      if (progress.status === 'failed') {
        throw new Error('Render failed');
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    throw new Error('Render timeout');
  }
}

// 类型定义
interface StyleProfile {
  source: 'reference' | 'preset' | 'default';
  colors: string[];
  lighting: 'soft' | 'dramatic' | 'natural';
  mood: 'calm' | 'sophisticated' | 'energetic';
  texture: string;
}

interface GeneratedAssets {
  backgrounds: Array<{ url: string }>;
  cards: Array<{ url: string }>;
}

interface SegmentedVideo {
  url: string;
  frames: number;
}
```

### 3.2 API 路由

```typescript
// apps/web/app/api/enhance/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { WorkflowOrchestrator, WorkflowInput } from '@vidluxe/core';
import { z } from 'zod';

const EnhanceRequestSchema = z.object({
  videoUrl: z.string().url(),
  referenceImageUrl: z.string().url().optional(),
  stylePreset: z.enum(['minimal', 'cinematic', 'luxury']).optional(),
  textContent: z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    quotes: z.array(z.string()).optional(),
  }).optional(),
  output: z.object({
    width: z.number().default(1080),
    height: z.number().default(1920),
    fps: z.number().default(30),
    format: z.enum(['mp4', 'webm']).default('mp4'),
  }).default({}),
});

// 活跃任务存储（生产环境应使用 Redis）
const activeTasks = new Map<string, WorkflowOrchestrator>();

/**
 * POST /api/enhance
 *
 * 启动视频高级化任务
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = EnhanceRequestSchema.parse(body);

    // 创建任务 ID
    const taskId = crypto.randomUUID();

    // 创建工作流编排器
    const orchestrator = new WorkflowOrchestrator({
      styleLearning: { provider: input.referenceImageUrl ? 'blora' : 'preset' },
      assetGeneration: { provider: 'nano-banana', concurrency: 4 },
      segmentation: { provider: 'replicate', frameSkip: 5 },
      composition: { template: 'PremiumTalkingVideo', quality: 'high' },
    });

    // 存储任务
    activeTasks.set(taskId, orchestrator);

    // 异步执行
    orchestrator.execute(input as WorkflowInput, (stage, progress) => {
      // 更新进度到 Redis 或其他存储
      console.log(`Task ${taskId}: ${stage} - ${progress * 100}%`);
    }).then(result => {
      // 存储结果
      console.log(`Task ${taskId} completed:`, result.videoUrl);
    }).catch(error => {
      console.error(`Task ${taskId} failed:`, error);
    }).finally(() => {
      activeTasks.delete(taskId);
    });

    return NextResponse.json({
      success: true,
      taskId,
      estimatedTime: 180, // 预估 3 分钟
    });
  } catch (error) {
    console.error('Enhance error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to start enhancement' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/enhance?taskId=xxx
 *
 * 查询任务状态
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('taskId');

  if (!taskId) {
    return NextResponse.json(
      { error: 'Missing taskId' },
      { status: 400 }
    );
  }

  // 从 Redis 获取任务状态
  // 实际实现中应使用 Redis 或数据库
  const task = activeTasks.get(taskId);

  if (!task) {
    return NextResponse.json({
      success: false,
      error: 'Task not found or completed',
    });
  }

  return NextResponse.json({
    success: true,
    status: 'processing',
    progress: 0, // 从存储中获取
  });
}
```

---

## 4. 性能优化

### 4.1 并行处理策略

```typescript
// packages/core/src/workflow/parallel-processor.ts

/**
 * 并行处理器
 */
export class ParallelProcessor {
  /**
   * 并行执行多个独立任务
   */
  static async parallel<T, R>(
    items: T[],
    fn: (item: T) => Promise<R>,
    concurrency: number
  ): Promise<R[]> {
    const results: R[] = [];
    const executing: Promise<void>[] = [];

    for (const item of items) {
      const promise = fn(item).then(result => {
        results.push(result);
      });

      executing.push(promise);

      if (executing.length >= concurrency) {
        await Promise.race(executing);
        // 移除已完成的
        executing.filter(async p => {
          try {
            await p;
            return false;
          } catch {
            return false;
          }
        });
      }
    }

    await Promise.all(executing);
    return results;
  }
}
```

### 4.2 缓存策略

```typescript
// packages/core/src/workflow/cache.ts

import { Redis } from '@upstash/redis';

/**
 * 工作流缓存
 */
export class WorkflowCache {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  /**
   * 缓存风格学习结果
   *
   * Key: style:{imageHash}
   * TTL: 7 天
   */
  async cacheStyle(imageHash: string, style: StyleProfile): Promise<void> {
    await this.redis.setex(
      `style:${imageHash}`,
      7 * 24 * 60 * 60,
      JSON.stringify(style)
    );
  }

  async getStyle(imageHash: string): Promise<StyleProfile | null> {
    const cached = await this.redis.get(`style:${imageHash}`);
    return cached as StyleProfile | null;
  }

  /**
   * 缓存生成的素材
   *
   * Key: asset:{promptHash}
   * TTL: 30 天
   */
  async cacheAsset(promptHash: string, assetUrl: string): Promise<void> {
    await this.redis.setex(
      `asset:${promptHash}`,
      30 * 24 * 60 * 60,
      assetUrl
    );
  }

  async getAsset(promptHash: string): Promise<string | null> {
    return this.redis.get(`asset:${promptHash}`);
  }
}
```

---

## 5. 错误处理与重试

### 5.1 错误类型

```typescript
// packages/core/src/workflow/errors.ts

export enum WorkflowErrorCode {
  // 输入错误
  INVALID_INPUT = 'INVALID_INPUT',
  VIDEO_TOO_LARGE = 'VIDEO_TOO_LARGE',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',

  // 处理错误
  STYLE_LEARNING_FAILED = 'STYLE_LEARNING_FAILED',
  ASSET_GENERATION_FAILED = 'ASSET_GENERATION_FAILED',
  SEGMENTATION_FAILED = 'SEGMENTATION_FAILED',
  COMPOSITION_FAILED = 'COMPOSITION_FAILED',

  // 系统错误
  API_RATE_LIMIT = 'API_RATE_LIMIT',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
}

export class WorkflowError extends Error {
  constructor(
    public code: WorkflowErrorCode,
    message: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'WorkflowError';
  }
}
```

### 5.2 重试策略

```typescript
// packages/core/src/workflow/retry.ts

/**
 * 重试策略
 */
export class RetryStrategy {
  /**
   * 指数退避重试
   */
  static async withRetry<T>(
    fn: () => Promise<T>,
    options: {
      maxRetries: number;
      initialDelayMs: number;
      maxDelayMs: number;
      backoffFactor: number;
    }
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < options.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // 检查是否可重试
        if (error instanceof WorkflowError && !error.retryable) {
          throw error;
        }

        // 计算延迟
        const delay = Math.min(
          options.initialDelayMs * Math.pow(options.backoffFactor, attempt),
          options.maxDelayMs
        );

        console.warn(
          `Attempt ${attempt + 1} failed, retrying in ${delay}ms:`,
          error
        );

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }
}
```

---

## 6. 监控与日志

### 6.1 监控指标

```yaml
关键指标:
  # 延迟
  - workflow.total_duration_ms
  - workflow.style_learning_duration_ms
  - workflow.asset_generation_duration_ms
  - workflow.segmentation_duration_ms
  - workflow.composition_duration_ms

  # 错误率
  - workflow.error_rate
  - workflow.retry_rate

  # 资源使用
  - workflow.active_tasks
  - workflow.queue_size

  # 成本
  - workflow.nano_banana_cost
  - workflow.remotion_cost
  - workflow.total_cost_per_video
```

### 6.2 日志规范

```typescript
// packages/core/src/workflow/logger.ts

import { nanoid } from 'nanoid';

interface LogEntry {
  timestamp: string;
  traceId: string;
  taskId: string;
  stage: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  metadata?: Record<string, unknown>;
}

/**
 * 工作流日志器
 */
export class WorkflowLogger {
  private traceId: string;
  private taskId: string;

  constructor(taskId: string) {
    this.traceId = nanoid();
    this.taskId = taskId;
  }

  info(stage: string, message: string, metadata?: Record<string, unknown>): void {
    this.log('info', stage, message, metadata);
  }

  warn(stage: string, message: string, metadata?: Record<string, unknown>): void {
    this.log('warn', stage, message, metadata);
  }

  error(stage: string, message: string, metadata?: Record<string, unknown>): void {
    this.log('error', stage, message, metadata);
  }

  private log(
    level: LogEntry['level'],
    stage: string,
    message: string,
    metadata?: Record<string, unknown>
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      traceId: this.traceId,
      taskId: this.taskId,
      stage,
      level,
      message,
      metadata,
    };

    // 输出到控制台（生产环境应发送到日志服务）
    console.log(JSON.stringify(entry));
  }
}
```

---

## 7. 成本估算

### 7.1 MVP 阶段成本

```yaml
单视频处理成本:

  风格学习:
    - B-LoRA (Modal): ~$0.01

  素材生成:
    - Nano Banana (3张背景): ~$0.015
    - Nano Banana (2张卡片): ~$0.01

  人物抠像:
    - Replicate (抽帧处理): ~$0.18

  视频合成:
    - Remotion Lambda: ~$0.05

  存储/带宽:
    - R2 存储: ~$0.01
    - CDN 带宽: ~$0.01

  总计: ~$0.29/视频 (约 ¥2.1)
```

### 7.2 成本优化建议

```yaml
优化策略:
  1. 抽帧处理:
     - 每 5 帧处理 1 帧
     - 节省 80% 抠像成本

  2. 缓存复用:
     - 相似风格复用生成结果
     - 节省 20-30% 生成成本

  3. 批量处理:
     - 夜间批量处理
     - 利用 Spot 实例
     - 节省 40-50% 计算成本

  4. 渐进式迁移:
     - 标准阶段迁移到 Modal
     - 抠像成本降低 90%
```

---

## 8. 参考资源

### 相关文档

| 文档 | 链接 |
|------|------|
| B-LoRA 集成 | [BLORA_INTEGRATION.md](./BLORA_INTEGRATION.md) |
| Nano Banana API | [NANOBANANA_API.md](./NANOBANANA_API.md) |
| Remotion 模板 | [REMOTION_TEMPLATES.md](./REMOTION_TEMPLATES.md) |
| MODNet 抠像 | [MODNET_INTEGRATION.md](./MODNET_INTEGRATION.md) |
| Prompt 工程 | [PROMPT_ENGINEERING.md](./PROMPT_ENGINEERING.md) |

### 外部资源

| 资源 | 链接 |
|------|------|
| Temporal (工作流引擎) | https://temporal.io/ |
| BullMQ (任务队列) | https://docs.bullmq.io/ |
| Serverless 工作流 | https://www.serverless.com/workflow |

---

## 更新历史

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-02-16 | 1.0 | 初始版本 |
