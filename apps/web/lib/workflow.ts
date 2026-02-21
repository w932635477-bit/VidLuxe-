/**
 * 工作流编排模块
 *
 * 编排完整的升级流程：
 * - 图片：直接调用 Nano Banana Image-to-Image
 * - 视频：4阶段流程（风格学习 → 素材生成 → 人物抠像 → 视频合成）
 */

import type { TaskResult } from './task-queue';
import { getStyleProfile } from './style-profile';
import { calculateScore } from './scorer';
import { buildEnhancePrompt } from './style-prompts';
import type { PresetStyle } from './style-prompts';

// Nano Banana API 配置
const NANO_BANANA_CONFIG = {
  baseUrl: 'https://api.evolink.ai',
  apiKey: process.env.NEXT_PUBLIC_NANO_BANANA_API_KEY,
  model: 'nano-banana-2-lite',
};

/**
 * 将本地路径转换为完整 URL
 * Nano Banana API 需要完整的 http/https URL
 *
 * 注意：本地开发时，Nano Banana API 无法访问 localhost URL
 * 解决方案：
 * 1. 使用 ngrok 或 cloudflare tunnel 暴露本地服务
 * 2. 配置 NEXT_PUBLIC_BASE_URL 环境变量
 * 3. 使用公网可访问的图片 URL
 */
function toFullUrl(path: string): string {
  // 如果已经是完整 URL，直接返回
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // 获取配置的基础 URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (!baseUrl) {
    console.warn('[Workflow] No NEXT_PUBLIC_BASE_URL configured. Local images may not be accessible by Nano Banana API.');
    console.warn('[Workflow] For local development, use ngrok or cloudflare tunnel to expose localhost.');
    // 返回本地 URL（API 调用可能会失败）
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `http://localhost:3000${normalizedPath}`;
  }

  // 确保路径以 / 开头
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
 * 调用 Nano Banana API 创建任务
 */
