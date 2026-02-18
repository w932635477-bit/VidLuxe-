/**
 * 生成真实的对比图 - 使用 Image-to-Image 保持主体一致
 *
 * 核心逻辑：
 * 1. 先生成"模拟小红书原图"（模拟博主随手拍）
 * 2. 然后基于原图进行 Image-to-Image 升级（主体不变，只升级背景/光影/质感）
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import https from 'https';
import http from 'http';

const API_KEY = process.env.NANO_BANANA_API_KEY || '';
const API_URL = 'https://api.evolink.ai';

/**
 * 对比图配置
 *
 * originalPrompt: 生成"模拟原图"的提示词（小红书博主日常风格）
 * enhancedPrompt: 升级指令（基于原图进行升级）
 *
 * 关键：enhancedPrompt 只描述"如何升级"，不描述新的主体
 */
const COMPARISONS = [
  {
    id: 'portrait-1',
    title: '人像升级',
    // 原图：模拟小红书博主室内自拍
    originalPrompt: `A casual selfie photo of a young Chinese woman in her 20s, taken with iPhone in a typical apartment bedroom.
She has natural makeup, wearing a cozy beige sweater, gentle smile looking at camera.
The room has warm but dim lighting from a small window, some clutter in the background like clothes on chair, books on desk.
Typical Xiaohongshu lifestyle blogger casual photo, authentic and relatable, phone camera quality, slightly unflattering overhead light.
Vertical portrait shot, natural pose, no heavy editing.`,
    // 升级指令：只描述如何升级，不改变人物
    enhancedPrompt: `Transform this photo into a professional fashion editorial portrait.
Keep the exact same person, same outfit, same pose and expression.
Upgrade the background to a clean, minimalist studio with soft warm beige tones.
Replace the harsh lighting with beautiful soft natural window light creating gentle shadows.
Add professional photography quality with perfect exposure and color grading.
Magazine cover quality, Vogue China aesthetic, premium retouching while keeping natural beauty.
Maintain authentic feel, avoid over-editing.`,
  },
  {
    id: 'product-1',
    title: '产品升级',
    // 原图：模拟小红书博主产品展示
    originalPrompt: `A product photo of a luxury skincare serum bottle taken with iPhone on a messy desk.
The bottle has gold cap and elegant glass packaging, sitting among other daily items like coffee cup, notebook, phone.
Overhead desk lamp lighting creating harsh reflections, cluttered background.
Typical Xiaohongshu beauty blogger product showcase, casual flatlay style, authentic daily life setting.
The product is clearly visible but the overall composition is unpolished.`,
    // 升级指令：只升级环境，产品保持原样
    enhancedPrompt: `Transform this product photo into a luxury beauty campaign shot.
Keep the exact same skincare serum bottle, same angle and position.
Replace the messy desk with a clean white marble surface with subtle rose gold accents.
Change harsh lighting to soft diffused studio light with gentle reflections.
Add minimal elegant props: a few fresh rose petals, soft shadows.
Chanel beauty advertisement aesthetic, premium cosmetics photography, magazine quality.
Clean, sophisticated, luxurious but not ostentatious.`,
  },
  {
    id: 'cafe-1',
    title: '咖啡探店升级',
    // 原图：模拟小红书博主咖啡店探店
    originalPrompt: `A casual photo of a beautiful latte with latte art in a white ceramic cup, taken with iPhone at a busy coffee shop.
The coffee sits on a wooden table, but background has other customers, menu boards, slightly chaotic cafe environment.
Overhead cafe lighting, not ideal for photography.
Typical Xiaohongshu cafe exploration post, authentic street cafe vibe, phone snapshot quality.
The latte art is visible but the overall photo lacks artistic composition.`,
    // 升级指令：只升级环境，咖啡保持原样
    enhancedPrompt: `Transform this cafe photo into a professional food photography shot.
Keep the exact same latte cup, same latte art design, same position on table.
Change the busy background to a minimalist cafe interior with clean lines and soft natural light.
Add warm cozy atmosphere with gentle bokeh in background, Kinfolk magazine aesthetic.
Beautiful morning light streaming through window, soft shadows, premium lifestyle feel.
Professional food photography quality while maintaining authentic cafe atmosphere.`,
  },
  {
    id: 'fashion-1',
    title: '穿搭升级',
    // 原图：模拟小红书博主穿搭自拍
    originalPrompt: `A casual outfit photo of a stylish young Chinese woman in her 20s, taken by friend with iPhone at shopping mall.
She is wearing a beige trench coat over casual clothes, standing confidently but slightly awkward pose.
Mall background with stores, other shoppers, fluorescent lighting, reflective floor.
Typical Xiaohongshu OOTD (outfit of the day) post, authentic street fashion blogger content.
The outfit is visible but lighting is unflattering, background distracting.`,
    // 升级指令：只升级环境，人物和穿搭保持原样
    enhancedPrompt: `Transform this outfit photo into a professional street fashion editorial shot.
Keep the exact same person, same outfit (beige trench coat), same general pose and expression.
Replace the shopping mall background with an elegant urban street scene during golden hour.
Change harsh fluorescent lighting to beautiful warm sunset light with soft shadows.
Add professional fashion photography composition, slight bokeh effect on background.
Vogue street style aesthetic, high fashion editorial quality, sophisticated and chic.
Maintain authentic street style feel, avoid over-styling.`,
  },
  {
    id: 'food-1',
    title: '美食升级',
    // 原图：模拟小红书博主餐厅美食
    originalPrompt: `A casual food photo of a beautiful pasta dish at a restaurant, taken with iPhone from above.
The pasta looks delicious but the photo is taken in a dimly lit restaurant with other dishes and utensils visible in background.
Phone flash created some glare on the plate surface.
Typical Xiaohongshu restaurant review post, authentic dining experience capture.
The food is appetizing but the photo composition is unpolished.`,
    // 升级指令：只升级环境，菜品保持原样
    enhancedPrompt: `Transform this food photo into a professional culinary photography shot.
Keep the exact same pasta dish, same plating, same angle of view.
Replace the dark restaurant background with a bright, elegant dining setting.
Remove glare and add beautiful soft natural lighting highlighting the food textures.
Add complementary props: quality napkin, elegant silverware, subtle wine glass in background.
Michelin guide restaurant photography aesthetic, appetizing and artistic composition.
Premium food magazine quality while keeping the dish looking authentic and inviting.`,
  },
  {
    id: 'lifestyle-1',
    title: '生活方式升级',
    // 原图：模拟小红书博主生活分享
    originalPrompt: `A casual lifestyle photo of a cozy morning scene with coffee and book on bed, taken with iPhone.
Shows rumpled bedsheets, a cup of coffee, an open book, phone on nightstand.
Early morning light through curtains, slightly messy bedroom, authentic daily life.
Typical Xiaohongshu lifestyle influencer morning routine post, relatable and honest.
The scene is cozy but composition is casual and unrefined.`,
    // 升级指令：只升级环境，物品保持原样
    enhancedPrompt: `Transform this lifestyle photo into a premium editorial shot.
Keep the exact same elements: coffee cup, book, general scene arrangement.
Elevate the setting to a luxury hotel suite or high-end bedroom.
Replace messy sheets with perfectly styled linen with beautiful texture.
Add golden morning light streaming through sheer curtains, creating warm atmosphere.
Kinfolk magazine aesthetic, curated but authentic, aspirational lifestyle photography.
Premium quality while maintaining the cozy, relatable morning mood.`,
  },
];

