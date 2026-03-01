/**
 * 任务队列模块
 *
 * MVP 阶段：内存存储 + 文件备份（服务重启可恢复）
 * 生产阶段：可切换到 Redis
 *
 * 改进：
 * - 使用全局变量解决 Next.js HMR 问题
 * - 添加数据验证
 * - 改进错误处理
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// 任务状态
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

// 任务结果
export interface TaskResult {
  type: 'image' | 'video';
  enhancedUrl: string;
  originalUrl: string;
  score?: {
    overall: number;
    grade: string;
    dimensions: {
      visualAttraction: number;    // 视觉吸引力
      contentMatch: number;        // 内容匹配度
      authenticity: number;        // 真实可信度
      emotionalImpact: number;     // 情绪感染力
      actionGuidance: number;      // 行动引导力
    };
  };
}

// 任务
export interface Task {
  id: string;
  status: TaskStatus;
  progress: number; // 0-100
  currentStage?: string;
  error?: string;
  result?: TaskResult;
  createdAt: number;
  updatedAt: number;
  // 任务输入
  input: {
    contentType: 'image' | 'video';
    contentUrl: string;
    styleSourceType: 'reference' | 'preset';
    presetStyle?: string;
    referenceUrl?: string;
    anonymousId: string;
    // 新效果系统参数（可选）
    effectId?: string;
    effectIntensity?: number; // 0-100
  };
}

// 配置常量
const TASK_CONFIG = {
  // 备份文件路径
  backupPath: process.env.TASK_BACKUP_PATH || './data/tasks.json',
  // 任务超时时间（毫秒）
  timeout: 10 * 60 * 1000, // 10 分钟
  // 备份间隔（毫秒）
  backupInterval: 5 * 1000, // 5 秒
  // 清理间隔（毫秒）
  cleanupInterval: 60 * 1000, // 1 分钟
  // 任务保留时间（毫秒）
  taskRetention: 2 * 60 * 60 * 1000, // 2 小时
  // 最大并发任务数
  maxConcurrent: 5,
} as const;

/**
 * 验证任务数据格式
 */
function validateTask(data: unknown): data is Task {
  if (typeof data !== 'object' || data === null) return false;
  const task = data as Record<string, unknown>;

  return (
    typeof task.id === 'string' &&
    ['pending', 'processing', 'completed', 'failed'].includes(task.status as string) &&
    typeof task.progress === 'number' &&
    typeof task.createdAt === 'number' &&
    typeof task.updatedAt === 'number' &&
    typeof task.input === 'object'
  );
}

/**
 * 任务队列类
 */
export class TaskQueue {
  private tasks: Map<string, Task> = new Map();
  private backupPath: string;
  private backupTimer?: NodeJS.Timeout;
  private cleanupTimer?: NodeJS.Timeout;
  private processingCount: number = 0;
  private isShuttingDown: boolean = false;

  constructor() {
    this.backupPath = path.resolve(process.cwd(), TASK_CONFIG.backupPath);
    this.ensureBackupDir();
    this.loadFromBackup();
    this.startBackupTimer();
    this.startCleanupTimer();

    // 注册进程退出处理
    process.on('beforeExit', () => this.handleShutdown());
  }

  // 处理关闭
  private handleShutdown(): void {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;
    this.stop();
  }

  // 确保备份目录存在
  private ensureBackupDir(): void {
    const dir = path.dirname(this.backupPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // 从备份加载（带数据验证）
  private loadFromBackup(): void {
    try {
      if (fs.existsSync(this.backupPath)) {
        const rawData = fs.readFileSync(this.backupPath, 'utf-8');
        const data = JSON.parse(rawData);
        const now = Date.now();

        let loadedCount = 0;
        let skippedCount = 0;

        // 验证并加载每个任务
        for (const [id, taskData] of Object.entries(data)) {
          if (!validateTask(taskData)) {
            console.warn(`[TaskQueue] Invalid task data for ${id}, skipping`);
            skippedCount++;
            continue;
          }

          // 只加载未过期的任务
          if (now - taskData.createdAt < TASK_CONFIG.taskRetention) {
            this.tasks.set(id, taskData);
            loadedCount++;

            // 统计正在处理的任务
            if (taskData.status === 'processing') {
              this.processingCount++;
            }
          }
        }

        console.log(`[TaskQueue] Loaded ${loadedCount} tasks from backup, skipped ${skippedCount} invalid`);
      }
    } catch (error) {
      console.error('[TaskQueue] Failed to load backup:', error);
      // 备份损坏时，创建空文件
      this.saveToBackup();
    }
  }

  // 保存到备份
  private saveToBackup(): void {
    try {
      const data: Record<string, Task> = {};
      this.tasks.forEach((value, key) => {
        data[key] = value;
      });
      fs.writeFileSync(this.backupPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('[TaskQueue] Failed to save backup:', error);
    }
  }

  // 启动备份定时器
  private startBackupTimer(): void {
    // 只在非 serverless 环境启动定时器
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      return;
    }

    this.backupTimer = setInterval(() => {
      if (!this.isShuttingDown) {
        this.saveToBackup();
      }
    }, TASK_CONFIG.backupInterval);

    // 允许进程退出
    this.backupTimer.unref();
  }

  // 启动清理定时器
  private startCleanupTimer(): void {
    // 只在非 serverless 环境启动定时器
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      return;
    }

    this.cleanupTimer = setInterval(() => {
      if (!this.isShuttingDown) {
        this.cleanup();
      }
    }, TASK_CONFIG.cleanupInterval);

    this.cleanupTimer.unref();
  }

  // 清理过期任务
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    const toDelete: string[] = [];

    this.tasks.forEach((task, id) => {
      // 删除已完成/失败且过期的任务
      if (
        (task.status === 'completed' || task.status === 'failed') &&
        now - task.createdAt > TASK_CONFIG.taskRetention
      ) {
        toDelete.push(id);
        cleaned++;
      }
      // 标记超时任务为失败
      else if (
        task.status === 'processing' &&
        now - task.createdAt > TASK_CONFIG.timeout
      ) {
        task.status = 'failed';
        task.error = 'Task timeout';
        task.updatedAt = now;
        this.processingCount = Math.max(0, this.processingCount - 1);
        cleaned++;
      }
    });

    toDelete.forEach((id) => this.tasks.delete(id));

    if (cleaned > 0) {
      console.log(`[TaskQueue] Cleaned ${cleaned} tasks`);
      this.saveToBackup();
    }
  }

