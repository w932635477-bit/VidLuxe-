/**
 * Prompt 对比测试脚本
 *
 * 目的：对比旧 Prompt 和新 Prompt（遵循 evolink.ai 最佳实践）的效果差异
 *
 * 使用方法：
 *   npx tsx scripts/test-prompt-comparison.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Nano Banana API 配置
const API_CONFIG = {
  baseUrl: 'https://api.evolink.ai',
  apiKey: process.env.NANO_BANANA_API_KEY!,
  model: 'nano-banana-2-lite',
};

// 测试图片 URL（需要是公网可访问的）
const TEST_IMAGE_URL = 'https://vidluxe.com.cn/comparisons/fashion-1-original.jpg';

// ============================================
// Prompt 定义
// ============================================

// 旧 Prompt：纯风格描述（当前 effect-presets.ts 中的）
const OLD_PROMPTS = {
  magazine: `Vogue magazine cover style, luxury fashion aesthetic, with elegant English text overlay, "VOGUE" masthead at top in bold sans-serif typography, "FALL ESSENTIALS" subtitle text, "THE NEW CLASSICS" headline at bottom, warm golden lighting, sophisticated and elegant, professional model photography, high-end beauty editorial, warm beige and champagne tones, cinematic background, soft studio lighting, premium quality, editorial composition, magazine cover typography design, fashion editorial text layout`,

  soft: `Japanese lifestyle magazine style, soft natural lighting, muted pastel colors, Kinfolk aesthetic, dreamy atmosphere, gentle and warm, artistic and refined, low saturation, earthy tones, natural and authentic, editorial quality`,

  vintage: `Kodak Portra 400 film look, vintage aesthetic, warm film grain, cinematic color grading, nostalgic atmosphere, retro style, artistic, soft highlights, subtle vignette, analog photography feel`,
};

// 新 Prompt：遵循 evolink.ai 最佳实践
// 结构：[保留指令] + [风格描述] + [质量保证]
const NEW_PROMPTS = {
  magazine: `Use the original image as the main reference. Keep the original subject, person, pose, facial features, outfit, and composition exactly unchanged. Only apply the following style enhancement: Vogue magazine cover style with elegant English text overlay, "VOGUE" masthead, warm golden lighting, luxury fashion aesthetic, professional model photography quality. Maintain original proportions and positioning.`,

  soft: `Use the original image as the main reference. Keep the original subject, person, pose, facial features, outfit, and composition exactly unchanged. Only apply the following style enhancement: Japanese lifestyle magazine style, soft natural lighting, muted pastel colors, Kinfolk aesthetic, dreamy atmosphere. Maintain original warmth and authenticity.`,

  vintage: `Use the original image as the main reference. Keep the original subject, person, pose, facial features, outfit, and composition exactly unchanged. Only apply the following style enhancement: Kodak Portra 400 film look, warm film grain, cinematic color grading, nostalgic atmosphere, analog photography feel. Maintain original details and composition.`,
};

// ============================================
// API 调用
// ============================================

async function createTask(prompt: string, imageUrl: string): Promise<string> {
  const response = await fetch(`${API_CONFIG.baseUrl}/v1/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_CONFIG.apiKey}`,
    },
    body: JSON.stringify({
      model: API_CONFIG.model,
      prompt,
      image_urls: [imageUrl],
      size: '9:16',
      quality: '2K',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`API Error: ${JSON.stringify(error)}`);
  }

  const result = await response.json();
  return result.id;
}

async function waitForTask(taskId: string): Promise<string> {
  const maxAttempts = 60;
  const interval = 3000; // 3 seconds

  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`${API_CONFIG.baseUrl}/v1/tasks/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${API_CONFIG.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get task status');
    }

    const result = await response.json();
    console.log(`  [Task ${taskId.slice(0, 8)}...] Status: ${result.status}, Progress: ${result.progress}%`);

    if (result.status === 'completed' && result.results?.length > 0) {
      return result.results[0];
    }

    if (result.status === 'failed') {
      throw new Error('Task failed');
    }

    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error('Task timeout');
}

async function downloadImage(url: string, outputPath: string): Promise<void> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  fs.writeFileSync(outputPath, Buffer.from(buffer));
}

// ============================================
// 主测试流程
// ============================================

async function runTest() {
  console.log('============================================');
  console.log('  Prompt 对比测试');
  console.log('============================================');
  console.log('');

  // 检查 API Key
  if (!API_CONFIG.apiKey) {
    console.error('错误: 请设置 NANO_BANANA_API_KEY 环境变量');
    process.exit(1);
  }

  // 创建输出目录
  const outputDir = path.join(__dirname, 'prompt-test-results');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const testStyle = 'magazine'; // 测试的风格
  const timestamp = Date.now();

  console.log(`测试图片: ${TEST_IMAGE_URL}`);
  console.log(`测试风格: ${testStyle}`);
  console.log('');

  // ============================================
  // 测试 1: 旧 Prompt
  // ============================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('测试 1: 旧 Prompt（纯风格描述）');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('Prompt:');
  console.log(OLD_PROMPTS[testStyle]);
  console.log('');

  console.log('创建任务...');
  const oldTaskId = await createTask(OLD_PROMPTS[testStyle], TEST_IMAGE_URL);
  console.log(`任务 ID: ${oldTaskId}`);

  console.log('等待完成...');
  const oldResultUrl = await waitForTask(oldTaskId);
  console.log(`结果 URL: ${oldResultUrl}`);

  // 下载结果
  const oldOutputPath = path.join(outputDir, `${timestamp}_${testStyle}_old.jpg`);
  await downloadImage(oldResultUrl, oldOutputPath);
  console.log(`已保存: ${oldOutputPath}`);
  console.log('');

  // ============================================
  // 测试 2: 新 Prompt
  // ============================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('测试 2: 新 Prompt（保留指令 + 风格描述）');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('Prompt:');
  console.log(NEW_PROMPTS[testStyle]);
  console.log('');

  console.log('创建任务...');
  const newTaskId = await createTask(NEW_PROMPTS[testStyle], TEST_IMAGE_URL);
  console.log(`任务 ID: ${newTaskId}`);

  console.log('等待完成...');
  const newResultUrl = await waitForTask(newTaskId);
  console.log(`结果 URL: ${newResultUrl}`);

  // 下载结果
  const newOutputPath = path.join(outputDir, `${timestamp}_${testStyle}_new.jpg`);
  await downloadImage(newResultUrl, newOutputPath);
  console.log(`已保存: ${newOutputPath}`);
  console.log('');

  // ============================================
  // 结果汇总
  // ============================================
  console.log('============================================');
  console.log('  测试完成！');
  console.log('============================================');
  console.log('');
  console.log('结果文件:');
  console.log(`  - 旧 Prompt: ${oldOutputPath}`);
  console.log(`  - 新 Prompt: ${newOutputPath}`);
  console.log('');
  console.log('请对比两张图片的效果差异:');
  console.log('  1. 内容一致性 - 人物/服装是否保持不变？');
  console.log('  2. 风格效果 - 高级感是否足够？');
  console.log('  3. 整体质量 - 哪张效果更好？');
  console.log('');
}

// 运行测试
runTest().catch(console.error);
