/**
 * 额度查询 API (v2 - Supabase)
 * GET /api/credits-v2
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    // 调用数据库函数获取额度信息
    const { data, error } = await supabase
      .rpc('get_available_credits', { p_user_id: user.id });

    if (error) {
      // 如果函数不存在（数据库还未迁移），返回默认值
      console.log('Database function not available, returning defaults');
      return NextResponse.json({
        balance: 0,
        free: 3,
        total: 3,
        note: '数据库尚未初始化，请先在 Supabase 中执行迁移脚本'
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Get credits error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
