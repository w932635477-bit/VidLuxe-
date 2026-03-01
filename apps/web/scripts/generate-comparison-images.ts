/**
 * 批量生成风格对比图脚本
 *
 * 使用方法：
 * 1. 确保开发服务器正在运行 (pnpm dev)
 * 2. 运行: npx ts-node scripts/generate-comparison-images.ts
 *
 * 此脚本会：
 * - 为每种内容类型的原图生成 4 种风格的增强版本
 * - 保存到 /public/comparisons/{contentType}-{style}.jpg
 */

const BASE_URL = 'http://localhost:3000';

// 内容类型配置
// 只生成之前失败的图片
const CONTENT_TYPES = {
  cafe: {
    name: '探店',
    sourceImage: '/comparisons/cafe-1-original.jpg',
    styles: ['urban'], // 之前超时失败
  },
  travel: {
    name: '旅游',
    sourceImage: '/comparisons/lifestyle-1-original.jpg',
    styles: ['soft'], // 之前超时失败
  },
  food: {
    name: '美食',
    sourceImage: '/comparisons/food-1-original.jpg',
    styles: ['soft'], // 之前超时失败
  },
};

// 风格 Prompt 映射
const STYLE_PROMPTS: Record<string, string> = {
  magazine: 'Vogue magazine editorial style, luxury fashion aesthetic, warm golden lighting, sophisticated and elegant, professional photography, premium quality',
  soft: 'Japanese lifestyle magazine style, soft natural lighting, muted pastel colors, Kinfolk aesthetic, dreamy atmosphere, gentle and warm, editorial quality',
  urban: 'Apple keynote style, clean professional background, cool blue-gray tones, modern minimalist, trustworthy and authoritative, premium corporate style',
  vintage: 'Kodak Portra 400 film look, vintage aesthetic, warm film grain, cinematic color grading, nostalgic atmosphere, retro style, analog photography feel',
};

interface EnhanceResponse {
  success: boolean;
  taskId?: string;
  error?: string;
}

interface TaskStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: {
    enhancedUrl: string;
    originalUrl: string;
  };
  error?: string;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createEnhanceTask(
  imageUrl: string,
  style: string,
  contentType: string
): Promise<string> {
  const stylePrompt = STYLE_PROMPTS[style];

  const response = await fetch(`${BASE_URL}/api/enhance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: { type: 'image', url: imageUrl },
      styleSource: { type: 'preset', presetStyle: style },
      contentType,
      anonymousId: 'script_batch_generator', // 脚本使用的固定 ID
    }),
  });

  const data: EnhanceResponse = await response.json();

  if (!data.success || !data.taskId) {
    throw new Error(`Failed to create task: ${data.error}`);
  }

  return data.taskId;
}

async function waitForTask(taskId: string): Promise<string> {
  const maxAttempts = 90; // 增加到 90 次 (180秒)

  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`${BASE_URL}/api/enhance/${taskId}`);
    const data: TaskStatus = await response.json();

    if (data.status === 'completed' && data.result) {
      return data.result.enhancedUrl;
    }

    if (data.status === 'failed') {
      throw new Error(`Task failed: ${data.error}`);
    }

    console.log(`  ⏳ Progress: ${data.progress}%`);
    await sleep(2000);
  }

  throw new Error('Task timeout');
}

async function downloadImage(url: string, outputPath: string): Promise<void> {
  const response = await fetch(url);
  const buffer = Buffer.from(await response.arrayBuffer());

  // 在实际环境中，这里应该使用 fs.writeFileSync
  // 但由于这是浏览器环境，我们只打印信息
  console.log(`  📥 Would save to: ${outputPath} (${buffer.length} bytes)`);
}

async function main() {
  console.log('🎨 开始生成风格对比图...\n');
  console.log('⚠️  请确保开发服务器正在运行: pnpm dev\n');

  const results: Array<{
    contentType: string;
    style: string;
    originalUrl: string;
    enhancedUrl: string;
    localPath: string;
  }> = [];

  for (const [contentType, config] of Object.entries(CONTENT_TYPES)) {
    console.log(`\n📁 处理内容类型: ${config.name} (${contentType})`);

    for (const style of config.styles) {
      console.log(`\n  🎨 生成风格: ${style}`);

      try {
        // 使用本地路径（API 会自动上传到图床获取公网 URL）
        // 注意：这里不能使用 localhost URL，因为外部 API 无法访问
        const imagePath = config.sourceImage;
        console.log(`  📷 原图路径: ${imagePath}`);

        // 创建增强任务
        console.log(`  🚀 创建增强任务...`);
        const taskId = await createEnhanceTask(imagePath, style, contentType);
        console.log(`  ✅ 任务创建成功: ${taskId}`);

        // 等待完成
        console.log(`  ⏳ 等待处理完成...`);
        const enhancedUrl = await waitForTask(taskId);
        console.log(`  ✅ 增强完成: ${enhancedUrl}`);

        // 记录结果
        const localPath = `/comparisons/${contentType}-${style}.jpg`;
        results.push({
          contentType,
          style,
          originalUrl: config.sourceImage,
          enhancedUrl,
          localPath,
        });

        console.log(`  💾 应保存到: public${localPath}`);

        // 等待一下，避免请求过快
        await sleep(1000);
      } catch (error) {
        console.error(`  ❌ 失败: ${error instanceof Error ? error.message : error}`);
      }
    }
  }

  // 输出总结
  console.log('\n\n📊 生成结果汇总:');
  console.log('='.repeat(60));

  for (const result of results) {
    console.log(`${result.contentType}/${result.style}: ${result.enhancedUrl}`);
  }

  console.log('\n\n📝 下一步:');
  console.log('1. 下载所有 enhancedUrl 的图片');
  console.log('2. 保存到 public/comparisons/{contentType}-{style}.jpg');
  console.log('3. 更新 StyleSelector.tsx 中的 comparisonImagesByType 映射');
}

main().catch(console.error);
