/**
 * 生成首屏 Hero 对比图片
 *
 * 正确流程：
 * 1. 先生成一张"原图"（普通场景）
 * 2. 使用 Image-to-Image，将原图作为参考，只改变背景，保留人物不变
 *
 * 核心原则：主体不变，背景重构
 */

import * as fs from 'fs';
import * as path from 'path';

const API_KEY = process.env.NANO_BANANA_API_KEY!;
const API_BASE = 'https://api.evolink.ai';

interface TaskResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  results?: string[];
}

// 轮询任务状态
async function waitForTask(taskId: string): Promise<string[]> {
  console.log(`等待任务完成: ${taskId}`);

  while (true) {
    const response = await fetch(`${API_BASE}/v1/tasks/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
    });

    const task: TaskResponse = await response.json();
    console.log(`状态: ${task.status}, 进度: ${task.progress}%`);

    if (task.status === 'completed' && task.results) {
      return task.results;
    }

    if (task.status === 'failed') {
      throw new Error('任务失败');
    }

    await new Promise(resolve => setTimeout(resolve, 3000));
  }
}

// 创建图片生成任务（纯文字生成）
async function createTextToImageTask(prompt: string): Promise<string> {
  const response = await fetch(`${API_BASE}/v1/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'nano-banana-2-lite',
      prompt,
      size: '9:16',
      quality: '2K',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`API 错误: ${JSON.stringify(error)}`);
  }

  const task: TaskResponse = await response.json();
  return task.id;
}

// 创建 Image-to-Image 任务（图片转图片，保留主体）
async function createImageToImageTask(imageUrl: string, prompt: string): Promise<string> {
  console.log(`Image-to-Image 参考图: ${imageUrl.substring(0, 50)}...`);

  const response = await fetch(`${API_BASE}/v1/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'nano-banana-2-lite',
      prompt,
      image_urls: [imageUrl],
      size: '9:16',
      quality: '2K',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`API 错误: ${JSON.stringify(error)}`);
  }

  const task: TaskResponse = await response.json();
  return task.id;
}

// 下载图片
async function downloadImage(url: string, outputPath: string): Promise<void> {
  console.log(`下载图片: ${url}`);
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  fs.writeFileSync(outputPath, Buffer.from(buffer));
  console.log(`保存到: ${outputPath}`);
}

async function main() {
  const outputDir = path.join(__dirname, '../public/hero');

  // 确保输出目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('=== 生成首屏 Hero 图片（正确方式：Image-to-Image）===\n');

  // 1. 生成"原图" - 普通穿搭照片
  console.log('步骤 1: 生成"原图"（普通场景）...');
  const beforePrompt = `
    A realistic Xiaohongshu fashion photo, young Asian woman in casual stylish outfit,
    standing in a busy urban coffee shop with ordinary background,
    natural daylight, smartphone photography style,
    vertical 9:16 composition, authentic everyday look,
    slightly cluttered background with other customers,
    casual and relatable atmosphere,
    the person has a natural friendly expression,
    wearing a simple white blouse and jeans,
    realistic skin texture, no heavy filters
  `.trim().replace(/\s+/g, ' ');

  const beforeTaskId = await createTextToImageTask(beforePrompt);
  const beforeResults = await waitForTask(beforeTaskId);

  if (beforeResults.length === 0) {
    throw new Error('原图生成失败');
  }

  const beforeImageUrl = beforeResults[0];
  await downloadImage(beforeImageUrl, path.join(outputDir, 'hero-new-before.jpg'));

  console.log('\n步骤 2: 使用 Image-to-Image 生成"升级后"（保留人物，改变背景）...');

  // 2. 使用 Image-to-Image，将原图作为参考，只改变背景
  // 关键：prompt 强调保留原人物，只改变背景
  const afterPrompt = `
    Transform this photo: KEEP THE EXACT SAME PERSON with identical face, pose, body, and clothing unchanged.
    ONLY change the background to a premium minimalist studio setting.
    Replace the current background with: elegant soft gradient from warm beige to light gray,
    professional studio lighting, clean and sophisticated atmosphere,
    high-end fashion magazine aesthetic, Apple campaign style.
    The person in the photo must remain exactly the same - do not modify face, pose, outfit or body at all.
    Only enhance the background and lighting quality.
  `.trim().replace(/\s+/g, ' ');

  const afterTaskId = await createImageToImageTask(beforeImageUrl, afterPrompt);
  const afterResults = await waitForTask(afterTaskId);

  if (afterResults.length > 0) {
    await downloadImage(afterResults[0], path.join(outputDir, 'hero-new-after.jpg'));
  }

  console.log('\n=== 完成！===');
  console.log(`原图: ${outputDir}/hero-new-before.jpg`);
  console.log(`升级后: ${outputDir}/hero-new-after.jpg`);
  console.log('\n注意：升级后的图片应该保留原图中的人物，只改变了背景');
}

main().catch(console.error);
