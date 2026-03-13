#!/usr/bin/env node
/**
 * 额度审计和修复脚本
 *
 * 用于查询和修复 Supabase 数据库中的用户额度问题
 *
 * 使用方法：
 * node scripts/fix-credits.mjs [email]
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 加载 .env.local 文件
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env.local');

if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=');
        process.env[key.trim()] = value.trim();
      }
    }
  });
  console.log('✅ 已加载 .env.local 环境变量');
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ 缺少 Supabase 环境变量');
  process.exit(1);
}

const supabaseRestUrl = `${SUPABASE_URL}/rest/v1`;

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

/**
 * 通过邮箱查找用户 ID
 */
async function findUserByEmail(email) {
  // 使用 admin API 查找用户
  const adminUrl = `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`;

  try {
    const response = await fetch(adminUrl, {
      method: 'GET',
      headers: {
        ...headers,
        'x-supabase-service-role-key': SUPABASE_KEY,
      },
    });

    if (!response.ok) {
      console.error(`查找用户失败: ${response.status}`);
      const text = await response.text();
      console.error(text);
      return null;
    }

    const data = await response.json();
    return data?.[0]?.id || null;
  } catch (error) {
    console.error('查找用户出错:', error);
    return null;
  }
}

/**
 * 查询用户当前额度
 */
async function getUserCredits(userId) {
  const url = `${supabaseRestUrl}/user_credits?user_id=eq.${userId}&select=*`;

  const response = await fetch(url, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    console.error(`查询额度失败: ${response.status}`);
    return null;
  }

  const data = await response.json();
  return data?.[0] || null;
}

/**
 * 查询用户所有交易记录
 */
async function getTransactions(userId) {
  const url = `${supabaseRestUrl}/credit_transactions?user_id=eq.${userId}&select=*&order=created_at.asc`;

  const response = await fetch(url, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    console.error(`查询交易记录失败: ${response.status}`);
    return [];
  }

  return await response.json();
}

/**
 * 修复用户额度
 */
async function fixUserCredits(userId, targetBalance, reason) {
  // 直接更新 user_credits 表
  const url = `${supabaseRestUrl}/user_credits?user_id=eq.${userId}`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      balance: targetBalance,
      total_earned: targetBalance, // 假设 total_earned 也需要更新
    }),
  });

  if (!response.ok) {
    console.error(`更新额度失败: ${response.status}`);
    const text = await response.text();
    console.error(text);
    return false;
  }

  // 添加一条记录说明修复原因
  await fetch(`${supabaseRestUrl}/credit_transactions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      user_id: userId,
      amount: targetBalance,
      type: 'admin_adjustment',
      description: reason,
    }),
  });

  return true;
}

/**
 * 计算理论余额
 */
function calculateTheoreticalBalance(transactions) {
  let balance = 0;

  console.log('\n📊 交易记录分析:');
  console.log('=' .repeat(100));

  for (const tx of transactions) {
    const amount = Number(tx.amount);
    const type = tx.type;
    const desc = tx.description || '';
    const time = tx.created_at ? new Date(tx.created_at).toLocaleString('zh-CN') : 'N/A';

    balance += amount;

    const sign = amount >= 0 ? '+' : '';
    console.log(`${time} | ${type.padEnd(15)} | ${sign}${amount.toString().padStart(3)} | 余额: ${balance.toString().padStart(3)} | ${desc}`);
  }

  console.log('=' .repeat(100));
  return balance;
}

async function main() {
  const email = process.argv[2] || '932635477@qq.com';

  console.log(`\n🔍 额度审计工具`);
  console.log(`📧 目标账号: ${email}`);
  console.log(`🔗 Supabase URL: ${SUPABASE_URL}\n`);

  // 1. 查找用户
  console.log('⏳ 正在查找用户...');
  const userId = await findUserByEmail(email);

  if (!userId) {
    console.error(`❌ 未找到用户: ${email}`);
    process.exit(1);
  }

  console.log(`✅ 找到用户 ID: ${userId}\n`);

  // 2. 查询当前额度
  console.log('⏳ 正在查询当前额度...');
  const credits = await getUserCredits(userId);

  if (!credits) {
    console.log('⚠️ 用户还没有额度记录，创建新记录中...');
  } else {
    console.log(`✅ 当前额度状态:`);
    console.log(`   - 付费余额: ${credits.balance}`);
    console.log(`   - 总获得: ${credits.total_earned}`);
    console.log(`   - 总消费: ${credits.total_spent}`);
    console.log(`   - 本月免费额度已用: ${credits.free_credits_used_this_month || 0}`);
  }

  // 3. 查询交易记录
  console.log('\n⏳ 正在查询交易记录...');
  const transactions = await getTransactions(userId);

  if (transactions.length === 0) {
    console.log('⚠️ 没有找到交易记录');
  } else {
    console.log(`✅ 找到 ${transactions.length} 条交易记录`);

    // 计算理论余额
    const theoreticalBalance = calculateTheoreticalBalance(transactions);

    console.log(`\n📈 理论余额（从交易记录计算）: ${theoreticalBalance}`);
    console.log(`📈 实际余额（数据库记录）: ${credits?.balance || 0}`);

    const discrepancy = (credits?.balance || 0) - theoreticalBalance;
    if (discrepancy !== 0) {
      console.log(`\n⚠️ 发现差异: ${discrepancy > 0 ? '+' : ''}${discrepancy}`);
      console.log('   这可能是由于:');
      console.log('   - 数据库直接修改');
      console.log('   - 退款失败');
      console.log('   - 并发问题');
    }
  }

  // 4. 如果需要修复，询问用户
  const args = process.argv.slice(2);
  if (args.includes('--fix') && args.includes('--balance')) {
    const balanceIndex = args.indexOf('--balance');
    const targetBalance = parseInt(args[balanceIndex + 1]);

    if (isNaN(targetBalance)) {
      console.error('❌ 无效的目标余额');
      process.exit(1);
    }

    console.log(`\n🔧 正在修复额度到 ${targetBalance}...`);
    const reason = `管理员修复: ${credits?.balance || 0} -> ${targetBalance}`;

    const success = await fixUserCredits(userId, targetBalance, reason);

    if (success) {
      console.log('✅ 额度修复成功');

      // 重新查询验证
      const newCredits = await getUserCredits(userId);
      console.log(`   新余额: ${newCredits?.balance}`);
    } else {
      console.error('❌ 额度修复失败');
    }
  } else {
    console.log('\n💡 如需修复额度，请使用:');
    console.log(`   node scripts/fix-credits.mjs ${email} --fix --balance <目标余额>`);
  }
}

main().catch(console.error);
