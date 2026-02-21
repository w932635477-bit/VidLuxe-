/**
 * 任务队列模块
 *
 * MVP 阶段：内存存储 + 文件备份（服务重启可恢复）
 * 生产阶段：可切换到 Redis
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
      color: number;
      composition: number;
      typography: number;
      detail: number;
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
  };
}

// 配置
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
};

/**
 * 任务队列类
 */
export class TaskQueue {
  private tasks: Map<string, Task> = new Map();
  private backupPath: string;
  private backupTimer?: NodeJS.Timeout;
  private cleanupTimer?: NodeJS.Timeout;

  constructor() {
    this.backupPath = path.resolve(process.cwd(), TASK_CONFIG.backupPath);
    this.ensureBackupDir();
    this.loadFromBackup();
    this.startBackupTimer();
    this.startCleanupTimer();
  }

  // 确保备份目录存在
  private ensureBackupDir(): void {
    const dir = path.dirname(this.backupPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // 从备份加载
  private loadFromBackup(): void {
    try {
      if (fs.existsSync(this.backupPath)) {
        const data = JSON.parse(fs.readFileSync(this.backupPath, 'utf-8'));
        const now = Date.now();

        // 只加载未过期的任务
        for (const task of Object.values(data) as Task[]) {
          if (now - task.createdAt < TASK_CONFIG.taskRetention) {
            this.tasks.set(task.id, task);
          }
        }

        console.log(`[TaskQueue] Loaded ${this.tasks.size} tasks from backup`);
      }
    } catch (error) {
      console.error('[TaskQueue] Failed to load backup:', error);
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
      console.log(`[TaskQueue] Saved ${Object.keys(data).length} tasks to backup`);
    } catch (error) {
      console.error('[TaskQueue] Failed to save backup:', error);
    }
  }

  // 启动备份定时器
  private startBackupTimer(): void {
    this.backupTimer = setInterval(() => {
      this.saveToBackup();
    }, TASK_CONFIG.backupInterval);
  }

  // 启动清理定时器
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, TASK_CONFIG.cleanupInterval);
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
    // 确保立即保存
    this.saveToBackup();
    console.log(`[TaskQueue] Task ${taskId} saved to backup`);
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
    // 确保立即保存
    this.saveToBackup();
    console.log(`[TaskQueue] Task ${taskId} saved to backup`);
    return task;
  }

  /**
   * 删除任务
   */
  delete(taskId: string): boolean {
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

    return { total: this.tasks.size, pending, processing, completed, failed };
  }

  /**
   * 停止定时器
   */
  stop(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
    }
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.saveToBackup();
  }
}

// 单例实例
let taskQueue: TaskQueue | null = null;

export function getTaskQueue(): TaskQueue {
  if (!taskQueue) {
    taskQueue = new TaskQueue();
  }
  return taskQueue;
}
