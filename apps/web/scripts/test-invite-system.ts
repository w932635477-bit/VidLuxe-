/**
 * 邀请码系统 API 测试脚本
 *
 * 测试范围：
 * 1. 生成邀请码
 * 2. 获取邀请统计
 * 3. 使用邀请码（正常流程）
 * 4. 邀请限制（重复使用、自我邀请等）
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
  error?: string;
}

const results: TestResult[] = [];

function log(name: string, passed: boolean, details?: string, error?: string) {
  results.push({ name, passed, details, error });
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${name}`);
  if (details) console.log(`   ${details}`);
  if (error) console.log(`   Error: ${error}`);
}

// 生成唯一的测试用户 ID
function generateTestId(prefix: string): string {
  return `test_${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

async function testGenerateInviteCode() {
  console.log('\n📋 测试 8.1: 生成邀请码');
  console.log('='.repeat(50));

  const userId = generateTestId('user_a');

  // 生成邀请码
  const response = await fetch(`${BASE_URL}/api/invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ anonymousId: userId }),
  });

  const data = await response.json();

  if (response.ok && data.success && data.data.code) {
    const code = data.data.code;
    const isValidFormat = /^[A-Z0-9]{6}$/.test(code);
    log(
      '生成邀请码',
      isValidFormat,
      `邀请码: ${code}, 格式: 6位字母数字`
    );

    // 验证邀请链接格式
    const inviteUrl = data.data.inviteUrl;
    const hasCorrectUrl = inviteUrl.includes(`invite=${code}`);
    log(
      '邀请链接格式',
      hasCorrectUrl,
      `链接: ${inviteUrl}`
    );

    return { userId, code };
  } else {
    log('生成邀请码', false, undefined, data.error || 'Unknown error');
    return { userId, code: null };
  }
}

async function testGetInviteStats(userId: string, expectedCode: string | null) {
  console.log('\n📋 测试 8.2: 获取邀请统计');
  console.log('='.repeat(50));

  const response = await fetch(`${BASE_URL}/api/invite?anonymousId=${userId}`);
  const data = await response.json();

  if (response.ok && data.success) {
    const { code, totalInvites, totalEarned } = data.data;

    log(
      '获取邀请统计',
      true,
      `邀请码: ${code}, 邀请人数: ${totalInvites}, 获得额度: ${totalEarned}`
    );

    if (expectedCode) {
      log(
        '邀请码匹配',
        code === expectedCode,
        `期望: ${expectedCode}, 实际: ${code}`
      );
    }

    return data.data;
  } else {
    log('获取邀请统计', false, undefined, data.error);
    return null;
  }
}

async function testUseInviteCode(
  code: string,
  inviteeId: string,
  shouldSucceed: boolean,
  expectedError?: string
) {
  console.log('\n📋 测试 8.3: 使用邀请码');
  console.log('='.repeat(50));

  const response = await fetch(`${BASE_URL}/api/invite/${code}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ anonymousId: inviteeId }),
  });

  const data = await response.json();

  if (shouldSucceed) {
    if (response.ok && data.success) {
      log(
        `使用邀请码成功 (${code})`,
        true,
        `消息: ${data.data?.message}, 新额度: ${data.data?.credits}`
      );
      return { success: true };
    } else {
      log(`使用邀请码成功 (${code})`, false, undefined, data.error);
      return { success: false, error: data.error };
    }
  } else {
    if (!response.ok || !data.success) {
      const errorMatch = expectedError
        ? data.error?.includes(expectedError)
        : true;
      log(
        `拒绝无效操作 (${expectedError || '预期失败'})`,
        errorMatch,
        `错误信息: ${data.error}`
      );
      return { success: false, error: data.error };
    } else {
      log(`拒绝无效操作`, false, undefined, '应该失败但成功了');
      return { success: true, unexpected: true };
    }
  }
}

async function testInviteRestrictions(code: string, ownerId: string) {
  console.log('\n📋 测试 8.4: 邀请限制');
  console.log('='.repeat(50));

  // 1. 自我邀请测试
  await testUseInviteCode(code, ownerId, false, '不能使用自己的邀请码');

  // 2. 无效邀请码测试
  const invalidCode = 'INVALID';
  await testUseInviteCode(invalidCode, generateTestId('user'), false, '邀请码无效');

  // 3. 重复使用邀请码（需要先成功使用一次）
  // 这个测试在实际流程中测试
}

async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 VidLuxe 邀请码系统 API 测试');
  console.log('='.repeat(60));
  console.log(`测试地址: ${BASE_URL}`);
  console.log(`测试时间: ${new Date().toLocaleString('zh-CN')}`);

  try {
    // 测试 1: 生成邀请码
    const { userId: userA, code } = await testGenerateInviteCode();

    if (!code) {
      console.log('\n❌ 无法生成邀请码，后续测试跳过');
      return;
    }

    // 测试 2: 获取邀请统计
    await testGetInviteStats(userA, code);

    // 测试 3: 邀请限制
    await testInviteRestrictions(code, userA);

    // 测试 4: 正常使用邀请码（需要新用户）
    console.log('\n📋 测试 8.5: 正常使用邀请码流程');
    console.log('='.repeat(50));

    const userB = generateTestId('user_b');
    console.log(`被邀请人 ID: ${userB}`);

    const useResult = await testUseInviteCode(code, userB, true);

    if (useResult.success) {
      // 再次获取邀请人统计，验证奖励
      console.log('\n验证邀请人获得奖励...');
      const stats = await testGetInviteStats(userA, code);

      if (stats) {
        log(
          '邀请人数增加',
          stats.totalInvites >= 1,
          `邀请人数: ${stats.totalInvites}`
        );
        log(
          '获得额度增加',
          stats.totalEarned >= 5,
          `获得额度: ${stats.totalEarned}`
        );
      }

      // 测试重复使用（同一用户再次使用）
      console.log('\n测试同一用户重复使用邀请码...');
      await testUseInviteCode(code, userB, false, '已经使用过');
    }

  } catch (error) {
    console.error('\n❌ 测试执行失败:', error);
  }

  // 打印汇总
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试结果汇总');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log(`\n总计: ${total} 项`);
  console.log(`通过: ${passed} 项`);
  console.log(`失败: ${failed} 项`);
  console.log(`通过率: ${((passed / total) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n❌ 失败的测试:');
    results
      .filter(r => !r.passed)
      .forEach(r => {
        console.log(`  - ${r.name}: ${r.error || 'Unknown error'}`);
      });
  }
}

// 运行测试
runTests();
