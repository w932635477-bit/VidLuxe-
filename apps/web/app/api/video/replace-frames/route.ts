/**
 * 视频帧替换 API
 *
 * POST /api/video/replace-frames
 *
 * 功能：使用 FFmpeg 将增强后的帧替换回视频
 *
 * 请求体：
 * - videoUrl: string - 原视频 URL
 * - frames: { timestamp: number; enhancedUrl: string }[] - 要替换的帧列表
 *
 * 响应：
 * - success: boolean
 * - outputUrl?: string - 输出视频的 URL
 * - error?: string
 */

import { NextRequest, NextResponse } from 'next/server';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

const execAsync = promisify(exec);

// 配置常量
const CONFIG = {
  ffmpegPath: process.env.FFMPEG_PATH || 'ffmpeg',
  tempDir: './tmp/replace-frames',
  outputDir: './public/uploads/videos/replaced',
  timeout: 300000, // 5分钟超时
};

// Next.js Route Segment Config
export const maxDuration = 300; // 5分钟超时

// ============================================
// FFmpeg 检查函数
// ============================================

/**
 * 检查 FFmpeg 是否可用
 */
async function checkFFmpegAvailable(): Promise<boolean> {
  try {
    await execAsync(`${CONFIG.ffmpegPath} -version`);
    return true;
  } catch {
    return false;
  }
}

// ============================================
// FFmpeg 执行函数
// ============================================

/**
 * 执行 FFmpeg 命令，带超时处理
 *
 * @param args FFmpeg 命令行参数
 * @param timeout 超时时间（毫秒）
 * @returns Promise<{ stdout: string; stderr: string }>
 */
