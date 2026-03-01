/**
 * 重新生成 复古胶片 和 都市职场 效果预览图
 *
 * 优化的 Prompt，确保效果更惊艳
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

async function waitForTask(taskId: string): Promise<string[]> {
  console.log(`  等待任务: ${taskId.substring(0, 20)}...`);

  while (true) {
    const response = await fetch(`${API_BASE}/v1/tasks/${taskId}`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` },
    });

    const task: TaskResponse = await response.json();
    process.stdout.write(`\r  进度: ${task.progress}%   `);

    if (task.status === 'completed' && task.results) {
      console.log('\n  ✅ 完成');
      return task.results;
    }

    if (task.status === 'failed') {
      throw new Error('任务失败');
    }

    await new Promise(resolve => setTimeout(resolve, 3000));
  }
}

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

async function createImageToImageTask(imageUrl: string, prompt: string): Promise<string> {
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

async function downloadImage(url: string, outputPath: string, retries = 5): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`  下载中... (尝试 ${i + 1}/${retries})`);
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const buffer = await response.arrayBuffer();
      fs.writeFileSync(outputPath, Buffer.from(buffer));
      console.log(`  ✅ 下载成功`);
      return;
    } catch (error) {
      if (i < retries - 1) {
        console.log(`  ⚠️ 下载失败，等待 5 秒后重试...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      } else {
        throw error;
      }
    }
  }
}

// ============================================
// 效果配置 - 优化的 Prompt
// ============================================

interface EffectConfig {
  id: string;
  name: string;
  // Before 场景：普通、平淡的日常场景
  beforeScene: string;
  // After 场景：惊艳的升级效果
  afterTransform: string;
}

const EFFECTS: EffectConfig[] = [
  // ===== 复古胶片 · 电影氛围 =====
  {
    id: 'outfit-vintage',
    name: '复古胶片 · 电影氛围',
    beforeScene: `
      A realistic casual photo, young Asian woman in everyday clothing,
      standing in a plain white-walled room with fluorescent ceiling lights,
      boring office environment, no atmosphere,
      smartphone snapshot quality, flat lighting,
      vertical 9:16 composition,
      wearing a simple casual shirt and pants,
      neutral expression, ordinary everyday moment,
      realistic skin texture, no filters, mundane background
    `,
    afterTransform: `
      Transform this photo: KEEP THE EXACT SAME PERSON with identical face, pose, body, and clothing completely unchanged.
      ONLY change the background and lighting to create a stunning vintage film aesthetic.

      Transform background to: A dreamy nostalgic scene with golden hour sunlight streaming through vintage windows,
      warm amber and honey tones throughout the entire image,
      visible film grain texture adding organic warmth,
      soft cinematic color grading like Kodak Portra 400 film stock,
      gentle vignette around edges creating intimate atmosphere,
      warm bokeh lights in background like old cinema,
      romantic hazy light leaks and organic film imperfections,
      Wong Kar-wai film aesthetic with emotional depth,
      timeless vintage atmosphere that feels like a treasured memory.

      The person must remain exactly the same - do not modify face, pose, outfit or body at all.
      Only enhance the background and lighting to create this stunning vintage film look.
      The transformation should be dramatic and immediately eye-catching.
    `,
  },

  // ===== 都市职场 · 专业干练 =====
  {
    id: 'outfit-urban',
    name: '都市职场 · 专业干练',
    beforeScene: `
      A realistic casual photo, young Asian professional in relaxed clothing,
      standing in a messy home office with cluttered desk and scattered papers,
      harsh window light creating unflattering shadows,
      smartphone snapshot quality, amateur photography,
      vertical 9:16 composition,
      wearing casual home clothes,
      tired expression, unprofessional setting,
      realistic skin texture, no filters, distracting background elements
    `,
    afterTransform: `
      Transform this photo: KEEP THE EXACT SAME PERSON with identical face, pose, body, and clothing completely unchanged.
      ONLY change the background and lighting to create a premium professional aesthetic.

      Transform background to: A sophisticated modern executive environment,
      sleek minimalist architecture with clean geometric lines,
      premium glass and steel materials reflecting soft light,
      cool blue-gray and silver color palette conveying trust and authority,
      professional studio lighting with soft key light and subtle rim light,
      depth of field creating elegant background blur,
      Apple headquarters aesthetic with premium materials,
      Fortune 500 CEO portrait quality,
      subtle ambient light from large windows,
      calm confident atmosphere that commands respect.

      The person must remain exactly the same - do not modify face, pose, outfit or body at all.
      Only enhance the background and lighting to create this premium professional look.
      The transformation should be dramatic and immediately impressive.
    `,
  },
];

// ============================================
// 主函数
// ============================================

async function main() {
  const outputDir = path.join(__dirname, '../public/comparisons');

  console.log('='.repeat(60));
  console.log('重新生成效果预览图（优化版）');
  console.log('='.repeat(60));
  console.log(`\nAPI Key: ${API_KEY ? '✅ 已配置' : '❌ 未配置'}`);
  console.log(`输出目录: ${outputDir}\n`);

  for (const effect of EFFECTS) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📌 ${effect.name}`);
    console.log(`${'='.repeat(60)}`);

    const beforePath = path.join(outputDir, `${effect.id}-before.jpg`);
    const afterPath = path.join(outputDir, `${effect.id}-after.jpg`);

    try {
      // Step 1: 生成 Before 图（普通场景）
      console.log('\n  📸 步骤 1: 生成"原图"（普通场景）...');
      const beforePrompt = effect.beforeScene.trim().replace(/\s+/g, ' ');
      const beforeTaskId = await createTextToImageTask(beforePrompt);
      const beforeResults = await waitForTask(beforeTaskId);

      if (beforeResults.length === 0) {
        throw new Error('Before 图生成失败');
      }

      const beforeImageUrl = beforeResults[0];
      await downloadImage(beforeImageUrl, beforePath);
      console.log(`  💾 已保存: ${effect.id}-before.jpg`);

      // 等待一下避免 API 限流
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Step 2: 生成 After 图（惊艳升级场景）
      console.log('\n  ✨ 步骤 2: 生成"效果图"（保留人物，升级背景）...');
      const afterPrompt = effect.afterTransform.trim().replace(/\s+/g, ' ');
      const afterTaskId = await createImageToImageTask(beforeImageUrl, afterPrompt);
      const afterResults = await waitForTask(afterTaskId);

      if (afterResults.length > 0) {
        await downloadImage(afterResults[0], afterPath);
        console.log(`  💾 已保存: ${effect.id}-after.jpg`);
      }

      console.log(`\n  ✅ ${effect.name} 完成！`);

    } catch (error) {
      console.error(`  ❌ ${effect.name} 失败:`, error);
    }

    // 每个效果之间暂停
    console.log('\n  ⏳ 等待 5 秒...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  console.log('\n' + '='.repeat(60));
  console.log('全部完成！');
  console.log('='.repeat(60));

  console.log('\n生成的文件:');
  for (const effect of EFFECTS) {
    const before = path.join(outputDir, `${effect.id}-before.jpg`);
    const after = path.join(outputDir, `${effect.id}-after.jpg`);
    console.log(`  ${effect.name}:`);
    console.log(`    Before: ${fs.existsSync(before) ? '✅' : '❌'} ${effect.id}-before.jpg`);
    console.log(`    After:  ${fs.existsSync(after) ? '✅' : '❌'} ${effect.id}-after.jpg`);
  }

  console.log('\n📝 下一步: 更新 effect-presets.ts 使用新图片:');
  console.log('  - outfit-vintage: before → outfit-vintage-before.jpg');
  console.log('  - outfit-vintage: after  → outfit-vintage-after.jpg');
  console.log('  - outfit-urban:   before → outfit-urban-before.jpg');
  console.log('  - outfit-urban:   after  → outfit-urban-after.jpg');
}

main().catch(console.error);
