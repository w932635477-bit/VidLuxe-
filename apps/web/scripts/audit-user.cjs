/**
 * 详细审计单个用户
 */
const fs = require('fs');
const path = require('path');

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
};

async function main() {
  const userId = process.argv[2] || '11e517a9-0d2f-4075-8b4d-53cb34820951';
  const fixMode = process.argv.includes('--fix');
  const targetBalance = fixMode ? parseInt(process.argv[process.argv.indexOf('--balance') + 1]) : null;

  console.log('\n🔍 详细额度审计');
  console.log('用户ID:', userId);

  // 查询额度
  const creditsRes = await fetch(`${SUPABASE_URL}/rest/v1/user_credits?user_id=eq.${userId}&select=*`, { headers });
  const creditsData = await creditsRes.json();
  const credits = creditsData?.[0];

  if (credits) {
    console.log('\n📊 当前额度状态:');
    console.log('  付费余额 (balance):', credits.balance);
    console.log('  总获得 (total_earned):', credits.total_earned);
    console.log('  总消费 (total_spent):', credits.total_spent);
    console.log('  本月免费已用 (free_credits_used_this_month):', credits.free_credits_used_this_month || 0);

    const freeLimit = 8;
    const freeRemaining = Math.max(0, freeLimit - (credits.free_credits_used_this_month || 0));
    console.log('  免费额度剩余:', freeRemaining);
    console.log('  总可用额度:', credits.balance + freeRemaining);
  }

  // 查询所有交易记录
  const txRes = await fetch(`${SUPABASE_URL}/rest/v1/credit_transactions?user_id=eq.${userId}&select=*&order=created_at.asc`, { headers });
  const transactions = await txRes.json();

  console.log('\n📋 交易记录 (' + transactions.length + ' 条):');
  console.log('='.repeat(130));

  let balance = 0;
  let totalSpent = 0;
  let totalEarned = 0;

  for (const tx of transactions) {
    const amount = Number(tx.amount);
    balance += amount;

    if (amount > 0) {
      totalEarned += amount;
    } else {
      totalSpent += Math.abs(amount);
    }

    const time = tx.created_at ? new Date(tx.created_at).toLocaleString('zh-CN') : 'N/A';
    const sign = amount >= 0 ? '+' : '';
    console.log(`${time} | ${(tx.type || '').padEnd(15)} | ${sign}${String(amount).padStart(3)} | 累计余额: ${String(balance).padStart(3)} | ${tx.description || ''}`);
  }

  console.log('='.repeat(130));
  console.log('\n📈 从交易记录计算:');
  console.log('  理论余额:', balance);
  console.log('  累计获得:', totalEarned);
  console.log('  累计消费:', totalSpent);

  console.log('\n📈 数据库记录:');
  console.log('  实际余额:', credits?.balance || 0);
  console.log('  总获得:', credits?.total_earned || 0);
  console.log('  总消费:', credits?.total_spent || 0);

  const balanceDiff = (credits?.balance || 0) - balance;
  const earnedDiff = (credits?.total_earned || 0) - totalEarned;
  const spentDiff = (credits?.total_spent || 0) - totalSpent;

  if (balanceDiff !== 0 || earnedDiff !== 0 || spentDiff !== 0) {
    console.log('\n⚠️ 发现差异:');
    if (balanceDiff !== 0) console.log('  余额差异:', balanceDiff > 0 ? '+' : '', balanceDiff);
    if (earnedDiff !== 0) console.log('  总获得差异:', earnedDiff > 0 ? '+' : '', earnedDiff);
    if (spentDiff !== 0) console.log('  总消费差异:', spentDiff > 0 ? '+' : '', spentDiff);
  } else {
    console.log('\n✅ 数据一致，无差异');
  }

  // 修复模式
  if (fixMode && targetBalance !== null && !isNaN(targetBalance)) {
    console.log('\n🔧 正在修复额度到', targetBalance, '...');
    const oldBalance = credits?.balance || 0;
    const reason = `管理员修复: ${oldBalance} -> ${targetBalance}`;

    // 更新额度
    const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/user_credits?user_id=eq.${userId}`, {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify({
        balance: targetBalance,
        total_earned: targetBalance + totalSpent, // 保持总消费不变
      }),
    });

    if (updateRes.ok) {
      // 添加交易记录
      await fetch(`${SUPABASE_URL}/rest/v1/credit_transactions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          user_id: userId,
          amount: targetBalance - oldBalance,
          type: 'admin_adjustment',
          description: reason,
        }),
      });

      console.log('✅ 修复成功');
      const newCreditsRes = await fetch(`${SUPABASE_URL}/rest/v1/user_credits?user_id=eq.${userId}&select=*`, { headers });
      const newCredits = await newCreditsRes.json();
      console.log('   新余额:', newCredits?.[0]?.balance);
    } else {
      console.log('❌ 修复失败:', await updateRes.text());
    }
  } else {
    console.log('\n💡 如需修复额度，请使用:');
    console.log(`   node scripts/audit-user.cjs ${userId} --fix --balance <目标余额>`);
  }
}

main().catch(console.error);
