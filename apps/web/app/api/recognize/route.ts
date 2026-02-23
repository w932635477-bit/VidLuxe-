/**
 * 内容识别 API
 *
 * POST /api/recognize - 识别图片品类和种草类型
 */

import { NextRequest, NextResponse } from 'next/server';
import { recognizeImage } from '@/lib/recognition';

// 请求验证
function validateRequest(data: unknown): { success: true; data: { imageUrl: string; filename?: string } } | { success: false; error: string } {
  if (!data || typeof data !== 'object') {
    return { success: false, error: 'Invalid request body' };
  }

  const body = data as Record<string, unknown>;

  if (!body.imageUrl || typeof body.imageUrl !== 'string') {
    return { success: false, error: 'imageUrl is required' };
  }

  return {
    success: true,
    data: {
      imageUrl: body.imageUrl,
      filename: body.filename as string | undefined,
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 验证请求
    const validation = validateRequest(body);
    if (!validation.success) {
      const errorResult = validation as { success: false; error: string };
      return NextResponse.json(
        { success: false, error: errorResult.error },
        { status: 400 }
      );
    }

    const { imageUrl, filename } = validation.data;

    // 执行识别
    const result = await recognizeImage(imageUrl, { filename });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[Recognize API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Recognition failed' },
      { status: 500 }
    );
  }
}
