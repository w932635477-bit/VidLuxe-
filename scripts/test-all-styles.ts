/**
 * 批量 Prompt 测试脚本
 *
 * 测试所有 7 种风格（除已测试的 magazine）
 * 对比旧 Prompt vs 新 Prompt 的效果
 */

import * as fs from 'fs';
import * as path from 'path';

// Nano Banana API 配置
const API_CONFIG = {
  baseUrl: 'https://api.evolink.ai',
  apiKey: process.env.NANO_BANANA_API_KEY!,
  model: 'nano-banana-2-lite',
};

// 测试图片 URL
const TEST_IMAGE_URL = 'https://vidluxe.com.cn/comparisons/fashion-1-original.jpg';

// ============================================
// Prompt 定义
// ============================================

// 旧 Prompt：当前 effect-presets.ts 中的
const OLD_PROMPTS: Record<string, { name: string; prompt: string }> = {
  soft: {
    name: '日系温柔',
    prompt: `Japanese lifestyle magazine style, soft natural lighting, muted pastel colors, Kinfolk aesthetic, dreamy atmosphere, gentle and warm, artistic and refined, low saturation, earthy tones, natural and authentic, editorial quality`,
  },
  'korean-premium': {
    name: '韩系高级',
    prompt: `Korean fashion photography, premium aesthetic, soft beige and milk tea tones, elegant and sophisticated, clean minimal background, natural lighting, high-end editorial, modern Korean style, subtle warmth`,
  },
  vintage: {
    name: '复古胶片',
    prompt: `Kodak Portra 400 film look, vintage aesthetic, warm film grain, cinematic color grading, nostalgic atmosphere, retro style, artistic, soft highlights, subtle vignette, analog photography feel`,
  },
  urban: {
    name: '都市职场',
    prompt: `Apple keynote style, clean professional background, cool blue-gray tones, corporate executive aesthetic, modern minimalist, trustworthy and authoritative, soft diffused lighting, sharp details, premium corporate style`,
  },
  'street-cool': {
    name: '街头酷感',
    prompt: `Street photography style, high contrast, urban cool aesthetic, bold shadows, editorial street fashion, gritty texture, dynamic composition, modern edge, fashion-forward`,
  },
  'minimal-clean': {
    name: '极简纯净',
    prompt: `Minimalist aesthetic, clean lines, neutral gray tones, Scandinavian style, pure and simple, high-key lighting, white space, elegant simplicity, modern editorial`,
  },
  'warm-cozy': {
    name: '温暖惬意',
    prompt: `Warm autumn atmosphere, cozy feeling, golden hour lighting, earthy tones, brown and amber colors, comfortable and inviting, lifestyle photography, natural warmth`,
  },
};

// 新 Prompt：添加保留指令
const NEW_PROMPTS: Record<string, { name: string; prompt: string }> = {
  soft: {
    name: '日系温柔',
    prompt: `Use the original image as the main reference. Keep the original subject, person, pose, facial features, outfit, and composition exactly unchanged. Only apply the following style enhancement: Japanese lifestyle magazine style, soft natural lighting, muted pastel colors, Kinfolk aesthetic, dreamy atmosphere, gentle and warm, artistic and refined. Maintain original warmth and authenticity.`,
  },
  'korean-premium': {
    name: '韩系高级',
    prompt: `Use the original image as the main reference. Keep the original subject, person, pose, facial features, outfit, and composition exactly unchanged. Only apply the following style enhancement: Korean fashion photography, premium aesthetic, soft beige and milk tea tones, elegant and sophisticated, modern Korean style. Maintain original details and elegance.`,
  },
  vintage: {
    name: '复古胶片',
    prompt: `Use the original image as the main reference. Keep the original subject, person, pose, facial features, outfit, and composition exactly unchanged. Only apply the following style enhancement: Kodak Portra 400 film look, warm film grain, cinematic color grading, nostalgic atmosphere, analog photography feel. Maintain original details and composition.`,
  },
  urban: {
    name: '都市职场',
    prompt: `Use the original image as the main reference. Keep the original subject, person, pose, facial features, outfit, and composition exactly unchanged. Only apply the following style enhancement: Apple keynote style, clean professional background, cool blue-gray tones, corporate executive aesthetic, modern minimalist, trustworthy and authoritative. Maintain original professionalism.`,
  },
  'street-cool': {
    name: '街头酷感',
    prompt: `Use the original image as the main reference. Keep the original subject, person, pose, facial features, outfit, and composition exactly unchanged. Only apply the following style enhancement: Street photography style, high contrast, urban cool aesthetic, bold shadows, editorial street fashion, modern edge. Maintain original composition and attitude.`,
  },
  'minimal-clean': {
    name: '极简纯净',
    prompt: `Use the original image as the main reference. Keep the original subject, person, pose, facial features, outfit, and composition exactly unchanged. Only apply the following style enhancement: Minimalist aesthetic, clean lines, neutral gray tones, Scandinavian style, pure and simple, elegant simplicity. Maintain original clarity and proportions.`,
  },
  'warm-cozy': {
    name: '温暖惬意',
    prompt: `Use the original image as the main reference. Keep the original subject, person, pose, facial features, outfit, and composition exactly unchanged. Only apply the following style enhancement: Warm autumn atmosphere, cozy feeling, golden hour lighting, earthy tones, brown and amber colors, comfortable and inviting. Maintain original warmth and feeling.`,
  },
};

