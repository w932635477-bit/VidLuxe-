/**
 * 执行 Supabase 迁移脚本
 * 直接执行 SQL 文件创建表和函数
 *
 * 运行方式: npx tsx scripts/execute-migration.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '../apps/web/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ 缺少 Supabase 环境变量');
  process.exit(1);
}

// 使用 service_role 权限创建客户端
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 迁移 SQL 文件路径
const migrationFile = path.resolve(__dirname, '../supabase/migrations/003_atomic_credits_functions.sql');

async function executeMigration() {
  console.log('🚀 开始执行 Supabase 迁移...\n');
  console.log(`📍 项目: ${supabaseUrl}`);
  console.log(`📄 文件: ${migrationFile}\n`);

  // 读取 SQL 文件
  let sql: string;
  try {
    sql = fs.readFileSync(migrationFile, 'utf-8');
    console.log(`✅ SQL 文件已读取 (${sql.length} 字符)\n`);
  } catch (e) {
    console.error('❌ 无法读取 SQL 文件:', e);
    process.exit(1);
  }

  // 分割 SQL 语句（按 ; 分割，但忽略函数体内的分号）
  // 简单策略：按 $$ 分割，$$ 之间的内容保持完整
  const statements: string[] = [];
  const parts = sql.split('$$');

  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      // 函数外部，按分号分割
      const subs = parts[i].split(';').filter(s => s.trim());
      statements.push(...subs);
    } else {
      // 函数内部，保持完整
      const prevStatement = statements.pop() || '';
      statements.push(prevStatement + '$$' + parts[i] + '$$');
    }
  }

  console.log(`📝 共 ${statements.length} 条 SQL 语句待执行\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i].trim();
    if (!statement) continue;

    // 显示进度
    console.log(`[${i + 1}/${statements.length}] 执行中...`);

    // 提取语句类型用于日志
    const statementPreview = statement.substring(0, 60).replace(/\n/g, ' ') + '...';
    console.log(`   ${statementPreview}`);

    try {
      // 使用 Supabase 的 RPC 执行 SQL
      // 注意：需要数据库中存在 exec_sql 函数，或者使用其他方法
      // 这里我们尝试直接通过 REST API 执行

      // 方法1：尝试使用 rpc
      const { error } = await supabase.rpc('exec_sql', { query: statement });

      if (error) {
        // 如果 exec_sql 不存在，尝试其他方法
        if (error.message.includes('function') && error.message.includes('does not exist')) {
          console.log('   ⚠️ exec_sql 函数不存在，尝试直接执行...');

          // 对于 CREATE FUNCTION 和 CREATE TABLE，我们需要通过 HTTP API
          // Supabase 提供了 /query/v1 端点（如果启用）
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': serviceRoleKey,
              'Authorization': `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({ query: statement }),
          });

          if (!response.ok) {
            const text = await response.text();
            console.log(`   ❌ 失败: ${text.substring(0, 100)}`);
            failed++;
            continue;
          }
        } else {
          console.log(`   ❌ 失败: ${error.message}`);
          failed++;
          continue;
        }
      }

      console.log('   ✅ 成功');
      success++;
    } catch (e: any) {
      console.log(`   ❌ 异常: ${e.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 执行结果');
  console.log('='.repeat(50));
  console.log(`   ✅ 成功: ${success}`);
  console.log(`   ❌ 失败: ${failed}`);
  console.log('');

  if (failed > 0) {
    console.log('⚠️ 部分语句执行失败，可能需要手动执行');
    console.log('');
    console.log('请在 Supabase SQL Editor 中手动执行以下文件:');
    console.log(`   ${migrationFile}`);
  }
}

executeMigration().catch(console.error);
