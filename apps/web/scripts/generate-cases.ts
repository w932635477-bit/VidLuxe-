// 案例图片生成脚本
// 直接调用 Nano Banana API 生成案例图片并下载

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import https from 'https';
import http from 'http';

const API_KEY = process.env.NANO_BANANA_API_KEY || '';
const API_URL = 'https://api.evolink.ai';

// 案例配置
const CASES = [
  // 穿搭
  {
    id: 'fashion-1',
    category: 'fashion',
    categoryLabel: '穿搭 OOTD',
    beforePrompt: `Professional fashion photography of an elegant woman, wearing stylish minimalist outfit, soft natural lighting from large window, clean neutral background with subtle texture, high-end magazine editorial style, professional model pose, premium quality, fashion week street style, sophisticated`,
    afterPrompt: `A woman taking a casual selfie in a messy bedroom, wearing casual everyday clothes, poor lighting from overhead fluorescent, cluttered background with clothes and items, phone camera quality, unflattering angle, amateur photography, no styling`,
    recommendedStyle: 'warmLuxury' as const,
  },
  {
    id: 'fashion-2',
    category: 'fashion',
    categoryLabel: '穿搭 OOTD',
    beforePrompt: `Stunning street fashion portrait, model wearing designer minimalist clothing, golden hour natural lighting, elegant urban background with bokeh, Vogue magazine cover quality, confident pose, luxury brand aesthetic, high fashion editorial photography`,
    afterPrompt: `Casual photo of someone in a coffee shop, wearing basic outfit, ordinary appearance, harsh overhead lighting, busy background with other customers, iPhone snapshot, unposed, cluttered composition`,
    recommendedStyle: 'minimal' as const,
  },
  // 美妆
  {
    id: 'beauty-1',
    category: 'beauty',
    categoryLabel: '美妆护肤',
    beforePrompt: `Luxury skincare product photography, elegant glass bottle with soft golden lighting, marble surface with rose petals, Chanel beauty campaign aesthetic, professional studio setup, soft shadows and highlights, premium cosmetics advertising`,
    afterPrompt: `Basic product photo of skincare bottle, taken on white desk with harsh flash, cluttered background with other items, amateur product photography, unflattering reflections`,
    recommendedStyle: 'warmLuxury' as const,
  },
  {
    id: 'beauty-2',
    category: 'beauty',
    categoryLabel: '美妆护肤',
    beforePrompt: `Elegant beauty flat lay photography, premium makeup products arranged artistically, soft diffused lighting, clean marble surface, Instagram beauty influencer aesthetic, professional product styling, luxury cosmetics editorial`,
    afterPrompt: `Snapshot of makeup products on messy vanity, poor lighting, unorganized items visible, phone camera quality, no styling`,
    recommendedStyle: 'minimal' as const,
  },
  // 咖啡
  {
    id: 'cafe-1',
    category: 'cafe',
    categoryLabel: '咖啡探店',
    beforePrompt: `Beautiful latte art photography, perfect rosetta pattern in ceramic cup, soft natural window light, minimalist cafe interior background, Kinfolk magazine aesthetic, professional food photography, warm cozy atmosphere`,
    afterPrompt: `Casual photo of latte art in a cup, taken at a crowded coffee shop, harsh overhead lighting, busy background, phone snapshot, ordinary appearance`,
    recommendedStyle: 'warmLuxury' as const,
  },
  {
    id: 'cafe-2',
    category: 'cafe',
    categoryLabel: '咖啡探店',
    beforePrompt: `Stunning cafe interior photography, beautiful minimalist design, soft golden hour light streaming through windows, elegant furniture and decor, architectural digest quality, professional interior photography, inviting sophisticated atmosphere`,
    afterPrompt: `Quick snapshot of coffee shop interior, poor lighting, empty chairs visible, unflattering angle, amateur photography`,
    recommendedStyle: 'morandi' as const,
  },
  // 美食
  {
    id: 'food-1',
    category: 'food',
    categoryLabel: '探店美食',
    beforePrompt: `Michelin star quality food photography, beautifully plated gourmet dish, professional studio lighting, elegant ceramic plate on dark surface, Bon Appetit magazine style, chef-level presentation, appetizing and artistic`,
    afterPrompt: `Casual photo of restaurant dish, taken at dinner with poor lighting, phone flash creating harsh reflections, unappetizing appearance`,
    recommendedStyle: 'warmLuxury' as const,
  },
  // 生活方式
  {
    id: 'lifestyle-1',
    category: 'lifestyle',
    categoryLabel: '生活方式',
    beforePrompt: `Beautiful minimalist workspace photography, clean organized desk with premium items, soft natural light from large window, neutral color palette, productivity influencer aesthetic, professional interior photography, inspiring and organized`,
    afterPrompt: `Messy desk photo with laptop and items, poor lighting, unorganized workspace, casual snapshot quality`,
    recommendedStyle: 'minimal' as const,
  },
  {
    id: 'lifestyle-2',
    category: 'lifestyle',
    categoryLabel: '生活方式',
    beforePrompt: `Stunning interior design photography, curated plant corner with beautiful pots, soft filtered natural light, neutral Scandi-style interior, Architectural Digest aesthetic, professional real estate photography, calm and sophisticated`,
    afterPrompt: `Snapshot of home corner with plants, ordinary appearance, harsh lighting, clutter visible in background`,
    recommendedStyle: 'morandi' as const,
  },
  // 数码
  {
    id: 'tech-1',
    category: 'tech',
    categoryLabel: '数码产品',
    beforePrompt: `Premium tech product photography, sleek wireless headphones, minimalist studio lighting, clean white or dark background, Apple product photography style, professional commercial quality, high-end consumer electronics`,
    afterPrompt: `Basic product photo of headphones, taken on messy desk with phone, harsh flash, unflattering background, amateur photography`,
    recommendedStyle: 'minimal' as const,
  },
  {
    id: 'tech-2',
    category: 'tech',
    categoryLabel: '数码产品',
    beforePrompt: `Professional tech workspace photography, premium laptop on clean desk, soft dramatic studio lighting, minimalist dark background, tech reviewer aesthetic, commercial product photography, sleek and modern`,
    afterPrompt: `Snapshot of laptop on desk, cluttered workspace, poor lighting, unflattering angle`,
    recommendedStyle: 'coolPro' as const,
  },
];

