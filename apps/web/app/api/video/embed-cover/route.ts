/**
 * 封面嵌入 API
 *
 * POST /api/video/embed-cover
 *
 * 将 AI 增强的封面图片插入到视频开头（显示 2 秒）
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
  coverDuration?: number; // 封面显示时长（秒），默认 2 秒
}

interface EmbedResponse {
  success: boolean;
  videoUrl?: string;
  error?: string;
}

const CONFIG = {
  ffmpegPath: process.env.FFMPEG_PATH || 'ffmpeg',
  outputDir: './public/uploads/videos/with-cover',
  coverDuration: 2, // 默认封面显示 2 秒
  timeout: 300000, // 5 分钟超时
};

/**
 * 执行 FFmpeg 命令
 */
async function execFFmpeg(args: string[], timeout: number): Promise<string> {
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
        resolve('success');
      } else {
        reject(new Error(`FFmpeg exited with code ${code}: ${stderr.slice(-500)}`));
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timeoutId);
      reject(err);
    });
  });
}

/**
 * 获取视频信息
 */
async function getVideoInfo(videoPath: string): Promise<{ width: number; height: number; fps: number }> {
  const ffprobePath = process.env.FFPROBE_PATH || 'ffprobe';
  const args = [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height,r_frame_rate',
    '-of', 'json',
    videoPath,
  ];

  return new Promise((resolve, reject) => {
    const proc = spawn(ffprobePath, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    proc.stdout?.on('data', (d) => stdout += d.toString());
    proc.on('close', (code) => {
      if (code === 0) {
        try {
          const info = JSON.parse(stdout);
          const stream = info.streams?.[0] || {};
          let fps = 30;
          if (stream.r_frame_rate) {
            const [num, den] = stream.r_frame_rate.split('/');
            fps = den ? Math.round(parseInt(num) / parseInt(den)) : parseInt(num);
          }
          resolve({
            width: stream.width || 1080,
            height: stream.height || 1920,
            fps,
          });
        } catch {
          resolve({ width: 1080, height: 1920, fps: 30 });
        }
      } else {
        resolve({ width: 1080, height: 1920, fps: 30 });
      }
    });
    proc.on('error', () => resolve({ width: 1080, height: 1920, fps: 30 }));
  });
}

export async function POST(request: NextRequest): Promise<NextResponse<EmbedResponse>> {
  try {
    const body: EmbedRequest = await request.json();
    const { videoUrl, coverUrl, coverDuration = CONFIG.coverDuration } = body;

    if (!videoUrl || !coverUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing videoUrl or coverUrl' },
        { status: 400 }
      );
    }

    console.log('[EmbedCover] Inserting cover at start of video:', { videoUrl, coverUrl, coverDuration });

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
        { success: false, error: `Video not found` },
        { status: 404 }
      );
    }
    if (!fs.existsSync(coverPath)) {
      return NextResponse.json(
        { success: false, error: `Cover not found` },
        { status: 404 }
      );
    }

    // 确保输出目录存在
    const outputDir = path.resolve(process.cwd(), CONFIG.outputDir);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 获取视频信息
    const videoInfo = await getVideoInfo(videoPath);
    console.log('[EmbedCover] Video info:', videoInfo);

    // 生成临时文件名
    const videoId = crypto.randomBytes(8).toString('hex');
    const coverVideoPath = path.join(outputDir, `cover_temp_${videoId}.mp4`);
    const concatListPath = path.join(outputDir, `concat_${videoId}.txt`);
    const outputFilename = `with_cover_${Date.now()}_${videoId}.mp4`;
    const outputPath = path.join(outputDir, outputFilename);

    try {
      // 步骤 1: 将封面图片转换为短视频（2秒），添加静音音频
      console.log('[EmbedCover] Step 1: Converting cover to video...');
      const coverArgs = [
        '-loop', '1',
        '-i', coverPath,
        '-f', 'lavfi',
        '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
        '-t', String(coverDuration),
        '-vf', `scale=${videoInfo.width}:${videoInfo.height}:force_original_aspect_ratio=decrease,pad=${videoInfo.width}:${videoInfo.height}:(ow-iw)/2:(oh-ih)/2,setsar=1`,
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-crf', '23',
        '-pix_fmt', 'yuv420p',
        '-r', String(videoInfo.fps),
        '-c:a', 'aac',
        '-shortest',
        '-f', 'mp4',
        '-y',
        coverVideoPath,
      ];
      await execFFmpeg(coverArgs, 30000);
      console.log('[EmbedCover] Cover video created');

      // 步骤 2: 创建 concat 列表文件
      const concatList = `file '${coverVideoPath}'\nfile '${videoPath}'`;
      fs.writeFileSync(concatListPath, concatList);

      // 步骤 3: 拼接视频（重新编码以确保兼容性）
      console.log('[EmbedCover] Step 2: Concatenating videos...');
      const concatArgs = [
        '-f', 'concat',
        '-safe', '0',
        '-i', concatListPath,
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-crf', '23',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        '-y',
        outputPath,
      ];
      await execFFmpeg(concatArgs, CONFIG.timeout);
      console.log('[EmbedCover] Videos concatenated');

    } finally {
      // 清理临时文件
      if (fs.existsSync(coverVideoPath)) {
        fs.unlinkSync(coverVideoPath);
      }
      if (fs.existsSync(concatListPath)) {
        fs.unlinkSync(concatListPath);
      }
    }

    // 检查输出文件
    if (!fs.existsSync(outputPath)) {
      throw new Error('Failed to create video with cover');
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
        error: error instanceof Error ? error.message : 'Failed to insert cover',
      },
      { status: 500 }
    );
  }
}
