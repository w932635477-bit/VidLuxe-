/**
 * 继续测试剩余风格
 * 只测试：vintage, urban, street-cool, minimal-clean, warm-cozy
 */

import * as fs from 'fs';
import * as path from 'path';

const API_CONFIG = {
  baseUrl: 'https://api.evolink.ai',
  apiKey: process.env.NANO_BANANA_API_KEY!,
  model: 'nano-banana-2-lite',
};

const TEST_IMAGE_URL = 'https://vidluxe.com.cn/comparisons/fashion-1-original.jpg';

// 剩余 5 种风格
const OLD_PROMPTS: Record<string, { name: string; prompt: string }> = {
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

const NEW_PROMPTS: Record<string, { name: string; prompt: string }> = {
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
  const maxAttempts = 120;
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
      console.log(' ✓');
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
  console.log(`\n[1/2] 旧 Prompt...`);
  const oldTaskId = await createTask(oldPrompt.prompt, TEST_IMAGE_URL);
  console.log(`  任务 ID: ${oldTaskId}`);
  const oldResultUrl = await waitForTask(oldTaskId, oldPrompt.name);
  await downloadImage(oldResultUrl, oldPath);
  console.log(`  ✓ 已保存: ${oldPath}`);

  await new Promise((resolve) => setTimeout(resolve, 2000));

  // 测试新 Prompt
  console.log(`\n[2/2] 新 Prompt...`);
  const newTaskId = await createTask(newPrompt.prompt, TEST_IMAGE_URL);
  console.log(`  任务 ID: ${newTaskId}`);
  const newResultUrl = await waitForTask(newTaskId, newPrompt.name);
  await downloadImage(newResultUrl, newPath);
  console.log(`  ✓ 已保存: ${newPath}`);

  return { oldPath, newPath };
}

async function main() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║     继续测试剩余 5 种风格                     ║');
  console.log('╚════════════════════════════════════════════════╝');

  if (!API_CONFIG.apiKey) {
    console.error('错误: 请设置 NANO_BANANA_API_KEY 环境变量');
    process.exit(1);
  }

  const outputDir = path.join(__dirname, 'prompt-test-results');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 使用之前的时间戳以保持文件名一致
  const timestamp = 1772712983106;
  const styleIds = Object.keys(OLD_PROMPTS);
  const results: Record<string, { oldPath: string; newPath: string }> = {};

  console.log(`\n测试图片: ${TEST_IMAGE_URL}`);
  console.log(`开始时间: ${new Date().toLocaleString()}`);

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

  console.log('\n');
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║              测试完成！                        ║');
  console.log('╚════════════════════════════════════════════════╝');

  console.log('\n所有结果文件:');
  const allFiles = fs.readdirSync(outputDir).filter(f => f.endsWith('.jpg'));
  for (const f of allFiles.sort()) {
    console.log(`  ${f}`);
  }

  console.log(`\n打开文件夹: open ${outputDir}`);
}

main().catch(console.error);
