import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const results: string[] = [];

  // 1. 检查视频文件
  const videoPath = path.resolve('./public/uploads/videos/file_1773217129059_cbbd488279e3.mp4');
  results.push(`Video path: ${videoPath}`);
  results.push(`Video exists: ${fs.existsSync(videoPath)}`);
  if (fs.existsSync(videoPath)) {
    results.push(`Video size: ${fs.statSync(videoPath).size} bytes`);
  }

  // 2. 测试 ffprobe
  const ffprobeResult = await new Promise<string>((resolve) => {
    const proc = spawn('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      videoPath
    ], { stdio: ['ignore', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    proc.on('close', (code) => {
      resolve(`FFprobe exit code: ${code}, stdout: "${stdout.trim()}", stderr: "${stderr.slice(0, 200)}"`);
    });

    proc.on('error', (err) => {
      resolve(`FFprobe error: ${err.message}`);
    });
  });
  results.push(ffprobeResult);

  // 3. 测试帧提取
  const testOutput = '/tmp/test_next_frame.jpg';
  const ffmpegResult = await new Promise<string>((resolve) => {
    const proc = spawn('ffmpeg', [
      '-ss', '0',
      '-i', videoPath,
      '-vframes', '1',
      '-q:v', '2',
      '-y', testOutput
    ], { stdio: ['ignore', 'pipe', 'pipe'] });

    let stderr = '';

    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    proc.on('close', (code) => {
      const exists = fs.existsSync(testOutput);
      resolve(`FFmpeg exit code: ${code}, output exists: ${exists}, stderr: "${stderr.slice(0, 200)}"`);
    });

    proc.on('error', (err) => {
      resolve(`FFmpeg error: ${err.message}`);
    });
  });
  results.push(ffmpegResult);

  return NextResponse.json({ results });
}
