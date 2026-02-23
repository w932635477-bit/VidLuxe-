/**
 * 视频分析 API
 *
 * POST /api/video/analyze
 *
 * 分析视频，提取关键帧并返回评分列表
 */

import { NextRequest, NextResponse } from 'next/server';
import { extractKeyFrames, type FrameScore } from '@/lib/keyframe-extractor';
import { getFileStorage } from '@/lib/file-storage';

// 请求体
interface AnalyzeRequest {
  videoUrl: string; // 上传后的视频 URL
}

// 响应
interface AnalyzeResponse {
  success: boolean;
  keyframes?: FrameScore[];
  videoInfo?: {
    duration: number;
    hasAudio: boolean;
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<AnalyzeResponse>> {
  try {
    const body: AnalyzeRequest = await request.json();
    const { videoUrl } = body;

    if (!videoUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing videoUrl' },
        { status: 400 }
      );
    }

    console.log('[VideoAnalyze] Analyzing video:', videoUrl);

    // 获取视频本地路径
    const storage = getFileStorage();
    let localPath: string;

    if (videoUrl.startsWith('/uploads/')) {
      // 本地上传的文件
      localPath = storage.getLocalPath(videoUrl);
      console.log('[VideoAnalyze] Local path resolved:', localPath);

      // 检查文件是否存在
      const fs = await import('fs');
      if (!fs.existsSync(localPath)) {
        console.error('[VideoAnalyze] File not found:', localPath);
        return NextResponse.json(
          { success: false, error: `Video file not found: ${localPath}` },
          { status: 404 }
        );
      }
      console.log('[VideoAnalyze] File exists, size:', fs.statSync(localPath).size);
    } else if (videoUrl.startsWith('http')) {
      // 远程 URL - 需要先下载
      // TODO: 实现远程视频下载
      return NextResponse.json(
        { success: false, error: 'Remote video URL not supported yet' },
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid videoUrl' },
        { status: 400 }
      );
    }

    // 提取关键帧
    const keyframes = await extractKeyFrames(localPath, {
      extractInterval: 2,
      topFrames: 10,
    });

    if (keyframes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No frames extracted from video' },
        { status: 500 }
      );
    }

    console.log('[VideoAnalyze] Extracted', keyframes.length, 'keyframes');

    return NextResponse.json({
      success: true,
      keyframes,
      videoInfo: {
        duration: Math.max(...keyframes.map(f => f.timestamp)) + 2, // 估算
        hasAudio: true, // 简化
      },
    });
  } catch (error) {
    console.error('[VideoAnalyze] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze video',
      },
      { status: 500 }
    );
  }
}
