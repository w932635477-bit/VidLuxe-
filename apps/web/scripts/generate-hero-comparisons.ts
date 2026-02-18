// 生成多组大幅对比图
// 关键：主体相同，只有背景/光影/质感不同

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import https from 'https';
import http from 'http';

const API_KEY = process.env.NANO_BANANA_API_KEY || '';
const API_URL = 'https://api.evolink.ai';

// 多组对比图配置 - 每组生成两张图：低质量版 vs 高质量版
// 使用相同的主体描述，只是环境和质感不同
const COMPARISONS = [
  {
    id: 'portrait-1',
    title: '人像升级',
    // 主体描述（两者共用）
    subject: 'elegant young woman with natural makeup, soft smile, wearing casual cream sweater, looking at camera',
    // 低质量版
    lowQuality: 'taken with phone camera in messy bedroom, harsh overhead fluorescent lighting, cluttered background with clothes and items, poor composition, amateur snapshot, low resolution, unflattering shadows',
    // 高质量版
    highQuality: 'professional fashion photography, soft natural window light from large window, clean minimalist studio background in warm beige tones, Vogue magazine editorial style, premium quality, professional retouching, elegant and sophisticated',
  },
  {
    id: 'product-1',
    title: '产品升级',
    subject: 'luxury skincare serum bottle with gold cap, elegant glass packaging, minimalist design',
    lowQuality: 'product photo taken on messy desk with phone flash, harsh reflections, cluttered background with other items, amateur photography, poor lighting',
    highQuality: 'professional product photography, soft diffused studio lighting, clean marble surface with subtle rose petals, Chanel beauty campaign aesthetic, premium cosmetics advertising, elegant and luxurious',
  },
  {
    id: 'food-1',
    title: '美食升级',
    subject: 'beautiful latte art in white ceramic cup, cappuccino with perfect rosetta pattern',
    lowQuality: 'casual coffee shop snapshot, harsh overhead lighting, busy background with other customers, phone camera quality, unflattering angle',
    highQuality: 'professional food photography, soft natural morning light, minimalist cafe interior with clean lines, Kinfolk magazine aesthetic, warm cozy atmosphere, premium quality',
  },
  {
    id: 'fashion-1',
    title: '穿搭升级',
    subject: 'stylish young woman wearing beige trench coat, standing confidently, casual elegant pose',
    lowQuality: 'quick selfie in shopping mall, harsh fluorescent lighting, cluttered background with stores and people, phone snapshot quality, unposed',
    highQuality: 'professional street fashion photography, golden hour natural lighting, elegant urban background with soft bokeh, Vogue street style, high fashion editorial, sophisticated and chic',
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
      size: '16:9',
      quality: '2K',
    })
  );

  if (response.error) {
    throw new Error(response.error.message);
  }

  return response.id;
}

async function waitForTask(taskId: string): Promise<string> {
  const maxAttempts = 60;

  for (let i = 0; i < maxAttempts; i++) {
    const response = await request(`${API_URL}/v1/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });

    console.log(`    ${response.status} (${response.progress}%)`);

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
  console.log('🎨 生成多组大幅对比图...\n');
  console.log('📌 关键：主体相同，只有背景/光影/质感升级\n');

  const outputDir = join(process.cwd(), 'public', 'comparisons');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const results: any[] = [];

  for (const comp of COMPARISONS) {
    console.log(`\n📦 生成对比组: ${comp.id} (${comp.title})`);
    console.log(`   主体: ${comp.subject.slice(0, 50)}...`);

    try {
      // 生成低质量版 (Before)
      console.log('  📷 生成 Before (低质量版)...');
      const lowPrompt = `${comp.subject}, ${comp.lowQuality}`;
      const lowTaskId = await createTask(lowPrompt);
      const lowUrl = await waitForTask(lowTaskId);
      console.log(`  ✓ Before 完成`);

      // 生成高质量版 (After) - 相同主体，升级环境
      console.log('  ✨ 生成 After (高质量版)...');
      const highPrompt = `${comp.subject}, ${comp.highQuality}`;
      const highTaskId = await createTask(highPrompt);
      const highUrl = await waitForTask(highTaskId);
      console.log(`  ✓ After 完成`);

      // 下载图片
      console.log('  📥 下载图片...');
      await downloadImage(lowUrl, join(outputDir, `${comp.id}-before.jpg`));
      await downloadImage(highUrl, join(outputDir, `${comp.id}-after.jpg`));
      console.log(`  ✅ ${comp.id} 完成！`);

      results.push({
        id: comp.id,
        title: comp.title,
        before: `/comparisons/${comp.id}-before.jpg`,
        after: `/comparisons/${comp.id}-after.jpg`,
      });

    } catch (error) {
      console.error(`  ❌ ${comp.id} 失败:`, error);
    }
  }

  // 保存配置
  const configPath = join(outputDir, 'config.json');
  writeFileSync(configPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 配置已保存: ${configPath}`);

  console.log('\n🎉 生成完成！');
  console.log(`\n共生成 ${results.length} 组对比图`);
  console.log(`图片保存在: ${outputDir}`);
}

main().catch(console.error);
