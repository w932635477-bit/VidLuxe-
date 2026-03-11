/**
 * 执行幂等性迁移脚本
 *
 * 这个脚本通过 Supabase REST API 执行 SQL 迁移
 */

const fs = require('fs');
const path = require('path');

// 加载环境变量
const envPath = path.join(__dirname, '..', '.env.local');
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 执行幂等性迁移...');
console.log('📍 Supabase URL:', SUPABASE_URL);

// 迁移 SQL
const migrations = [
  {
    name: '创建 task_id 唯一索引',
    sql: `CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_transactions_task_id
          ON credit_transactions (task_id)
          WHERE task_id IS NOT NULL;`
  },
  {
    name: '添加审计字段',
    sql: `ALTER TABLE credit_transactions
          ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45),
          ADD COLUMN IF NOT EXISTS user_agent TEXT,
          ADD COLUMN IF NOT EXISTS request_id VARCHAR(64);`
  },
  {
    name: '添加 webhook 签名验证字段',
    sql: `ALTER TABLE webhook_events
          ADD COLUMN IF NOT EXISTS signature_verified BOOLEAN DEFAULT false;`
  },
];

async function executeSql(sql) {
  // 使用 Supabase 的 SQL 执行端点
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql }),
  });

  return response;
}

async function runMigration() {
  console.log('\n开始执行迁移...\n');

  for (const migration of migrations) {
    console.log(`📋 ${migration.name}...`);

    try {
      // 直接使用 REST API 执行 SQL
      // 注意：Supabase 可能不支持直接执行 DDL，需要通过 Dashboard 或 psql
      console.log('   SQL:', migration.sql.replace(/\s+/g, ' ').substring(0, 100) + '...');
      console.log('   ⚠️  需要在 Supabase Dashboard 中手动执行此迁移');
      console.log('');
    } catch (error) {
      console.log(`   ❌ 错误: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📋 迁移说明');
  console.log('='.repeat(60));
  console.log(`
由于 Supabase REST API 不支持直接执行 DDL 语句，
请在 Supabase Dashboard 中手动执行以下 SQL：

1. 打开 Supabase Dashboard
2. 进入 SQL Editor
3. 执行以下内容：

---

-- 1. 创建 task_id 唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_transactions_task_id
ON credit_transactions (task_id)
WHERE task_id IS NOT NULL;

-- 2. 添加审计字段
ALTER TABLE credit_transactions
ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45),
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS request_id VARCHAR(64);

-- 3. 添加 webhook 签名验证字段
ALTER TABLE webhook_events
ADD COLUMN IF NOT EXISTS signature_verified BOOLEAN DEFAULT false;

---

执行完成后，运行以下命令验证：
node scripts/verify-credits-system.cjs
`);
}

runMigration().catch(console.error);
