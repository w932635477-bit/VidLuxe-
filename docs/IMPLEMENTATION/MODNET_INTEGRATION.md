# MODNet 抠像集成文档

> **版本**: 1.0
> **更新日期**: 2026-02-16
> **状态**: MVP 阶段

## 概述

本文档详细说明 VidLuxe 项目中 MODNet 人物抠像的集成方案，包括本地部署、API 调用和视频处理流程。

## 官方资源

| 资源 | 链接 |
|------|------|
| **官方仓库** | https://github.com/ZHKKKe/MODNet |
| **论文** | [Real-Time High-Resolution Background Matting (CVPR 2021)](https://arxiv.org/abs/2011.11961) |
| **ONNX 模型** | https://github.com/ZHKKKe/MODNet#onnx-inference |
| **Demo 页面** | https://huggingface.co/spaces/akhaliq/modnet |

---

## 1. MODNet 技术概述

### 1.1 什么是 MODNet？

MODNet (Matting Objective Diminution Network) 是一个实时高分辨率背景抠像模型，能够从图像/视频中精准地分离前景人物。

**来源**: [MODNet 论文](https://arxiv.org/abs/2011.11961)

```yaml
核心特点:
  - 实时处理: 30+ FPS @ 512x512
  - 高精度: 语义分割 + 细节抠像
  - 无需绿幕: 适用于任意背景
  - 轻量级: ~25MB (ONNX)
```

### 1.2 技术架构

```
MODNet 架构:
┌─────────────────────────────────────────────────────────────┐
│                      Input Image                            │
│                    (H x W x 3)                              │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Encoder (MobileNetV2)                     │
│                 - 特征提取                                   │
│                 - 下采样 1/4, 1/8, 1/16                      │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │ Semantic │   │  Detail  │   │  Fusion  │
    │  Module  │   │  Module  │   │  Module  │
    │ (粗分割)  │   │ (边缘细化) │   │ (结果融合) │
    └────┬─────┘   └────┬─────┘   └────┬─────┘
         │              │              │
         └──────────────┼──────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │   Alpha Matte   │
              │   (H x W x 1)   │
              └─────────────────┘
```

**参考**: [MODNet GitHub - Architecture](https://github.com/ZHKKKe/MODNet#network-architecture)

---

## 2. 部署方案

### 2.1 MVP 阶段：API 调用（推荐）

MVP 阶段使用第三方 API 服务，降低部署复杂度。

#### 方案 A: Replicate MODNet

**来源**: [Replicate MODNet](https://replicate.com/cjwbw/modnet)

```typescript
// packages/generator/src/segmenter/replicate-modnet.ts

import Replicate from 'replicate';

/**
 * Replicate MODNet 客户端
 *
 * 文档：https://replicate.com/cjwbw/modnet
 * 价格：~$0.001/次
 */
export class ReplicateMODNetClient {
  private replicate: Replicate;
  private modelVersion: string;

  constructor(apiToken: string) {
    this.replicate = new Replicate({ auth: apiToken });
    // MODNet 模型版本
    this.modelVersion = 'db5c9c3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3';
  }

  /**
   * 抠像处理
   *
   * @param imageUrl - 输入图片 URL
   * @returns 遮罩图片 URL
   */
  async segment(imageUrl: string): Promise<string> {
    const output = await this.replicate.run(
      'cjwbw/modnet:db5c9c3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3',
      {
        input: {
          image: imageUrl,
        },
      }
    );

    return output as string;
  }

  /**
   * 视频逐帧处理
   *
   * 注意：此方法较慢，适合短视频
   */
  async segmentVideo(
    frames: string[],
    onProgress?: (progress: number) => void
  ): Promise<string[]> {
    const results: string[] = [];

    for (let i = 0; i < frames.length; i++) {
      const mask = await this.segment(frames[i]);
      results.push(mask);

      if (onProgress) {
        onProgress((i + 1) / frames.length);
      }
    }

    return results;
  }
}
```

#### 方案 B: Background Matting API

**来源**: [BackgroundMattingV2](https://github.com/PeterL1n/Background-Matting-V2)

```typescript
// packages/generator/src/segmenter/bgm-v2-client.ts

/**
 * BackgroundMattingV2 API 客户端
 *
 * 参考部署：
 * - Modal: https://modal.com/docs/examples/image-segmentation
 * - Replicate: https://replicate.com/peterl1n/background-matting-v2
 */
export class BGMV2Client {
  private apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  async segment(imageUrl: string, backgroundImageUrl?: string): Promise<string> {
    const response = await fetch(`${this.apiUrl}/matting`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: imageUrl,
        background: backgroundImageUrl,
      }),
    });

    const data = await response.json();
    return data.alpha_url;
  }
}
```

### 2.2 标准阶段：Modal 自部署

**来源**: [Modal - GPU Serverless](https://modal.com/)

```python
# packages/generator/segmenter/modal_modnet.py

import modal

# 定义 Modal 应用
app = modal.App("vidluxe-modnet")

# 定义镜像
image = (
    modal.Image.from_registry("python:3.10-slim")
    .pip_install(
        "onnxruntime-gpu>=1.16.0",
        "opencv-python-headless>=4.8.0",
        "numpy>=1.24.0",
        "pillow>=10.0.0",
    )
    .run_commands(
        "wget -O /app/modnet.onnx "
        "https://github.com/ZHKKKe/MODNet/releases/download/v1.0.0/modnet.onnx"
    )
)

# 定义 GPU 函数
@app.cls(image=image, gpu="T4", container_idle_timeout=300)
class MODNetService:
    @modal.enter()
    def load_model(self):
        """加载 ONNX 模型"""
        import onnxruntime as ort

        self.session = ort.InferenceSession(
            "/app/modnet.onnx",
            providers=['CUDAExecutionProvider', 'CPUExecutionProvider']
        )

    @modal.method()
    def segment(self, image_data: bytes) -> bytes:
        """
        执行抠像

        参考：https://github.com/ZHKKKe/MODNet#onnx-inference
        """
        import cv2
        import numpy as np
        from PIL import Image
        import io

        # 解码图片
        image = Image.open(io.BytesIO(image_data)).convert('RGB')
        image_np = np.array(image)

        # 预处理
        input_size = 512
        image_resized = cv2.resize(image_np, (input_size, input_size))
        image_normalized = (image_resized - 127.5) / 127.5
        image_transposed = np.transpose(image_normalized, (2, 0, 1))
        input_tensor = np.expand_dims(image_transposed, 0).astype(np.float32)

        # 推理
        input_name = self.session.get_inputs()[0].name
        output_name = self.session.get_outputs()[0].name
        matte = self.session.run([output_name], {input_name: input_tensor})[0]

        # 后处理
        matte = matte[0, 0]
        matte = cv2.resize(matte, (image.width, image.height))
        matte = (matte * 255).astype(np.uint8)

        # 编码输出
        output = Image.fromarray(matte)
        buffer = io.BytesIO()
        output.save(buffer, format='PNG')
        return buffer.getvalue()

# 本地入口
@app.local_entrypoint()
def main():
    """测试入口"""
    service = MODNetService()
    with open("test_image.jpg", "rb") as f:
        result = service.segment.remote(f.read())
    with open("output_mask.png", "wb") as f:
        f.write(result)
```

### 2.3 TypeScript 调用 Modal

```typescript
// packages/generator/src/segmenter/modal-modnet-client.ts

import axios from 'axios';

/**
 * Modal MODNet 客户端
 *
 * 文档：https://modal.com/docs/guide/http-endpoints
 */
export class ModalMODNetClient {
  private endpointUrl: string;
  private apiKey: string;

  constructor(config: { endpointUrl: string; apiKey: string }) {
    this.endpointUrl = config.endpointUrl;
    this.apiKey = config.apiKey;
  }

  /**
   * 处理单张图片
   */
  async segmentImage(imageBuffer: Buffer): Promise<Buffer> {
    const response = await axios.post(
      `${this.endpointUrl}/segment`,
      imageBuffer,
      {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        responseType: 'arraybuffer',
      }
    );

    return Buffer.from(response.data);
  }

  /**
   * 批量处理图片
   *
   * Modal 支持并发调用
   */
  async segmentBatch(
    images: Buffer[],
    concurrency = 4
  ): Promise<Buffer[]> {
    const results: Buffer[] = [];

    // 分批处理
    for (let i = 0; i < images.length; i += concurrency) {
      const batch = images.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map(img => this.segmentImage(img))
      );
      results.push(...batchResults);
    }

    return results;
  }
}
```

---

## 3. VidLuxe 集成实现

### 3.1 统一抠像接口

```typescript
// packages/generator/src/segmenter/types.ts

/**
 * 抠像结果
 */
export interface SegmentationResult {
  // Alpha 遮罩
  alphaMask: Buffer;

  // 带透明通道的前景图
  foreground?: Buffer;

  // 元数据
  metadata: {
    width: number;
    height: number;
    processingTimeMs: number;
  };
}

/**
 * 抠像器接口
 */
export interface Segmenter {
  segment(image: Buffer): Promise<SegmentationResult>;
  segmentBatch(images: Buffer[], concurrency?: number): Promise<SegmentationResult[]>;
}

/**
 * 抠像配置
 */
export interface SegmenterConfig {
  provider: 'replicate' | 'modal' | 'local';
  apiKey?: string;
  endpointUrl?: string;

  // 处理选项
  options?: {
    targetSize?: number; // 缩放到指定尺寸（提升速度）
    refineEdges?: boolean; // 边缘优化
    outputFormat?: 'png' | 'webp';
  };
}
```

### 3.2 抠像服务工厂

```typescript
// packages/generator/src/segmenter/factory.ts

import type { Segmenter, SegmenterConfig } from './types';
import { ReplicateMODNetClient } from './replicate-modnet';
import { ModalMODNetClient } from './modal-modnet-client';

/**
 * 抠像服务工厂
 *
 * 根据配置创建对应的抠像器实例
 */
export function createSegmenter(config: SegmenterConfig): Segmenter {
  switch (config.provider) {
    case 'replicate':
      if (!config.apiKey) {
        throw new Error('Replicate API key is required');
      }
      return new ReplicateSegmenter(config.apiKey);

    case 'modal':
      if (!config.endpointUrl || !config.apiKey) {
        throw new Error('Modal endpoint URL and API key are required');
      }
      return new ModalSegmenter(config.endpointUrl, config.apiKey);

    default:
      throw new Error(`Unknown segmenter provider: ${config.provider}`);
  }
}

/**
 * Replicate 抠像器实现
 */
class ReplicateSegmenter implements Segmenter {
  private client: ReplicateMODNetClient;

  constructor(apiKey: string) {
    this.client = new ReplicateMODNetClient(apiKey);
  }

  async segment(image: Buffer): Promise<SegmentationResult> {
    const startTime = Date.now();

    // 上传图片到临时存储获取 URL
    const imageUrl = await this.uploadImage(image);

    // 调用 Replicate API
    const maskUrl = await this.client.segment(imageUrl);

    // 下载遮罩
    const alphaMask = await this.downloadImage(maskUrl);

    return {
      alphaMask,
      metadata: {
        width: 0, // 从图片解析
        height: 0,
        processingTimeMs: Date.now() - startTime,
      },
    };
  }

  async segmentBatch(images: Buffer[], concurrency = 4): Promise<SegmentationResult[]> {
    const results: SegmentationResult[] = [];

    for (let i = 0; i < images.length; i += concurrency) {
      const batch = images.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map(img => this.segment(img))
      );
      results.push(...batchResults);
    }

    return results;
  }

  private async uploadImage(buffer: Buffer): Promise<string> {
    // 使用 S3/R2 上传图片并返回 URL
    // 实现略...
    return '';
  }

  private async downloadImage(url: string): Promise<Buffer> {
    const response = await fetch(url);
    return Buffer.from(await response.arrayBuffer());
  }
}

/**
 * Modal 抠像器实现
 */
class ModalSegmenter implements Segmenter {
  private client: ModalMODNetClient;

  constructor(endpointUrl: string, apiKey: string) {
    this.client = new ModalMODNetClient({ endpointUrl, apiKey });
  }

  async segment(image: Buffer): Promise<SegmentationResult> {
    const startTime = Date.now();

    const alphaMask = await this.client.segmentImage(image);

    return {
      alphaMask,
      metadata: {
        width: 0,
        height: 0,
        processingTimeMs: Date.now() - startTime,
      },
    };
  }

  async segmentBatch(images: Buffer[], concurrency = 4): Promise<SegmentationResult[]> {
    const startTime = Date.now();

    const masks = await this.client.segmentBatch(images, concurrency);

    return masks.map((mask, index) => ({
      alphaMask: mask,
      metadata: {
        width: 0,
        height: 0,
        processingTimeMs: Date.now() - startTime,
      },
    }));
  }
}
```

### 3.3 视频抠像处理

```typescript
// packages/generator/src/segmenter/video-segmenter.ts

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import type { Segmenter, SegmentationResult } from './types';

const execAsync = promisify(exec);

/**
 * 视频抠像处理器
 *
 * 处理流程：
 * 1. 提取视频帧
 * 2. 批量抠像处理
 * 3. 合成透明视频
 */
export class VideoSegmenter {
  private segmenter: Segmenter;
  private tempDir: string;

  constructor(segmenter: Segmenter, tempDir = '/tmp/vidluxe') {
    this.segmenter = segmenter;
    this.tempDir = tempDir;
  }

  /**
   * 处理视频
   *
   * @param videoPath - 输入视频路径
   * @param outputPath - 输出视频路径（带 Alpha 通道）
   */
  async segmentVideo(
    videoPath: string,
    outputPath: string,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    const sessionId = Date.now().toString();
    const workDir = path.join(this.tempDir, sessionId);

    try {
      // 1. 创建工作目录
      await fs.mkdir(workDir, { recursive: true });

      // 2. 提取帧
      onProgress?.(0.1);
      const frames = await this.extractFrames(videoPath, workDir);
      onProgress?.(0.2);

      // 3. 批量抠像
      const masks = await this.processFrames(frames, (p) => {
        onProgress?.(0.2 + p * 0.6);
      });

      // 4. 合成视频
      onProgress?.(0.85);
      await this.composeVideo(frames, masks, outputPath, workDir);

      onProgress?.(1.0);
    } finally {
      // 清理临时文件
      await fs.rm(workDir, { recursive: true, force: true });
    }
  }

  /**
   * 提取视频帧
   *
   * 使用 FFmpeg 提取
   */
  private async extractFrames(
    videoPath: string,
    workDir: string
  ): Promise<string[]> {
    const framesDir = path.join(workDir, 'frames');
    await fs.mkdir(framesDir);

    // FFmpeg 提取帧
    // 参考：https://ffmpeg.org/ffmpeg.html
    await execAsync(
      `ffmpeg -i "${videoPath}" -vsync 0 "${framesDir}/frame_%06d.png"`
    );

    // 获取帧列表
    const files = await fs.readdir(framesDir);
    return files
      .filter(f => f.endsWith('.png'))
      .sort()
      .map(f => path.join(framesDir, f));
  }

  /**
   * 批量处理帧
   */
  private async processFrames(
    framePaths: string[],
    onProgress?: (progress: number) => void
  ): Promise<Buffer[]> {
    const results: Buffer[] = [];
    const batchSize = 10;

    for (let i = 0; i < framePaths.length; i += batchSize) {
      const batch = framePaths.slice(i, i + batchSize);

      // 读取图片
      const images = await Promise.all(
        batch.map(p => fs.readFile(p))
      );

      // 批量抠像
      const segmentResults = await this.segmenter.segmentBatch(images, 4);
      results.push(...segmentResults.map(r => r.alphaMask));

      onProgress?.((i + batch.length) / framePaths.length);
    }

    return results;
  }

  /**
   * 合成透明视频
   *
   * 使用 FFmpeg 合成带 Alpha 通道的视频
   */
  private async composeVideo(
    framePaths: string[],
    masks: Buffer[],
    outputPath: string,
    workDir: string
  ): Promise<void> {
    const composedDir = path.join(workDir, 'composed');
    await fs.mkdir(composedDir);

    // 合成帧
    for (let i = 0; i < framePaths.length; i++) {
      const frame = await fs.readFile(framePaths[i]);
      const mask = masks[i];

      // 使用 ImageMagick 或 Sharp 合成
      // 这里简化处理，实际需要更复杂的合成逻辑
      const composed = await this.applyMask(frame, mask);
      await fs.writeFile(
        path.join(composedDir, `frame_${i.toString().padStart(6, '0')}.png`),
        composed
      );
    }

    // 获取原始视频信息
    const fps = await this.getVideoFps(framePaths.length, outputPath);

    // FFmpeg 合成视频（ProRes 4444 支持 Alpha）
    // 参考：https://trac.ffmpeg.org/wiki/Encode/ProRes
    await execAsync(
      `ffmpeg -framerate ${fps} -i "${composedDir}/frame_%06d.png" ` +
      `-c:v prores_ks -profile:v 4444 -pix_fmt yuva444p10le ` +
      `"${outputPath}"`
    );
  }

  /**
   * 应用遮罩
   */
  private async applyMask(image: Buffer, mask: Buffer): Promise<Buffer> {
    // 使用 Sharp 处理
    // 实现：将 mask 作为 alpha 通道合并到 image
    // 实际代码略...
    return image;
  }

  /**
   * 获取视频帧率
   */
  private async getVideoFps(frameCount: number, videoPath: string): Promise<number> {
    // 从原始视频获取帧率
    // 实际代码略...
    return 30;
  }
}
```

---

## 4. 边缘优化

### 4.1 边缘平滑处理

MODNet 生成的遮罩边缘可能有锯齿，需要进行平滑处理。

```typescript
// packages/generator/src/segmenter/edge-refinement.ts

import sharp from 'sharp';

/**
 * 边缘优化器
 *
 * 技术参考：
 * - 形态学操作: https://docs.opencv.org/4.x/d9/d61/tutorial_py_morphological_ops.html
 * - Alpha Matting: https://github.com/Alibaba/AlphaMate
 */
export class EdgeRefiner {
  /**
   * 平滑遮罩边缘
   *
   * @param mask - 原始遮罩
   * @param radius - 模糊半径
   */
  async refineEdge(mask: Buffer, radius = 2): Promise<Buffer> {
    // 高斯模糊平滑边缘
    const refined = await sharp(mask)
      .blur(radius)
      .threshold(128) // 二值化
      .blur(1) // 再次轻微模糊
      .png()
      .toBuffer();

    return refined;
  }

  /**
   * 形态学闭操作
   *
   * 填充遮罩中的小孔洞
   */
  async morphologicalClose(mask: Buffer, kernelSize = 3): Promise<Buffer> {
    // 使用 OpenCV.js 或自定义实现
    // 实际代码略...
    return mask;
  }

  /**
   * 边缘羽化
   *
   * 使边缘更自然
   */
  async featherEdge(mask: Buffer, featherWidth = 5): Promise<Buffer> {
    const image = sharp(mask);
    const { width, height } = await image.metadata();

    // 创建渐变遮罩
    const gradient = await sharp({
      create: {
        width: width!,
        height: height!,
        channels: 1,
        background: { r: 0 },
      },
    })
      .linear(featherWidth / width!, 0) // 水平渐变
      .png()
      .toBuffer();

    // 应用羽化
    // 实际代码略...

    return mask;
  }
}
```

### 4.2 帧间一致性

视频抠像需要保持帧间一致性，避免闪烁。

```typescript
// packages/generator/src/segmenter/temporal-smoothing.ts

/**
 * 时间平滑处理器
 *
 * 通过帧间平滑减少闪烁
 */
export class TemporalSmoother {
  private previousMask: Buffer | null = null;
  private smoothingFactor: number;

  constructor(smoothingFactor = 0.3) {
    this.smoothingFactor = smoothingFactor;
  }

  /**
   * 平滑处理
   *
   * currentMask = α * currentMask + (1-α) * previousMask
   */
  async smooth(currentMask: Buffer): Promise<Buffer> {
    if (!this.previousMask) {
      this.previousMask = currentMask;
      return currentMask;
    }

    // 使用 Sharp 混合两张遮罩
    const smoothed = await sharp(this.previousMask)
      .composite([
        {
          input: currentMask,
          blend: 'over',
          // 自定义混合模式
        },
      ])
      .png()
      .toBuffer();

    this.previousMask = smoothed;
    return smoothed;
  }

  /**
   * 重置状态
   */
  reset(): void {
    this.previousMask = null;
  }
}
```

---

## 5. 成本估算

### 5.1 各方案成本对比

```yaml
# MVP 阶段：Replicate API
Replicate MODNet:
  - 价格: ~$0.001/张
  - 30秒视频 (900帧 @ 30fps): ~$0.90
  - 优点: 无需部署，即用即走
  - 缺点: 视频处理成本高

# 标准阶段：Modal 自部署
Modal T4 GPU:
  - GPU: T4 ~$0.40/小时
  - 处理速度: ~30 FPS
  - 30秒视频: ~$0.01
  - 优点: 成本低，速度快
  - 缺点: 需要部署维护

# 抽帧优化（推荐）
抽帧处理:
  - 每 3 帧处理 1 帧: ~$0.30/视频 (Replicate)
  - 插值填充中间帧
  - 质量损失轻微
```

### 5.2 MVP 推荐方案

```yaml
# MVP 阶段推荐：Replicate + 抽帧
策略:
  - 每 5 帧处理 1 帧
  - 使用光流插值或线性插值填充
  - 降低成本 80%

成本:
  - 30秒视频: ~$0.18
  - 质量: 轻微降低，但可接受
```

---

## 6. 最佳实践

### 6.1 输入优化

```typescript
/**
 * 预处理优化
 */
async function preprocessForSegmentation(image: Buffer): Promise<Buffer> {
  const { width, height } = await sharp(image).metadata();

  // 1. 缩放到合适尺寸（MODNet 支持 512x512 最佳）
  const targetSize = 512;
  const scale = Math.max(targetSize / width!, targetSize / height!);

  if (scale < 1) {
    // 原图太大，缩放
    return sharp(image)
      .resize(Math.round(width! * scale), Math.round(height! * scale))
      .toBuffer();
  }

  return image;
}
```

### 6.2 批量处理优化

```typescript
/**
 * 智能批量处理
 */
async function smartBatchProcess(
  frames: Buffer[],
  segmenter: Segmenter
): Promise<Buffer[]> {
  // 1. 检测变化帧（跳过相似帧）
  const changedFrames = await detectChangedFrames(frames);

  // 2. 只处理变化帧
  const masks = new Map<number, Buffer>();

  for (let i = 0; i < frames.length; i++) {
    if (changedFrames.has(i)) {
      const result = await segmenter.segment(frames[i]);
      masks.set(i, result.alphaMask);
    } else {
      // 复用上一帧遮罩
      masks.set(i, masks.get(i - 1)!);
    }
  }

  // 3. 返回按顺序排列的遮罩
  return frames.map((_, i) => masks.get(i)!);
}
```

### 6.3 错误处理

```typescript
/**
 * 带重试的抠像
 */
async function segmentWithRetry(
  segmenter: Segmenter,
  image: Buffer,
  maxRetries = 3
): Promise<SegmentationResult> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await segmenter.segment(image);
    } catch (error) {
      lastError = error as Error;
      console.warn(`Segmentation attempt ${attempt + 1} failed:`, error);

      // 指数退避
      await new Promise(resolve =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }

  throw lastError;
}
```

---

## 7. 参考资源

### 官方资源

| 资源 | 链接 |
|------|------|
| MODNet GitHub | https://github.com/ZHKKKe/MODNet |
| MODNet 论文 | https://arxiv.org/abs/2011.11961 |
| ONNX 模型 | https://github.com/ZHKKKe/MODNet/releases |
| HuggingFace Demo | https://huggingface.co/spaces/akhaliq/modnet |

### API 服务

| 服务 | 链接 | 价格 |
|------|------|------|
| Replicate MODNet | https://replicate.com/cjwbw/modnet | ~$0.001/次 |
| BackgroundMattingV2 | https://replicate.com/peterl1n/background-matting-v2 | ~$0.002/次 |
| remove.bg | https://www.remove.bg/api | ~$0.20/次 |

### 部署平台

| 平台 | 链接 | 说明 |
|------|------|------|
| Modal | https://modal.com/ | Serverless GPU |
| RunPod | https://www.runpod.io/ | GPU 租赁 |
| AWS SageMaker | https://aws.amazon.com/sagemaker/ | 托管推理 |

---

## 8. 下一步

1. **选择方案**: MVP 使用 Replicate API，后续迁移到 Modal
2. **实现 Segmenter**: 按照本文档实现统一接口
3. **集成到工作流**: 与 Nano Banana 和 Remotion 集成
4. **优化成本**: 实施抽帧和帧间平滑策略

---

## 更新历史

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-02-16 | 1.0 | 初始版本 |
