import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoUrl, frames } = body;

    if (!videoUrl || !frames || !Array.isArray(frames) || frames.length === 0) {
      return NextResponse.json(
        { success: false, error: '请提供视频和要替换的帧' },
        { status: 400 }
      );
    }

    // 创建临时目录
    const tempDir = `/tmp/vidluxe_${Date.now()}`;
    await fs.mkdir(tempDir, { recursive: true });
    const videoPath = path.join(tempDir, 'input.mp4');

    try {
      // 下载视频
      const videoResponse = await fetch(videoUrl);
      if (!videoResponse.ok) {
        throw new Error('下载视频失败');
      }
      const videoBuffer = await videoResponse.arrayBuffer();
      await fs.writeFile(videoPath, Buffer.from(videoBuffer));

      // 下载所有增强后的图片
      const frameFiles: { timestamp: number; path: string }[] = [];
      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        const framePath = path.join(tempDir, `frame_${i}.png`);

        const frameResponse = await fetch(frame.enhancedImageUrl);
        if (!frameResponse.ok) {
          console.warn(`Failed to download frame at ${frame.timestamp}s`);
          continue;
        }
        const frameBuffer = await frameResponse.arrayBuffer();
        await fs.writeFile(framePath, Buffer.from(frameBuffer));

        frameFiles.push({ timestamp: frame.timestamp, path: framePath });
      }

      if (frameFiles.length === 0) {
        throw new Error('没有可用的帧图片');
      }

      // 使用 FFmpeg 进行帧替换
      // 这里使用简单的覆盖方式，将图片叠加到视频的指定时间点
      const outputPath = path.join(tempDir, 'output.mp4');

      // 构建滤镜：每帧显示0.1秒
      let filterComplex = '';
      let inputArgs = `-i ${videoPath} `;

      frameFiles.forEach((fp, index) => {
        inputArgs += `-i ${fp.path} `;
        // 在指定时间点显示图片0.1秒
        filterComplex += `[${index + 1}:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2[img${index}];`;
        filterComplex += `[0:v][img${index}]overlay=0:0:enable='between(t,${fp.timestamp},${fp.timestamp + 0.1})'[v${index}];`;
      });

      // 构建最终命令
      const lastOutput = `[v${frameFiles.length - 1}]`;
      const command = `ffmpeg ${inputArgs}-filter_complex "${filterComplex.slice(0, -1).replace(/\[v\d+\];$/, '')}" -map "${lastOutput}" -map 0:a? -c:a copy -c:v libx264 -preset fast -y ${outputPath}`;

      await execAsync(command, { maxBuffer: 1024 * 1024 * 100 });

      // 读取输出文件
      const outputBuffer = await fs.readFile(outputPath);
      const outputBase64 = outputBuffer.toString('base64');
      const outputDataUrl = `data:video/mp4;base64,${outputBase64}`;

      // 清理临时文件
      await fs.rm(tempDir, { recursive: true, force: true });

      return NextResponse.json({
        success: true,
        videoUrl: outputDataUrl,
      });
    } catch (processError) {
      // 清理临时文件
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch {}
      throw processError;
    }
  } catch (error) {
    console.error('Replace frames error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '帧替换失败' },
      { status: 500 }
    );
  }
}
