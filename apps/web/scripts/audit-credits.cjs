/**
 * 额度审计脚本
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
        const key = trimmed.substring(0, eqIndex).trim();
        const value = trimmed.substring(eqIndex + 1).trim();
        process.env[key] = value;
      }
    }
  });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ 缺少环境变量');
  process.exit(1);
}

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': 'Bearer ' + SUPABASE_KEY,
  'Content-Type': 'application/json',
};

async function findUserByEmail(email) {
  const url = `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    console.error('查找用户失败:', res.status);
    return null;
  }
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

async function fixCredits(userId, targetBalance, reason) {
  // 更新额度
  const url = `${SUPABASE_URL}/rest/v1/user_credits?user_id=eq.${userId}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      balance: targetBalance,
      total_earned: targetBalance,
    }),
  });

  if (!res.ok) {
    console.error('更新失败:', res.status);
    return false;
  }

  // 添加交易记录
  await fetch(`${SUPABASE_URL}/rest/v1/credit_transactions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      user_id: userId,
      amount: targetBalance - (await getUserCredits(userId))?.balance || targetBalance,
      type: 'admin_adjustment',
      description: reason,
    }),
  });

  return true;
}

async function main() {
  const email = process.argv[2] || '932635477@qq.com';
  const fixMode = process.argv.includes('--fix');
  const targetBalance = fixMode ? parseInt(process.argv[process.argv.indexOf('--balance') + 1]) : null;

  console.log('\n🔍 额度审计工具');
  console.log('📧 账号:', email);
  console.log('🔗 Supabase:', SUPABASE_URL);

  // 查找用户
  console.log('\n⏳ 正在查找用户...');
  const userId = await findUserByEmail(email);
  if (!userId) {
    console.log('❌ 未找到用户:', email);
    process.exit(1);
  }
  console.log('✅ 用户ID:', userId);

  // 查询额度
  console.log('\n⏳ 正在查询当前额度...');
  const credits = await getUserCredits(userId);
  if (credits) {
    console.log('✅ 当前额度状态:');
    console.log('   - 付费余额:', credits.balance);
    console.log('   - 总获得:', credits.total_earned);
    console.log('   - 总消费:', credits.total_spent);
    console.log('   - 本月免费已用:', credits.free_credits_used_this_month || 0);
  } else {
    console.log('⚠️ 用户还没有额度记录');
  }

  // 查询交易记录
  console.log('\n⏳ 正在查询交易记录...');
  const transactions = await getTransactions(userId);
  console.log('✅ 找到', transactions.length, '条交易记录');

  if (transactions.length > 0) {
    let balance = 0;
    console.log('\n📊 交易记录分析:');
    console.log('='.repeat(120));
    for (const tx of transactions) {
      balance += Number(tx.amount);
      const sign = tx.amount >= 0 ? '+' : '';
      const time = tx.created_at ? new Date(tx.created_at).toLocaleString('zh-CN') : 'N/A';
      console.log(`${time} | ${(tx.type || '').padEnd(15)} | ${sign}${String(tx.amount).padStart(3)} | 余额: ${String(balance).padStart(3)} | ${tx.description || ''}`);
    }
    console.log('='.repeat(120));

    console.log('\n📈 理论余额（从交易记录计算）:', balance);
    console.log('📈 实际余额（数据库记录）:', credits?.balance || 0);

    const discrepancy = (credits?.balance || 0) - balance;
    if (discrepancy !== 0) {
      console.log('⚠️ 发现差异:', discrepancy > 0 ? '+' : '', discrepancy);
    } else {
      console.log('✅ 余额一致，无差异');
    }
  }

  // 修复模式
  if (fixMode && targetBalance !== null && !isNaN(targetBalance)) {
    console.log('\n🔧 正在修复额度到', targetBalance, '...');
    const oldBalance = credits?.balance || 0;
    const reason = `管理员修复: ${oldBalance} -> ${targetBalance}`;

    const success = await fixCredits(userId, targetBalance, reason);
    if (success) {
      console.log('✅ 额度修复成功');
      const newCredits = await getUserCredits(userId);
      console.log('   新余额:', newCredits?.balance);
    } else {
      console.log('❌ 额度修复失败');
    }
  } else if (!fixMode) {
    console.log('\n💡 如需修复额度，请使用:');
    console.log(`   node scripts/audit-credits.cjs ${email} --fix --balance <目标余额>`);
  }
}

main().catch(console.error);
