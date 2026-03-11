/**
 * 余额完整性验证作业
 *
 * 这个脚本用于：
 * 1. 验证 user_credits.balance 与 credit_transactions 记录的一致性
 * 2. 验证 total_earned 和 total_spent 的正确性
 * 3. 发送告警（如果配置）
 *
 * 使用方法：
 * node scripts/verify-balance-integrity.cjs [--fix] [--alert]
 *
 * 建议：每天运行一次（cron job）
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

const shouldFix = process.argv.includes('--fix');
const shouldAlert = process.argv.includes('--alert');

// 统计信息
const stats = {
  totalUsers: 0,
  consistentUsers: 0,
  inconsistentUsers: 0,
  fixedUsers: 0,
  errors: [],
};

/**
 * 获取所有用户额度记录
 */
async function getAllUserCredits() {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/user_credits?select=user_id,balance,total_earned,total_spent`,
    { headers }
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch user credits: ${response.status}`);
  }
  return await response.json();
}

/**
 * 获取用户交易记录并计算理论余额
 */
async function calculateBalanceFromTransactions(userId) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/credit_transactions?user_id=eq.${userId}&select=amount,type`,
    { headers }
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch transactions: ${response.status}`);
  }
  const transactions = await response.json();

  let balance = 0;
  let totalEarned = 0;
  let totalSpent = 0;

  for (const tx of transactions) {
    const amount = Number(tx.amount);
    balance += amount;

    if (amount > 0) {
      totalEarned += amount;
    } else {
      totalSpent += Math.abs(amount);
    }
  }

  return { balance, totalEarned, totalSpent, transactionCount: transactions.length };
}

/**
 * 修复不一致的余额
 */
async function fixUserBalance(userId, correctBalance, correctEarned, correctSpent) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/user_credits?user_id=eq.${userId}`,
    {
      method: 'PATCH',
      headers: {
        ...headers,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        balance: correctBalance,
        total_earned: correctEarned,
        total_spent: correctSpent,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fix balance: ${response.status}`);
  }

  // 添加修复记录
  await fetch(`${SUPABASE_URL}/rest/v1/credit_transactions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      user_id: userId,
      amount: correctBalance - (await getStoredBalance(userId)),
      type: 'admin_adjustment',
      description: `自动修复：余额校正值`,
    }),
  });
}

async function getStoredBalance(userId) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/user_credits?user_id=eq.${userId}&select=balance`,
    { headers }
  );
  const data = await response.json();
  return data?.[0]?.balance || 0;
}

/**
 * 发送告警（简单实现，可以扩展为邮件/Slack）
 */
async function sendAlert(userId, stored, calculated) {
  const message = `⚠️ 余额不一致告警

用户ID: ${userId}
存储余额: ${stored.balance}
计算余额: ${calculated.balance}
差异: ${stored.balance - calculated.balance}

时间: ${new Date().toLocaleString('zh-CN')}
`;

  console.error(message);

  // TODO: 实现邮件或 Slack 告警
  // await sendEmail(process.env.ALERT_EMAIL, 'VidLuxe 余额告警', message);
  // await sendSlack(process.env.SLACK_WEBHOOK, message);
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 VidLuxe 余额完整性验证作业');
  console.log('='.repeat(60));
  console.log(`📅 时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log(`🔧 自动修复: ${shouldFix ? '启用' : '禁用'}`);
  console.log(`📢 发送告警: ${shouldAlert ? '启用' : '禁用'}`);
  console.log('');

  // 获取所有用户
  const users = await getAllUserCredits();
  stats.totalUsers = users.length;

  console.log(`📊 共 ${users.length} 个用户需要验证\n`);

  // 验证每个用户
  for (const user of users) {
    try {
      const stored = {
        balance: user.balance,
        totalEarned: user.total_earned,
        totalSpent: user.total_spent,
      };

      const calculated = await calculateBalanceFromTransactions(user.user_id);

      // 检查一致性
      const balanceMatch = stored.balance === calculated.balance;
      const earnedMatch = stored.totalEarned === calculated.totalEarned;
      const spentMatch = stored.totalSpent === calculated.totalSpent;

      if (balanceMatch && earnedMatch && spentMatch) {
        stats.consistentUsers++;
        console.log(`✅ ${user.user_id.substring(0, 8)}... 余额: ${stored.balance} (${calculated.transactionCount} 笔交易)`);
      } else {
        stats.inconsistentUsers++;

        const issues = [];
        if (!balanceMatch) issues.push(`余额: 存储=${stored.balance}, 计算=${calculated.balance}`);
        if (!earnedMatch) issues.push(`获得: 存储=${stored.totalEarned}, 计算=${calculated.totalEarned}`);
        if (!spentMatch) issues.push(`消费: 存储=${stored.totalSpent}, 计算=${calculated.totalSpent}`);

        console.log(`❌ ${user.user_id.substring(0, 8)}... ${issues.join(', ')}`);

        // 发送告警
        if (shouldAlert) {
          await sendAlert(user.user_id, stored, calculated);
        }

        // 自动修复
        if (shouldFix) {
          await fixUserBalance(
            user.user_id,
            calculated.balance,
            calculated.totalEarned,
            calculated.totalSpent
          );
          stats.fixedUsers++;
          console.log(`   🔧 已修复`);
        }
      }
    } catch (error) {
      stats.errors.push({ userId: user.user_id, error: error.message });
      console.log(`⚠️ ${user.user_id.substring(0, 8)}... 验证失败: ${error.message}`);
    }
  }

  // 打印总结
  console.log('\n' + '='.repeat(60));
  console.log('📋 验证总结');
  console.log('='.repeat(60));
  console.log(`总用户数: ${stats.totalUsers}`);
  console.log(`✅ 一致: ${stats.consistentUsers}`);
  console.log(`❌ 不一致: ${stats.inconsistentUsers}`);
  console.log(`🔧 已修复: ${stats.fixedUsers}`);
  console.log(`⚠️ 错误: ${stats.errors.length}`);

  if (stats.inconsistentUsers > 0 && !shouldFix) {
    console.log('\n💡 提示: 使用 --fix 参数自动修复不一致的余额');
  }

  // 返回状态码
  if (stats.inconsistentUsers > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch(error => {
  console.error('脚本执行错误:', error);
  process.exit(1);
});