// ============================================
// API 调用
// ============================================

async function createTask(prompt: string, imageUrl: string): Promise<string> {
  const response = await fetch(`${API_CONFIG.baseUrl}/v1/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_CONFIG.apiKey}`,
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

async function waitForTask(taskId: string, styleName: string): Promise<string> {
  const maxAttempts = 120; // 增加到 120 次，约 6 分钟
  const interval = 3000;

  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`${API_CONFIG.baseUrl}/v1/tasks/${taskId}`, {
      headers: {
        Authorization: `Bearer ${API_CONFIG.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get task status');
    }

    const result = await response.json();
    process.stdout.write(`\r  [${styleName}] Progress: ${result.progress}%  `);

    if (result.status === 'completed' && result.results?.length > 0) {
      console.log(''); // 换行
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

async function testStyle(
  styleId: string,
  oldPrompt: { name: string; prompt: string },
  newPrompt: { name: string; prompt: string },
  outputDir: string,
  timestamp: number
): Promise<{ oldPath: string; newPath: string }> {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`  测试风格: ${oldPrompt.name}`);
  console.log('='.repeat(50));

  const oldPath = path.join(outputDir, `${timestamp}_${styleId}_old.jpg`);
  const newPath = path.join(outputDir, `${timestamp}_${styleId}_new.jpg`);

  // 测试旧 Prompt
  console.log(`\n[1/2] 旧 Prompt 测试...`);
  const oldTaskId = await createTask(oldPrompt.prompt, TEST_IMAGE_URL);
  console.log(`  任务 ID: ${oldTaskId}`);
  const oldResultUrl = await waitForTask(oldTaskId, oldPrompt.name);
  await downloadImage(oldResultUrl, oldPath);
  console.log(`  ✓ 已保存: ${oldPath}`);

  // 等待一下，避免 API 限流
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // 测试新 Prompt
  console.log(`\n[2/2] 新 Prompt 测试...`);
  const newTaskId = await createTask(newPrompt.prompt, TEST_IMAGE_URL);
  console.log(`  任务 ID: ${newTaskId}`);
  const newResultUrl = await waitForTask(newTaskId, newPrompt.name);
  await downloadImage(newResultUrl, newPath);
  console.log(`  ✓ 已保存: ${newPath}`);

  return { oldPath, newPath };
}

async function runAllTests() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║     批量 Prompt 测试 - 7 种风格              ║');
  console.log('╚════════════════════════════════════════════════╝');

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

  const timestamp = Date.now();
  const styleIds = Object.keys(OLD_PROMPTS);
  const results: Record<string, { oldPath: string; newPath: string }> = {};

  console.log(`\n测试图片: ${TEST_IMAGE_URL}`);
  console.log(`测试风格数: ${styleIds.length}`);
  console.log(`开始时间: ${new Date().toLocaleString()}`);

  // 逐个测试
  for (const styleId of styleIds) {
    try {
      const result = await testStyle(
        styleId,
        OLD_PROMPTS[styleId],
        NEW_PROMPTS[styleId],
        outputDir,
        timestamp
      );
      results[styleId] = result;
    } catch (error) {
      console.error(`\n  ✗ 测试失败: ${styleId}`);
      console.error(error);
    }
  }

  // 结果汇总
  console.log('\n');
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║              测试完成！                        ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log('\n结果文件:');

  for (const [styleId, paths] of Object.entries(results)) {
    const name = OLD_PROMPTS[styleId].name;
    console.log(`\n【${name}】`);
    console.log(`  旧 Prompt: ${paths.oldPath}`);
    console.log(`  新 Prompt: ${paths.newPath}`);
  }

  console.log('\n');
  console.log('请在 Finder 中查看对比:');
  console.log(`  open ${outputDir}`);
  console.log('\n');
}

runAllTests().catch(console.error);
