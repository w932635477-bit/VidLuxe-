#!/usr/bin/env node
/**
 * Supabase 迁移执行脚本
 *
 * 使用方式：
 * 1. 在 Supabase Dashboard 获取数据库密码：
 *    Settings > Database > Connection string > PostgreSQL
 * 2. 设置环境变量：
 *    export SUPABASE_DB_PASSWORD="your-password"
 * 3. 运行脚本：
 *    node scripts/run-migration.mjs
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;
const PROJECT_REF = 'lklgluxnloqmyelxtpfi';

if (!DB_PASSWORD) {
  console.error('\n❌ 错误: 未设置数据库密码\n');
  console.log('请按以下步骤操作:\n');
  console.log('1. 打开 Supabase Dashboard:');
  console.log('   https://supabase.com/dashboard/project/lklgluxnloqmyelxtpfi/settings/database\n');
  console.log('2. 找到 "Connection string" > "PostgreSQL"');
  console.log('3. 复制密码（或者重置密码）\n');
  console.log('4. 设置环境变量并重新运行:');
  console.log('   export SUPABASE_DB_PASSWORD="your-password"');
  console.log('   node scripts/run-migration.mjs\n');
  process.exit(1);
}

const DB_URL = `postgresql://postgres:${encodeURIComponent(DB_PASSWORD)}@db.${PROJECT_REF}.supabase.co:5432/postgres`;

async function main() {
  console.log('\n🚀 开始执行 Supabase 迁移...\n');

  const migrationFile = path.resolve(__dirname, '../supabase/migrations/003_atomic_credits_functions.sql');
  const sql = fs.readFileSync(migrationFile, 'utf-8');

  console.log(`📄 SQL 文件: ${migrationFile}`);
  console.log(`   大小: ${sql.length} 字符\n`);

  const client = new pg.Client({
    connectionString: DB_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔗 连接数据库...');
    await client.connect();
    console.log('   ✅ 连接成功\n');

    console.log('📝 执行迁移 SQL...');
    await client.query(sql);
    console.log('   ✅ 迁移执行成功\n');

    // 验证
    console.log('🔍 验证迁移结果...\n');

    const checks = [
      { name: 'webhook_events 表', query: "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'webhook_events')" },
      { name: 'increment_credits 函数', query: "SELECT EXISTS (SELECT FROM pg_proc WHERE proname = 'increment_credits')" },
      { name: 'consume_credits 函数', query: "SELECT EXISTS (SELECT FROM pg_proc WHERE proname = 'consume_credits')" },
    ];

    for (const check of checks) {
      const result = await client.query(check.query);
      const exists = result.rows[0].exists;
      console.log(`   ${exists ? '✅' : '❌'} ${check.name}: ${exists ? '已创建' : '创建失败'}`);
    }

    console.log('\n🎉 迁移完成！支付系统现在可以正常工作了。\n');

  } catch (error) {
    console.error('\n❌ 迁移执行失败:', error.message);
    console.error('\n请检查数据库密码是否正确。\n');
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
