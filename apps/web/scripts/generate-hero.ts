// 生成横版 Hero 图片
// 使用 Nano Banana API 生成大尺寸对比图

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import https from 'https';
import http from 'http';

const API_KEY = process.env.NANO_BANANA_API_KEY || '';
const API_URL = 'https://api.evolink.ai';

// 横版 Hero 图片 prompt
const HERO_PROMPTS = {
  after: `Professional fashion portrait photography of elegant woman, wearing stylish minimalist outfit, soft golden hour natural lighting, clean neutral background with subtle texture, high-end magazine editorial style, professional model pose, premium quality, fashion week street style, sophisticated, warm luxury aesthetic, perfect skin tones, dramatic soft lighting`,
  before: `Casual selfie photo of woman, wearing basic everyday clothes, poor lighting from overhead fluorescent, cluttered background with items, phone camera quality, unflattering angle, amateur photography, no styling, ordinary appearance`,
};

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
      size: '16:9', // 横版
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
  console.log('🎨 生成横版 Hero 图片...\n');

  const outputDir = join(process.cwd(), 'public', 'hero');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  try {
    // 生成 After (升级后)
    console.log('📦 生成 After 图片...');
    const afterTaskId = await createTask(HERO_PROMPTS.after);
    const afterUrl = await waitForTask(afterTaskId);
    console.log(`  ✓ After: ${afterUrl.slice(0, 50)}...`);

    // 生成 Before (原片)
    console.log('📦 生成 Before 图片...');
    const beforeTaskId = await createTask(HERO_PROMPTS.before);
    const beforeUrl = await waitForTask(beforeTaskId);
    console.log(`  ✓ Before: ${beforeUrl.slice(0, 50)}...`);

    // 下载图片
    console.log('\n📥 下载图片...');
    await downloadImage(afterUrl, join(outputDir, 'hero-after.jpg'));
    console.log('  ✓ hero-after.jpg');
    await downloadImage(beforeUrl, join(outputDir, 'hero-before.jpg'));
    console.log('  ✓ hero-before.jpg');

    console.log('\n🎉 Hero 图片生成完成！');
    console.log(`\n图片保存在: ${outputDir}`);
  } catch (error) {
    console.error('❌ 生成失败:', error);
  }
}

main().catch(console.error);
