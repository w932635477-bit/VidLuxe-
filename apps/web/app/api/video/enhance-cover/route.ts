/**
 * 封面增强 API
 *
 * POST /api/video/enhance-cover
 *
 * 将选中的关键帧通过 AI 增强为高级感封面
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getFileStorage } from '@/lib/file-storage';
import { getEffectById, getEffectPrompt } from '@/lib/effect-presets';
import { spendCredits, getAvailableCredits } from '@/lib/credits';

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

// 风格到 Prompt 的映射（向后兼容）
const STYLE_PROMPTS: Record<string, string> = {
  magazine: 'Vogue magazine cover style with elegant English text overlay, "VOGUE" masthead at top in bold sans-serif typography, "FALL ESSENTIALS" subtitle text, "THE NEW CLASSICS" headline at bottom, high fashion photography, clean background, professional lighting, editorial look, premium quality, magazine cover typography design',
  warm: 'warm golden hour lighting, cozy atmosphere, soft tones, premium lifestyle photography, inviting mood',
  cinematic: 'cinematic look, film color grading, moody atmosphere, professional cinematography, movie poster quality',
};

// 请求体
interface EnhanceCoverRequest {
  frameUrl: string; // 关键帧 URL
  style?: 'magazine' | 'warm' | 'cinematic'; // 旧风格参数（向后兼容）
  effectId?: string; // 新效果系统参数
  intensity?: number; // 效果强度 0-100
  contentType?: string; // 内容类型
  quality?: '1K' | '2K'; // 画质
  anonymousId?: string; // 匿名用户 ID（用于额度扣除）
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
 * 创建 Nano Banana 任务
 */
