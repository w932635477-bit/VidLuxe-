/**
 * Supabase Auth 回调路由
 * 处理 OAuth 回调和魔法链接验证
 */
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // 成功后重定向到目标页面
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // 出错时返回登录页并显示错误
  return NextResponse.redirect(`${origin}/auth?error=auth_callback_error`)
}
