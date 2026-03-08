/**
 * 积分系统测试脚本
 * 测试内容：
 * 1. 新用户积分查询
 * 2. 积分消耗
 * 3. 积分不足场景
 */

const BASE_URL = 'http://localhost:3000';

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

async function testCreditsAPI() {
  const testUserId = `test_${Date.now()}`;
  console.log(`\n📋 测试用户ID: ${testUserId}\n`);

  // ========== 测试 1: 新用户积分查询 ==========
  console.log('=== 测试 6.1 积分查询 ===\n');

  // 1.1 查询新用户积分
  try {
    const res = await fetch(`${BASE_URL}/api/credits?anonymousId=${testUserId}`);
    const json = await res.json();
    log(
      '6.1.1 新用户积分查询',
      json.success && json.data?.total === 8,
      { total: 8 },
      { total: json.data?.total, free: json.data?.free }
    );
  } catch (e: any) {
    log('6.1.1 新用户积分查询', false, { total: 8 }, {}, e.message);
  }

  // 1.2 再次查询同一用户（验证数据持久化）
  try {
    const res = await fetch(`${BASE_URL}/api/credits?anonymousId=${testUserId}`);
    const json = await res.json();
    log(
      '6.1.2 积分数据持久化',
      json.success && json.data?.total === 8,
      { total: 8 },
      { total: json.data?.total }
    );
  } catch (e: any) {
    log('6.1.2 积分数据持久化', false, { total: 8 }, {}, e.message);
  }

  // ========== 测试 2: 积分消耗 ==========
  console.log('\n=== 测试 6.2 积分消耗 ===\n');

  // 2.1 消耗1个积分
  try {
    const res = await fetch(`${BASE_URL}/api/credits/spend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        anonymousId: testUserId,
        amount: 1,
        description: '测试消耗'
      })
    });
    const json = await res.json();
    log(
      '6.2.1 消耗1个积分',
      json.success && json.data?.newBalance !== undefined,
      { success: true },
      json
    );
  } catch (e: any) {
    log('6.2.1 消耗1个积分', false, { success: true }, {}, e.message);
  }

  // 2.2 验证积分减少
  try {
    const res = await fetch(`${BASE_URL}/api/credits?anonymousId=${testUserId}`);
    const json = await res.json();
    log(
      '6.2.2 验证积分减少1',
      json.success && json.data?.total === 7,
      { total: 7 },
      { total: json.data?.total }
    );
  } catch (e: any) {
    log('6.2.2 验证积分减少1', false, { total: 7 }, {}, e.message);
  }

  // 2.3 再消耗3个积分
  try {
    const res = await fetch(`${BASE_URL}/api/credits/spend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        anonymousId: testUserId,
        amount: 3,
        description: '测试消耗3个'
      })
    });
    const json = await res.json();
    log(
      '6.2.3 消耗3个积分',
      json.success && json.data?.newBalance === 4,
      { newBalance: 4 },
      { newBalance: json.data?.newBalance }
    );
  } catch (e: any) {
    log('6.2.3 消耗3个积分', false, { newBalance: 4 }, {}, e.message);
  }

  // ========== 测试 3: 积分不足场景 ==========
  console.log('\n=== 测试 6.3 积分不足 ===\n');

  // 3.1 尝试消耗超过余额的积分
  try {
    const res = await fetch(`${BASE_URL}/api/credits/spend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        anonymousId: testUserId,
        amount: 10,  // 只有4个，尝试消耗10个
        description: '测试超额消耗'
      })
    });
    const json = await res.json();
    log(
      '6.3.1 积分不足拒绝',
      !json.success && json.error?.includes('不足'),
      { success: false, error: '包含"不足"' },
      json
    );
  } catch (e: any) {
    log('6.3.1 积分不足拒绝', false, { success: false }, {}, e.message);
  }

  // 3.2 验证余额不变
  try {
    const res = await fetch(`${BASE_URL}/api/credits?anonymousId=${testUserId}`);
    const json = await res.json();
    log(
      '6.3.2 积分不足时余额不变',
      json.success && json.data?.total === 4,
      { total: 4 },
      { total: json.data?.total }
    );
  } catch (e: any) {
    log('6.3.2 积分不足时余额不变', false, { total: 4 }, {}, e.message);
  }

  // 3.3 消耗剩余积分
  try {
    const res = await fetch(`${BASE_URL}/api/credits/spend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        anonymousId: testUserId,
        amount: 4,
        description: '消耗剩余积分'
      })
    });
    const json = await res.json();
    log(
      '6.3.3 消耗剩余积分',
      json.success && json.data?.newBalance === 0,
      { newBalance: 0 },
      { newBalance: json.data?.newBalance }
    );
  } catch (e: any) {
    log('6.3.3 消耗剩余积分', false, { newBalance: 0 }, {}, e.message);
  }

  // 3.4 余额为0时尝试消耗
  try {
    const res = await fetch(`${BASE_URL}/api/credits/spend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        anonymousId: testUserId,
        amount: 1,
        description: '余额为0时消耗'
      })
    });
    const json = await res.json();
    log(
      '6.3.4 余额为0时消耗被拒绝',
      !json.success,
      { success: false },
      json
    );
  } catch (e: any) {
    log('6.3.4 余额为0时消耗被拒绝', false, { success: false }, {}, e.message);
  }

  // ========== 测试 4: 付费积分优先消耗 ==========
  console.log('\n=== 测试 6.4 付费积分优先消耗 ===\n');

  const paidTestUser = `test_paid_${Date.now()}`;

  // 4.1 先创建用户并查看初始状态
  try {
    const res = await fetch(`${BASE_URL}/api/credits?anonymousId=${paidTestUser}`);
    const json = await res.json();
    log(
      '6.4.1 付费测试用户初始状态',
      json.success && json.data?.total === 8 && json.data?.paid === 0,
      { total: 8, paid: 0 },
      { total: json.data?.total, paid: json.data?.paid }
    );
  } catch (e: any) {
    log('6.4.1 付费测试用户初始状态', false, { total: 8, paid: 0 }, {}, e.message);
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

testCreditsAPI().catch(console.error);
