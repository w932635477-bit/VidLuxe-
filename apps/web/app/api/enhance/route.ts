/**
 * 升级任务 API
 *
 * POST /api/enhance - 创建升级任务
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTaskQueue, type Task } from '@/lib/task-queue';
import { getQuotaManager } from '@/lib/quota';
import { processEnhancement } from '@/lib/workflow';
import type { PresetStyle } from '@/lib/style-prompts';

// 请求参数
interface EnhanceRequest {
  content: {
    type: 'image' | 'video';
    url: string;
  };
  styleSource: {
    type: 'reference' | 'preset';
    referenceUrl?: string;
    presetStyle?: PresetStyle;
  };
  anonymousId: string;
}

// 预估处理时间（秒）
const ESTIMATED_TIME = {
  image: 30,
  video: 120,
};

export async function POST(request: NextRequest) {
  try {
    const body: EnhanceRequest = await request.json();
    const { content, styleSource, anonymousId } = body;

    // 参数验证
    if (!content?.url || !content?.type) {
      return NextResponse.json(
        { success: false, error: 'Missing content information' },
        { status: 400 }
      );
    }

    if (!['image', 'video'].includes(content.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid content type' },
        { status: 400 }
      );
    }

    if (!styleSource?.type) {
      return NextResponse.json(
        { success: false, error: 'Missing style source' },
        { status: 400 }
      );
    }

    if (!anonymousId) {
      return NextResponse.json(
        { success: false, error: 'Missing anonymous ID' },
        { status: 400 }
      );
    }

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

    // 创建任务
    const taskQueue = getTaskQueue();
    const task = taskQueue.create({
      contentType: content.type,
      contentUrl: content.url,
      styleSourceType: styleSource.type,
      presetStyle: styleSource.presetStyle,
      referenceUrl: styleSource.referenceUrl,
      anonymousId,
    });

    // 预扣额度
    quotaManager.deduct(anonymousId);

    // 异步执行任务
    executeTaskAsync(task);

    return NextResponse.json({
      success: true,
      taskId: task.id,
      estimatedTime: ESTIMATED_TIME[content.type],
      quota: quotaManager.getQuotaInfo(anonymousId),
    });
  } catch (error) {
    console.error('[Enhance API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create task' },
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
    taskQueue.startProcessing(task.id);
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
        console.log(`[Enhance API] Task ${task.id} progress: ${progress}% - ${stage}`);
        taskQueue.updateProgress(task.id, progress, stage);
      },
    });

    // 完成
    console.log(`[Enhance API] Task ${task.id} completed successfully`);
    taskQueue.complete(task.id, result);
    console.log(`[Enhance API] Task ${task.id} marked as completed`);
  } catch (error) {
    console.error(`[Enhance API] Task ${task.id} failed:`, error);

    // 标记失败
    taskQueue.fail(task.id, error instanceof Error ? error.message : 'Unknown error');

    // 退还额度
    quotaManager.refund(task.input.anonymousId);
  }
}
