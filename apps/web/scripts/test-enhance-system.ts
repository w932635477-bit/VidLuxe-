/**
 * 图片升级功能端到端测试
 * 测试内容：
 * 1. 创建升级任务（额度扣除）
 * 2. 查询任务状态
 * 3. 任务完成后验证结果
 * 4. 失败时额度退回
 */

const BASE_URL = 'http://localhost:3000';
const TEST_IMAGE = '/uploads/test/fashion-1.jpg';

interface TestResult {
  name: string;
  passed: boolean;
  expected: any;
  actual: any;
  error?: string;
}

const results: TestResult[] = [];

function log(name: string, passed: boolean, expected: any, actual: any, error?: string) {
  results.push({ name, passed, expected, actual, error });
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${name}`);
  if (!passed) {
    console.log(`   预期: ${JSON.stringify(expected)}`);
    console.log(`   实际: ${JSON.stringify(actual)}`);
    if (error) console.log(`   错误: ${error}`);
  }
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testEnhanceSystem() {
  const testUserId = `test_enhance_${Date.now()}`;
  console.log(`\n📋 测试用户ID: ${testUserId}`);
  console.log(`📋 测试图片: ${TEST_IMAGE}\n`);

  // ========== 测试 1: 额度查询 ==========
  console.log('=== 测试前额度状态 ===\n');

  let initialCredits = 0;
  try {
    const res = await fetch(`${BASE_URL}/api/credits?anonymousId=${testUserId}`);
    const json = await res.json();
    initialCredits = json.data?.total || 0;
    log('4.1.1 初始额度查询', json.success, { success: true }, json);
  } catch (e: any) {
    log('4.1.1 初始额度查询', false, { success: true }, {}, e.message);
  }

  // ========== 测试 2: 创建升级任务 ==========
  console.log('\n=== 测试 4.4 AI 处理 ===\n');

  let taskId = '';
  try {
    const res = await fetch(`${BASE_URL}/api/enhance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: {
          type: 'image',
          url: TEST_IMAGE,
        },
        styleSource: {
          type: 'preset',
          presetStyle: 'magazine',
        },
        anonymousId: testUserId,
      }),
    });
    const json = await res.json();
    taskId = json.taskId || '';

    log(
      '4.4.1 创建升级任务',
      json.success && taskId !== '',
      { success: true, taskId: '非空' },
      { success: json.success, taskId: taskId ? '已创建' : '未创建', error: json.error }
    );
  } catch (e: any) {
    log('4.4.1 创建升级任务', false, { success: true }, {}, e.message);
  }

  // ========== 测试 3: 验证额度扣除 ==========
  if (taskId) {
    console.log('\n=== 测试 4.4.2 额度扣除验证 ===\n');

    try {
      const res = await fetch(`${BASE_URL}/api/credits?anonymousId=${testUserId}`);
      const json = await res.json();
      const currentCredits = json.data?.total || 0;
      log(
        '4.4.2 额度扣除验证',
        currentCredits === initialCredits - 1,
        { credits: initialCredits - 1 },
        { credits: currentCredits }
      );
    } catch (e: any) {
      log('4.4.2 额度扣除验证', false, { credits: initialCredits - 1 }, {}, e.message);
    }
  }

  // ========== 测试 4: 查询任务状态 ==========
  if (taskId) {
    console.log('\n=== 测试 4.4.3 任务状态查询 ===\n');

    let taskCompleted = false;
    let taskFailed = false;
    const maxAttempts = 60; // 最多等待 60 秒
    let attempt = 0;

    while (!taskCompleted && !taskFailed && attempt < maxAttempts) {
      attempt++;
      try {
        const res = await fetch(`${BASE_URL}/api/tasks/${taskId}?anonymousId=${testUserId}`);
        const json = await res.json();

        if (json.success && json.task) {
          const status = json.task.status;
          console.log(`   [${attempt}s] 任务状态: ${status}, 进度: ${json.task.progress || 0}%`);

          if (status === 'completed') {
            taskCompleted = true;
            log('4.4.3 任务完成', true, { status: 'completed' }, { status, result: json.task.result ? '有结果' : '无结果' });
          } else if (status === 'failed') {
            taskFailed = true;
            log('4.4.3 任务失败', false, { status: 'completed' }, { status, error: json.task.error });
          } else {
            await sleep(1000);
          }
        }
      } catch (e: any) {
        console.log(`   [${attempt}s] 查询出错: ${e.message}`);
        await sleep(1000);
      }
    }

    if (!taskCompleted && !taskFailed) {
      log('4.4.3 任务超时', false, { status: 'completed' }, { status: 'timeout' });
    }

    // ========== 测试 5: 失败时额度退回 ==========
    if (taskFailed) {
      console.log('\n=== 测试 6.2.4 失败时额度退回 ===\n');

      try {
        const res = await fetch(`${BASE_URL}/api/credits?anonymousId=${testUserId}`);
        const json = await res.json();
        const currentCredits = json.data?.total || 0;
        log(
          '6.2.4 失败额度退回',
          currentCredits === initialCredits, // 失败后应该退回
          { credits: initialCredits },
          { credits: currentCredits }
        );
      } catch (e: any) {
        log('6.2.4 失败额度退回', false, { credits: initialCredits }, {}, e.message);
      }
    }

    // ========== 测试 6: 完成后额度不再变化 ==========
    if (taskCompleted) {
      console.log('\n=== 测试 4.4.4 完成后额度验证 ===\n');

      try {
        const res = await fetch(`${BASE_URL}/api/credits?anonymousId=${testUserId}`);
        const json = await res.json();
        const currentCredits = json.data?.total || 0;
        log(
          '4.4.4 完成后额度不变',
          currentCredits === initialCredits - 1,
          { credits: initialCredits - 1 },
          { credits: currentCredits }
        );
      } catch (e: any) {
        log('4.4.4 完成后额度不变', false, { credits: initialCredits - 1 }, {}, e.message);
      }
    }
  }

  // ========== 测试汇总 ==========
  console.log('\n=== 测试结果汇总 ===\n');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`总计: ${results.length} 项`);
  console.log(`通过: ${passed} 项`);
  console.log(`失败: ${failed} 项`);
  console.log(`通过率: ${((passed / results.length) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n失败的测试:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}`);
    });
  }
}

testEnhanceSystem().catch(console.error);