async function execFFmpeg(
  args: string[],
  timeout: number
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(CONFIG.ffmpegPath, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const timeoutId = setTimeout(() => {
      proc.kill('SIGKILL');
      reject(new Error('FFmpeg timeout'));
    }, timeout);

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      clearTimeout(timeoutId);
      if (code === 0) {
        resolve({ stdout, stderr });
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

// ============================================
// 目录管理函数
// ============================================

/**
 * 确保目录存在
 */
async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    // 目录可能已存在
  }
}

// ============================================
// 请求/响应类型
// ============================================

interface FrameToReplace {
  timestamp: number;
  enhancedUrl: string;
}

interface ReplaceFramesRequest {
  videoUrl: string;
  frames: FrameToReplace[];
}

interface ReplaceFramesResponse {
  success: boolean;
  outputUrl?: string;
  error?: string;
}

// ============================================
// 主处理函数
// ============================================

export async function POST(
  request: NextRequest
): Promise<NextResponse<ReplaceFramesResponse>> {
  // 创建唯一的会话 ID
  const sessionId = crypto.randomBytes(8).toString('hex');
  const tempDir = path.resolve(process.cwd(), `${CONFIG.tempDir}/${sessionId}`);

  try {
    // 1. 检查 FFmpeg 是否可用
    const ffmpegAvailable = await checkFFmpegAvailable();
    if (!ffmpegAvailable) {
      console.error('[ReplaceFrames] FFmpeg is not available');
      return NextResponse.json(
        { success: false, error: 'FFmpeg is not available on this server' },
        { status: 500 }
      );
    }

    // 2. 解析请求
    const body: ReplaceFramesRequest = await request.json();
    const { videoUrl, frames } = body;

    // 验证请求
    if (!videoUrl || !frames || !Array.isArray(frames) || frames.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing videoUrl or frames' },
        { status: 400 }
      );
    }

    console.log(`[ReplaceFrames] Processing: ${frames.length} frames for session ${sessionId}`);

    // 3. 创建临时工作目录
    await ensureDir(tempDir);
    const videoPath = path.join(tempDir, 'input.mp4');

    // 4. 下载原视频
    console.log('[ReplaceFrames] Downloading original video...');
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.status}`);
    }
    const videoBuffer = await videoResponse.arrayBuffer();
    await fs.writeFile(videoPath, Buffer.from(videoBuffer));

    // 5. 下载所有增强后的帧
    console.log('[ReplaceFrames] Downloading enhanced frames...');
    const frameFiles: { timestamp: number; path: string }[] = [];

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const framePath = path.join(tempDir, `frame_${i}.png`);

      try {
        const frameResponse = await fetch(frame.enhancedUrl);
        if (!frameResponse.ok) {
          console.warn(`[ReplaceFrames] Failed to download frame at ${frame.timestamp}s`);
          continue;
        }
        const frameBuffer = await frameResponse.arrayBuffer();
        await fs.writeFile(framePath, Buffer.from(frameBuffer));
        frameFiles.push({ timestamp: frame.timestamp, path: framePath });
      } catch (err) {
        console.warn(`[ReplaceFrames] Error downloading frame ${i}:`, err);
      }
    }

    if (frameFiles.length === 0) {
      throw new Error('No frames could be downloaded');
    }

    console.log(`[ReplaceFrames] Downloaded ${frameFiles.length} frames`);

    // 6. 构建 FFmpeg 滤镜链替换帧
    // MVP 版本：使用 overlay 滤镜在指定时间点显示增强后的帧
    const outputPath = path.join(tempDir, 'output.mp4');

    // 构建输入参数和滤镜链
    const inputArgs: string[] = ['-i', videoPath];
    const filterParts: string[] = [];

    frameFiles.forEach((fp, index) => {
      inputArgs.push('-i', fp.path);
      // 缩放帧到视频尺寸（假设是 1080x1920 竖屏）
      // 使用 overlay 在指定时间点显示增强帧
      filterParts.push(
        `[${index + 1}:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2[img${index}]`
      );
    });

    // 构建叠加滤镜链
    let currentVideo = '[0:v]';
    frameFiles.forEach((fp, index) => {
      const nextVideo = index === frameFiles.length - 1 ? '[outv]' : `[v${index}]`;
      // 在指定时间点显示增强帧（显示 0.1 秒）
      filterParts.push(
        `${currentVideo}[img${index}]overlay=0:0:enable='between(t,${fp.timestamp},${fp.timestamp + 0.1})'${nextVideo}`
      );
      currentVideo = nextVideo;
    });

    const filterComplex = filterParts.join(';');

    // 构建 FFmpeg 命令参数
    const ffmpegArgs = [
      ...inputArgs,
      '-filter_complex', filterComplex,
      '-map', '[outv]',
      '-map', '0:a?', // 保留原音频（如果有）
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '23',
      '-c:a', 'copy',
      '-movflags', '+faststart',
      '-y',
      outputPath,
    ];

    console.log('[ReplaceFrames] Running FFmpeg...');
    console.log(`[ReplaceFrames] FFmpeg args: ${ffmpegArgs.join(' ')}`);

    // 7. 执行 FFmpeg
    await execFFmpeg(ffmpegArgs, CONFIG.timeout);

    // 8. 验证输出文件
    try {
      await fs.access(outputPath);
    } catch {
      throw new Error('Output file was not created');
    }

    // 9. 将输出文件移动到 public 目录
    const outputDir = path.resolve(process.cwd(), CONFIG.outputDir);
    await ensureDir(outputDir);

    const outputFileName = `replaced_${sessionId}.mp4`;
    const finalOutputPath = path.join(outputDir, outputFileName);
    await fs.copyFile(outputPath, finalOutputPath);

    // 10. 清理临时文件
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.warn('[ReplaceFrames] Cleanup failed:', cleanupError);
    }

    // 11. 返回输出 URL
    const outputUrl = `/uploads/videos/replaced/${outputFileName}`;
    console.log(`[ReplaceFrames] Complete: ${outputUrl}`);

    return NextResponse.json({
      success: true,
      outputUrl,
    });
  } catch (error) {
    console.error('[ReplaceFrames] Error:', error);

    // 清理临时文件
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {}

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Frame replacement failed',
      },
      { status: 500 }
    );
  }
}
