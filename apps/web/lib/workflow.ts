/**
 * 工作流编排模块
 *
 * 编排完整的升级流程：
 * - 图片：直接调用 Nano Banana Image-to-Image
 * - 视频：5阶段流程（风格学习 → 素材生成 → 人物抠像 → 视频合成 → 评分）
 *
 * 改进：
 * - 添加请求超时控制
 * - 改进错误处理
 * - 优化 API 调用
 * - 集成人物抠像功能
 */

import type { TaskResult } from './task-queue';
import { getStyleProfile } from './style-profile';
import { calculateScore } from './scorer';
import { buildEnhancePrompt } from './style-prompts';
import type { PresetStyle } from './style-prompts';
import { getFileStorage } from './file-storage';

// Nano Banana API 配置
const NANO_BANANA_CONFIG = {
  baseUrl: 'https://api.evolink.ai',
  apiKey: process.env.NANO_BANANA_API_KEY, // 服务端专用
  model: 'nano-banana-2-lite',
  // 超时配置
  timeout: {
    create: 30000, // 创建任务超时 30s
    poll: 10000,   // 轮询单次超时 10s
    total: 120000, // 总超时 120s
  },
  // 轮询配置
  maxPollAttempts: 60,
  pollInterval: 2000,
};

/**
 * 带超时的 fetch
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 将本地路径转换为完整 URL
 */
function toFullUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (!baseUrl) {
    console.warn('[Workflow] No NEXT_PUBLIC_BASE_URL configured.');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `http://localhost:3000${normalizedPath}`;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

/**
 * 检查 URL 是否可被公网访问
 */
function isPublicUrl(url: string): boolean {
  return url.startsWith('https://') && !url.includes('localhost');
}

// 进度回调
export type ProgressCallback = (progress: number, stage: string) => void;

/**
 * 调用 Nano Banana API 创建任务（带超时控制）
 */
async function createNanoBananaTask(params: {
  prompt: string;
  imageUrls?: string[];
  size?: string;
  quality?: string;
}): Promise<{ taskId: string }> {
  let response: Response;
  try {
    response = await fetchWithTimeout(
      `${NANO_BANANA_CONFIG.baseUrl}/v1/images/generations`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${NANO_BANANA_CONFIG.apiKey}`,
        },
        body: JSON.stringify({
          model: NANO_BANANA_CONFIG.model,
          prompt: params.prompt,
          image_urls: params.imageUrls,
          size: params.size || '9:16',
          quality: params.quality || '2K',
        }),
      },
      NANO_BANANA_CONFIG.timeout.create
    );
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('API request timeout');
    }
    throw error;
  }

  if (!response.ok) {
    // 记录详细错误到日志，返回通用错误
    try {
      const errorData = await response.json();
      console.error('[Workflow] Nano Banana API error:', errorData);
    } catch {
      console.error('[Workflow] Nano Banana API error: HTTP', response.status);
    }
    throw new Error('Failed to create image generation task');
  }

  const result = await response.json();
  return { taskId: result.id };
}

/**
 * 查询 Nano Banana 任务状态（带超时控制）
 */
async function getNanoBananaTaskStatus(taskId: string): Promise<{
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  results?: string[];
}> {
  let response: Response;
  try {
    response = await fetchWithTimeout(
      `${NANO_BANANA_CONFIG.baseUrl}/v1/tasks/${taskId}`,
      {
        headers: {
          'Authorization': `Bearer ${NANO_BANANA_CONFIG.apiKey}`,
        },
      },
      NANO_BANANA_CONFIG.timeout.poll
    );
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      // 超时不算失败，返回 processing 状态继续轮询
      console.warn('[Workflow] Status poll timeout for task', taskId);
      return { status: 'processing', progress: 0 };
    }
    throw error;
  }

  if (!response.ok) {
    throw new Error('Failed to get task status');
  }

  return response.json();
}

/**
 * 等待 Nano Banana 任务完成（带总超时控制）
 */
async function waitForNanoBananaTask(
  taskId: string,
  onProgress?: (progress: number) => void
): Promise<string[]> {
  const startTime = Date.now();
  const { maxPollAttempts, pollInterval, timeout } = NANO_BANANA_CONFIG;

  for (let i = 0; i < maxPollAttempts; i++) {
    // 检查总超时
    if (Date.now() - startTime > timeout.total) {
      throw new Error('Task timeout - please try again');
    }

    const status = await getNanoBananaTaskStatus(taskId);

    if (onProgress) {
      onProgress(status.progress);
    }

    if (status.status === 'completed' && status.results) {
      return status.results;
    }

    if (status.status === 'failed') {
      throw new Error('Image generation failed');
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error('Task timeout - please try again');
}

/**
 * 图片升级工作流
 */
export async function processImageEnhancement(params: {
  imageUrl: string;
  styleSourceType: 'reference' | 'preset';
  presetStyle?: PresetStyle;
  referenceUrl?: string;
  onProgress?: ProgressCallback;
  // 新效果系统参数
  effectId?: string;
  effectIntensity?: number;
}): Promise<TaskResult> {
  const { imageUrl, styleSourceType, presetStyle, referenceUrl, onProgress, effectId, effectIntensity } = params;

  // Stage 1: 获取风格 Profile (0-10%)
  onProgress?.(0, '获取风格特征');
  const styleProfile = await getStyleProfile({
    sourceType: styleSourceType,
    referenceUrl,
    presetStyle,
  });
  onProgress?.(10, '风格特征已获取');

  // Stage 2: 构建 Prompt 并调用 Nano Banana (10-80%)
  onProgress?.(15, '构建升级 Prompt');
  const prompt = styleProfile.prompt;

  // 获取公网 URL
  let publicUrl: string | null = null;

  if (imageUrl.startsWith('http')) {
    publicUrl = imageUrl;
    console.log('[Workflow] Using provided URL:', imageUrl);
  } else {
    // 本地文件，上传到图床
    onProgress?.(16, '上传图片');
    const storage = getFileStorage();
    const localPath = imageUrl.startsWith('/')
      ? `${process.cwd()}/public${imageUrl}`
      : imageUrl;

    console.log('[Workflow] Local path:', localPath);
    publicUrl = await storage.getPublicUrl(localPath);

    if (publicUrl) {
      console.log('[Workflow] Got public URL:', publicUrl);
    } else {
      throw new Error('无法上传图片到图床，请检查网络连接');
    }
  }

  // 构建 API 请求参数
  const taskParams: {
    prompt: string;
    imageUrls?: string[];
    size: string;
    quality: string;
  } = {
    prompt,
    imageUrls: [publicUrl],
    size: '9:16',
    quality: '2K',
  };

  onProgress?.(20, '提交升级任务');
  console.log('[Workflow] Creating enhancement task with public URL');

  const { taskId } = await createNanoBananaTask(taskParams);

  onProgress?.(25, 'AI 正在升级图片');
  const results = await waitForNanoBananaTask(taskId, (progress) => {
    const mappedProgress = 25 + (progress / 100) * 55;
    onProgress?.(mappedProgress, 'AI 正在升级图片');
  });

  if (!results || results.length === 0) {
    throw new Error('No results from image generation');
  }

  const enhancedUrl = results[0];
  onProgress?.(80, '图片升级完成');

  // Stage 3: 计算评分 (80-95%)
  onProgress?.(85, '计算高级感评分');
  const score = await calculateScore(enhancedUrl);
  onProgress?.(95, '评分完成');

  // Stage 4: 返回结果 (95-100%)
  onProgress?.(100, '完成');

  return {
    type: 'image',
    enhancedUrl,
    originalUrl: imageUrl,
    score,
  };
}

/**
 * 视频升级工作流（5阶段）
 *
 * Stage 1: 风格学习 (0-10%)
 * Stage 2: 素材生成 - 背景 (10-35%)
 * Stage 3: 人物抠像 (35-55%)
 * Stage 4: 视频合成 (55-90%)
 * Stage 5: 评分 (90-100%)
 */
export async function processVideoEnhancement(params: {
  videoUrl: string;
  styleSourceType: 'reference' | 'preset';
  presetStyle?: PresetStyle;
  referenceUrl?: string;
  onProgress?: ProgressCallback;
  /** 是否启用人物抠像（默认 false，MVP 阶段可选） */
  enableBackgroundRemoval?: boolean;
  // 新效果系统参数
  effectId?: string;
  effectIntensity?: number;
}): Promise<TaskResult> {
  const {
    videoUrl,
    styleSourceType,
    presetStyle,
    referenceUrl,
    onProgress,
    enableBackgroundRemoval = false,
    effectId,
    effectIntensity,
  } = params;

  // 导入视频生成器
  const { generateVideo } = await import('./video-generator');

  // ========================================
  // Stage 1: 风格学习 (0-10%)
  // ========================================
  onProgress?.(0, '学习风格特征');
  const styleProfile = await getStyleProfile({
    sourceType: styleSourceType,
    referenceUrl,
    presetStyle,
  });
  onProgress?.(10, '风格特征已提取');

  // ========================================
  // Stage 2: 素材生成 - 背景 (10-35%)
  // ========================================
  onProgress?.(12, '生成高级感背景');
  const backgroundPrompt = buildEnhancePrompt({
    style: presetStyle || 'magazine',
    mediaType: 'video',
    customKeywords: ['video background', 'no text', 'abstract', 'premium quality'],
  });

  const { taskId: bgTaskId } = await createNanoBananaTask({
    prompt: backgroundPrompt,
    size: '9:16',
    quality: '2K',
  });

  onProgress?.(15, 'AI 生成背景素材');
  const backgrounds = await waitForNanoBananaTask(bgTaskId, (progress) => {
    const mappedProgress = 15 + (progress / 100) * 18;
    onProgress?.(mappedProgress, 'AI 生成背景素材');
  });

  const backgroundUrl = backgrounds[0];
  onProgress?.(35, '背景素材生成完成');

  // ========================================
  // Stage 3: 人物抠像 (35-55%) - 可选
  // ========================================
  let foregroundUrl: string | undefined;

  if (enableBackgroundRemoval) {
    try {
      onProgress?.(36, '准备人物抠像');

      // 导入背景移除模块
      const { removeImageBackground } = await import('./background-removal');

      // 从视频第一帧提取人物
      // 注意：这里简化处理，实际应该从视频提取关键帧
      // 目前使用视频封面图或第一帧进行抠像
      const videoFrameUrl = await extractVideoFrame(videoUrl);

      if (videoFrameUrl) {
        onProgress?.(40, 'AI 人物抠像中');
        foregroundUrl = await removeImageBackground(videoFrameUrl, {
          model: 'isnet_fp16', // 使用 fp16 模型平衡速度和质量
          onProgress: (progress) => {
            const mappedProgress = 40 + (progress / 100) * 13;
            onProgress?.(mappedProgress, `AI 人物抠像中 (${progress}%)`);
          },
        });
        onProgress?.(55, '人物抠像完成');
      } else {
        console.warn('[Workflow] Failed to extract video frame, skipping background removal');
        onProgress?.(55, '跳过人物抠像（无法提取视频帧）');
      }
    } catch (error) {
      console.warn('[Workflow] Background removal failed:', error);
      onProgress?.(55, '人物抠像失败，使用原视频');
      // 继续执行，不中断流程
    }
  } else {
    onProgress?.(55, '跳过人物抠像');
  }

  // ========================================
  // Stage 4: 视频合成 (55-90%)
  // ========================================
  onProgress?.(60, '准备视频合成');

  // 使用 FFmpeg 生成视频
  const videoResult = await generateVideo({
    backgroundUrl,
    foregroundUrl, // 可选的前景图（抠像后的人物）
    duration: 5,
    style: presetStyle,
    transition: 'fade',
  });

  console.log('[Workflow] Video generated:', videoResult.videoUrl);
  onProgress?.(88, '视频渲染完成');

  // ========================================
  // Stage 5: 评分 (90-100%)
  // ========================================
  onProgress?.(90, '计算种草力评分');
  const score = await calculateScore(backgroundUrl);
  onProgress?.(100, '完成');

  return {
    type: 'video',
    enhancedUrl: videoResult.videoUrl,
    originalUrl: videoUrl,
    score,
  };
}

/**
 * 从视频中提取帧图片
 *
 * MVP 实现：返回视频封面或占位图
 * 完整实现：使用 FFmpeg 提取指定帧
 */
async function extractVideoFrame(videoUrl: string): Promise<string | null> {
  // 如果是本地路径，尝试获取视频信息
  if (!videoUrl.startsWith('http')) {
    // MVP 阶段：直接返回原视频路径
    // 实际应该使用 FFmpeg 提取第一帧
    return videoUrl;
  }

  // 如果是 URL，尝试获取视频封面
  // 许多视频 URL 支持添加 ?frame=0 或类似参数获取帧
  try {
    const frameUrl = videoUrl.includes('?')
      ? `${videoUrl}&frame=0`
      : `${videoUrl}?frame=0`;

    // 检查是否可访问
    const response = await fetch(frameUrl, { method: 'HEAD' });
    if (response.ok && response.headers.get('content-type')?.startsWith('image/')) {
      return frameUrl;
    }
  } catch {
    // 忽略错误
  }

  // 无法提取帧
  return null;
}

/**
 * 统一的工作流入口
 */
export async function processEnhancement(params: {
  contentType: 'image' | 'video';
  contentUrl: string;
  styleSourceType: 'reference' | 'preset';
  presetStyle?: PresetStyle;
  referenceUrl?: string;
  onProgress?: ProgressCallback;
  // 新效果系统参数
  effectId?: string;
  effectIntensity?: number;
}): Promise<TaskResult> {
  // 如果提供了 effectId，使用新效果系统的 Prompt
  if (params.effectId) {
    const { getEffectPrompt } = await import('./effect-presets');
    const effectPrompt = getEffectPrompt(params.effectId, params.effectIntensity ?? 100);
    console.log('[Workflow] Using effect prompt from new effect system:', params.effectId);
    // 可以在这里覆盖 styleProfile 的 prompt
    // 目前先使用 effectId 映射到 presetStyle 的方式
  }

  if (params.contentType === 'image') {
    return processImageEnhancement({
      imageUrl: params.contentUrl,
      styleSourceType: params.styleSourceType,
      presetStyle: params.presetStyle,
      referenceUrl: params.referenceUrl,
      onProgress: params.onProgress,
      effectId: params.effectId,
      effectIntensity: params.effectIntensity,
    });
  } else {
    return processVideoEnhancement({
      videoUrl: params.contentUrl,
      styleSourceType: params.styleSourceType,
      presetStyle: params.presetStyle,
      referenceUrl: params.referenceUrl,
      onProgress: params.onProgress,
      effectId: params.effectId,
      effectIntensity: params.effectIntensity,
    });
  }
}
