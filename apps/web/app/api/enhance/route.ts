import { NextRequest, NextResponse } from 'next/server';

// API 路由：图片升级处理
// 使用 Nano Banana API（国内代理 evolink.ai）

const NANO_BANANA_API_URL = 'https://api.evolink.ai';

interface EnhanceRequest {
  imageUrl: string;
  style: 'minimal' | 'warmLuxury' | 'coolPro' | 'morandi';
}

interface TaskResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  results?: string[];
}

// 风格对应的 Prompt
const STYLE_PROMPTS: Record<string, string> = {
  minimal: `
    Premium minimalist photo style, Apple keynote aesthetic,
    clean background with subtle gradient from charcoal to soft gray,
    soft diffused lighting, professional product photography,
    generous negative space, elegant and refined,
    low saturation colors, high contrast subject
  `,
  warmLuxury: `
    Luxurious warm-toned photo style, Chanel campaign aesthetic,
    warm beige to deep brown tones, soft golden hour lighting,
    subtle marble texture, elegant and sophisticated,
    rich warm colors, premium quality,
    fashion magazine style
  `,
  coolPro: `
    Professional cool-toned photo style, tech aesthetic,
    steel blue to slate gray tones, clean and modern,
    high-key lighting with soft shadows,
    trustworthy and authoritative,
    corporate premium style, sharp details
  `,
  morandi: `
    Morandi-style photo, Kinfolk magazine aesthetic,
    muted sage green, dusty pink, warm gray palette,
    soft diffused natural lighting,
    artistic and refined, low saturation,
    elegant earth tones, editorial quality
  `,
};

export async function POST(request: NextRequest) {
  try {
    const body: EnhanceRequest = await request.json();
    const { imageUrl, style = 'warmLuxury' } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'imageUrl is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_NANO_BANANA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const prompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.warmLuxury;

    // 创建图片生成任务
    const taskResponse = await fetch(`${NANO_BANANA_API_URL}/v1/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'nano-banana-2-lite',
        prompt: prompt.trim().replace(/\s+/g, ' '),
        image_urls: [imageUrl],
        size: '9:16',
        quality: '2K',
      }),
    });

    if (!taskResponse.ok) {
      const error = await taskResponse.json();
      return NextResponse.json(
        { error: error.error?.message || 'Failed to create task' },
        { status: taskResponse.status }
      );
    }

    const task: TaskResponse = await taskResponse.json();

    return NextResponse.json({
      taskId: task.id,
      status: task.status,
      estimatedTime: 45, // 预计 45 秒
    });
  } catch (error) {
    console.error('Enhance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 查询任务状态
export async function GET(request: NextRequest) {
  const taskId = request.nextUrl.searchParams.get('taskId');

  if (!taskId) {
    return NextResponse.json(
      { error: 'taskId is required' },
      { status: 400 }
    );
  }

  const apiKey = process.env.NEXT_PUBLIC_NANO_BANANA_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`${NANO_BANANA_API_URL}/v1/tasks/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.error?.message || 'Failed to get task status' },
        { status: response.status }
      );
    }

    const task: TaskResponse = await response.json();

    return NextResponse.json({
      taskId: task.id,
      status: task.status,
      progress: task.progress,
      results: task.results,
    });
  } catch (error) {
    console.error('Task status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
