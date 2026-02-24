/**
 * 额度消耗 API (v2 - Supabase)
 * POST /api/credits-v2/spend
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { amount, description, taskId } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: '请输入有效的消耗数量' }, { status: 400 });
    }

    // 调用数据库函数消耗额度
    const { data, error } = await supabase.rpc('spend_credits', {
      p_user_id: user.id,
      p_amount: amount,
      p_description: description || '使用额度',
      p_task_id: taskId || null,
    });

    if (error) {
      if (error.message.includes('额度不足')) {
        return NextResponse.json({
          success: false,
          error: '额度不足',
        }, { status: 400 });
      }

      console.error('Spend credits error:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      newBalance: data,
    });
  } catch (error) {
    console.error('Spend credits error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
