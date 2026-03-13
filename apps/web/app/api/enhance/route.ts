/**
 * 升级任务 API
 *
 * POST /api/enhance - 创建升级任务
 *
 * 支持两种模式：
 * 1. 新效果系统：effectId + effectIntensity（推荐）
 * 2. 旧风格系统：styleSource.type='preset' + styleSource.presetStyle（向后兼容）
 *
 * 额度系统：
 * - 登录用户：使用 Supabase 数据库
 * - 匿名用户：使用文件系统
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTaskQueue, type Task } from '@/lib/task-queue';
import { processEnhancement } from '@/lib/workflow';
import { validateEnhanceRequest, type PresetStyle } from '@/lib/validations';
import { spendCredits, refundCredits, getAvailableCredits } from '@/lib/credits';
import { getEffectById } from '@/lib/effect-presets';
import { createClient } from '@/lib/supabase/server';
import type { ContentType } from '@/lib/content-types';
import fs from 'fs';
import path from 'path';

// 预估处理时间（秒）
const ESTIMATED_TIME = {
  image: 30,
  video: 120,
} as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 支持新效果系统参数（可选）
    const effectId = body.effectId as string | undefined;
    const effectIntensity = body.effectIntensity as number | undefined;

    // 验证 effectId（如果提供）
    if (effectId) {
      const effect = getEffectById(effectId);
      if (!effect) {
        return NextResponse.json(
          { success: false, error: `Invalid effectId: ${effectId}` },
          { status: 400 }
        );
      }
      // 验证 effectIntensity 范围
      if (effectIntensity !== undefined && (effectIntensity < 0 || effectIntensity > 100)) {
        return NextResponse.json(
          { success: false, error: 'effectIntensity must be between 0 and 100' },
          { status: 400 }
        );
      }
    }

    // 使用 Zod 验证输入（兼容旧 API）
    const validation = validateEnhanceRequest(body);
    if (!validation.success) {
      const errorResult = validation as { success: false; error: string };
      return NextResponse.json(
        { success: false, error: errorResult.error },
        { status: 400 }
      );
    }

    const { content, styleSource, anonymousId, quality } = validation.data;

    // 检查是否登录用户
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 获取额度信息
    let creditsInfo: { total: number; paid: number; free: number };
    let useSupabaseCredits = false;

    if (user) {
      // 登录用户：从 Supabase 获取额度
      useSupabaseCredits = true;
      const { data: userCredit } = await supabase
        .from('user_credits')
        .select('balance, free_credits_used_this_month')
        .eq('user_id', user.id)
        .single();

      const balance = userCredit?.balance || 0;
      const freeCreditsUsed = userCredit?.free_credits_used_this_month || 0;
      const freeCreditsLimit = 8;
      const freeCreditsRemaining = Math.max(0, freeCreditsLimit - freeCreditsUsed);
      creditsInfo = { total: balance + freeCreditsRemaining, paid: balance, free: freeCreditsRemaining };

      console.log('[Enhance API] Logged in user:', user.id, 'credits:', creditsInfo);

      if (creditsInfo.total < 1) {
        return NextResponse.json(
          {
            success: false,
            error: '额度不足',
            credits: creditsInfo,
          },
          { status: 429 }
        );
      }
    } else {
      // 匿名用户：从文件系统获取额度
      const available = getAvailableCredits(anonymousId);
      creditsInfo = {
        total: available.total,
        paid: available.paid,
        free: available.free,
      };

      console.log('[Enhance API] Anonymous user:', anonymousId, 'credits:', creditsInfo);

      if (creditsInfo.total < 1) {
        return NextResponse.json(
          {
            success: false,
            error: '额度不足',
            credits: creditsInfo,
          },
          { status: 429 }
        );
      }
    }

    // 检查并发限制
    const taskQueue = getTaskQueue();
    if (!taskQueue.canStartProcessing()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Server busy. Please try again later.',
          retryAfter: 30,
        },
        { status: 503 }
      );
    }

    // 验证文件存在性（本地文件）
    if (content.url.startsWith('/uploads/')) {
      const publicDir = path.join(process.cwd(), 'public');
      const filePath = path.join(publicDir, content.url);

      if (!fs.existsSync(filePath)) {
        return NextResponse.json(
          { success: false, error: '文件不存在，请重新上传' },
          { status: 400 }
        );
      }
    }

    // 扣除额度
    if (useSupabaseCredits && user) {
      // 登录用户：使用新的 spend_user_credits RPC 扣除额度
      const { data: spendResult, error: spendError } = await supabase.rpc('spend_user_credits', {
        p_user_id: user.id,
        p_amount: 1,
        p_description: `生成${content.type === 'image' ? '图片' : '视频'}`,
        p_task_id: null,
      });

      if (spendError || !spendResult?.success) {
        console.error('[Enhance API] Supabase spend error:', spendError, spendResult);
        return NextResponse.json(
          {
            success: false,
            error: spendResult?.error || '额度扣除失败',
            credits: creditsInfo,
          },
          { status: spendResult?.error === 'insufficient_balance' ? 429 : 500 }
        );
      }

      // 更新 creditsInfo
      creditsInfo.total = spendResult.balance + spendResult.free_remaining;
      creditsInfo.paid = spendResult.balance;
      creditsInfo.free = spendResult.free_remaining;
      console.log('[Enhance API] Supabase credits spent:', {
        paid_spent: spendResult.paid_spent,
        free_spent: spendResult.free_spent,
        new_balance: spendResult.balance,
        free_remaining: spendResult.free_remaining,
      });
    } else {
      // 匿名用户：使用文件系统扣除额度
      const spendResult = spendCredits({
        anonymousId,
        amount: 1,
        description: `生成${content.type === 'image' ? '图片' : '视频'}`,
      });

      if (!spendResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: spendResult.error || '额度不足',
            credits: getAvailableCredits(anonymousId),
          },
          { status: 429 }
        );
      }

      creditsInfo.total = spendResult.newBalance;
      console.log('[Enhance API] File credits spent, new total:', creditsInfo.total);
    }

    // 创建任务
    const taskInput: Task['input'] = {
      contentType: content.type,
      contentUrl: content.url,
      styleSourceType: styleSource.type,
      presetStyle: styleSource.type === 'preset' ? styleSource.presetStyle : undefined,
      referenceUrl: styleSource.type === 'reference' ? styleSource.referenceUrl : undefined,
      anonymousId,
      // 新效果系统参数
      effectId,
      effectIntensity: effectIntensity ?? 100,
      quality, // 加入 quality 支持
    };

    const task = taskQueue.create(taskInput);

    // 异步执行任务
    executeTaskAsync(task, useSupabaseCredits, user?.id).catch((error) => {
      console.error(`[Enhance API] Unhandled error in task ${task.id}:`, error);
      try {
        taskQueue.fail(task.id, 'Internal server error');
        // 退回额度
        if (useSupabaseCredits && user) {
          refundSupabaseCredits(user.id, 1, '任务执行失败');
        } else {
          refundCredits(anonymousId, 1, '任务执行失败');
        }
        console.log(`[Enhance API] Refunded 1 credit for task ${task.id}`);
      } catch (cleanupError) {
        console.error(`[Enhance API] Failed to cleanup task ${task.id}:`, cleanupError);
      }
    });

    return NextResponse.json({
      success: true,
      taskId: task.id,
      estimatedTime: ESTIMATED_TIME[content.type],
      credits: creditsInfo,
    });
  } catch (error) {
    console.error('[Enhance API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create task. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * 退回 Supabase 额度
 */
