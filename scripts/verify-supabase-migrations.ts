/**
 * Supabase 迁移验证脚本
 * 检查支付系统所需的表和函数是否存在
 *
 * 运行方式: npx tsx scripts/verify-supabase-migrations.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '../apps/web/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ 缺少 Supabase 环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface CheckResult {
  name: string;
  type: 'table' | 'function';
  exists: boolean;
  error?: string;
}

async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(tableName)
      .select('id')
      .limit(1);

    // 如果错误是"关系不存在"，则表不存在
    if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
      return false;
    }
    // 其他错误（如权限）可能意味着表存在
    return !error || error.code !== '42P01';
  } catch (e) {
    return false;
  }
}

async function checkFunctionExists(functionName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc(functionName, {
      p_user_id: 'test-check',
      p_amount: 0
    });

    // 如果函数不存在，会返回特定错误
    if (error?.message?.includes('function') && error?.message?.includes('does not exist')) {
      return false;
    }
    // 函数存在（即使参数错误也说明函数存在）
    return true;
  } catch (e) {
    return false;
  }
}

async function checkFunctionExistsViaSQL(functionName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `SELECT proname FROM pg_proc WHERE proname = '${functionName}'`
    });

    if (error) {
      // 如果exec_sql不存在，尝试直接调用目标函数
      return checkFunctionExists(functionName);
    }

    return data && data.length > 0;
  } catch (e) {
    // 回退到直接调用检查
    return checkFunctionExists(functionName);
  }
}

async function main() {
  console.log('🔍 Supabase 迁移验证脚本\n');
  console.log(`📍 项目: ${supabaseUrl}\n`);

  const results: CheckResult[] = [];

  // ============================================
  // 1. 检查表是否存在
  // ============================================
  console.log('📋 检查表...');

  const tables = [
    'payment_orders',
    'payment_transactions',
    'user_credits',
    'credit_transactions',
    'webhook_events'
  ];

  for (const table of tables) {
    const exists = await checkTableExists(table);
    results.push({ name: table, type: 'table', exists });
    console.log(`   ${exists ? '✅' : '❌'} ${table}`);
  }

  // ============================================
  // 2. 检查函数是否存在
  // ============================================
  console.log('\n⚡ 检查函数...');

  const functions = [
    'increment_credits',
    'consume_credits'
  ];

  for (const func of functions) {
    const exists = await checkFunctionExists(func);
    results.push({ name: func, type: 'function', exists });
    console.log(`   ${exists ? '✅' : '❌'} ${func}()`);
  }

  // ============================================
  // 3. 检查 user_credits 表结构
  // ============================================
  console.log('\n📊 检查 user_credits 表结构...');

  try {
    const { data, error } = await supabase
      .from('user_credits')
      .select('user_id, balance, total_earned, total_spent')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        console.log('   ❌ user_credits 表不存在');
      } else {
        console.log(`   ⚠️ 无法查询: ${error.message}`);
      }
    } else {
      console.log('   ✅ user_credits 表结构正确');
    }
  } catch (e: any) {
    console.log(`   ❌ 检查失败: ${e.message}`);
  }

  // ============================================
  // 4. 汇总结果
  // ============================================
  console.log('\n' + '='.repeat(50));
  console.log('📊 验证结果汇总');
  console.log('='.repeat(50));

  const tablesOk = results.filter(r => r.type === 'table' && r.exists).length;
  const tablesTotal = results.filter(r => r.type === 'table').length;
  const functionsOk = results.filter(r => r.type === 'function' && r.exists).length;
  const functionsTotal = results.filter(r => r.type === 'function').length;

  console.log(`\n   表: ${tablesOk}/${tablesTotal} ✅`);
  console.log(`   函数: ${functionsOk}/${functionsTotal} ✅`);

  const allOk = tablesOk === tablesTotal && functionsOk === functionsTotal;

  if (allOk) {
    console.log('\n🎉 所有迁移已完成！支付系统可以正常工作。');
  } else {
    console.log('\n⚠️ 部分迁移未完成，需要执行以下步骤：\n');

    const missingTables = results.filter(r => r.type === 'table' && !r.exists);
    const missingFunctions = results.filter(r => r.type === 'function' && !r.exists);

    if (missingTables.length > 0 || missingFunctions.length > 0) {
      console.log('   请在 Supabase SQL Editor 中执行：\n');

      if (missingTables.some(t => ['payment_orders', 'payment_transactions', 'user_credits', 'credit_transactions'].includes(t.name))) {
        console.log('   1. supabase/migrations/001_payment_tables.sql');
      }
      if (missingTables.some(t => t.name === 'webhook_events') || missingFunctions.length > 0) {
        console.log('   2. supabase/migrations/003_atomic_credits_functions.sql');
      }
    }
  }

  console.log('');
}

main().catch(console.error);
