/**
 * 执行 Supabase 迁移脚本
 * 使用 PostgreSQL 直连执行 SQL
 *
 * 运行方式: node scripts/execute-migration.mjs
 */

import pg from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '../apps/web/.env.local') });

// Supabase 数据库连接字符串格式:
// postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
const supabaseDbUrl = process.env.SUPABASE_DATABASE_URL;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!supabaseDbUrl && !supabaseUrl) {
  console.error('❌ 缺少数据库连接信息');
  console.error('请在 .env.local 中设置 SUPABASE_DATABASE_URL');
  console.error('格式: postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres');
  process.exit(1);
}

// 如果没有直接的数据库 URL，尝试从 Supabase URL 构建
let dbUrl = supabaseDbUrl;
if (!dbUrl && supabaseUrl) {
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (projectRef) {
    console.log(`\n⚠️  需要数据库密码来连接`);
    console.log(`\n数据库连接字符串格式:`);
    console.log(`postgresql://postgres:[YOUR-PASSWORD]@db.${projectRef}.supabase.co:5432/postgres`);
    console.log(`\n请在 Supabase Dashboard > Settings > Database 中获取数据库密码`);
    console.log(`然后设置 SUPABASE_DATABASE_URL 环境变量\n`);
    process.exit(1);
  }
}

// 迁移 SQL 文件路径
const migrationFile = path.resolve(__dirname, '../supabase/migrations/003_atomic_credits_functions.sql');

async function executeMigration() {
  console.log('🚀 开始执行 Supabase 迁移...\n');

  // 读取 SQL 文件
  const sql = fs.readFileSync(migrationFile, 'utf-8');
  console.log(`📄 SQL 文件: ${migrationFile}`);
  console.log(`   大小: ${sql.length} 字符\n`);

  // 创建 PostgreSQL 客户端
  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔗 连接数据库...');
    await client.connect();
    console.log('   ✅ 连接成功\n');

    // 执行 SQL
    console.log('📝 执行迁移 SQL...\n');
    await client.query(sql);
    console.log('   ✅ 迁移执行成功\n');

    // 验证表和函数是否创建成功
    console.log('🔍 验证迁移结果...\n');

    // 检查 webhook_events 表
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'webhook_events'
      );
    `);
    console.log(`   webhook_events 表: ${tableCheck.rows[0].exists ? '✅ 存在' : '❌ 不存在'}`);

    // 检查 increment_credits 函数
    const funcCheck1 = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_proc
        WHERE proname = 'increment_credits'
      );
    `);
    console.log(`   increment_credits 函数: ${funcCheck1.rows[0].exists ? '✅ 存在' : '❌ 不存在'}`);

    // 检查 consume_credits 函数
    const funcCheck2 = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_proc
        WHERE proname = 'consume_credits'
      );
    `);
    console.log(`   consume_credits 函数: ${funcCheck2.rows[0].exists ? '✅ 存在' : '❌ 不存在'}`);

    console.log('\n🎉 迁移完成！\n');

  } catch (error) {
    console.error('❌ 迁移执行失败:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

executeMigration().catch(console.error);
