/**
 * 端到端测试：验证不同风格生成不同的图片效果
 *
 * 测试流程：
 * 1. 创建多个任务，使用不同的效果
 * 2. 查询任务状态，等待完成
 * 3. 比较生成的图片 URL 是否不同
 */

const BASE_URL = 'http://localhost:3000';
const TEST_IMAGE = '/uploads/test/fashion-1.jpg';

// 测试的效果列表
const TEST_EFFECTS = [
  { id: 'outfit-magazine', name: '穿搭-杂志大片' },
  { id: 'beauty-oriental', name: '美妆-新中式' },
  { id: 'outfit-korean-premium', name: '穿搭-韩系高级' },
];

interface TaskResult {
  effectId: string;
  effectName: string;
  taskId: string;
  status: string;
  enhancedUrl?: string;
  error?: string;
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createTask(effectId: string, anonymousId: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/enhance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: { type: 'image', url: TEST_IMAGE },
      styleSource: { type: 'preset', presetStyle: 'magazine' },
      anonymousId,
      effectId,
      effectIntensity: 100,
    }),
  });
  const json = await res.json();

  if (!json.success) {
    throw new Error(`创建任务失败: ${json.error}`);
  }

  return json.taskId;
}

async function waitForTask(taskId: string, anonymousId: string, maxWaitMs = 180000): Promise<{ status: string; enhancedUrl?: string; error?: string }> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const res = await fetch(`${BASE_URL}/api/enhance/${taskId}?anonymousId=${anonymousId}`);
    const json = await res.json();

    if (json.success && json.task) {
      const { status, result, error } = json.task;

      if (status === 'completed') {
        return { status: 'completed', enhancedUrl: result?.enhancedUrl };
      } else if (status === 'failed') {
        return { status: 'failed', error };
      }

      console.log(`   [${Math.floor((Date.now() - startTime) / 1000)}s] 任务 ${taskId.slice(0, 20)}... 状态: ${status}, 进度: ${json.task.progress || 0}%`);
    }

    await sleep(2000);
  }

  return { status: 'timeout' };
}

async function runTest() {
  console.log('='.repeat(60));
  console.log('端到端测试：验证不同风格生成不同的图片效果');
  console.log('='.repeat(60));
  console.log(`\n测试图片: ${TEST_IMAGE}`);
  console.log(`测试效果: ${TEST_EFFECTS.map(e => e.name).join(', ')}\n`);

  const results: TaskResult[] = [];
  const testId = `e2e_test_${Date.now()}`;

  // 1. 依次创建任务
  console.log('=== 第1步：创建任务 ===\n');

  for (const effect of TEST_EFFECTS) {
    const anonymousId = `${testId}_${effect.id.replace(/-/g, '_')}`;

    try {
      console.log(`创建任务: ${effect.name} (${effect.id})`);
      const taskId = await createTask(effect.id, anonymousId);
      console.log(`  ✅ 任务已创建: ${taskId}\n`);

      results.push({
        effectId: effect.id,
        effectName: effect.name,
        taskId,
        status: 'pending',
      });
    } catch (e: any) {
      console.log(`  ❌ 创建失败: ${e.message}\n`);
      results.push({
        effectId: effect.id,
        effectName: effect.name,
        taskId: '',
        status: 'failed',
        error: e.message,
      });
    }
  }

  // 2. 等待所有任务完成
  console.log('\n=== 第2步：等待任务完成 ===\n');

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (!result.taskId) continue;

    console.log(`\n[${i + 1}/${results.length}] 等待: ${result.effectName}`);

    const anonymousId = `${testId}_${result.effectId.replace(/-/g, '_')}`;
    const taskResult = await waitForTask(result.taskId, anonymousId);

    result.status = taskResult.status;
    result.enhancedUrl = taskResult.enhancedUrl;
    result.error = taskResult.error;

    if (taskResult.status === 'completed') {
      console.log(`  ✅ 完成: ${taskResult.enhancedUrl?.slice(0, 60)}...`);
    } else {
      console.log(`  ❌ 失败: ${taskResult.error || taskResult.status}`);
    }
  }

  // 3. 分析结果
  console.log('\n' + '='.repeat(60));
  console.log('=== 第3步：结果分析 ===');
  console.log('='.repeat(60) + '\n');

  console.log('任务结果汇总:');
  console.log('-'.repeat(60));

  for (const result of results) {
    console.log(`\n${result.effectName} (${result.effectId}):`);
    console.log(`  状态: ${result.status}`);
    if (result.enhancedUrl) {
      console.log(`  结果URL: ${result.enhancedUrl}`);
    }
    if (result.error) {
      console.log(`  错误: ${result.error}`);
    }
  }

  // 4. 验证差异性
  console.log('\n' + '-'.repeat(60));
  console.log('验证图片差异性:');

  const completedResults = results.filter(r => r.status === 'completed' && r.enhancedUrl);
  const uniqueUrls = new Set(completedResults.map(r => r.enhancedUrl));

  console.log(`\n完成的任务: ${completedResults.length} / ${results.length}`);
  console.log(`唯一的图片URL: ${uniqueUrls.size} / ${completedResults.length}`);

  if (completedResults.length === 0) {
    console.log('\n❌ 所有任务都失败了，无法验证差异性');
  } else if (uniqueUrls.size === completedResults.length && completedResults.length > 1) {
    console.log('\n✅ 验证通过：不同风格生成了不同的图片！');
  } else if (uniqueUrls.size === 1 && completedResults.length > 1) {
    console.log('\n❌ 验证失败：不同风格生成了相同的图片！');
    console.log('\n相同的图片URL:');
    console.log(completedResults[0].enhancedUrl);
  } else {
    console.log('\n⚠️ 只有一个任务完成，无法验证差异性');
  }

  // 5. 最终结论
  console.log('\n' + '='.repeat(60));
  console.log('=== 测试结论 ===');
  console.log('='.repeat(60) + '\n');

  const successCount = completedResults.length;
  const failCount = results.filter(r => r.status !== 'completed').length;

  console.log(`总任务数: ${results.length}`);
  console.log(`成功: ${successCount}`);
  console.log(`失败: ${failCount}`);

  if (successCount === results.length && uniqueUrls.size === results.length) {
    console.log('\n🎉 端到端测试通过！不同风格正确生成了不同的图片效果。');
  } else if (successCount > 0 && uniqueUrls.size === successCount) {
    console.log('\n✅ 部分通过。成功的任务都生成了不同的图片。');
  } else {
    console.log('\n⚠️ 测试未完全通过，请检查日志。');
  }
}

runTest().catch(console.error);
