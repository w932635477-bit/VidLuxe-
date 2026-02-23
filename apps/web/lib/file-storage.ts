/**
 * 文件存储模块
 *
 * MVP 阶段：使用本地文件系统
 * 生产阶段：切换到 Cloudflare R2 / AWS S3
 *
 * 安全特性：
 * - 文件魔数验证（防止 MIME Type 伪造）
 * - 路径遍历防护
 * - SSRF 防护
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

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

// 文件大小限制（字节）
const FILE_SIZE_LIMITS = {
  image: 10 * 1024 * 1024, // 10MB
  video: 1024 * 1024 * 1024, // 1GB
} as const;

// 支持的文件类型
export type FileType = 'image' | 'video';

// 支持的 MIME 类型
const ALLOWED_MIME_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/webp'],
  video: ['video/mp4', 'video/quicktime', 'video/webm'],
} as const;

// 文件扩展名到 MIME 类型的映射
const EXTENSION_TO_MIME: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

// 文件魔数签名（用于验证真实文件类型）
const MAGIC_NUMBERS: Record<string, { bytes: number[]; offset: number; mimeType: string }> = {
  // JPEG: FF D8 FF
  jpeg: { bytes: [0xff, 0xd8, 0xff], offset: 0, mimeType: 'image/jpeg' },
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  png: { bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], offset: 0, mimeType: 'image/png' },
  // WebP: 52 49 46 46 ?? ?? ?? ?? 57 45 42 50
  webp: { bytes: [0x52, 0x49, 0x46, 0x46], offset: 0, mimeType: 'image/webp' },
  // MP4: ftyp at offset 4
  mp4: { bytes: [0x66, 0x74, 0x79, 0x70], offset: 4, mimeType: 'video/mp4' },
  // MOV: ftyp at offset 4
  mov: { bytes: [0x66, 0x74, 0x79, 0x70], offset: 4, mimeType: 'video/quicktime' },
  // WebM: 1A 45 DF A3
  webm: { bytes: [0x1a, 0x45, 0xdf, 0xa3], offset: 0, mimeType: 'video/webm' },
};

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

/**
 * 验证文件魔数（防止 MIME Type 伪造）
 */
function verifyMagicNumbers(buffer: Buffer): { valid: boolean; detectedMimetype?: string } {
  for (const [, signature] of Object.entries(MAGIC_NUMBERS)) {
    const { bytes, offset, mimeType } = signature;

    // 确保缓冲区足够长
    if (buffer.length < offset + bytes.length) {
      continue;
    }

    // 检查魔数是否匹配
    let matches = true;
    for (let i = 0; i < bytes.length; i++) {
      if (buffer[offset + i] !== bytes[i]) {
        matches = false;
        break;
      }
    }

    if (matches) {
      // 特殊处理 WebP（需要检查 RIFF + WEBP）
      if (mimeType === 'image/webp') {
        if (buffer.length >= 12 &&
            buffer[8] === 0x57 && buffer[9] === 0x45 &&
            buffer[10] === 0x42 && buffer[11] === 0x50) {
          return { valid: true, detectedMimetype: 'image/webp' };
        }
        continue;
      }
      return { valid: true, detectedMimetype: mimeType };
    }
  }

  return { valid: false };
}

/**
 * 检测文件类型（基于 MIME Type 和魔数验证）
 * 返回文件类型和检测到的真实 MIME 类型
 */
export function detectFileType(mimetype: string, buffer?: Buffer, filename?: string): { fileType: FileType | null; detectedMime: string } {
  let detectedMime = mimetype;

  // 如果是 octet-stream，尝试通过扩展名或魔数检测
  if (mimetype === 'application/octet-stream' && filename) {
    const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
    if (EXTENSION_TO_MIME[ext]) {
      detectedMime = EXTENSION_TO_MIME[ext];
    }
  }

  // 首先检查 MIME Type
  let fileType: FileType | null = null;
  if (detectedMime.startsWith('image/')) {
    fileType = 'image';
  } else if (detectedMime.startsWith('video/')) {
    fileType = 'video';
  }

  if (!fileType) {
    return { fileType: null, detectedMime };
  }

  // 如果提供了 buffer，验证魔数
  if (buffer) {
    const { valid, detectedMimetype } = verifyMagicNumbers(buffer);
    if (!valid) {
      console.warn('[FileStorage] File magic number verification failed');
      return { fileType: null, detectedMime };
    }

    // 确保 MIME Type 与实际文件类型匹配
    if (detectedMimetype) {
      const detectedType = detectedMimetype.startsWith('image/') ? 'image' : 'video';
      if (detectedType !== fileType) {
        console.warn(`[FileStorage] MIME type mismatch: declared ${detectedMime}, detected ${detectedMimetype}`);
        return { fileType: null, detectedMime };
      }
      // 使用检测到的实际 MIME 类型
      detectedMime = detectedMimetype;
    }
  }

  // 验证 MIME Type 是否在允许列表中
  const allowedMimes = ALLOWED_MIME_TYPES[fileType] as readonly string[];
  if (!allowedMimes.includes(detectedMime as any)) {
    console.warn(`[FileStorage] MIME type not allowed: ${detectedMime}`);
    return { fileType: null, detectedMime };
  }

  return { fileType, detectedMime };
}

