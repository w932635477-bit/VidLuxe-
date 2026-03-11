/**
 * 部署后额度系统健康检查
 *
 * 这个脚本应该在每次部署后运行，确保：
 * 1. Supabase API Key 正确配置
 * 2. 额度查询功能正常
 * 3. 测试用户数据未丢失
 *
 * 使用方法：
 * node scripts/credits-health-check.cjs
 *
 * 退出码：
 * 0 - 所有检查通过
 * 1 - 存在检查失败
 */

const fs = require('fs');
const path = require('path');

// 测试账号配置（已知用户 ID）
const TEST_ACCOUNTS = [
  {
    email: '932635477@qq.com',
    userId: '11e517a9-0d2f-4075-8b4d-53cb34820951',
    expectedPaid: 12,
    expectedFree: 8,
    expectedTotal: 20,
    description: '主要测试账号（购买过额度）',
  },
];

// 加载环境变量
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex > 0) {
          process.env[trimmed.substring(0, eqIndex).trim()] = trimmed.substring(eqIndex + 1).trim();
        }
      }
    });
  }
}

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 结果收集
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  checks: [],
};

function addCheck(name, status, message = '') {
  results.checks.push({ name, status, message });
  if (status === 'pass') results.passed++;
  else if (status === 'fail') results.failed++;
  else results.warnings++;

  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  console.log(`${icon} ${name}${message ? ': ' + message : ''}`);
}

async function checkEnvironment() {
  console.log('\n📦 检查 1: 环境变量配置');
  console.log('='.repeat(60));

  // 检查 SUPABASE_URL
  if (!SUPABASE_URL) {
    addCheck('SUPABASE_URL', 'fail', '未配置');
    return false;
  }
  addCheck('SUPABASE_URL', 'pass', SUPABASE_URL);

  // 检查 SUPABASE_KEY
  if (!SUPABASE_KEY) {
    addCheck('SUPABASE_SERVICE_ROLE_KEY', 'fail', '未配置');
    return false;
  }

  // 检查 Key 格式
  if (SUPABASE_KEY.startsWith('sb_secret_')) {
    addCheck('API Key 格式', 'pass', 'sb_secret_ 格式（正确）');
  } else if (SUPABASE_KEY.startsWith('eyJ')) {
    addCheck('API Key 格式', 'fail', 'JWT 格式（无效，请使用 sb_secret_ 格式）');
    return false;
  } else {
    addCheck('API Key 格式', 'warning', '未知格式');
  }

  return true;
}

async function checkSupabaseConnection() {
  console.log('\n🔗 检查 2: Supabase 连接');
  console.log('='.repeat(60));

  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY,
  };

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/user_credits?select=count`, {
      headers,
    });

    if (response.ok) {
      const data = await response.json();
      const count = data?.[0]?.count || 0;
      addCheck('Supabase 连接', 'pass', `成功，共 ${count} 条用户记录`);
      return true;
    } else if (response.status === 401) {
      addCheck('Supabase 连接', 'fail', '401 Unauthorized - API Key 无效');
      return false;
    } else {
      const error = await response.text();
      addCheck('Supabase 连接', 'fail', `HTTP ${response.status} - ${error}`);
      return false;
    }
  } catch (error) {
    addCheck('Supabase 连接', 'fail', error.message);
    return false;
  }
}

async function checkUserCredits(account) {
  console.log(`\n👤 检查 3: 用户额度 (${account.email})`);
  console.log('='.repeat(60));

  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY,
  };

  try {
    // 获取用户额度
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/user_credits?user_id=eq.${account.userId}&select=*`,
      { headers }
    );

    if (!response.ok) {
      addCheck(`获取用户额度 (${account.email})`, 'fail', `HTTP ${response.status}`);
      return false;
    }

    const data = await response.json();
    const credits = data?.[0];

    if (!credits) {
      addCheck(`用户记录存在 (${account.email})`, 'fail', '无额度记录');
      return false;
    }

    addCheck(`用户记录存在 (${account.email})`, 'pass', `ID: ${account.userId.substring(0, 8)}...`);

    // 计算免费额度
    const freeLimit = 8;
    const freeUsed = credits.free_credits_used_this_month || 0;
    const freeRemaining = Math.max(0, freeLimit - freeUsed);
    const total = credits.balance + freeRemaining;

    // 验证额度值
    const balanceMatch = credits.balance === account.expectedPaid;
    const freeMatch = freeRemaining === account.expectedFree;
    const totalMatch = total === account.expectedTotal;

    addCheck(
      `付费额度 (${account.email})`,
      balanceMatch ? 'pass' : 'warning',
      `实际: ${credits.balance}, 预期: ${account.expectedPaid}`
    );

    addCheck(
      `免费额度 (${account.email})`,
      freeMatch ? 'pass' : 'warning',
      `实际: ${freeRemaining}, 预期: ${account.expectedFree}`
    );

    addCheck(
      `总额度 (${account.email})`,
      totalMatch ? 'pass' : 'warning',
      `实际: ${total}, 预期: ${account.expectedTotal}`
    );

    // 检查数据一致性
    // 获取交易记录来验证
    const txResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/credit_transactions?user_id=eq.${account.userId}&select=amount`,
      { headers }
    );

    if (txResponse.ok) {
      const transactions = await txResponse.json();
      let calculatedBalance = 0;
      for (const tx of transactions) {
        calculatedBalance += Number(tx.amount);
      }

      const consistent = calculatedBalance === credits.balance;
      addCheck(
        `数据一致性 (${account.email})`,
        consistent ? 'pass' : 'fail',
        consistent ? '交易记录与余额一致' : `差异: 余额 ${credits.balance}, 计算 ${calculatedBalance}`
      );
    }

    return true;
  } catch (error) {
    addCheck(`检查用户额度 (${account.email})`, 'fail', error.message);
    return false;
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🏥 VidLuxe 部署后健康检查');
  console.log('='.repeat(60));
  console.log(`📅 时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log(`🔗 Supabase: ${SUPABASE_URL || '未配置'}`);

  // 1. 检查环境变量
  const envOk = await checkEnvironment();
  if (!envOk) {
    console.log('\n❌ 环境变量检查失败，无法继续');
    printSummary();
    process.exit(1);
  }

  // 2. 检查 Supabase 连接
  const connOk = await checkSupabaseConnection();
  if (!connOk) {
    console.log('\n❌ Supabase 连接失败，无法继续');
    printSummary();
    process.exit(1);
  }

  // 3. 检查测试账号
  for (const account of TEST_ACCOUNTS) {
    await checkUserCredits(account);
  }

  // 打印总结
  printSummary();

  // 退出
  if (results.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 检查总结');
  console.log('='.repeat(60));
  console.log(`✅ 通过: ${results.passed}`);
  console.log(`⚠️ 警告: ${results.warnings}`);
  console.log(`❌ 失败: ${results.failed}`);

  if (results.failed === 0 && results.warnings === 0) {
    console.log('\n🎉 所有检查通过！');
  } else if (results.failed === 0) {
    console.log('\n⚠️ 存在警告，但没有严重问题');
  } else {
    console.log('\n❌ 存在失败的检查，请立即处理！');
  }
}

main().catch(error => {
  console.error('脚本执行错误:', error);
  process.exit(1);
});