  /**
   * 检查是否可以开始处理新任务
   */
  canStartProcessing(): boolean {
    return this.processingCount < TASK_CONFIG.maxConcurrent;
  }

  /**
   * 创建新任务
   */
  create(input: Task['input']): Task {
    const task: Task = {
      id: `task_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      status: 'pending',
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      input,
    };

    this.tasks.set(task.id, task);
    this.saveToBackup();
    return task;
  }

  /**
   * 获取任务
   */
  get(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * 更新任务状态
   */
  update(
    taskId: string,
    updates: Partial<Pick<Task, 'status' | 'progress' | 'currentStage' | 'error' | 'result'>>
  ): Task | undefined {
    const task = this.tasks.get(taskId);
    if (!task) return undefined;

    // 更新处理计数
    if (updates.status) {
      if (task.status === 'processing' && updates.status !== 'processing') {
        this.processingCount = Math.max(0, this.processingCount - 1);
      } else if (task.status !== 'processing' && updates.status === 'processing') {
        this.processingCount++;
      }
    }

    Object.assign(task, updates, { updatedAt: Date.now() });
    this.tasks.set(taskId, task);

    // 状态变化时立即保存
    if (updates.status || updates.result) {
      this.saveToBackup();
    }

    return task;
  }

  /**
   * 开始处理任务
   */
  startProcessing(taskId: string): Task | undefined {
    if (!this.canStartProcessing()) {
      console.warn(`[TaskQueue] Max concurrent tasks reached, cannot start ${taskId}`);
      return undefined;
    }
    return this.update(taskId, {
      status: 'processing',
      progress: 0,
    });
  }

  /**
   * 更新进度
   */
  updateProgress(taskId: string, progress: number, stage?: string): Task | undefined {
    return this.update(taskId, {
      progress: Math.min(100, Math.max(0, progress)),
      currentStage: stage,
    });
  }

  /**
   * 标记完成
   */
  complete(taskId: string, result: TaskResult): Task | undefined {
    console.log(`[TaskQueue] Marking task ${taskId} as completed`);
    const task = this.update(taskId, {
      status: 'completed',
      progress: 100,
      result,
    });
    this.saveToBackup();
    return task;
  }

  /**
   * 标记失败
   */
  fail(taskId: string, error: string): Task | undefined {
    console.log(`[TaskQueue] Marking task ${taskId} as failed: ${error}`);
    const task = this.update(taskId, {
      status: 'failed',
      error,
    });
    this.saveToBackup();
    return task;
  }

  /**
   * 删除任务
   */
  delete(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (task?.status === 'processing') {
      this.processingCount = Math.max(0, this.processingCount - 1);
    }

    const deleted = this.tasks.delete(taskId);
    if (deleted) {
      this.saveToBackup();
    }
    return deleted;
  }

  /**
   * 获取任务统计
   */
  getStats(): {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    processingCount: number;
  } {
    let pending = 0;
    let processing = 0;
    let completed = 0;
    let failed = 0;

    this.tasks.forEach((task) => {
      switch (task.status) {
        case 'pending':
          pending++;
          break;
        case 'processing':
          processing++;
          break;
        case 'completed':
          completed++;
          break;
        case 'failed':
          failed++;
          break;
      }
    });

    return {
      total: this.tasks.size,
      pending,
      processing,
      completed,
      failed,
      processingCount: this.processingCount,
    };
  }

  /**
   * 停止定时器
   */
  stop(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = undefined;
    }
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    this.saveToBackup();
  }
}

// 使用全局变量保持跨请求持久化（解决 Next.js HMR 问题）
declare global {
  // eslint-disable-next-line no-var
  var taskQueueGlobal: TaskQueue | undefined;
}

export function getTaskQueue(): TaskQueue {
  if (!global.taskQueueGlobal) {
    global.taskQueueGlobal = new TaskQueue();
  }
  return global.taskQueueGlobal;
}