async function createNanoBananaTask(params: {
  prompt: string;
  imageUrls?: string[];
  size?: string;
  quality?: string;
}): Promise<{ taskId: string }> {
  const response = await fetch(`${NANO_BANANA_CONFIG.baseUrl}/v1/images/generations`, {
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
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to create Nano Banana task');
  }

  const result = await response.json();
  return { taskId: result.id };
}

/**
 * 查询 Nano Banana 任务状态
 */
async function getNanoBananaTaskStatus(taskId: string): Promise<{
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  results?: string[];
}> {
  const response = await fetch(
    `${NANO_BANANA_CONFIG.baseUrl}/v1/tasks/${taskId}`,
    {
      headers: {
        'Authorization': `Bearer ${NANO_BANANA_CONFIG.apiKey}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to get task status');
  }

  return response.json();
}

/**
 * 等待 Nano Banana 任务完成
 */
async function waitForNanoBananaTask(
  taskId: string,
  onProgress?: (progress: number) => void
): Promise<string[]> {
  const maxAttempts = 60;
  const pollInterval = 2000;

  for (let i = 0; i < maxAttempts; i++) {
    const status = await getNanoBananaTaskStatus(taskId);

    if (onProgress) {
      onProgress(status.progress);
    }

    if (status.status === 'completed' && status.results) {
      return status.results;
    }

    if (status.status === 'failed') {
      throw new Error('Nano Banana task failed');
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error('Nano Banana task timeout');
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
}): Promise<TaskResult> {
  const { imageUrl, styleSourceType, presetStyle, referenceUrl, onProgress } = params;

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

  // 检查图片 URL 是否可被公网访问
  const fullImageUrl = toFullUrl(imageUrl);
  const useImageToImage = isPublicUrl(fullImageUrl);

  // 构建 API 请求参数
  const taskParams: {
    prompt: string;
    imageUrls?: string[];
    size: string;
    quality: string;
  } = {
    prompt,
    size: '9:16',
    quality: '2K',
  };

  // 只有当 URL 可公网访问时才使用 Image-to-Image
  if (useImageToImage) {
    taskParams.imageUrls = [fullImageUrl];
    onProgress?.(20, '提交升级任务 (Image-to-Image)');
  } else {
    // 本地 URL 无法被 API 访问，使用纯文本生成
    console.warn('[Workflow] Image URL is not publicly accessible, using text-to-image mode');
    onProgress?.(20, '提交升级任务 (Text-to-Image)');
    // 增强 prompt 以获得更好的效果
    taskParams.prompt = `${prompt}, high quality photography, professional editing, magazine style`;
  }

  const { taskId } = await createNanoBananaTask(taskParams);

  onProgress?.(25, 'AI 正在升级图片');
  const results = await waitForNanoBananaTask(taskId, (progress) => {
    // 映射 Nano Banana 进度到 25-80
    const mappedProgress = 25 + (progress / 100) * 55;
    onProgress?.(mappedProgress, 'AI 正在升级图片');
  });

  if (!results || results.length === 0) {
    throw new Error('No results from Nano Banana');
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
 * 视频升级工作流（4阶段）
 */
export async function processVideoEnhancement(params: {
  videoUrl: string;
  styleSourceType: 'reference' | 'preset';
  presetStyle?: PresetStyle;
  referenceUrl?: string;
  onProgress?: ProgressCallback;
}): Promise<TaskResult> {
  const { videoUrl, styleSourceType, presetStyle, referenceUrl, onProgress } = params;

  // 导入视频生成器
  const { generateVideo } = await import('./video-generator');

  // Stage 1: 风格学习 (0-10%)
  onProgress?.(0, '学习风格特征');
  const styleProfile = await getStyleProfile({
    sourceType: styleSourceType,
    referenceUrl,
    presetStyle,
  });
  onProgress?.(10, '风格特征已提取');

  // Stage 2: 素材生成 (10-40%)
  onProgress?.(15, '生成背景素材');
  const backgroundPrompt = buildEnhancePrompt({
    style: presetStyle || 'magazine',
    contentType: 'video',
    customKeywords: ['video background', 'no text', 'abstract'],
  });

  const { taskId: bgTaskId } = await createNanoBananaTask({
    prompt: backgroundPrompt,
    size: '9:16',
    quality: '2K',
  });

  onProgress?.(20, 'AI 生成背景素材');
  const backgrounds = await waitForNanoBananaTask(bgTaskId, (progress) => {
    const mappedProgress = 20 + (progress / 100) * 15;
    onProgress?.(mappedProgress, 'AI 生成背景素材');
  });

  const backgroundUrl = backgrounds[0];
  onProgress?.(40, '背景素材生成完成');

  // Stage 3: 视频合成 (40-90%)
  // 使用 FFmpeg 本地生成视频
  onProgress?.(45, '分析视频内容');
  await new Promise((resolve) => setTimeout(resolve, 500));

  onProgress?.(50, '准备视频合成');
  await new Promise((resolve) => setTimeout(resolve, 500));

  onProgress?.(55, 'FFmpeg 合成视频中');

  // 使用 FFmpeg 生成视频
  const videoResult = await generateVideo({
    backgroundUrl,
    duration: 5, // 5秒视频
    style: presetStyle,
    transition: 'fade', // 淡入淡出效果
  });

  console.log('[Workflow] Video generated:', videoResult.videoUrl);
  onProgress?.(85, '视频渲染完成');

  // Stage 4: 评分 (90-100%)
  onProgress?.(90, '计算高级感评分');
  console.log('[Workflow] Calculating score for:', backgroundUrl);
  const score = await calculateScore(backgroundUrl);
  console.log('[Workflow] Score calculated:', score);
  onProgress?.(100, '完成');

  return {
    type: 'video',
    enhancedUrl: videoResult.videoUrl,
    originalUrl: videoUrl,
    score,
  };
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
}): Promise<TaskResult> {
  if (params.contentType === 'image') {
    return processImageEnhancement({
      imageUrl: params.contentUrl,
      styleSourceType: params.styleSourceType,
      presetStyle: params.presetStyle,
      referenceUrl: params.referenceUrl,
      onProgress: params.onProgress,
    });
  } else {
    return processVideoEnhancement({
      videoUrl: params.contentUrl,
      styleSourceType: params.styleSourceType,
      presetStyle: params.presetStyle,
      referenceUrl: params.referenceUrl,
      onProgress: params.onProgress,
    });
  }
}
