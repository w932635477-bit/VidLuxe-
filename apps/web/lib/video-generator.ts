/**
 * FFmpeg 视频生成器
 *
 * 使用本地 FFmpeg 生成视频
 * MVP 阶段：创建简单的图片轮播/合成视频
 *
 * 安全说明：使用 spawn 替代 exec 防止命令注入
 */

import { spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

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
  // FFprobe 路径
  ffprobePath: process.env.FFPROBE_PATH || 'ffprobe',
};

// 视频生成参数
export interface VideoGenerationParams {
  backgroundUrl: string; // 背景图 URL 或本地路径
  foregroundUrl?: string; // 前景图（人物）URL 或本地路径
  duration?: number; // 视频时长（秒）
  style?: 'magazine' | 'soft' | 'urban' | 'vintage';
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
 * 验证路径安全性
 * 防止路径遍历和命令注入
 */
function validatePath(inputPath: string, basePath: string): string {
  // 规范化路径
  const normalizedPath = path.normalize(inputPath);
  const resolvedPath = path.resolve(basePath, normalizedPath);

  // 确保解析后的路径在基础路径内
  if (!resolvedPath.startsWith(basePath)) {
    throw new Error(`Path traversal detected: ${inputPath}`);
  }

  // 检查路径是否包含危险字符
  if (/[;&|`$(){}[\]<>]/.test(inputPath)) {
    throw new Error(`Invalid characters in path: ${inputPath}`);
  }

  return resolvedPath;
}

/**
 * 验证文件名安全性
 */
function validateFilename(filename: string): string {
  // 只允许安全字符
  if (!/^[a-zA-Z0-9_\-./]+$/.test(filename)) {
    throw new Error(`Invalid filename characters: ${filename}`);
  }
  return filename;
}

/**
 * 安全执行 FFmpeg 命令
 * 使用 spawn 替代 exec，参数作为数组传递
 */
async function execFFmpeg(args: string[], timeout: number = 60000): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      proc.kill('SIGKILL');
      reject(new Error('FFmpeg timeout'));
    }, timeout);

    const proc = spawn(VIDEO_CONFIG.ffmpegPath, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

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
        const error = new Error(`FFmpeg exited with code ${code}: ${stderr.slice(-500)}`);
        reject(error);
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timeoutId);
      reject(err);
    });
  });
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
  // 验证输出路径
  const tempDir = path.dirname(outputPath);
  validatePath(outputPath, tempDir);

  // 如果是本地路径，直接复制
  if (url.startsWith('/') || url.startsWith('./')) {
    const cwd = process.cwd();
    const localPath = validatePath(url.replace(/^\//, ''), cwd);
    if (fs.existsSync(localPath)) {
      fs.copyFileSync(localPath, outputPath);
      return;
    }
  }

  // 如果是 URL，下载图片
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // 验证 URL 格式
    try {
      const parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid URL protocol');
      }
    } catch {
      throw new Error(`Invalid URL: ${url}`);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status}`);
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(outputPath, buffer);
    } finally {
      clearTimeout(timeoutId);
    }
    return;
  }

  // 如果是 public 目录下的路径
  const publicDir = path.resolve(process.cwd(), 'public');
  const publicPath = validatePath(url.replace(/^\//, ''), publicDir);
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

  // 验证视频 ID
  validateFilename(videoId);

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
      console.warn(`[VideoGenerator] Failed to cleanup temp dir ${tempDir}:`, e);
    }
  }
}

/**
 * 从单张图片生成视频
 * 使用 spawn 安全执行 FFmpeg
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

  // 使用 spawn 安全执行，参数作为数组传递
  const args = [
    '-loop', '1',
    '-i', imagePath,
    '-vf', filter,
    '-c:v', 'libx264',
    '-t', String(duration),
    '-pix_fmt', 'yuv420p',
    '-r', String(VIDEO_CONFIG.fps),
    '-y',
    outputPath,
  ];

  if (process.env.NODE_ENV !== 'production') {
    console.log('[FFmpeg] Running command for video generation');
  }

  const { stderr } = await execFFmpeg(args);

  if (stderr && !stderr.includes('frame=')) {
    console.warn('[FFmpeg] stderr:', stderr.slice(-200));
  }
}

/**
 * 合成背景 + 前景生成视频
 * 使用 spawn 安全执行 FFmpeg
 */
async function generateCompositeVideo(
  bgPath: string,
  fgPath: string,
  outputPath: string,
  duration: number,
  transition?: string
): Promise<void> {
  // 构建滤镜：背景 + 前景叠加
  const filter = [
    // 缩放背景
    '[0:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2[bg]',
    // 缩放前景（保持比例，最大 80% 高度）
    `[1:v]scale=1080:1536:force_original_aspect_ratio=decrease[fg]`,
    // 叠加前景到背景中心
    `[bg][fg]overlay=(W-w)/2:(H-h)/2,fade=t=in:st=0:d=0.5,fade=t=out:st=${duration - 0.5}:d=0.5`,
  ].join(';');

  // 使用 spawn 安全执行，参数作为数组传递
  const args = [
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
  ];

  console.log('[FFmpeg] Running composite command');

  const { stderr } = await execFFmpeg(args);

  if (stderr && !stderr.includes('frame=')) {
    console.warn('[FFmpeg] stderr:', stderr.slice(-200));
  }
}

/**
 * 检查 FFmpeg 是否可用
 */
export async function checkFFmpegAvailable(): Promise<boolean> {
  try {
    await execFFmpeg(['-version'], 5000);
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取视频时长
 * 使用 spawn 安全执行
 */
export async function getVideoDuration(videoPath: string): Promise<number> {
  // 验证路径
  const cwd = process.cwd();
  const validatedPath = validatePath(videoPath, cwd);

  const args = [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    validatedPath,
  ];

  try {
    const { stdout } = await execFFmpeg(args, 10000);
    const duration = parseFloat(stdout.trim());
    return isNaN(duration) ? 0 : duration;
  } catch {
    return 0;
  }
}
