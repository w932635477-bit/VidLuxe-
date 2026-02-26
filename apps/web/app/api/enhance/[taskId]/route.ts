/**
 * 任务状态查询 API
 *
 * GET /api/enhance/:taskId - 查询任务状态
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTaskQueue } from '@/lib/task-queue';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'Missing taskId' },
        { status: 400 }
      );
    }

    const taskQueue = getTaskQueue();
    const task = taskQueue.get(taskId);

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // 构建响应
    const response: any = {
      taskId: task.id,
      status: task.status,
      progress: task.progress,
      currentStage: task.currentStage,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };

    // 如果完成，包含结果
    if (task.status === 'completed' && task.result) {
      response.result = task.result;
    }

    // 如果失败，包含错误信息
    if (task.status === 'failed') {
      response.error = task.error;
    }

    return NextResponse.json({
      success: true,
      ...response,
    });
  } catch (error) {
    console.error('[Task Status API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get task status' },
      { status: 500 }
    );
  }
}
