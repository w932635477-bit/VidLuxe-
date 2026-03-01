/**
 * 生成效果预览对比图
 *
 * 核心原则：主体不变，背景重构
 * 使用 Image-to-Image 技术，保留人物完全不变，只升级背景和灯光
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

// 创建 Text-to-Image 任务
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

// 创建 Image-to-Image 任务
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

// 下载图片（带重试）
async function downloadImage(url: string, outputPath: string, retries = 3): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`  下载中... (尝试 ${i + 1}/${retries})`);
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
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

// 效果配置
interface EffectConfig {
  id: string;
  name: string;
  // Before 场景描述
  beforeScene: string;
  // After 场景转换指令
  afterTransform: string;
}

const EFFECTS: EffectConfig[] = [
  // ===== 韩系高级 =====
  {
    id: 'outfit-korean',
    name: '韩系高级 · 奶茶色调',
    beforeScene: `
      A realistic Xiaohongshu fashion photo, young Asian woman in casual outfit,
      standing in a cluttered home interior with messy background,
      fluorescent ceiling lighting, smartphone photography style,
      vertical 9:16 composition, authentic everyday look,
      the person has a natural expression,
      wearing a simple beige sweater and casual pants,
      realistic skin texture, no filters
    `,
    afterTransform: `
      Transform this photo: KEEP THE EXACT SAME PERSON with identical face, pose, body, and clothing completely unchanged.
      ONLY change the background to a Korean premium aesthetic setting.
      Replace background with: soft milk tea and beige color palette,
      warm natural window light from left side, clean minimalist Korean cafe interior,
      elegant light beige walls, subtle warm tones throughout,
      high-end Korean fashion magazine aesthetic, soft dreamy atmosphere.
      The person must remain exactly the same - do not modify face, pose, outfit or body at all.
      Only enhance the background and lighting to Korean premium style.
    `,
  },

  // ===== 街头酷感 =====
  {
    id: 'outfit-street',
    name: '街头酷感 · 高对比度',
    beforeScene: `
      A realistic Xiaohongshu fashion photo, young Asian woman in casual streetwear,
      standing in a boring office hallway with plain white walls,
      harsh fluorescent lighting, smartphone photography style,
      vertical 9:16 composition, authentic everyday look,
      the person has a neutral expression,
      wearing a simple black hoodie and jeans,
      realistic skin texture, no filters
    `,
    afterTransform: `
      Transform this photo: KEEP THE EXACT SAME PERSON with identical face, pose, body, and clothing completely unchanged.
      ONLY change the background to an urban street photography setting.
      Replace background with: dramatic high contrast city street at dusk,
      bold shadows and highlights, neon signs reflecting on wet pavement,
      cool blue and orange color grading, gritty urban texture,
      editorial street fashion photography, intense atmospheric lighting.
      The person must remain exactly the same - do not modify face, pose, outfit or body at all.
      Only enhance the background and lighting to street cool aesthetic.
    `,
  },

  // ===== 极简纯净 =====
  {
    id: 'outfit-minimal',
    name: '极简纯净 · 高级灰',
    beforeScene: `
      A realistic Xiaohongshu fashion photo, young Asian woman in casual outfit,
      standing in a busy shopping mall with colorful advertisements and crowds,
      mixed artificial lighting, smartphone photography style,
      vertical 9:16 composition, authentic everyday look,
      the person has a casual expression,
      wearing a simple gray t-shirt and white pants,
      realistic skin texture, no filters
    `,
    afterTransform: `
      Transform this photo: KEEP THE EXACT SAME PERSON with identical face, pose, body, and clothing completely unchanged.
      ONLY change the background to a minimalist Scandinavian design setting.
      Replace background with: clean pure white and light gray walls,
      soft diffused natural lighting, simple geometric shadows,
      empty negative space, neutral gray tones throughout,
      Apple product photography aesthetic, elegant simplicity.
      The person must remain exactly the same - do not modify face, pose, outfit or body at all.
      Only enhance the background and lighting to minimal clean aesthetic.
    `,
  },

  // ===== 温暖惬意 =====
  {
    id: 'outfit-warm',
    name: '温暖惬意 · 秋日氛围',
    beforeScene: `
      A realistic Xiaohongshu fashion photo, young Asian woman in casual outfit,
      standing in a cold office environment with blue-tinted lighting,
      artificial fluorescent lights, smartphone photography style,
      vertical 9:16 composition, authentic everyday look,
      the person has a tired expression,
      wearing a simple knitted sweater and casual pants,
      realistic skin texture, no filters
    `,
    afterTransform: `
      Transform this photo: KEEP THE EXACT SAME PERSON with identical face, pose, body, and clothing completely unchanged.
      ONLY change the background to a warm autumn cozy setting.
      Replace background with: golden hour sunlight streaming through windows,
      warm amber and brown tones, cozy wooden interior with soft textures,
      autumn leaves visible through window, warm inviting atmosphere,
      Netflix lifestyle documentary aesthetic, comfortable and intimate.
      The person must remain exactly the same - do not modify face, pose, outfit or body at all.
      Only enhance the background and lighting to warm cozy aesthetic.
    `,
  },
];

async function main() {
  const outputDir = path.join(__dirname, '../public/comparisons');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('='.repeat(60));
  console.log('生成效果预览对比图');
  console.log('='.repeat(60));
  console.log(`\nAPI Key: ${API_KEY ? '✅ 已配置' : '❌ 未配置'}`);
  console.log(`输出目录: ${outputDir}\n`);

  for (const effect of EFFECTS) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📌 ${effect.name}`);
    console.log(`${'='.repeat(60)}`);

    // 检查是否已存在
    const beforePath = path.join(outputDir, `${effect.id}-before.jpg`);
    const afterPath = path.join(outputDir, `${effect.id}-after.jpg`);

    if (fs.existsSync(beforePath) && fs.existsSync(afterPath)) {
      console.log('  ⏭️ 已存在，跳过');
      continue;
    }

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

      // Step 2: 生成 After 图（升级场景）
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

    // 每个效果之间暂停，避免 API 限流
    console.log('\n  ⏳ 等待 5 秒...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  console.log('\n' + '='.repeat(60));
  console.log('全部完成！');
  console.log('='.repeat(60));
  console.log(`\n输出目录: ${outputDir}`);
  console.log('\n生成的文件:');
  for (const effect of EFFECTS) {
    const before = path.join(outputDir, `${effect.id}-before.jpg`);
    const after = path.join(outputDir, `${effect.id}-after.jpg`);
    console.log(`  ${effect.name}:`);
    console.log(`    Before: ${fs.existsSync(before) ? '✅' : '❌'} ${effect.id}-before.jpg`);
    console.log(`    After:  ${fs.existsSync(after) ? '✅' : '❌'} ${effect.id}-after.jpg`);
  }
}

main().catch(console.error);
