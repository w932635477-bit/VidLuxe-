/**
 * 视频调色 API
 *
 * POST /api/video/color-grade
 *
 * 功能：
 * 1. 分析视频色彩，返回分析结果和专业解释
 * 2. 应用调色滤镜，返回调色后视频
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { getFileStorage } from '@/lib/file-storage';
import { analyzeVideoColor } from '@/lib/color-analyzer';
import { applyColorGrade } from '@/lib/ffmpeg-color-filters';

// 请求类型
interface ColorGradeRequest {
  videoUrl: string;       // 视频URL
  action: 'analyze' | 'process';  // analyze=只分析，process=分析并处理
  previewOnly?: boolean;  // 是否只生成预览
}

// 响应类型
interface ColorGradeResponse {
  success: boolean;
  analysis?: {
    brightness: { value: number; status: string; adjustment: number };
    contrast: { value: number; status: string; adjustment: number };
    saturation: { value: number; status: string; adjustment: number };
    colorTemp: { value: number; status: string; adjustment: number };
    sharpness: { value: number; status: string; adjustment: number };
    noise: { value: number; status: string; adjustment: number };
  };
  explanation?: string;
  gradedVideoUrl?: string;
  error?: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ColorGradeResponse>> {
  try {
    const body: ColorGradeRequest = await request.json();
    const { videoUrl, action = 'analyze', previewOnly = false } = body;

    // 验证 videoUrl
    if (!videoUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing videoUrl' },
        { status: 400 }
      );
    }

    console.log('[ColorGrade] Processing:', { videoUrl, action, previewOnly });

    // 获取视频本地路径
    const storage = getFileStorage();
    let videoPath: string;

    if (videoUrl.startsWith('/uploads/')) {
      videoPath = storage.getLocalPath(videoUrl);
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid videoUrl' },
        { status: 400 }
      );
    }

    // 检查文件存在
    if (!fs.existsSync(videoPath)) {
      return NextResponse.json(
        { success: false, error: 'Video not found' },
        { status: 404 }
      );
    }

    // 步骤 1: 分析视频色彩
    console.log('[ColorGrade] Step 1: Analyzing video color...');
    const analysisResult = await analyzeVideoColor(videoPath);

    if (!analysisResult.success) {
      return NextResponse.json(
        { success: false, error: analysisResult.error || 'Analysis failed' },
        { status: 500 }
      );
    }

    // 如果只是分析，直接返回结果
    if (action === 'analyze') {
      console.log('[ColorGrade] Analysis complete, returning results');
      return NextResponse.json({
        success: true,
        analysis: analysisResult.analysis,
        explanation: analysisResult.explanation,
      });
    }

    // 步骤 2: 应用调色
    console.log('[ColorGrade] Step 2: Applying color grade...');
    const gradeResult = await applyColorGrade(videoPath, analysisResult.analysis, {
      previewOnly,
      previewDuration: 3,
    });

    if (!gradeResult.success) {
      return NextResponse.json(
        { success: false, error: gradeResult.error || 'Color grading failed' },
        { status: 500 }
      );
    }

    console.log('[ColorGrade] Color grading complete:', gradeResult.outputPath);

    return NextResponse.json({
      success: true,
      analysis: analysisResult.analysis,
      explanation: analysisResult.explanation,
      gradedVideoUrl: gradeResult.outputPath,
    });
  } catch (error) {
    console.error('[ColorGrade] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process video',
      },
      { status: 500 }
    );
  }
}
