/**
 * 生成美妆 8 种效果预览图
 *
 * 使用现有的 hero-beauty-before.jpg 作为原图
 * 通过 Image-to-Image API 生成 6 种新风格的 after 效果图
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

// 美妆效果配置
interface BeautyEffectConfig {
  id: string;
  name: string;
  prompt: string;
  negativePrompt: string;
}

const BEAUTY_EFFECTS: BeautyEffectConfig[] = [
  {
    id: 'beauty-glass-skin',
    name: '韩系水光 · 透亮无瑕',
    prompt: `
      K-beauty glass skin portrait, ultra dewy hydrated complexion,
      water-glow finish, poreless smooth skin, natural gradient lips in soft pink,
      straight Korean brows, subtle highlighter on cheekbones,
      soft diffused studio lighting, high-key bright aesthetic,
      clean minimalist background, Korean celebrity skincare endorsement style,
      fresh and radiant, plump hydrated skin texture, 2K quality
    `,
    negativePrompt: 'matte, dry skin, heavy makeup, dark shadows, harsh lighting, overlined lips, dramatic contour',
  },
  {
    id: 'beauty-japanese',
    name: '日系透明 · 清新氧气',
    prompt: `
      Japanese beauty aesthetic, transparent skin finish,
      airy and ethereal complexion, soft flushed cheeks placement,
      natural feathered brows, clear gloss lips,
      soft natural window light, dreamy bokeh background,
      lifestyle magazine quality, innocent and pure vibe,
      Fuji film color tone, soft pastel atmosphere, authentic J-beauty, 2K quality
    `,
    negativePrompt: 'heavy foundation, bold colors, dramatic makeup, harsh lines, artificial look, overprocessed, high contrast',
  },
  {
    id: 'beauty-retro-hk',
    name: '复古港风 · 经典红唇',
    prompt: `
      1980s Hong Kong cinema beauty, classic vintage glamour,
      bold red matte lips, defined arched brows, soft winged eyeliner,
      warm golden film lighting, film grain texture, analog photography aesthetic,
      muted warm color palette, nostalgic atmosphere, elegant and sophisticated,
      Wong Kar-wai film mood, cinematic portrait, timeless beauty, 2K quality
    `,
    negativePrompt: 'modern, digital sharp, cool tones, minimalist, clean background, natural makeup, fresh look',
  },
  {
    id: 'beauty-editorial',
    name: '欧美高级 · 立体轮廓',
    prompt: `
      High-fashion editorial beauty, Western magazine cover style,
      sculpted bone structure, defined contouring, sharp winged eyeliner,
      bold statement lips, butterfly lighting setup, dramatic shadows,
      dark gradient background, Vogue Harper's Bazaar aesthetic,
      professional studio photography, confident and powerful gaze,
      ultra-detailed skin texture, 2K quality
    `,
    negativePrompt: 'cute, soft, natural, low contrast, flat lighting, amateur, casual, warm tones, gentle',
  },
  {
    id: 'beauty-milky',
    name: '奶油肌底 · 温柔气质',
    prompt: `
      Soft matte creamy skin finish, velvet texture complexion,
      warm beige and milk tones, gentle natural makeup,
      soft defined brows, nude pink lips,
      warm diffused lighting, cozy and inviting atmosphere,
      lifestyle beauty photography, elegant and approachable,
      subtle glow without shine, refined and polished, 2K quality
    `,
    negativePrompt: 'oily, glossy, high contrast, bold colors, dramatic, harsh lighting, cold tones, artificial',
  },
  {
    id: 'beauty-oriental',
    name: '新中式 · 国风雅韵',
    prompt: `
      Modern Chinese beauty aesthetic, contemporary oriental elegance,
      porcelain skin with subtle luminosity, refined brow shape,
      soft red gradient lips, elegant and graceful,
      warm ambient lighting, traditional Chinese color palette with modern twist,
      cultural sophistication, C-beauty editorial style,
      timeless oriental charm, artistic composition, 2K quality
    `,
    negativePrompt: 'western makeup style, heavy contour, dramatic, cool tones, minimalist modern, casual, vintage retro',
  },
];

async function main() {
  const outputDir = path.join(__dirname, '../public/comparisons');
  const beforeImagePath = path.join(__dirname, '../public/hero/hero-beauty-before.jpg');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('='.repeat(60));
  console.log('生成美妆效果预览图');
  console.log('='.repeat(60));
  console.log(`\nAPI Key: ${API_KEY ? '✅ 已配置' : '❌ 未配置'}`);
  console.log(`Before 图片: ${fs.existsSync(beforeImagePath) ? '✅' : '❌'} ${beforeImagePath}`);
  console.log(`输出目录: ${outputDir}\n`);

  if (!fs.existsSync(beforeImagePath)) {
    console.error('❌ Before 图片不存在，请先准备好 hero-beauty-before.jpg');
    return;
  }

  // 读取 before 图片并上传为 base64 或使用 URL
  // 由于 Nano Banana API 需要公网可访问的 URL，我们需要先上传图片
  // 这里假设 before 图片已经可以通过公网访问
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://vidluxe.com.cn';
  const beforeImageUrl = `${baseUrl}/hero/hero-beauty-before.jpg`;

  console.log(`Before 图片 URL: ${beforeImageUrl}\n`);

  for (const effect of BEAUTY_EFFECTS) {
    const afterPath = path.join(outputDir, `${effect.id}.jpg`);

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📌 ${effect.name} (${effect.id})`);
    console.log(`${'='.repeat(60)}`);

    // 检查是否已存在
    if (fs.existsSync(afterPath)) {
      console.log('  ⏭️ 已存在，跳过');
      continue;
    }

    try {
      // 使用 Image-to-Image 生成 after 效果图
      console.log('\n  ✨ 生成效果图中...');
      const prompt = effect.prompt.trim().replace(/\s+/g, ' ');
      const taskId = await createImageToImageTask(beforeImageUrl, prompt);
      const results = await waitForTask(taskId);

      if (results.length > 0) {
        await downloadImage(results[0], afterPath);
        console.log(`  💾 已保存: ${effect.id}.jpg`);
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
  console.log('生成完成！');
  console.log('='.repeat(60));
  console.log(`\n输出目录: ${outputDir}`);
  console.log('\n生成的文件:');
  for (const effect of BEAUTY_EFFECTS) {
    const after = path.join(outputDir, `${effect.id}.jpg`);
    console.log(`  ${effect.name}: ${fs.existsSync(after) ? '✅' : '❌'} ${effect.id}.jpg`);
  }
}

main().catch(console.error);
