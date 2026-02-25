import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { frameUrls, style } = body;

    if (!frameUrls || !Array.isArray(frameUrls) || frameUrls.length === 0) {
      return NextResponse.json(
        { success: false, error: '请提供要增强的帧' },
        { status: 400 }
      );
    }

    // 并发处理所有帧
    const results = await Promise.all(
      frameUrls.map(async (frameUrl: string) => {
        try {
          // 调用增强 API
          const enhanceResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/enhance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: { type: 'image', url: frameUrl },
              styleSource: { type: 'preset', presetStyle: style },
            }),
          });

          const enhanceData = await enhanceResponse.json();

          if (enhanceData.success && enhanceData.taskId) {
            // 轮询等待完成
            const maxAttempts = 60;
            for (let i = 0; i < maxAttempts; i++) {
              const statusResponse = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || ''}/api/enhance/${enhanceData.taskId}`
              );
              const statusData = await statusResponse.json();

              if (statusData.status === 'completed' && statusData.result) {
                return {
                  originalUrl: frameUrl,
                  enhancedUrl: statusData.result.enhancedUrl,
                  success: true,
                };
              }

              if (statusData.status === 'failed') {
                return { originalUrl: frameUrl, error: '增强失败', success: false };
              }

              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }

          return { originalUrl: frameUrl, error: '创建任务失败', success: false };
        } catch (err) {
          return {
            originalUrl: frameUrl,
            error: err instanceof Error ? err.message : '处理失败',
            success: false,
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Enhance frames error:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}
