/**
 * 封面增强 API
 *
 * POST /api/video/enhance-cover
 *
 * 将选中的关键帧通过 AI 增强为高级感封面
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getFileStorage } from '@/lib/file-storage';

// Nano Banana API 配置
const NANO_BANANA_CONFIG = {
  baseUrl: 'https://api.evolink.ai',
  apiKey: process.env.NANO_BANANA_API_KEY,
  model: 'nano-banana-2-lite',
  timeout: {
    create: 30000,
    poll: 10000,
    total: 300000, // 5 分钟总超时
  },
  maxPollAttempts: 150, // 增加轮询次数
  pollInterval: 2000,
};

// 风格到 Prompt 的映射
const STYLE_PROMPTS: Record<string, string> = {
  magazine: 'magazine cover style, high fashion photography, clean background, professional lighting, editorial look, premium quality',
  warm: 'warm golden hour lighting, cozy atmosphere, soft tones, premium lifestyle photography, inviting mood',
  cinematic: 'cinematic look, film color grading, moody atmosphere, professional cinematography, movie poster quality',
};

// 请求体
interface EnhanceCoverRequest {
  frameUrl: string; // 关键帧 URL
  style?: 'magazine' | 'warm' | 'cinematic';
}

// 响应
interface EnhanceCoverResponse {
  success: boolean;
  enhancedUrl?: string;
  error?: string;
}

/**
 * 带超时的 fetch
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 检查 URL 是否可被公网访问
 */
function isPublicUrl(url: string): boolean {
  return url.startsWith('https://') && !url.includes('localhost');
}

/**
 * 创建 Nano Banana 任务
 */
async function createNanoBananaTask(params: {
  prompt: string;
  imageUrls?: string[];
}): Promise<{ taskId: string }> {
  const requestBody = {
    model: NANO_BANANA_CONFIG.model,
    prompt: params.prompt,
    image_urls: params.imageUrls,
    size: '9:16',
    quality: '2K',
  };

  // Debug: Log the exact request being sent
  console.log('[EnhanceCover] API Request:', JSON.stringify({
    model: requestBody.model,
    prompt: requestBody.prompt.substring(0, 100) + '...',
    image_urls: requestBody.image_urls,
    size: requestBody.size,
    quality: requestBody.quality,
  }, null, 2));

  const response = await fetchWithTimeout(
    `${NANO_BANANA_CONFIG.baseUrl}/v1/images/generations`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NANO_BANANA_CONFIG.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    },
    NANO_BANANA_CONFIG.timeout.create
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('[EnhanceCover] Nano Banana API error:', errorData);
    throw new Error('Failed to create enhancement task');
  }

  const result = await response.json();
  console.log('[EnhanceCover] API Response:', JSON.stringify(result, null, 2));
  return { taskId: result.id };
}

/**
 * 查询任务状态
 */
async function getTaskStatus(taskId: string): Promise<{
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  results?: string[];
}> {
  const response = await fetchWithTimeout(
    `${NANO_BANANA_CONFIG.baseUrl}/v1/tasks/${taskId}`,
    {
      headers: {
        'Authorization': `Bearer ${NANO_BANANA_CONFIG.apiKey}`,
      },
    },
    NANO_BANANA_CONFIG.timeout.poll
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    console.error(`[EnhanceCover] Task status error (${response.status}):`, errorText);
    throw new Error(`Failed to get task status: ${response.status}`);
  }

  return response.json();
}

/**
 * 等待任务完成
 */
