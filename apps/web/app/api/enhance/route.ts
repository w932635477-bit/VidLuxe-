/**
 * 升级任务 API
 *
 * POST /api/enhance - 创建升级任务
 *
 * 支持两种模式：
 * 1. 新效果系统：effectId + effectIntensity（推荐）
 * 2. 旧风格系统：styleSource.type='preset' + styleSource.presetStyle（向后兼容）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTaskQueue, type Task } from '@/lib/task-queue';
import { processEnhancement } from '@/lib/workflow';
import { validateEnhanceRequest, type PresetStyle } from '@/lib/validations';
import { spendCredits, refundCredits, getAvailableCredits } from '@/lib/credits';
import { getFileStorage } from '@/lib/file-storage';
import { getEffectById, getEffectPrompt, convertStyleToEffect } from '@/lib/effect-presets';
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
    const contentType = body.contentType as ContentType | undefined;

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

    const { content, styleSource, anonymousId } = validation.data;

    // 检查额度（使用新的 credits 系统）
    const available = getAvailableCredits(anonymousId);
    if (available.total < 1) {
      return NextResponse.json(
        {
          success: false,
          error: '额度不足',
          credits: available,
        },
        { status: 429 }
      );
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

    // 扣除额度（使用新的 credits 系统）
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

    // 创建任务 - 支持新效果系统和旧风格系统
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
    };

    const task = taskQueue.create(taskInput);

    // 异步执行任务（带错误捕获和额度退回）
    executeTaskAsync(task).catch((error) => {
      // 捕获未处理的异常，确保任务状态被更新和额度退回
      console.error(`[Enhance API] Unhandled error in task ${task.id}:`, error);
      try {
        taskQueue.fail(task.id, 'Internal server error');
        // 退回额度
        refundCredits(anonymousId, 1, '任务执行失败');
        console.log(`[Enhance API] Refunded 1 credit for task ${task.id}`);
      } catch (cleanupError) {
        console.error(`[Enhance API] Failed to cleanup task ${task.id}:`, cleanupError);
      }
    });

    return NextResponse.json({
      success: true,
      taskId: task.id,
      estimatedTime: ESTIMATED_TIME[content.type],
      credits: getAvailableCredits(anonymousId),
    });
  } catch (error) {
    console.error('[Enhance API] Error:', error);

    // 返回通用错误信息（不泄露内部细节）
    return NextResponse.json(
      { success: false, error: 'Failed to create task. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * 异步执行任务
 */
async function executeTaskAsync(task: Task): Promise<void> {
  console.log(`[Enhance API] Starting async execution for task ${task.id}`);
  const taskQueue = getTaskQueue();

  try {
    // 开始处理
    const started = taskQueue.startProcessing(task.id);
    if (!started) {
      console.warn(`[Enhance API] Could not start task ${task.id} - concurrent limit reached`);
      // 退回额度
      refundCredits(task.input.anonymousId, 1, '服务器繁忙');
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
        // 从 effectId 提取 presetStyle（兼容旧系统）
        // 例如 'outfit-magazine' -> 'magazine'
        const styleMatch = task.input.effectId.match(/-(magazine|soft|urban|vintage)$/);
        if (styleMatch) {
          presetStyle = styleMatch[1] as PresetStyle;
        }
        console.log(`[Enhance API] Using effect system: ${task.input.effectId} (intensity: ${task.input.effectIntensity || 100}%), mapped to style: ${presetStyle}`);
      }
    } else if (task.input.presetStyle) {
      // 使用旧的风格系统
      presetStyle = task.input.presetStyle as PresetStyle;
      console.log(`[Enhance API] Using legacy style system: ${presetStyle}`);
    }

    // 执行升级工作流
    console.log(`[Enhance API] Executing enhancement workflow for task ${task.id}`);
    const result = await processEnhancement({
      contentType: task.input.contentType,
      contentUrl: task.input.contentUrl,
      styleSourceType: task.input.styleSourceType,
      presetStyle,
      referenceUrl: task.input.referenceUrl,
      // 传递新效果系统参数
      effectId: task.input.effectId,
      effectIntensity: task.input.effectIntensity ?? 100,
      onProgress: (progress, stage) => {
        taskQueue.updateProgress(task.id, progress, stage);
      },
    });

    // 完成
    console.log(`[Enhance API] Task ${task.id} completed successfully`);
    taskQueue.complete(task.id, result);
    console.log(`[Enhance API] Task ${task.id} marked as completed`);
  } catch (error) {
    // 记录详细错误到日志
    console.error(`[Enhance API] Task ${task.id} failed:`, error);

    // 标记失败
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    taskQueue.fail(task.id, errorMessage);

    // 退回额度
    try {
      const refundResult = refundCredits(task.input.anonymousId, 1, `任务失败: ${errorMessage}`);
      if (refundResult.success) {
        console.log(`[Enhance API] Refunded 1 credit for failed task ${task.id}`);
      } else {
        console.warn(`[Enhance API] Failed to refund credit for task ${task.id}`);
      }
    } catch (refundError) {
      console.error(`[Enhance API] Error refunding credit for task ${task.id}:`, refundError);
    }
  }
}