function request(url: string, options: any, body?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const lib = urlObj.protocol === 'https:' ? https : http;

    const req = lib.request(
      {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: options.headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(data);
          }
        });
      }
    );

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

/**
 * 创建图片生成任务
 * 支持 text-to-image 和 image-to-image
 */
async function createTask(
  prompt: string,
  imageUrls?: string[]
): Promise<string> {
  const requestBody: any = {
    model: 'nano-banana-2-lite',
    prompt: prompt.trim().replace(/\s+/g, ' '),
    size: '16:9',
    quality: '2K',
  };

  // 如果提供了图片URL，使用 image-to-image 模式
  if (imageUrls && imageUrls.length > 0) {
    requestBody.image_urls = imageUrls;
    console.log(`    📷 使用 Image-to-Image 模式`);
  }

  const response = await request(
    `${API_URL}/v1/images/generations`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
    },
    JSON.stringify(requestBody)
  );

  if (response.error) {
    throw new Error(response.error.message);
  }

  return response.id;
}

async function waitForTask(taskId: string): Promise<string> {
  const maxAttempts = 90; // 增加等待时间，因为 image-to-image 可能需要更长时间

  for (let i = 0; i < maxAttempts; i++) {
    const response = await request(`${API_URL}/v1/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });

    const progress = response.progress || 0;
    process.stdout.write(`\r    进度: ${progress}%`);

    if (response.status === 'completed' && response.results?.[0]) {
      console.log(''); // 换行
      return response.results[0];
    }

    if (response.status === 'failed') {
      console.log(''); // 换行
      throw new Error('Task failed');
    }

    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log(''); // 换行
  throw new Error('Task timeout');
}

async function downloadImage(url: string, filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = require('fs').createWriteStream(filepath);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        downloadImage(response.headers.location!, filepath).then(resolve).catch(reject);
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('🎨 生成真实对比图（Image-to-Image 模式）...\n');
  console.log('📌 核心原理：');
  console.log('   1. 先生成"模拟小红书原图"（博主日常风格）');
  console.log('   2. 再用 Image-to-Image 升级（主体不变，只升级环境）\n');

  const outputDir = join(process.cwd(), 'public', 'comparisons');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const results: any[] = [];

  for (const comp of COMPARISONS) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`📦 生成对比组: ${comp.id} (${comp.title})`);
    console.log(`${'═'.repeat(60)}`);

    try {
      // 步骤1: 生成"模拟原图"（Text-to-Image）
      console.log('\n  Step 1: 生成原图（模拟小红书博主随手拍）');
      console.log(`  📷 Text-to-Image 模式`);
      const originalTaskId = await createTask(comp.originalPrompt);
      const originalUrl = await waitForTask(originalTaskId);
      console.log(`  ✅ 原图生成完成`);

      // 步骤2: 基于原图升级（Image-to-Image）
      console.log('\n  Step 2: 升级原图（Image-to-Image 保持主体）');
      console.log(`  ✨ Image-to-Image 模式 - 主体保持不变`);
      const enhancedTaskId = await createTask(comp.enhancedPrompt, [originalUrl]);
      const enhancedUrl = await waitForTask(enhancedTaskId);
      console.log(`  ✅ 升级版生成完成`);

      // 下载图片
      console.log('\n  Step 3: 下载图片');
      await downloadImage(originalUrl, join(outputDir, `${comp.id}-original.jpg`));
      console.log(`  ✓ 原图已保存`);
      await downloadImage(enhancedUrl, join(outputDir, `${comp.id}-enhanced.jpg`));
      console.log(`  ✓ 升级版已保存`);

      console.log(`\n  ✅ ${comp.id} 完成！`);

      results.push({
        id: comp.id,
        title: comp.title,
        original: `/comparisons/${comp.id}-original.jpg`,
        enhanced: `/comparisons/${comp.id}-enhanced.jpg`,
      });

    } catch (error: any) {
      console.error(`\n  ❌ ${comp.id} 失败: ${error.message}`);
    }
  }

  // 保存配置
  const configPath = join(outputDir, 'config.json');
  writeFileSync(configPath, JSON.stringify(results, null, 2));
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`📄 配置已保存: ${configPath}`);

  console.log(`\n🎉 生成完成！`);
  console.log(`\n共生成 ${results.length} 组对比图`);
  console.log(`图片保存在: ${outputDir}`);
  console.log(`\n💡 提示: 升级版图片保持了原图的主体（人物/产品），只升级了背景/光影/质感`);
}

main().catch(console.error);
