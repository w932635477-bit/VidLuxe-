/**
 * 邮箱验证奖励 API
 * 验证成功后发放额度奖励
 */
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { userId, email } = await request.json()

    if (!userId || !email) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 使用 service_role_key 操作数据库
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 检查用户是否已经领取过验证奖励
    const { data: existingReward } = await supabase
      .from('credit_transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'email_verification_reward')
      .single()

    if (existingReward) {
      console.log('[Verify Reward] Already claimed:', email)
      return NextResponse.json({
        success: false,
        message: '已经领取过验证奖励',
      })
    }

    // 发放 5 次免费额度
    const rewardAmount = 5

    // 1. 更新用户额度
    const { data: currentCredits } = await supabase
      .from('user_credits')
      .select('balance, total_earned')
      .eq('user_id', userId)
      .single()

    if (currentCredits) {
      // 用户已有额度记录，更新
      await supabase
        .from('user_credits')
        .update({
          balance: currentCredits.balance + rewardAmount,
          total_earned: currentCredits.total_earned + rewardAmount,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
    } else {
      // 用户没有额度记录，创建
      await supabase
        .from('user_credits')
        .insert({
          user_id: userId,
          balance: rewardAmount,
          total_earned: rewardAmount,
          total_spent: 0,
        })
    }

    // 2. 记录交易
    await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        type: 'email_verification_reward',
        amount: rewardAmount,
        balance_after: (currentCredits?.balance || 0) + rewardAmount,
        description: '邮箱验证奖励',
      })

    console.log('[Verify Reward] Granted:', {
      userId,
      email,
      amount: rewardAmount,
    })

    return NextResponse.json({
      success: true,
      amount: rewardAmount,
      message: `恭喜！获得 ${rewardAmount} 次免费额度`,
    })
  } catch (error) {
    console.error('[Verify Reward] Error:', error)
    return NextResponse.json(
      { error: '发放奖励失败' },
      { status: 500 }
    )
  }
}
