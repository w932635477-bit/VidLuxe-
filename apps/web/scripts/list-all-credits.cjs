/**
 * 查询所有用户额度
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
  // 查询所有用户额度
  console.log('\n📋 所有用户额度:');
  console.log('='.repeat(80));

  const res = await fetch(`${SUPABASE_URL}/rest/v1/user_credits?select=user_id,balance,total_earned,total_spent,free_credits_used_this_month&order=balance.desc`, {
    headers
  });
  const users = await res.json();

  for (const user of users) {
    console.log(`用户ID: ${user.user_id}`);
    console.log(`  余额: ${user.balance}, 总获得: ${user.total_earned}, 总消费: ${user.total_spent}`);
    console.log(`  本月免费已用: ${user.free_credits_used_this_month || 0}`);
  }

  // 查询最近的交易记录
  console.log('\n📋 最近50条交易记录:');
  console.log('='.repeat(120));

  const txRes = await fetch(`${SUPABASE_URL}/rest/v1/credit_transactions?select=*&order=created_at.desc&limit=50`, {
    headers
  });
  const transactions = await txRes.json();

  for (const tx of transactions) {
    const time = tx.created_at ? new Date(tx.created_at).toLocaleString('zh-CN') : 'N/A';
    console.log(`${tx.user_id.substring(0, 8)}... | ${time} | ${(tx.type || '').padEnd(15)} | ${tx.amount >= 0 ? '+' : ''}${tx.amount} | ${tx.description || ''}`);
  }
}

main().catch(console.error);