/**
 * 验证路径安全性（防止路径遍历）
 */
function validatePath(relativePath: string, basePath: string): string {
  // 规范化路径
  const normalizedPath = path.normalize(relativePath);

  // 检查是否包含路径遍历
  if (normalizedPath.startsWith('..') || path.isAbsolute(normalizedPath)) {
    throw new Error('Path traversal detected');
  }

  // 解析完整路径
  const resolvedPath = path.resolve(basePath, normalizedPath);

  // 确保最终路径在基础路径内
  if (!resolvedPath.startsWith(basePath)) {
    throw new Error('Path traversal detected');
  }

  return resolvedPath;
}

/**
 * 检查是否为私有 IP（防止 SSRF）
 */
function isPrivateIP(hostname: string): boolean {
  const privatePatterns = [
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^169\.254\./,
    /^0\.0\.0\.0$/,
    /^localhost$/i,
    /^::1$/,
    /^fc00:/i,
    /^fe80:/i,
  ];

  return privatePatterns.some(pattern => pattern.test(hostname));
}

/**
 * 验证 URL 安全性（防止 SSRF）
 */
function validateUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsedUrl = new URL(url);

    // 只允许 HTTP/HTTPS 协议
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return { valid: false, error: 'Only HTTP/HTTPS protocols are allowed' };
    }

    // 阻止私有 IP 访问
    if (isPrivateIP(parsedUrl.hostname)) {
      return { valid: false, error: 'Cannot access private IP addresses' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
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

/**
 * 文件存储类
 */
export class FileStorage {
  private basePath: string;
  private r2Client: S3Client | null = null;

  constructor() {
    this.basePath = path.resolve(process.cwd(), STORAGE_CONFIG.localPath);
    ensureDirectory(this.basePath);
    ensureDirectory(path.join(this.basePath, 'images'));
    ensureDirectory(path.join(this.basePath, 'videos'));

    // 初始化 R2 客户端（如果配置了）
    if (!STORAGE_CONFIG.useLocal && STORAGE_CONFIG.r2.accountId) {
      this.r2Client = new S3Client({
        region: 'auto',
        endpoint: `https://${STORAGE_CONFIG.r2.accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: STORAGE_CONFIG.r2.accessKeyId || '',
          secretAccessKey: STORAGE_CONFIG.r2.secretAccessKey || '',
        },
      });
    }
  }

  /**
   * 上传文件到临时托管服务（litterbox.catbox.moe）
   * 用于本地开发时获取公网 URL
   * litterbox 支持 1-72 小时临时存储，可被 AI API 访问
   */
  private async uploadToTmpfiles(localPath: string): Promise<string | null> {
    try {
      const fileBuffer = fs.readFileSync(localPath);
      const filename = path.basename(localPath);

      // 使用 litterbox.catbox.moe API（临时存储）
      // 文档: https://litterbox.catbox.moe/
      // 注意：catbox.moe 的永久链接不被某些 AI API 支持，改用 litterbox
      const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('reqtype', 'fileupload');
      formData.append('time', '1h'); // 1 小时后过期，足够处理
      formData.append('fileToUpload', blob, filename);

      const response = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        console.warn('[FileStorage] litterbox upload failed:', response.status);
        return null;
      }

      // litterbox 直接返回图片 URL
      const url = (await response.text()).trim();
      if (url && url.startsWith('https://')) {
        console.log('[FileStorage] Uploaded to litterbox:', url);
        return url;
      }

      console.warn('[FileStorage] Invalid response from litterbox:', url);
      return null;
    } catch (error) {
      console.warn('[FileStorage] Temp file upload error:', error);
      return null;
    }
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
      filename = file.name;
      // 尝试通过扩展名或魔数检测真实 MIME 类型
      mimetype = file.type;
      if (mimetype === 'application/octet-stream') {
        const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
        if (EXTENSION_TO_MIME[ext]) {
          mimetype = EXTENSION_TO_MIME[ext];
        }
      }
    } else {
      buffer = file;
      mimetype = options?.mimetype || 'application/octet-stream';
      filename = options?.filename || `${fileId}`;
    }

    // 验证文件类型（包含魔数验证）
    const { fileType, detectedMime } = detectFileType(mimetype, buffer, filename);
    if (!fileType) {
      throw new Error(`Unsupported or invalid file type: ${mimetype}`);
    }
    // 使用检测到的真实 MIME 类型
    mimetype = detectedMime;

    // 文件大小检查
    const maxSize = FILE_SIZE_LIMITS[fileType];
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
   * 保存来自 URL 的文件（带 SSRF 防护）
   */
  async saveFromUrl(url: string): Promise<UploadedFile> {
    // 验证 URL 安全性
    const { valid, error } = validateUrl(url);
    if (!valid) {
      throw new Error(`URL validation failed: ${error}`);
    }

    // 添加超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'VidLuxe/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch file from URL: ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || 'application/octet-stream';

      // 限制下载大小
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > 100 * 1024 * 1024) {
        throw new Error('File too large to download');
      }

      const buffer = Buffer.from(await response.arrayBuffer());

      return this.saveFile(buffer, {
        mimetype: contentType,
        filename: url.split('/').pop() || 'downloaded',
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * 获取文件（带路径遍历防护）
   */
  getFile(relativePath: string): Buffer | null {
    try {
      const filePath = validatePath(relativePath, this.basePath);
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath);
      }
      return null;
    } catch (error) {
      console.warn('[FileStorage] Path validation failed:', error);
      return null;
    }
  }

  /**
   * 删除文件（带路径遍历防护）
   */
  deleteFile(relativePath: string): boolean {
    try {
      const filePath = validatePath(relativePath, this.basePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.warn('[FileStorage] Path validation failed:', error);
      return false;
    }
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
   * 根据相对 URL 获取本地文件路径
   */
  getLocalPath(url: string): string {
    // 移除开头的 /
    const relativePath = url.startsWith('/') ? url.slice(1) : url;

    // 直接从项目根目录的 public 文件夹解析
    const publicDir = path.resolve(process.cwd(), 'public');
    return path.join(publicDir, relativePath);
  }

  /**
   * 上传文件到 R2 获取公网 URL
   * 用于 Image-to-Image API 需要公网可访问的图片
   */
  async uploadToR2(localPath: string): Promise<string> {
    if (!this.r2Client) {
      throw new Error('R2 client not configured. Please set R2 environment variables.');
    }

    if (!fs.existsSync(localPath)) {
      throw new Error(`File not found: ${localPath}`);
    }

    const fileBuffer = fs.readFileSync(localPath);
    const filename = path.basename(localPath);
    const key = `keyframes/${Date.now()}_${filename}`;

    const command = new PutObjectCommand({
      Bucket: STORAGE_CONFIG.r2.bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: filename.endsWith('.jpg') || filename.endsWith('.jpeg')
        ? 'image/jpeg'
        : filename.endsWith('.png')
          ? 'image/png'
          : 'image/webp',
    });

    await this.r2Client.send(command);

    const publicUrl = `${STORAGE_CONFIG.r2.publicUrl}/${key}`;
    console.log('[FileStorage] Uploaded to R2:', publicUrl);

    return publicUrl;
  }

  /**
   * 将本地文件上传到公网（用于 Image-to-Image API）
   * 优先级：R2 > tmpfiles.org > NEXT_PUBLIC_BASE_URL
   */
  async getPublicUrl(localPath: string): Promise<string | null> {
    // 如果文件已经是公网 URL，直接返回
    if (localPath.startsWith('http')) {
      return localPath;
    }

    // 检查文件是否存在
    if (!fs.existsSync(localPath)) {
      console.error('[FileStorage] File not found:', localPath);
      return null;
    }

    // 尝试上传到 R2（优先）
    if (this.r2Client && STORAGE_CONFIG.r2.publicUrl) {
      try {
        return await this.uploadToR2(localPath);
      } catch (error) {
        console.warn('[FileStorage] R2 upload failed, trying tmpfiles:', error);
      }
    }

    // 尝试上传到 tmpfiles.org（备选）
    const tmpfilesUrl = await this.uploadToTmpfiles(localPath);
    if (tmpfilesUrl) {
      return tmpfilesUrl;
    }

    // 最后尝试使用 NEXT_PUBLIC_BASE_URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (baseUrl && baseUrl.startsWith('https://')) {
      // 只有 HTTPS 的公网 URL 才有效
      const publicDir = path.resolve(process.cwd(), 'public');
      if (localPath.startsWith(publicDir)) {
        const url = `${baseUrl}${localPath.replace(publicDir, '')}`;
        console.log('[FileStorage] Using base URL:', url);
        return url;
      }
    }

    console.warn('[FileStorage] No public URL available for:', localPath);
    return null;
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
          try {
            fs.unlinkSync(filePath);
            deletedCount++;
          } catch (e) {
            console.warn(`[FileStorage] Failed to delete ${filePath}:`, e);
          }
        }
      }
    };

    scanDir(this.basePath);
    return deletedCount;
  }
}

// 使用全局变量保持跨请求持久化（解决 Next.js HMR 问题）
declare global {
  // eslint-disable-next-line no-var
  var fileStorageGlobal: FileStorage | undefined;
}

export function getFileStorage(): FileStorage {
  if (!global.fileStorageGlobal) {
    global.fileStorageGlobal = new FileStorage();
  }
  return global.fileStorageGlobal;
}