async function waitForTask(taskId: string): Promise<string[]> {
  const startTime = Date.now();
  const { maxPollAttempts, pollInterval, timeout } = NANO_BANANA_CONFIG;

  for (let i = 0; i < maxPollAttempts; i++) {
    if (Date.now() - startTime > timeout.total) {
      throw new Error('Task timeout');
    }

    const status = await getTaskStatus(taskId);

    if (status.status === 'completed' && status.results) {
      return status.results;
    }

    if (status.status === 'failed') {
      throw new Error('Enhancement task failed');
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error('Task timeout');
}

/**
 * 下载增强后的图片到本地
 */
async function downloadEnhancedImage(url: string): Promise<string> {
  const outputDir = path.resolve(process.cwd(), './public/uploads/covers');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const imageId = crypto.randomBytes(8).toString('hex');
  const response = await fetch(url);
  const buffer = Buffer.from(await response.arrayBuffer());

  // 根据文件魔数确定扩展名（Nano Banana API 返回 JPEG）
  let extension = '.jpg';
  if (buffer[0] === 0x89 && buffer[1] === 0x50) {
    extension = '.png';
  } else if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    extension = '.jpg';
  } else if (buffer[0] === 0x52 && buffer[1] === 0x49) {
    extension = '.webp';
  }

  const filename = `cover_${Date.now()}_${imageId}${extension}`;
  const outputPath = path.join(outputDir, filename);
  fs.writeFileSync(outputPath, buffer);

  return `/uploads/covers/${filename}`;
}

export async function POST(request: NextRequest): Promise<NextResponse<EnhanceCoverResponse>> {
  try {
    const body: EnhanceCoverRequest = await request.json();
    const { frameUrl, style = 'magazine' } = body;

    if (!frameUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing frameUrl' },
        { status: 400 }
      );
    }

    console.log('[EnhanceCover] Enhancing frame:', frameUrl, 'with style:', style);

    // 获取关键帧的本地路径
    const storage = getFileStorage();
    let localPath: string;

    if (frameUrl.startsWith('/uploads/')) {
      localPath = storage.getLocalPath(frameUrl);
      console.log('[EnhanceCover] Local path resolved:', localPath);

      if (!fs.existsSync(localPath)) {
        return NextResponse.json(
          { success: false, error: `Frame file not found: ${localPath}` },
          { status: 404 }
        );
      }
    } else if (frameUrl.startsWith('http')) {
      // 如果已经是公网 URL，直接使用
      localPath = frameUrl;
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid frameUrl' },
        { status: 400 }
      );
    }

    // 尝试获取公网 URL（上传到 R2）
    let publicUrl: string | null = null;

    if (!frameUrl.startsWith('http')) {
      publicUrl = await storage.getPublicUrl(localPath);
      if (publicUrl) {
        console.log('[EnhanceCover] Got public URL:', publicUrl);
      } else {
        console.warn('[EnhanceCover] Failed to get public URL, will use text-to-image mode');
      }
    } else {
      publicUrl = frameUrl;
    }

    // 构建 prompt
    const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.magazine;
    const basePrompt = `${stylePrompt}, maintain the original person/subject, enhance background and lighting, keep natural look`;

    let imageUrls: string[] | undefined;
    let finalPrompt = basePrompt;

    if (publicUrl && isPublicUrl(publicUrl)) {
      imageUrls = [publicUrl];
      console.log('[EnhanceCover] Using Image-to-Image mode with public URL');
    } else {
      // 无法使用 Image-to-Image，回退到 text-to-image
      finalPrompt = `${basePrompt}, high quality photography, professional editing, portrait of a beautiful person`;
      console.log('[EnhanceCover] Using Text-to-Image mode (no public URL available)');
    }

    // 创建增强任务
    const { taskId } = await createNanoBananaTask({
      prompt: finalPrompt,
      imageUrls,
    });

    console.log('[EnhanceCover] Task created:', taskId);

    // 等待完成
    const results = await waitForTask(taskId);

    if (!results || results.length === 0) {
      throw new Error('No results from enhancement');
    }

    const enhancedRemoteUrl = results[0];
    console.log('[EnhanceCover] Enhanced image URL:', enhancedRemoteUrl);

    // 下载到本地
    const enhancedLocalUrl = await downloadEnhancedImage(enhancedRemoteUrl);
    console.log('[EnhanceCover] Saved to:', enhancedLocalUrl);

    return NextResponse.json({
      success: true,
      enhancedUrl: enhancedLocalUrl,
    });
  } catch (error) {
    console.error('[EnhanceCover] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to enhance cover',
      },
      { status: 500 }
    );
  }
}