// 发送 HTTP 请求
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

// 创建图片生成任务
async function createTask(prompt: string): Promise<string> {
  const response = await request(
    `${API_URL}/v1/images/generations`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
    },
    JSON.stringify({
      model: 'nano-banana-2-lite',
      prompt: prompt.trim().replace(/\s+/g, ' '),
      size: '9:16',
      quality: '2K',
    })
  );

  if (response.error) {
    throw new Error(response.error.message);
  }

  return response.id;
}

// 轮询任务状态
async function waitForTask(taskId: string): Promise<string> {
  const maxAttempts = 60;

  for (let i = 0; i < maxAttempts; i++) {
    const response = await request(`${API_URL}/v1/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });

    console.log(`  Task ${taskId.slice(0, 20)}... - ${response.status} (${response.progress}%)`);

    if (response.status === 'completed' && response.results?.[0]) {
      return response.results[0];
    }

    if (response.status === 'failed') {
      throw new Error('Task failed');
    }

    await new Promise((r) => setTimeout(r, 2000));
  }

  throw new Error('Task timeout');
}

// 下载图片
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

// 主函数
async function main() {
  console.log('🚀 开始生成案例图片...\n');

  const outputDir = join(process.cwd(), 'public', 'cases');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const results: any[] = [];

  for (const caseConfig of CASES) {
    console.log(`\n📦 生成案例: ${caseConfig.id} (${caseConfig.categoryLabel})`);

    try {
      // 生成升级后图片
      console.log('  生成升级后图片...');
      const beforeTaskId = await createTask(caseConfig.beforePrompt);
      const beforeUrl = await waitForTask(beforeTaskId);
      console.log(`  ✓ 升级后: ${beforeUrl.slice(0, 50)}...`);

      // 生成原片
      console.log('  生成原片...');
      const afterTaskId = await createTask(caseConfig.afterPrompt);
      const afterUrl = await waitForTask(afterTaskId);
      console.log(`  ✓ 原片: ${afterUrl.slice(0, 50)}...`);

      // 保存结果
      results.push({
        id: caseConfig.id,
        category: caseConfig.category,
        categoryLabel: caseConfig.categoryLabel,
        beforeUrl,
        afterUrl,
        recommendedStyle: caseConfig.recommendedStyle,
      });

      console.log(`  ✅ 完成: ${caseConfig.id}`);
    } catch (error) {
      console.error(`  ❌ 失败: ${caseConfig.id}`, error);
    }
  }

  // 保存 JSON
  const jsonPath = join(outputDir, 'cases.json');
  writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 案例数据已保存到: ${jsonPath}`);

  // 生成 TypeScript 代码
  const tsContent = `// 自动生成的案例数据 - ${new Date().toISOString()}
// 由 Nano Banana API 生成

export interface Case {
  id: string;
  category: string;
  categoryLabel: string;
  beforeUrl: string;  // 升级后
  afterUrl: string;   // 原片
  recommendedStyle: 'minimal' | 'warmLuxury' | 'coolPro' | 'morandi';
}

export const CASES: Case[] = ${JSON.stringify(results, null, 2)};

export function getCasesByCategory(category: string): Case[] {
  return CASES.filter((c) => c.category === category);
}

export function getHeroCases(count: number = 3): Case[] {
  return CASES.slice(0, count);
}

export const CATEGORIES = [
  { id: 'fashion', label: '穿搭 OOTD', icon: '👗' },
  { id: 'beauty', label: '美妆护肤', icon: '💄' },
  { id: 'cafe', label: '咖啡探店', icon: '☕' },
  { id: 'food', label: '探店美食', icon: '🍽️' },
  { id: 'lifestyle', label: '生活方式', icon: '🌿' },
  { id: 'tech', label: '数码产品', icon: '📱' },
] as const;

export type CategoryId = typeof CATEGORIES[number]['id'];
`;

  const tsPath = join(process.cwd(), 'lib', 'cases-generated.ts');
  writeFileSync(tsPath, tsContent);
  console.log(`📝 TypeScript 代码已生成: ${tsPath}`);

  console.log('\n🎉 生成完成！');
  console.log('\n下一步:');
  console.log('1. 检查 public/cases/cases.json 中的图片 URL');
  console.log('2. 图片有效期 24 小时，请尽快下载保存');
  console.log('3. 将 lib/cases-generated.ts 重命名为 lib/cases.ts');
}

main().catch(console.error);
