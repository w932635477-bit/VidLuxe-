/**
 * Supabase Auth 回调路由
 * 处理 OAuth 回调和魔法链接验证
 */
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/try'
  const verified = searchParams.get('verified') === 'true' // 是否是邮箱验证回调

  // 创建响应对象，添加缓存控制头
  const createResponse = (url: string) => {
    const response = NextResponse.redirect(url)
    // 防止 CDN 缓存认证响应（安全关键）
    response.headers.set('Cache-Control', 'private, no-store, no-cache, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    return response
  }

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // 如果是邮箱验证回调，发放奖励额度
      if (verified && data.user.email_confirmed_at) {
        try {
          // 调用额度 API 发放奖励
          const creditsResponse = await fetch(`${origin}/api/auth/verify-reward`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: data.user.id,
              email: data.user.email,
            }),
          })

          if (creditsResponse.ok) {
            console.log('[Auth Callback] Verification reward granted:', data.user.email)
            // 重定向到 /try 页面并显示成功提示
            return createResponse(`${origin}/try?verified=success`)
          }
        } catch (rewardError) {
          console.error('[Auth Callback] Reward error:', rewardError)
          // 即使奖励失败，也继续正常流程
        }
      }

      // 成功后重定向到目标页面
      console.log('[Auth Callback] Success - redirecting to:', next)
      return createResponse(`${origin}${next}`)
    }

    // 记录错误详情
    console.error('[Auth Callback] Error:', {
      message: error.message,
      status: error.status,
      code: error.code,
    })

    // 返回带错误详情的登录页
    const errorParam = error.code || 'auth_callback_error'
    return createResponse(`${origin}/auth?error=${errorParam}`)
  }

  // 缺少 code 参数
  console.warn('[Auth Callback] Missing code parameter')
  return createResponse(`${origin}/auth?error=missing_code`)
}
