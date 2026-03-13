/**
 * 发送邮箱验证邮件 API
 * 用户可以主动请求发送验证邮件
 */
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 获取当前用户
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      )
    }

    // 检查邮箱是否已验证
    if (user.email_confirmed_at) {
      return NextResponse.json(
        { error: '邮箱已验证', verified: true },
        { status: 400 }
      )
    }

    // 发送验证邮件
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://vidluxe.com.cn'
    const { error: sendError } = await supabase.auth.resend({
      type: 'signup',
      email: user.email!,
      options: {
        emailRedirectTo: `${baseUrl}/api/auth/callback?verified=true`,
      },
    })

    if (sendError) {
      console.error('[Send Verification] Error:', sendError)
      return NextResponse.json(
        { error: sendError.message },
        { status: 500 }
      )
    }

    console.log('[Send Verification] Success:', user.email)

    return NextResponse.json({
      success: true,
      message: '验证邮件已发送，请检查收件箱',
    })
  } catch (error) {
    console.error('[Send Verification] Exception:', error)
    return NextResponse.json(
      { error: '发送失败，请稍后重试' },
      { status: 500 }
    )
  }
}
