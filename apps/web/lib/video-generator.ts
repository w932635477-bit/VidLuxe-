/**
 * FFmpeg 视频生成器
 *
 * 使用本地 FFmpeg 生成视频
 * MVP 阶段：创建简单的图片轮播/合成视频
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const execAsync = promisify(exec);

// 配置
const VIDEO_CONFIG = {
  // 输出目录
  outputDir: process.env.VIDEO_OUTPUT_DIR || './public/uploads/videos',
  // 视频参数
  fps: 30,
  duration: 5, // 默认 5 秒
  width: 1080,
  height: 1920,
  // FFmpeg 路径
  ffmpegPath: process.env.FFMPEG_PATH || 'ffmpeg',
};

// 视频生成参数
export interface VideoGenerationParams {
  backgroundUrl: string; // 背景图 URL 或本地路径
  foregroundUrl?: string; // 前景图（人物）URL 或本地路径
  duration?: number; // 视频时长（秒）
  style?: 'magazine' | 'soft' | 'urban' | 'minimal' | 'vintage';
  transition?: 'fade' | 'zoom' | 'slide'; // 转场效果
}

// 视频生成结果
export interface VideoGenerationResult {
  videoUrl: string;
  duration: number;
  width: number;
  height: number;
  fileSize: number;
}

/**
 * 确保输出目录存在
 */
