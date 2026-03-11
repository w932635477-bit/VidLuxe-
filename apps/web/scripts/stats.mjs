#!/usr/bin/env node
/**
 * VidLuxe 数据统计脚本
 * 一键查询用户注册和使用数据
 *
 * 使用方法: node scripts/stats.mjs
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 手动加载 .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

// Supabase 配置
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ 请配置 Supabase 环境变量');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// 使用 service role key 获取完整数据访问权限
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 格式化日期
function formatDate(date) {
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 格式化数字
function formatNumber(num) {
  return num?.toLocaleString('zh-CN') || '0';
}

// 分隔线
function divider(char = '-', length = 50) {
  console.log(char.repeat(length));
}

// 主统计函数
async function getStats() {
  console.log('\n📊 VidLuxe 数据统计');
  divider('=', 50);
  console.log(`📅 查询时间: ${formatDate(new Date())}\n`);

  try {
    // 1. 用户统计
    console.log('👥 用户统计');
    divider();

    // 总用户数
    const { count: totalUsers, error: usersError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (usersError) throw usersError;

    // 今日新增
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: todayUsers, error: todayError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    if (todayError) throw todayError;

    // 本周新增
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const { count: weekUsers, error: weekError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekStart.toISOString());

    if (weekError) throw weekError;

    // 本月新增
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const { count: monthUsers, error: monthError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', monthStart.toISOString());

    if (monthError) throw monthError;

    console.log(`   总用户数:     ${formatNumber(totalUsers)}`);
    console.log(`   今日新增:     ${formatNumber(todayUsers)}`);
    console.log(`   本周新增:     ${formatNumber(weekUsers)}`);
    console.log(`   本月新增:     ${formatNumber(monthUsers)}`);

    // 2. 额度统计
    console.log('\n💰 额度统计');
    divider();

    const { data: creditStats, error: creditError } = await supabase
      .from('profiles')
      .select('credits_balance, total_credits_earned, total_credits_spent');

    if (creditError) throw creditError;

    const totalBalance = creditStats.reduce((sum, u) => sum + (u.credits_balance || 0), 0);
    const totalEarned = creditStats.reduce((sum, u) => sum + (u.total_credits_earned || 0), 0);
    const totalSpent = creditStats.reduce((sum, u) => sum + (u.total_credits_spent || 0), 0);

    console.log(`   用户余额总计: ${formatNumber(totalBalance)} 次`);
    console.log(`   累计获得:     ${formatNumber(totalEarned)} 次`);
    console.log(`   累计消耗:     ${formatNumber(totalSpent)} 次`);

    // 3. 交易统计
    console.log('\n📈 交易统计');
    divider();

    const { data: transactions, error: transError } = await supabase
      .from('credit_transactions')
      .select('type, amount');

    if (transError) throw transError;

    const transByType = transactions.reduce((acc, t) => {
      if (!acc[t.type]) {
        acc[t.type] = { count: 0, amount: 0 };
      }
      acc[t.type].count++;
      acc[t.type].amount += t.amount;
      return acc;
    }, {});

    const typeLabels = {
      'purchase': '购买',
      'invite_earned': '邀请奖励',
      'invite_bonus': '被邀请奖励',
      'free': '免费额度',
      'spend': '消耗'
    };

    for (const [type, data] of Object.entries(transByType)) {
      const label = typeLabels[type] || type;
      console.log(`   ${label}:       ${formatNumber(data.count)} 笔, ${formatNumber(data.amount)} 次`);
    }

    // 4. 支付统计
    console.log('\n💳 支付统计');
    divider();

    const { data: orders, error: ordersError } = await supabase
      .from('payment_orders')
      .select('status, amount');

    if (ordersError) throw ordersError;

    const paidOrders = orders.filter(o => o.status === 'paid');
    const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.amount || 0), 0);

    console.log(`   总订单数:     ${formatNumber(orders.length)} 笔`);
    console.log(`   已支付:       ${formatNumber(paidOrders.length)} 笔`);
    console.log(`   总收入:       ¥${formatNumber(totalRevenue / 100)}`);

    // 5. 最近用户
    console.log('\n🆕 最近 10 位用户');
    divider();

    const { data: recentUsers, error: recentError } = await supabase
      .from('profiles')
      .select('id, email, phone, created_at, credits_balance')
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentError) throw recentError;

    for (const user of recentUsers) {
      const contact = user.email || user.phone || '未知';
      const balance = user.credits_balance || 0;
      console.log(`   ${formatDate(user.created_at)} | ${contact.padEnd(25)} | 余额: ${balance}`);
    }

    console.log('\n');
    divider('=', 50);
    console.log('✅ 统计完成\n');

  } catch (error) {
    console.error('\n❌ 查询失败:', error.message);
    process.exit(1);
  }
}

// 运行
getStats();