async function createNanoBananaTask(params: {
  prompt: string;
  imageUrls?: string[];
  quality?: '1K' | '2K';
}): Promise<{ taskId: string }> {
  const requestBody = {
    model: NANO_BANANA_CONFIG.model,
    prompt: params.prompt,
    image_urls: params.imageUrls,
    size: '9:16',
    quality: params.quality || '1K',
  };

  // Debug: Log the exact request being sent
  const logImageUrls = params.imageUrls?.map(url =>
    url.startsWith('data:') ? `base64:${url.substring(0, 50)}...` : url
  );
  console.log('[EnhanceCover] API Request:', JSON.stringify({
    model: requestBody.model,
    prompt: requestBody.prompt.substring(0, 100) + '...',
    image_urls: logImageUrls,
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
  error?: string;
  error_message?: string;
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

  const result = await response.json();
  console.log(`[EnhanceCover] Task ${taskId} status:`, JSON.stringify(result, null, 2));
  return result;
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
      const errorMsg = status.error_message || status.error || 'Enhancement task failed (no details)';
      console.error(`[EnhanceCover] Task ${taskId} failed:`, errorMsg);
      throw new Error(errorMsg);
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
  let creditsDeducted = false;
  let anonymousIdForCredit: string | undefined;

  try {
    const body: EnhanceCoverRequest = await request.json();
    const { frameUrl, style = 'magazine', effectId, intensity = 100, contentType, quality = '1K', anonymousId } = body;
    anonymousIdForCredit = anonymousId;

    if (!frameUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing frameUrl' },
        { status: 400 }
      );
    }

    console.log('[EnhanceCover] Enhancing frame:', frameUrl, 'with effectId:', effectId, 'or style:', style);

    // ========== 额度检查和扣除 ==========
    let creditsInfo: { total: number; paid: number; free: number };

    // 尝试获取登录用户
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method must be called from a Server Component.
            }
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // 登录用户：使用 Supabase RPC 扣除额度
      const { data: userCredit, error: creditError } = await supabase
        .from('user_credits')
        .select('balance, free_credits_used_this_month')
        .eq('user_id', user.id)
        .single();

      if (creditError || !userCredit) {
        return NextResponse.json(
          { success: false, error: '无法获取用户额度' },
          { status: 500 }
        );
      }

      const freeCreditsUsed = userCredit?.free_credits_used_this_month || 0;
      const freeCreditsRemaining = Math.max(0, 8 - freeCreditsUsed);
      creditsInfo = { total: userCredit.balance + freeCreditsRemaining, paid: userCredit.balance, free: freeCreditsRemaining };
      console.log('[EnhanceCover] Logged in user:', user.id, 'credits:', creditsInfo);

      if (creditsInfo.total < 1) {
        return NextResponse.json(
          { success: false, error: '额度不足', credits: creditsInfo },
          { status: 429 }
        );
      }

      // 扣除额度
      const { data: spendResult, error: spendError } = await supabase.rpc('spend_user_credits', {
        p_user_id: user.id,
        p_amount: 1,
        p_description: '视频帧增强',
      });

      if (spendError || !spendResult?.success) {
        console.error('[EnhanceCover] Supabase spend error:', spendError, spendResult);
        return NextResponse.json(
          { success: false, error: spendResult?.error || '额度扣除失败', credits: creditsInfo },
          { status: spendResult?.error === 'insufficient_balance' ? 429 : 500 }
        );
      }

      creditsDeducted = true;
      creditsInfo.total = spendResult.balance + spendResult.free_remaining;
      console.log('[EnhanceCover] Credits spent for user:', user.id);
    } else if (anonymousId) {
      // 匿名用户：使用文件系统扣除额度
      creditsInfo = getAvailableCredits(anonymousId);
      console.log('[EnhanceCover] Anonymous user:', anonymousId, 'credits:', creditsInfo);

      if (creditsInfo.total < 1) {
        return NextResponse.json(
          { success: false, error: '额度不足', credits: creditsInfo },
          { status: 429 }
        );
      }

      const spendResult = spendCredits({
        anonymousId,
        amount: 1,
        description: '视频帧增强',
      });

      if (!spendResult.success) {
        return NextResponse.json(
          { success: false, error: spendResult.error || '额度不足', credits: getAvailableCredits(anonymousId) },
          { status: 429 }
        );
      }

      creditsDeducted = true;
      creditsInfo.total = spendResult.newBalance;
      console.log('[EnhanceCover] Credits spent for anonymous:', anonymousId, 'new total:', creditsInfo.total);
    }
    // ========== 额度检查和扣除结束 ==========

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

    // 构建 prompt - 优先使用新效果系统
    let stylePrompt: string;

    if (effectId) {
      // 使用新效果系统
      const effect = getEffectById(effectId);
      if (effect) {
        stylePrompt = getEffectPrompt(effectId, intensity);
        console.log('[EnhanceCover] Using effect system:', effectId, 'intensity:', intensity);
      } else {
        // effectId 无效，回退到旧系统
        stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.magazine;
        console.log('[EnhanceCover] Invalid effectId, falling back to style:', style);
      }
    } else {
      // 使用旧风格系统
      stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.magazine;
      console.log('[EnhanceCover] Using legacy style system:', style);
    }

    const basePrompt = `${stylePrompt}, maintain the original person/subject, enhance background and lighting, keep natural look`;

    // 获取公网 URL
    let publicUrl: string | null = null;

    if (frameUrl.startsWith('http')) {
      publicUrl = frameUrl;
      console.log('[EnhanceCover] Using provided URL:', frameUrl);
    } else {
      // 上传到图床获取公网 URL
      publicUrl = await storage.getPublicUrl(localPath);
      if (publicUrl) {
        console.log('[EnhanceCover] Got public URL:', publicUrl);
      } else {
        return NextResponse.json(
          { success: false, error: '无法上传图片到图床，请检查网络连接' },
          { status: 500 }
        );
      }
    }

    console.log('[EnhanceCover] Creating enhancement task...');

    // 创建增强任务
    const { taskId } = await createNanoBananaTask({
      prompt: basePrompt,
      imageUrls: [publicUrl],
      quality,
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

    // 如果已扣除额度但处理失败，退还额度
    if (creditsDeducted) {
      try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              getAll() {
                return cookieStore.getAll();
              },
              setAll(cookiesToSet) {
                try {
                  cookiesToSet.forEach(({ name, value, options }) =>
                    cookieStore.set(name, value, options)
                  );
                } catch {
                  // Server Component limitation
                }
              },
            },
          }
        );

        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // 登录用户：使用 Supabase RPC 退还额度
          const { error: refundError } = await supabase.rpc('refund_user_credits', {
            p_user_id: user.id,
            p_amount: 1,
            p_description: '视频帧增强失败退款',
          });
          if (refundError) {
            console.error('[EnhanceCover] Supabase refund error:', refundError);
          } else {
            console.log('[EnhanceCover] Refunded 1 credit for logged in user');
          }
        } else if (anonymousIdForCredit) {
          // 匿名用户：使用文件系统退还额度
          const { refundCredits } = await import('@/lib/credits');
          refundCredits(
            anonymousIdForCredit,
            1,
            '视频帧增强失败退款'
          );
          console.log('[EnhanceCover] Refunded 1 credit for anonymous user');
        }
      } catch (refundError) {
        console.error('[EnhanceCover] Error refunding credit:', refundError);
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to enhance cover',
      },
      { status: 500 }
    );
  }
}
