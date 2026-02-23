/**
 * 人物抠像模块
 *
 * 使用 @imgly/background-removal 进行 AI 抠像
 * 支持图片和视频帧处理
 */

import { removeBackground } from '@imgly/background-removal';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// 模型类型
type BgRemovalModel = 'isnet' | 'isnet_fp16' | 'isnet_quint8';

// 配置
const REMOVAL_CONFIG = {
  // 输出目录
  outputDir: process.env.BG_REMOVAL_OUTPUT_DIR || './public/uploads/removed-bg',
  // 模型配置：isnet_fp16 是速度和质量的平衡
  model: 'isnet_fp16' as BgRemovalModel,
  // 输出格式
  format: 'image/png' as const,
  // 超时（毫秒）
  timeout: 60000,
};

// 确保输出目录存在
function ensureOutputDir(): void {
  const dir = path.resolve(process.cwd(), REMOVAL_CONFIG.outputDir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * 从 URL 或本地路径加载图片
 */
async function loadImage(source: string): Promise<Blob> {
  // 如果是 URL
  if (source.startsWith('http://') || source.startsWith('https://')) {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    return response.blob();
  }

  // 如果是本地文件路径
  const localPath = source.startsWith('/')
    ? path.join(process.cwd(), 'public', source)
    : source;

  if (fs.existsSync(localPath)) {
    const buffer = fs.readFileSync(localPath);
    return new Blob([buffer], { type: 'image/png' });
  }

  throw new Error(`Image not found: ${source}`);
}

/**
 * 保存处理后的图片
 */
async function saveImage(blob: Blob, filename: string): Promise<string> {
  ensureOutputDir();

  const outputPath = path.join(
    path.resolve(process.cwd(), REMOVAL_CONFIG.outputDir),
    filename
  );

  const buffer = Buffer.from(await blob.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);

  // 返回可访问的 URL 路径
  return `/${REMOVAL_CONFIG.outputDir.replace('./public/', '')}/${filename}`;
}

/**
 * 处理单张图片的背景移除
 *
 * @param imageSource 图片 URL 或本地路径
 * @param options 配置选项
 * @returns 处理后的图片 URL
 */
export async function removeImageBackground(
  imageSource: string,
  options?: {
    model?: BgRemovalModel;
    onProgress?: (progress: number) => void;
  }
): Promise<string> {
  const startTime = Date.now();
  console.log('[BgRemoval] Starting background removal for:', imageSource);

  try {
    // 加载图片
    const imageBlob = await loadImage(imageSource);

    // 执行背景移除
    const resultBlob = await removeBackground(imageBlob, {
      model: options?.model || REMOVAL_CONFIG.model,
      output: {
        format: REMOVAL_CONFIG.format,
      },
      progress: (key, current, total) => {
        if (options?.onProgress && key === 'compute:inference') {
          options.onProgress(Math.round((current / total) * 100));
        }
      },
    });

    // 生成文件名
    const imageId = crypto
      .createHash('md5')
      .update(imageSource + Date.now())
      .digest('hex')
      .slice(0, 12);
    const filename = `removed-bg-${imageId}.png`;

    // 保存结果
    const outputUrl = await saveImage(resultBlob, filename);

    console.log(`[BgRemoval] Completed in ${Date.now() - startTime}ms`);
    return outputUrl;
  } catch (error) {
    console.error('[BgRemoval] Error:', error);
    throw new Error(
      `Background removal failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * 视频帧背景移除结果
 */
export interface VideoBgRemovalResult {
  /** 处理后的帧图片 URL 列表 */
  frameUrls: string[];
  /** 透明背景视频 URL（如果有） */
  transparentVideoUrl?: string;
  /** 帧率 */
  fps: number;
  /** 总帧数 */
  totalFrames: number;
  /** 总时长（秒） */
  duration: number;
}

/**
 * 处理视频的背景移除（逐帧处理）
 *
 * 注意：这是一个简化的实现，实际生产环境需要使用 FFmpeg 提取帧
 * 然后逐帧处理，最后重新合成视频
 *
 * @param videoSource 视频 URL 或本地路径
 * @param options 配置选项
 */
export async function removeVideoBackground(
  videoSource: string,
  options?: {
    fps?: number;
    maxFrames?: number;
    onProgress?: (progress: number, stage: string) => void;
  }
): Promise<VideoBgRemovalResult> {
  const fps = options?.fps || 30;
  const maxFrames = options?.maxFrames || 150; // 最多处理 5 秒 @ 30fps

  console.log('[BgRemoval] Starting video background removal for:', videoSource);

  // MVP 阶段：返回占位结果
  // 实际实现需要：
  // 1. 使用 FFmpeg 提取视频帧
  // 2. 逐帧进行背景移除
  // 3. 使用 Remotion 或 FFmpeg 重新合成

  options?.onProgress?.(0, '准备处理视频...');

  // 模拟处理进度
  for (let i = 0; i <= 100; i += 10) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    options?.onProgress?.(i, `处理视频帧... ${i}%`);
  }

  console.log('[BgRemoval] Video processing not fully implemented in MVP');

  return {
    frameUrls: [],
    transparentVideoUrl: videoSource, // 返回原视频作为占位
    fps,
    totalFrames: maxFrames,
    duration: maxFrames / fps,
  };
}

/**
 * 检查背景移除功能是否可用
 */
export async function checkBgRemovalAvailable(): Promise<{
  available: boolean;
  reason?: string;
}> {
  try {
    // 检查输出目录是否可写
    ensureOutputDir();

    // 检查库是否正确加载
    if (typeof removeBackground !== 'function') {
      return { available: false, reason: 'Library not loaded' };
    }

    return { available: true };
  } catch (error) {
    return {
      available: false,
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
