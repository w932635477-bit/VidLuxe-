/**
 * 生成首屏 Hero 美妆对比图
 *
 * 使用 Nano Banana API 生成：
 * 1. Before: 素颜/淡妆的亚洲女性人像（普通背景）
 * 2. After: 杂志风格的升级后图片
 */

const API_URL = 'https://api.evolink.ai';
const API_KEY = 'sk-HjlHRagN4SKCPV522UdoqYtE3T4VGEun1TR7BK7U3bomoa43';

interface TaskResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  results?: string[];
}

// 创建图片生成任务
async function createImageTask(prompt: string, imageUrls?: string[]): Promise<TaskResponse> {
  const response = await fetch(`${API_URL}/v1/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'nano-banana-2-lite',
      prompt: prompt.trim().replace(/\s+/g, ' '),
      image_urls: imageUrls,
      size: '9:16',
      quality: '2K',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to create task');
  }

  return response.json();
}

// 查询任务状态
async function getTaskStatus(taskId: string): Promise<TaskResponse> {
  const response = await fetch(`${API_URL}/v1/tasks/${taskId}`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to get task status');
  }

  return response.json();
}

// 等待任务完成
async function waitForCompletion(taskId: string): Promise<TaskResponse> {
  const maxAttempts = 60; // 最多等待 2 分钟
  const pollInterval = 2000; // 2 秒轮询一次

  for (let i = 0; i < maxAttempts; i++) {
    const result = await getTaskStatus(taskId);
    console.log(`  进度: ${result.progress}%`);

    if (result.status === 'completed') {
      return result;
    }

    if (result.status === 'failed') {
      throw new Error('Task failed');
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error('Task timeout');
}

// 下载图片
async function downloadImage(url: string, outputPath: string): Promise<void> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();

  const fs = await import('fs');
  fs.writeFileSync(outputPath, Buffer.from(buffer));
  console.log(`  已保存: ${outputPath}`);
}

async function main() {
  console.log('🎨 开始生成首屏 Hero 美妆对比图...\n');

  // Step 1: 生成 Before 图片（素颜/淡妆的亚洲女性）
  console.log('📸 Step 1: 生成 Before 图片（素颜/淡妆亚洲女性）...');

  const beforePrompt = `
    A professional portrait photograph of a beautiful Asian woman,
    natural minimal makeup look, fresh skin, simple plain gray background,
    soft natural window lighting, casual everyday appearance,
    looking at camera, friendly expression,
    high quality photography, realistic, no filters,
    vertical portrait orientation, clean simple composition
  `;

  const beforeTask = await createImageTask(beforePrompt);
  console.log(`  任务 ID: ${beforeTask.id}`);

  const beforeResult = await waitForCompletion(beforeTask.id);

  if (!beforeResult.results || beforeResult.results.length === 0) {
    throw new Error('No results for before image');
  }

  const beforeImageUrl = beforeResult.results[0];
  console.log(`  图片 URL: ${beforeImageUrl}`);

  // 下载 Before 图片
  await downloadImage(beforeImageUrl, './public/hero/hero-beauty-before.jpg');

  // Step 2: 使用 Before 图片生成 After 图片（杂志风格升级）
  console.log('\n✨ Step 2: 生成 After 图片（杂志风格升级）...');

  const afterPrompt = `
    Luxurious fashion magazine cover style portrait,
    Vogue magazine aesthetic, high-end beauty editorial,
    warm golden champagne background with elegant gradient,
    professional studio lighting with dramatic shadows,
    sophisticated makeup, glamorous look,
    premium quality, editorial photography,
    elegant and refined, luxury brand aesthetic,
    warm beige and gold tones, soft highlights
  `;

  const afterTask = await createImageTask(afterPrompt, [beforeImageUrl]);
  console.log(`  任务 ID: ${afterTask.id}`);

  const afterResult = await waitForCompletion(afterTask.id);

  if (!afterResult.results || afterResult.results.length === 0) {
    throw new Error('No results for after image');
  }

  const afterImageUrl = afterResult.results[0];
  console.log(`  图片 URL: ${afterImageUrl}`);

  // 下载 After 图片
  await downloadImage(afterImageUrl, './public/hero/hero-beauty-after.jpg');

  console.log('\n✅ 完成！首屏对比图已生成：');
  console.log('  - Before: /public/hero/hero-beauty-before.jpg');
  console.log('  - After:  /public/hero/hero-beauty-after.jpg');
}

main().catch(console.error);
