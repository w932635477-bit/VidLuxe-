/**
 * 文件存储模块
 *
 * MVP 阶段：使用本地文件系统
 * 生产阶段：切换到 Cloudflare R2 / AWS S3
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// 存储配置
const STORAGE_CONFIG = {
  // 本地存储路径
  localPath: process.env.STORAGE_LOCAL_PATH || './public/uploads',
  // R2 配置（生产环境）
  r2: {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucketName: process.env.R2_BUCKET_NAME,
    publicUrl: process.env.R2_PUBLIC_URL,
  },
  // 是否使用本地存储
  useLocal: process.env.STORAGE_USE_LOCAL !== 'false',
};

// 支持的文件类型
export type FileType = 'image' | 'video';

export interface UploadedFile {
  id: string;
  url: string;
  type: FileType;
  filename: string;
  mimetype: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number; // 视频时长（秒）
}

// 确保目录存在
function ensureDirectory(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 生成唯一文件 ID
function generateFileId(): string {
  return `file_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
}

// 获取文件扩展名
function getExtension(mimetype: string): string {
  const extensions: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'video/mp4': '.mp4',
    'video/quicktime': '.mov',
    'video/webm': '.webm',
  };
  return extensions[mimetype] || '';
}

// 检测文件类型
export function detectFileType(mimetype: string): FileType | null {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  return null;
}

/**
 * 文件存储类
 */
export class FileStorage {
  private basePath: string;

  constructor() {
    this.basePath = path.resolve(process.cwd(), STORAGE_CONFIG.localPath);
    ensureDirectory(this.basePath);
    ensureDirectory(path.join(this.basePath, 'images'));
    ensureDirectory(path.join(this.basePath, 'videos'));
  }

  /**
   * 保存文件
   */
  async saveFile(
    file: File | Buffer,
    options?: {
      filename?: string;
      mimetype?: string;
    }
  ): Promise<UploadedFile> {
    const fileId = generateFileId();
    let buffer: Buffer;
    let mimetype: string;
    let filename: string;

    if (file instanceof File) {
      buffer = Buffer.from(await file.arrayBuffer());
      mimetype = file.type;
      filename = file.name;
    } else {
      buffer = file;
      mimetype = options?.mimetype || 'application/octet-stream';
      filename = options?.filename || `${fileId}`;
    }

    const fileType = detectFileType(mimetype);
    if (!fileType) {
      throw new Error(`Unsupported file type: ${mimetype}`);
    }

    // 文件大小检查
    const maxSize = fileType === 'video' ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    if (buffer.length > maxSize) {
      throw new Error(`File too large. Max size: ${maxSize / 1024 / 1024}MB`);
    }

    // 保存文件
    const extension = getExtension(mimetype);
    const savedFilename = `${fileId}${extension}`;
    const subDir = fileType === 'image' ? 'images' : 'videos';
    const filePath = path.join(this.basePath, subDir, savedFilename);

    fs.writeFileSync(filePath, buffer);

    // 返回文件信息
    return {
      id: fileId,
      url: `/uploads/${subDir}/${savedFilename}`,
      type: fileType,
      filename: filename,
      mimetype: mimetype,
      size: buffer.length,
    };
  }

  /**
   * 保存来自 URL 的文件
   */
  async saveFromUrl(url: string): Promise<UploadedFile> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch file from URL: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const buffer = Buffer.from(await response.arrayBuffer());

    return this.saveFile(buffer, {
      mimetype: contentType,
      filename: url.split('/').pop() || 'downloaded',
    });
  }

  /**
   * 获取文件
   */
  getFile(relativePath: string): Buffer | null {
    const filePath = path.join(this.basePath, relativePath);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath);
    }
    return null;
  }

  /**
   * 删除文件
   */
  deleteFile(relativePath: string): boolean {
    const filePath = path.join(this.basePath, relativePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  }

  /**
   * 获取文件 URL
   */
  getUrl(relativePath: string): string {
    if (STORAGE_CONFIG.useLocal) {
      return relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
    }
    // R2 URL
    return `${STORAGE_CONFIG.r2.publicUrl}/${relativePath}`;
  }

  /**
   * 清理过期文件（可选）
   */
  async cleanupOldFiles(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<number> {
    let deletedCount = 0;
    const now = Date.now();

    const scanDir = (dir: string) => {
      if (!fs.existsSync(dir)) return;

      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          scanDir(filePath);
        } else if (now - stat.mtimeMs > maxAgeMs) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }
    };

    scanDir(this.basePath);
    return deletedCount;
  }
}

// 单例实例
let fileStorage: FileStorage | null = null;

export function getFileStorage(): FileStorage {
  if (!fileStorage) {
    fileStorage = new FileStorage();
  }
  return fileStorage;
}
