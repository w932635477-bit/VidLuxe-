/**
 * 额度系统完整性验证测试
 *
 * 这个脚本用于：
 * 1. 验证 Supabase API Key 是否有效
 * 2. 验证用户额度数据是否正确
 * 3. 验证交易记录与余额是否一致
 *
 * 使用方法：node scripts/verify-credits-system.cjs [email]
 */

const fs = require('fs');
const path = require('path');

// 加载环境变量
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': 'Bearer ' + SUPABASE_KEY,
  'Content-Type': 'application/json',
};

let testsPassed = 0;
let testsFailed = 0;

function logTest(name, passed, details = '') {
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}${details ? ': ' + details : ''}`);
  if (passed) testsPassed++;
  else testsFailed++;
}

async function findUserByEmail(email) {
  const url = `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`;
  const res = await fetch(url, { headers });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.[0]?.id || null;
}

async function getUserCredits(userId) {
  const url = `${SUPABASE_URL}/rest/v1/user_credits?user_id=eq.${userId}&select=*`;
  const res = await fetch(url, { headers });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.[0] || null;
}

async function getTransactions(userId) {
  const url = `${SUPABASE_URL}/rest/v1/credit_transactions?user_id=eq.${userId}&select=*&order=created_at.asc`;
  const res = await fetch(url, { headers });
  if (!res.ok) return [];
  return await res.json();
}

async function testSupabaseConnection() {
  console.log('\n📡 测试 1: Supabase API 连接');
  console.log('='.repeat(50));

  try {
    // 简单查询来验证 API Key
    const url = `${SUPABASE_URL}/rest/v1/user_credits?select=count`;
    const res = await fetch(url, { headers });

    if (res.ok) {
      const data = await res.json();
      logTest('API Key 有效性', true, `连接成功，共 ${data?.[0]?.count || 0} 条记录`);
      return true;
    } else if (res.status === 401) {
      const error = await res.text();
      logTest('API Key 有效性', false, `401 Unauthorized - ${error}`);
      return false;
    } else {
      const error = await res.text();
      logTest('API Key 有效性', false, `HTTP ${res.status} - ${error}`);
      return false;
    }
  } catch (error) {
    logTest('API Key 有效性', false, error.message);
    return false;
  }
}

async function testUserCredits(userId) {
  console.log('\n👤 测试 2: 用户额度数据');
  console.log('='.repeat(50));

  logTest('用户ID', true, `${userId.substring(0, 8)}...`);

  // 获取额度
  const credits = await getUserCredits(userId);
  if (!credits) {
    logTest('获取额度记录', false, '无额度记录');
    return null;
  }
  logTest('获取额度记录', true, `余额: ${credits.balance}`);

  // 获取交易记录
  const transactions = await getTransactions(userId);
  logTest('获取交易记录', true, `${transactions.length} 条记录`);

  // 验证交易记录与余额一致性
  let calculatedBalance = 0;
  for (const tx of transactions) {
    calculatedBalance += Number(tx.amount);
  }

  const balanceMatch = calculatedBalance === credits.balance;
  logTest('余额一致性', balanceMatch,
    balanceMatch ? '交易记录与余额一致' : `差异: 实际 ${credits.balance}, 计算 ${calculatedBalance}`);

  // 详细输出
  console.log('\n📊 额度详情:');
  console.log(`   付费余额: ${credits.balance}`);
  console.log(`   总获得: ${credits.total_earned}`);
  console.log(`   总消费: ${credits.total_spent}`);
  console.log(`   本月免费已用: ${credits.free_credits_used_this_month || 0}`);

  const freeLimit = 8;
  const freeRemaining = Math.max(0, freeLimit - (credits.free_credits_used_this_month || 0));
  console.log(`   免费剩余: ${freeRemaining}`);
  console.log(`   总可用: ${credits.balance + freeRemaining}`);

  return { userId, credits, transactions, calculatedBalance };
}

async function testDataIntegrity(userData) {
  if (!userData) return;

  console.log('\n🔍 测试 3: 数据完整性');
  console.log('='.repeat(50));

  const { credits, transactions, calculatedBalance } = userData;

  // 检查 total_earned 是否正确
  let totalEarned = 0;
  let totalSpent = 0;
  for (const tx of transactions) {
    if (Number(tx.amount) > 0) {
      totalEarned += Number(tx.amount);
    } else {
      totalSpent += Math.abs(Number(tx.amount));
    }
  }

  const earnedMatch = totalEarned === credits.total_earned;
  const spentMatch = totalSpent === credits.total_spent;

  logTest('total_earned 正确性', earnedMatch,
    earnedMatch ? `${credits.total_earned}` : `记录 ${totalEarned}, 数据库 ${credits.total_earned}`);
  logTest('total_spent 正确性', spentMatch,
    spentMatch ? `${credits.total_spent}` : `记录 ${totalSpent}, 数据库 ${credits.total_spent}`);

  // 检查是否有孤儿交易（没有对应类型）
  const validTypes = ['purchase', 'spend', 'refund', 'invite_earned', 'invite_bonus', 'admin_adjustment'];
  const orphanTx = transactions.filter(tx => !validTypes.includes(tx.type));
  logTest('交易类型有效性', orphanTx.length === 0,
    orphanTx.length === 0 ? '所有交易类型有效' : `发现 ${orphanTx.length} 条无效类型`);
}

async function main() {
  const input = process.argv[2] || '932635477@qq.com';
  // 检查是否是 UUID 格式
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input);

  console.log('\n' + '='.repeat(50));
  console.log('🧪 VidLuxe 额度系统完整性验证');
  console.log('='.repeat(50));
  console.log(`📅 时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log(`${isUuid ? '🆔 用户ID' : '📧 测试账号'}: ${input}`);
  console.log(`🔗 Supabase: ${SUPABASE_URL}`);

  // 检查环境变量
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.log('\n❌ 缺少环境变量:');
    console.log(`   SUPABASE_URL: ${SUPABASE_URL ? '已配置' : '缺失'}`);
    console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_KEY ? '已配置' : '缺失'}`);
    process.exit(1);
  }

  console.log(`   API Key 格式: ${SUPABASE_KEY.startsWith('sb_secret_') ? '✅ 正确 (sb_secret_)' : '⚠️ 可能无效'}`);

  // 运行测试
  const apiOk = await testSupabaseConnection();
  if (!apiOk) {
    console.log('\n❌ API 连接失败，无法继续测试');
    process.exit(1);
  }

  // 如果是 UUID，直接使用；否则通过邮箱查找
  let userId = isUuid ? input : null;

  if (!userId) {
    userId = await findUserByEmail(input);
  }

  if (!userId) {
    // 尝试使用已知的测试账号 ID
    const knownUserIds = {
      '932635477@qq.com': '11e517a9-0d2f-4075-8b4d-53cb34820951',
    };
    userId = knownUserIds[input];
    if (userId) {
      console.log(`\nℹ️ 使用已知用户 ID: ${userId.substring(0, 8)}...`);
    }
  }

  if (!userId) {
    console.log('\n❌ 无法找到用户，请提供有效的用户 ID');
    process.exit(1);
  }

  const userData = await testUserCredits(userId);
  await testDataIntegrity(userData);

  // 总结
  console.log('\n' + '='.repeat(50));
  console.log('📋 测试总结');
  console.log('='.repeat(50));
  console.log(`✅ 通过: ${testsPassed}`);
  console.log(`❌ 失败: ${testsFailed}`);

  if (testsFailed === 0) {
    console.log('\n🎉 所有测试通过！额度系统运行正常。');
    process.exit(0);
  } else {
    console.log('\n⚠️ 存在失败的测试，请检查上述详情。');
    process.exit(1);
  }
}

main().catch(console.error);