async function refundSupabaseCredits(userId: string, amount: number, reason: string): Promise<void> {
  const supabase = await createClient();
  const { data: refundResult, error } = await supabase.rpc('refund_user_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_description: `退回额度: ${reason}`,
  });

  if (error || !refundResult?.success) {
    console.error('[Enhance API] Supabase refund error:', error, refundResult);
    throw error || new Error(refundResult?.error || 'Refund failed');
  }

  console.log('[Enhance API] Supabase refund success, new balance:', refundResult.balance);
}

/**
 * 异步执行任务
 */
async function executeTaskAsync(
  task: Task,
  useSupabaseCredits: boolean,
  userId?: string
): Promise<void> {
  console.log(`[Enhance API] Starting async execution for task ${task.id}`);
  const taskQueue = getTaskQueue();

  try {
    // 开始处理
    const started = taskQueue.startProcessing(task.id);
    if (!started) {
      console.warn(`[Enhance API] Could not start task ${task.id} - concurrent limit reached`);
      // 退回额度
      if (useSupabaseCredits && userId) {
        await refundSupabaseCredits(userId, 1, '服务器繁忙');
      } else {
        refundCredits(task.input.anonymousId, 1, '服务器繁忙');
      }
      taskQueue.fail(task.id, 'Server busy');
      return;
    }
    console.log(`[Enhance API] Task ${task.id} marked as processing`);

    // 获取效果配置
    let presetStyle: PresetStyle = 'magazine'; // 默认值

    // 优先使用新的效果系统
    if (task.input.effectId) {
      const effect = getEffectById(task.input.effectId);
      if (effect) {
        const styleMatch = task.input.effectId.match(/-(magazine|soft|urban|vintage)$/);
        if (styleMatch) {
          presetStyle = styleMatch[1] as PresetStyle;
        }
        console.log(`[Enhance API] Using effect: ${task.input.effectId}, style: ${presetStyle}`);
      }
    } else if (task.input.presetStyle) {
      presetStyle = task.input.presetStyle as PresetStyle;
      console.log(`[Enhance API] Using legacy style: ${presetStyle}`);
    }

    // 执行升级工作流
    console.log(`[Enhance API] Executing enhancement for task ${task.id}`);
    const result = await processEnhancement({
      contentType: task.input.contentType,
      contentUrl: task.input.contentUrl,
      styleSourceType: task.input.styleSourceType,
      presetStyle,
      referenceUrl: task.input.referenceUrl,
      effectId: task.input.effectId,
      effectIntensity: task.input.effectIntensity ?? 100,
      quality: task.input.quality ?? '1K',
      onProgress: (progress, stage) => {
        taskQueue.updateProgress(task.id, progress, stage);
      },
    });

    // 完成
    console.log(`[Enhance API] Task ${task.id} completed successfully`);
    taskQueue.complete(task.id, result);
  } catch (error) {
    console.error(`[Enhance API] Task ${task.id} failed:`, error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    taskQueue.fail(task.id, errorMessage);

    // 退回额度
    try {
      if (useSupabaseCredits && userId) {
        await refundSupabaseCredits(userId, 1, `任务失败: ${errorMessage}`);
      } else {
        refundCredits(task.input.anonymousId, 1, `任务失败: ${errorMessage}`);
      }
      console.log(`[Enhance API] Refunded 1 credit for failed task ${task.id}`);
    } catch (refundError) {
      console.error(`[Enhance API] Error refunding credit:`, refundError);
    }
  }
}
