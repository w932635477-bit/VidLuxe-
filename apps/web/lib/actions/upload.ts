'use server';

/**
 * 文件上传 Server Action
 *
 * 使用 Server Action 而不是 API Route，因为：
 * - Server Actions 支持 bodySizeLimit 配置
 * - API Routes 有 undici 的 10MB 硬限制
 */

import { detectFileType } from '@/lib/file-storage';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// 文件大小限制
const FILE_SIZE_LIMITS = {
  image: 10 * 1024 * 1024, // 10MB
  video: 500 * 1024 * 1024, // 500MB
} as const;

// 允许的 MIME 类型
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

function detectMimeTypeFromExt(filename: string): string | null {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  return EXTENSION_TO_MIME[ext] || null;
}

function getFileType(mimetype: string): 'image' | 'video' | null {
  if (ALLOWED_MIME_TYPES.image.includes(mimetype as any)) return 'image';
  if (ALLOWED_MIME_TYPES.video.includes(mimetype as any)) return 'video';
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  return null;
}

function generateFileId(): string {
  return `file_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
}

export interface UploadResult {
  success: boolean;
  file?: {
    id: string;
    url: string;
    type: 'image' | 'video';
    filename: string;
    size: number;
  };
  error?: string;
}

export async function uploadFile(formData: FormData): Promise<UploadResult> {
  try {
    const file = formData.get('file');

    if (!file || typeof file !== 'object' || !('arrayBuffer' in file)) {
      return { success: false, error: 'No file provided' };
    }

    const fileObj = file as File;
    let mimetype = fileObj.type;
    const filename = fileObj.name;

    // 检测 MIME 类型
    if (mimetype === 'application/octet-stream') {
      const detected = detectMimeTypeFromExt(filename);
      if (detected) mimetype = detected;
    }

    // 判断文件类型
    const fileType = getFileType(mimetype);
    if (!fileType) {
      return { success: false, error: `Unsupported file type: ${mimetype}` };
    }

    // 检查文件大小
    const maxSize = FILE_SIZE_LIMITS[fileType];
    if (fileObj.size > maxSize) {
      return { success: false, error: `File too large. Max size: ${maxSize / 1024 / 1024}MB` };
    }

    // 读取文件内容
    const arrayBuffer = await fileObj.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 验证文件魔数
    const headerBuffer = buffer.slice(0, 16);
    const { fileType: verifiedType, detectedMime } = detectFileType(mimetype, headerBuffer, filename);

    if (!verifiedType) {
      return { success: false, error: `Unsupported or invalid file type: ${mimetype}` };
    }

    // 生成文件名
    const fileId = generateFileId();
    const ext = Object.entries(EXTENSION_TO_MIME).find(([, mime]) => mime === detectedMime)?.[0] || '';
    const subDir = verifiedType === 'image' ? 'images' : 'videos';
    const finalFilename = `${fileId}${ext}`;

    // 确保目录存在
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', subDir);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 写入文件
    const filePath = path.join(uploadDir, finalFilename);
    fs.writeFileSync(filePath, buffer);

    return {
      success: true,
      file: {
        id: fileId,
        url: `/uploads/${subDir}/${finalFilename}`,
        type: verifiedType,
        filename: filename,
        size: buffer.length,
      },
    };
  } catch (error) {
    console.error('[Upload Action] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
    return { success: false, error: errorMessage };
  }
}
