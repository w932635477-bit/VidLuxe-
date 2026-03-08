/**
 * 任务状态查询 API
 *
 * GET /api/tasks/[taskId] - 查询任务状态
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
        { success: false, error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const taskQueue = getTaskQueue();
    // 强制从文件重新加载，解决多进程环境下状态不同步问题
    const task = taskQueue.get(taskId, true);

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      task: {
        id: task.id,
        status: task.status,
        progress: task.progress,
        currentStage: task.currentStage,
        error: task.error,
        result: task.result,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      },
    });
  } catch (error) {
    console.error('[Task Status API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get task status' },
      { status: 500 }
    );
  }
}
