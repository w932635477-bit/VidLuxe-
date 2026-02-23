/**
 * FFmpeg 色彩滤镜工具模块
 *
 * 根据色彩分析结果构建 FFmpeg 滤镜链，执行视频调色处理
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { ColorAnalysis } from './color-analyzer';

// ============================================
// 配置常量
// ============================================

const FILTER_CONFIG = {
  ffmpegPath: process.env.FFMPEG_PATH || 'ffmpeg',
  outputDir: './public/uploads/videos/color-graded',
  timeout: 300000, // 5分钟超时
};

// ============================================
// 滤镜链构建函数
// ============================================

/**
 * 根据色彩分析结果构建 FFmpeg 滤镜链
 *
 * @param analysis 色彩分析结果
 * @returns FFmpeg 滤镜链字符串，如果没有需要调整的则返回 'null'
 */
export function buildFilterChain(analysis: ColorAnalysis): string {
  const filters: string[] = [];

  // 亮度调节: eq=brightness=X (范围 -1.0 到 1.0)
  // adjustment 范围 -100 到 100，映射到 -0.2 到 0.2
  if (analysis.brightness.adjustment !== 0) {
    const brightnessValue = analysis.brightness.adjustment / 500; // -100~100 -> -0.2~0.2
    filters.push(`eq=brightness=${brightnessValue.toFixed(3)}`);
  }

  // 对比度调节: eq=contrast=X (范围 0.0 到 2.0, 1.0 是原始)
  // adjustment 范围 -100 到 100，映射到 0.7 到 1.3
  if (analysis.contrast.adjustment !== 0) {
    const contrastValue = 1.0 + analysis.contrast.adjustment / 300; // -100~100 -> 0.67~1.33
    filters.push(`eq=contrast=${contrastValue.toFixed(3)}`);
  }

  // 饱和度调节: eq=saturation=X (范围 0.0 到 3.0, 1.0 是原始)
  // adjustment 范围 -100 到 100，映射到 0.5 到 1.5
  if (analysis.saturation.adjustment !== 0) {
    const saturationValue = 1.0 + analysis.saturation.adjustment / 200; // -100~100 -> 0.5~1.5
    filters.push(`eq=saturation=${saturationValue.toFixed(3)}`);
  }

  // 色温调节: colorbalance=rs=X:bs=Y (调整 R/B 通道)
  // adjustment < 0 表示偏冷，需要增加暖色 (R)
  // adjustment > 0 表示偏暖，需要增加冷色 (B)
  if (analysis.colorTemp.adjustment !== 0) {
    const tempAdjust = analysis.colorTemp.adjustment / 200; // -100~100 -> -0.5~0.5
    if (tempAdjust < 0) {
      // 偏冷，增加红色减少蓝色
      filters.push(`colorbalance=rs=${Math.abs(tempAdjust).toFixed(3)}:bs=${tempAdjust.toFixed(3)}`);
    } else {
      // 偏暖，增加蓝色减少红色
      filters.push(`colorbalance=rs=${(-tempAdjust).toFixed(3)}:bs=${tempAdjust.toFixed(3)}`);
    }
  }

  // 锐化: unsharp=5:5:1.0:5:5:0.0
  if (analysis.sharpness.status === 'low') {
    filters.push('unsharp=5:5:1.0:5:5:0.0');
  }

  // 降噪: hqdn3d=4:3:6:4.5
  if (analysis.noise.status === 'high') {
    filters.push('hqdn3d=4:3:6:4.5');
  }

  // 如果没有滤镜，返回 'null'
  if (filters.length === 0) {
    return 'null';
  }

  return filters.join(',');
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
    // 重要：spawn() 必须在 setTimeout() 之前调用，避免 ReferenceError
    const proc = spawn(FILTER_CONFIG.ffmpegPath, args, {
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
 * 确保输出目录存在
 */
function ensureOutputDir(): string {
  const dir = path.resolve(process.cwd(), FILTER_CONFIG.outputDir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

// ============================================
// 主导出函数
// ============================================

/**
 * 应用色彩调色到视频
 *
 * @param inputPath 输入视频文件路径
 * @param analysis 色彩分析结果
 * @param options 可选参数
 * @param options.previewOnly 是否仅生成预览
 * @param options.previewDuration 预览时长（秒），默认 3 秒
 * @returns 处理结果
 */
export async function applyColorGrade(
  inputPath: string,
  analysis: ColorAnalysis,
  options?: {
    previewOnly?: boolean;
    previewDuration?: number;
  }
): Promise<{ success: boolean; outputPath?: string; error?: string }> {
  console.log(`[FFmpegColorFilters] Applying color grade to: ${inputPath}`);
  console.log(`[FFmpegColorFilters] Preview mode: ${options?.previewOnly || false}`);

  try {
    // 构建滤镜链
    const filterChain = buildFilterChain(analysis);
    console.log(`[FFmpegColorFilters] Filter chain: ${filterChain}`);

    // 确保输出目录存在
    const outputDir = ensureOutputDir();

    // 生成唯一输出文件名
    const sessionId = crypto.randomBytes(8).toString('hex');
    const outputFileName = `graded_${sessionId}.mp4`;
    const outputPath = path.join(outputDir, outputFileName);

    // 构建 FFmpeg 参数
    const args: string[] = ['-i', inputPath];

    // 如果是预览模式，只处理前几秒
    if (options?.previewOnly) {
      args.push('-t', String(options.previewDuration || 3));
    }

    // 添加滤镜链
    if (filterChain !== 'null') {
      args.push('-vf', filterChain);
    }

    // 编码参数
    args.push(
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '23',
      '-c:a', 'copy',
      '-movflags', '+faststart',
      '-y',
      outputPath
    );

    console.log(`[FFmpegColorFilters] FFmpeg args: ${args.join(' ')}`);

    // 执行 FFmpeg
    await execFFmpeg(args, FILTER_CONFIG.timeout);

    // 验证输出文件
    if (!fs.existsSync(outputPath)) {
      return {
        success: false,
        error: 'Output file was not created',
      };
    }

    // 返回相对 URL
    const relativeUrl = `/uploads/videos/color-graded/${outputFileName}`;
    console.log(`[FFmpegColorFilters] Color grade complete: ${relativeUrl}`);

    return {
      success: true,
      outputPath: relativeUrl,
    };
  } catch (error) {
    console.error('[FFmpegColorFilters] Color grade failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 清理调色输出目录中的旧文件
 *
 * @param maxAgeMs 最大文件年龄（毫秒），默认 24 小时
 */
export function cleanupOldFiles(maxAgeMs: number = 24 * 60 * 60 * 1000): void {
  const outputDir = ensureOutputDir();
  const now = Date.now();

  try {
    const files = fs.readdirSync(outputDir);
    let cleanedCount = 0;

    for (const file of files) {
      const filePath = path.join(outputDir, file);
      const stats = fs.statSync(filePath);

      if (now - stats.mtimeMs > maxAgeMs) {
        fs.unlinkSync(filePath);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`[FFmpegColorFilters] Cleaned up ${cleanedCount} old files`);
    }
  } catch (error) {
    console.warn('[FFmpegColorFilters] Cleanup failed:', error);
  }
}