function ensureOutputDir(): void {
  const dir = path.resolve(process.cwd(), VIDEO_CONFIG.outputDir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * 生成视频 ID
 */
function generateVideoId(): string {
  return `video_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
}

/**
 * 下载远程图片到本地
 */
async function downloadImage(url: string, outputPath: string): Promise<void> {
  // 如果是本地路径，直接复制
  if (url.startsWith('/') || url.startsWith('./')) {
    const localPath = path.resolve(process.cwd(), url.replace(/^\//, ''));
    if (fs.existsSync(localPath)) {
      fs.copyFileSync(localPath, outputPath);
      return;
    }
  }

  // 如果是 URL，下载图片
  if (url.startsWith('http://') || url.startsWith('https://')) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(outputPath, buffer);
    return;
  }

  // 如果是 public 目录下的路径
  const publicPath = path.resolve(process.cwd(), 'public', url.replace(/^\//, ''));
  if (fs.existsSync(publicPath)) {
    fs.copyFileSync(publicPath, outputPath);
    return;
  }

  throw new Error(`Image not found: ${url}`);
}

/**
 * 使用 FFmpeg 生成视频
 *
 * MVP 实现：从单张图片生成视频（带淡入淡出效果）
 */
export async function generateVideo(params: VideoGenerationParams): Promise<VideoGenerationResult> {
  ensureOutputDir();

  const videoId = generateVideoId();
  const tempDir = path.resolve(process.cwd(), 'tmp', videoId);
  const outputDir = path.resolve(process.cwd(), VIDEO_CONFIG.outputDir);

  // 创建临时目录
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  try {
    const duration = params.duration || VIDEO_CONFIG.duration;
    const outputFile = path.join(outputDir, `${videoId}.mp4`);

    // 下载背景图
    const bgPath = path.join(tempDir, 'background.png');
    await downloadImage(params.backgroundUrl, bgPath);

    // 下载前景图（如果有）
    let fgPath: string | null = null;
    if (params.foregroundUrl) {
      fgPath = path.join(tempDir, 'foreground.png');
      await downloadImage(params.foregroundUrl, fgPath);
    }

    // 构建 FFmpeg 命令
    if (fgPath && fs.existsSync(fgPath)) {
      // 有前景图：合成背景 + 前景
      await generateCompositeVideo(bgPath, fgPath, outputFile, duration, params.transition);
    } else {
      // 无前景图：单图生成视频
      await generateSingleImageVideo(bgPath, outputFile, duration, params.transition);
    }

    // 获取视频信息
    const stats = fs.statSync(outputFile);

    return {
      videoUrl: `/uploads/videos/${videoId}.mp4`,
      duration,
      width: VIDEO_CONFIG.width,
      height: VIDEO_CONFIG.height,
      fileSize: stats.size,
    };
  } finally {
    // 清理临时目录
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {
      // 忽略清理错误
    }
  }
}

/**
 * 从单张图片生成视频
 */
async function generateSingleImageVideo(
  imagePath: string,
  outputPath: string,
  duration: number,
  transition?: string
): Promise<void> {
  // 构建滤镜
  let filter = '';

  switch (transition) {
    case 'zoom':
      // 缓慢放大效果
      filter = `scale=1080:1920,zoompan=z='min(zoom+0.0005,1.2)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${duration * VIDEO_CONFIG.fps}:s=1080x1920:fps=${VIDEO_CONFIG.fps}`;
      break;
    case 'slide':
      // 滑动效果
      filter = `scale=1080:1920,zoompan=z=1:x='iw/2-(iw/zoom/2)+on*2':y='ih/2-(ih/zoom/2)':d=${duration * VIDEO_CONFIG.fps}:s=1080x1920:fps=${VIDEO_CONFIG.fps}`;
      break;
    case 'fade':
    default:
      // 淡入淡出
      filter = `scale=1080:1920,fade=t=in:st=0:d=0.5,fade=t=out:st=${duration - 0.5}:d=0.5`;
      break;
  }

  const cmd = [
    VIDEO_CONFIG.ffmpegPath,
    '-loop', '1',
    '-i', imagePath,
    '-vf', filter,
    '-c:v', 'libx264',
    '-t', String(duration),
    '-pix_fmt', 'yuv420p',
    '-r', String(VIDEO_CONFIG.fps),
    '-y', // 覆盖输出文件
    outputPath,
  ].join(' ');

  console.log('[FFmpeg] Running command:', cmd);

  const { stdout, stderr } = await execAsync(cmd, { maxBuffer: 50 * 1024 * 1024 });

  if (stderr && !stderr.includes('frame=')) {
    console.warn('[FFmpeg] stderr:', stderr);
  }
}

/**
 * 合成背景 + 前景生成视频
 */
async function generateCompositeVideo(
  bgPath: string,
  fgPath: string,
  outputPath: string,
  duration: number,
  transition?: string
): Promise<void> {
  // 使用 FFmpeg overlay 滤镜合成
  // 前景居中显示，背景可能有动画效果
  const totalFrames = duration * VIDEO_CONFIG.fps;

  // 构建滤镜：背景 + 前景叠加
  let filter = [
    // 缩放背景
    '[0:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2[bg]',
    // 缩放前景（保持比例，最大 80% 高度）
    `[1:v]scale=1080:1536:force_original_aspect_ratio=decrease[fg]`,
    // 叠加前景到背景中心
    '[bg][fg]overlay=(W-w)/2:(H-h)/2',
  ].join(';');

  // 添加淡入淡出
  filter += `,fade=t=in:st=0:d=0.5,fade=t=out:st=${duration - 0.5}:d=0.5`;

  const cmd = [
    VIDEO_CONFIG.ffmpegPath,
    '-loop', '1',
    '-i', bgPath,
    '-loop', '1',
    '-i', fgPath,
    '-filter_complex', filter,
    '-c:v', 'libx264',
    '-t', String(duration),
    '-pix_fmt', 'yuv420p',
    '-r', String(VIDEO_CONFIG.fps),
    '-y',
    outputPath,
  ].join(' ');

  console.log('[FFmpeg] Running composite command');

  const { stderr } = await execAsync(cmd, { maxBuffer: 50 * 1024 * 1024 });

  if (stderr && !stderr.includes('frame=')) {
    console.warn('[FFmpeg] stderr:', stderr);
  }
}

/**
 * 检查 FFmpeg 是否可用
 */
export async function checkFFmpegAvailable(): Promise<boolean> {
  try {
    await execAsync(`${VIDEO_CONFIG.ffmpegPath} -version`);
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取视频时长
 */
export async function getVideoDuration(videoPath: string): Promise<number> {
  const cmd = `${VIDEO_CONFIG.ffmpegPath} -i "${videoPath}" 2>&1 | grep Duration`;
  const { stdout } = await execAsync(cmd);

  const match = stdout.match(/Duration: (\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
  if (match) {
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const seconds = parseInt(match[3], 10);
    const centiseconds = parseInt(match[4], 10);
    return hours * 3600 + minutes * 60 + seconds + centiseconds / 100;
  }

  return 0;
}
