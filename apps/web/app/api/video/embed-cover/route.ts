/**
 * 封面嵌入 API
 *
 * POST /api/video/embed-cover
 *
 * 将 AI 增强的封面图片嵌入视频元数据（不重新编码）
 */

import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getFileStorage } from '@/lib/file-storage';

interface EmbedRequest {
  videoUrl: string;
  coverUrl: string;
}

interface EmbedResponse {
  success: boolean;
  videoUrl?: string;
  error?: string;
}

const CONFIG = {
  ffmpegPath: process.env.FFMPEG_PATH || 'ffmpeg',
  outputDir: './public/uploads/videos/with-cover',
  timeout: 30000,
};

/**
 * 执行 FFmpeg 命令
 */
async function execFFmpeg(args: string[], timeout: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      proc.kill('SIGKILL');
      reject(new Error('FFmpeg timeout'));
    }, timeout);

    const proc = spawn(CONFIG.ffmpegPath, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderr = '';
    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      clearTimeout(timeoutId);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}: ${stderr}`));
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timeoutId);
      reject(err);
    });
  });
}

export async function POST(request: NextRequest): Promise<NextResponse<EmbedResponse>> {
  try {
    const body: EmbedRequest = await request.json();
    const { videoUrl, coverUrl } = body;

    if (!videoUrl || !coverUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing videoUrl or coverUrl' },
        { status: 400 }
      );
    }

    console.log('[EmbedCover] Embedding cover into video:', { videoUrl, coverUrl });

    const storage = getFileStorage();

    // 解析本地路径
    let videoPath: string;
    let coverPath: string;

    if (videoUrl.startsWith('/uploads/')) {
      videoPath = storage.getLocalPath(videoUrl);
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid videoUrl' },
        { status: 400 }
      );
    }

    if (coverUrl.startsWith('/uploads/')) {
      coverPath = storage.getLocalPath(coverUrl);
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid coverUrl' },
        { status: 400 }
      );
    }

    // 检查文件存在
    if (!fs.existsSync(videoPath)) {
      return NextResponse.json(
        { success: false, error: `Video not found: ${videoPath}` },
        { status: 404 }
      );
    }
    if (!fs.existsSync(coverPath)) {
      return NextResponse.json(
        { success: false, error: `Cover not found: ${coverPath}` },
        { status: 404 }
      );
    }

    // 确保输出目录存在
    const outputDir = path.resolve(process.cwd(), CONFIG.outputDir);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 生成输出文件名
    const videoId = crypto.randomBytes(8).toString('hex');
    const outputFilename = `with_cover_${Date.now()}_${videoId}.mp4`;
    const outputPath = path.join(outputDir, outputFilename);

    // FFmpeg 命令：嵌入封面（不重新编码）
    const args = [
      '-i', videoPath,
      '-i', coverPath,
      '-map', '0',
      '-map', '1',
      '-c', 'copy',
      '-disposition:v:1', 'attached_pic',
      '-y',
      outputPath,
    ];

    console.log('[EmbedCover] Running FFmpeg...');
    await execFFmpeg(args, CONFIG.timeout);

    if (!fs.existsSync(outputPath)) {
      throw new Error('Failed to embed cover');
    }

    const outputUrl = `/uploads/videos/with-cover/${outputFilename}`;
    console.log('[EmbedCover] Success:', outputUrl);

    return NextResponse.json({
      success: true,
      videoUrl: outputUrl,
    });
  } catch (error) {
    console.error('[EmbedCover] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to embed cover',
      },
      { status: 500 }
    );
  }
}
