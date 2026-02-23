/**
 * 升级任务 API
 *
 * POST /api/enhance - 创建升级任务
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTaskQueue, type Task } from '@/lib/task-queue';
import { getQuotaManager } from '@/lib/quota';
import { processEnhancement } from '@/lib/workflow';
import { validateEnhanceRequest, type PresetStyle } from '@/lib/validations';

// 预估处理时间（秒）
const ESTIMATED_TIME = {
  image: 30,
  video: 120,
} as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 使用 Zod 验证输入
    const validation = validateEnhanceRequest(body);
    if (!validation.success) {
      const errorResult = validation as { success: false; error: string };
      return NextResponse.json(
        { success: false, error: errorResult.error },
        { status: 400 }
      );
    }

    const { content, styleSource, anonymousId } = validation.data;

    // 检查额度
    const quotaManager = getQuotaManager();
    if (!quotaManager.hasQuota(anonymousId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Quota exceeded',
          quota: quotaManager.getQuotaInfo(anonymousId),
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

    // 创建任务
    const task = taskQueue.create({
      contentType: content.type,
      contentUrl: content.url,
      styleSourceType: styleSource.type,
      presetStyle: styleSource.type === 'preset' ? styleSource.presetStyle : undefined,
      referenceUrl: styleSource.type === 'reference' ? styleSource.referenceUrl : undefined,
      anonymousId,
    });

    // 预扣额度
    const deducted = quotaManager.deduct(anonymousId);
    if (!deducted) {
      // 额度扣减失败（可能被并发请求消耗），删除任务
      taskQueue.delete(task.id);
      return NextResponse.json(
        {
          success: false,
          error: 'Quota exceeded',
          quota: quotaManager.getQuotaInfo(anonymousId),
        },
        { status: 429 }
      );
    }

    // 异步执行任务（带错误捕获）
    executeTaskAsync(task).catch((error) => {
      // 捕获未处理的异常，确保任务状态被更新
      console.error(`[Enhance API] Unhandled error in task ${task.id}:`, error);
      try {
        taskQueue.fail(task.id, 'Internal server error');
        quotaManager.refund(task.input.anonymousId);
      } catch (cleanupError) {
        console.error(`[Enhance API] Failed to cleanup task ${task.id}:`, cleanupError);
      }
    });

    return NextResponse.json({
      success: true,
      taskId: task.id,
      estimatedTime: ESTIMATED_TIME[content.type],
      quota: quotaManager.getQuotaInfo(anonymousId),
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
  const quotaManager = getQuotaManager();

  try {
    // 开始处理
    const started = taskQueue.startProcessing(task.id);
    if (!started) {
      console.warn(`[Enhance API] Could not start task ${task.id} - concurrent limit reached`);
      quotaManager.refund(task.input.anonymousId);
      taskQueue.fail(task.id, 'Server busy');
      return;
    }
    console.log(`[Enhance API] Task ${task.id} marked as processing`);

    // 执行升级工作流
    console.log(`[Enhance API] Executing enhancement workflow for task ${task.id}`);
    const result = await processEnhancement({
      contentType: task.input.contentType,
      contentUrl: task.input.contentUrl,
      styleSourceType: task.input.styleSourceType,
      presetStyle: task.input.presetStyle as PresetStyle,
      referenceUrl: task.input.referenceUrl,
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

    // 标记失败（返回通用错误给用户）
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    taskQueue.fail(task.id, errorMessage);

    // 退还额度
    const refunded = quotaManager.refund(task.input.anonymousId);
    if (!refunded) {
      console.warn(`[Enhance API] Failed to refund quota for task ${task.id}`);
    }
  }
}
