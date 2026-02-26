// 下载案例图片到本地存储
// 避免 24 小时 URL 过期问题

import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import https from 'https';

const CASES_JSON = join(process.cwd(), 'public/cases/cases.json');
const OUTPUT_DIR = join(process.cwd(), 'public/cases/images');

interface Case {
  id: string;
  category: string;
  categoryLabel: string;
  beforeUrl: string;
  afterUrl: string;
  recommendedStyle: string;
}

function downloadImage(url: string, filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(filepath);
    const request = (url: string) => {
      https.get(url, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          // 跟随重定向
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            request(redirectUrl);
          } else {
            reject(new Error('Redirect without location'));
          }
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}`));
          return;
        }

        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }).on('error', reject);
    };
    request(url);
  });
}

async function main() {
  console.log('📥 开始下载案例图片...\n');

  // 确保输出目录存在
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 读取案例数据
  const cases: Case[] = require(CASES_JSON);
  const results: Array<{
    id: string;
    category: string;
    categoryLabel: string;
    beforeUrl: string;
    afterUrl: string;
    recommendedStyle: string;
  }> = [];

  for (const caseItem of cases) {
    console.log(`📦 下载案例: ${caseItem.id}`);

    try {
      // 下载升级后图片 (before)
      const beforePath = join(OUTPUT_DIR, `${caseItem.id}-before.jpg`);
      console.log(`  下载升级后图片...`);
      await downloadImage(caseItem.beforeUrl, beforePath);
      console.log(`  ✓ 已保存: ${beforePath}`);

      // 下载原片 (after)
      const afterPath = join(OUTPUT_DIR, `${caseItem.id}-after.jpg`);
      console.log(`  下载原片...`);
      await downloadImage(caseItem.afterUrl, afterPath);
      console.log(`  ✓ 已保存: ${afterPath}`);

      // 更新 URL 为本地路径
      results.push({
        ...caseItem,
        beforeUrl: `/cases/images/${caseItem.id}-before.jpg`,
        afterUrl: `/cases/images/${caseItem.id}-after.jpg`,
      });

      console.log(`  ✅ 完成: ${caseItem.id}\n`);
    } catch (error) {
      console.error(`  ❌ 失败: ${caseItem.id}`, error);
      // 保留原始 URL
      results.push(caseItem);
    }
  }

  // 生成 TypeScript 代码
  const tsContent = `// 自动生成的案例数据 - ${new Date().toISOString()}
// 图片已下载到本地存储

export interface Case {
  id: string;
  category: string;
  categoryLabel: string;
  beforeUrl: string;  // 升级后
  afterUrl: string;   // 原片
  recommendedStyle: 'magazine' | 'soft' | 'urban' | 'vintage';
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

  const tsPath = join(process.cwd(), 'lib/cases.ts');
  require('fs').writeFileSync(tsPath, tsContent);
  console.log(`📝 已更新: ${tsPath}`);

  // 更新 JSON
  const jsonPath = join(process.cwd(), 'public/cases/cases-local.json');
  require('fs').writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`📄 已保存: ${jsonPath}`);

  console.log('\n🎉 下载完成！');
  console.log(`\n共下载 ${results.length} 个案例的图片`);
}

main().catch(console.error);
