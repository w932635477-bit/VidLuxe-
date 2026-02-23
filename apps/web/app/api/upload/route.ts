/**
 * 文件上传 API
 *
 * POST /api/upload
 * 支持图片和视频上传
 *
 * 安全特性：
 * - 文件魔数验证
 * - 文件大小限制
 * - 安全的文件名处理
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFileStorage } from '@/lib/file-storage';

// 文件大小限制
const FILE_SIZE_LIMITS = {
  image: 10 * 1024 * 1024, // 10MB
  video: 500 * 1024 * 1024, // 500MB（视频）
} as const;

// 允许的 MIME 类型
const ALLOWED_MIME_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/webp'],
  video: ['video/mp4', 'video/quicktime', 'video/webm', 'application/octet-stream'],
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

// 通过文件扩展名检测 MIME 类型
function detectMimeType(filename: string, declaredType: string): string {
  // 如果声明的类型不是 octet-stream，直接使用
  if (declaredType !== 'application/octet-stream') {
    return declaredType;
  }

  // 通过扩展名判断
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  return EXTENSION_TO_MIME[ext] || declaredType;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    // 验证文件存在
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // 检测真实 MIME 类型（处理 curl 发送 application/octet-stream 的情况）
    const mimeType = detectMimeType(file.name, file.type);

    // 判断文件类型
    const isImage = ALLOWED_MIME_TYPES.image.includes(mimeType as any);
    const isVideo = mimeType.startsWith('video/') || ALLOWED_MIME_TYPES.video.includes(mimeType as any);

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { success: false, error: `Unsupported file type: ${mimeType}` },
        { status: 400 }
      );
    }

    // 检查文件大小
    const fileType = isImage ? 'image' : 'video';
    const maxSize = FILE_SIZE_LIMITS[fileType];
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: `File too large. Max size: ${maxSize / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // 保存文件（包含魔数验证）
    const storage = getFileStorage();
    const uploadedFile = await storage.saveFile(file);

    return NextResponse.json({
      success: true,
      file: {
        id: uploadedFile.id,
        url: uploadedFile.url,
        type: uploadedFile.type,
        filename: uploadedFile.filename,
        size: uploadedFile.size,
      },
    });
  } catch (error) {
    console.error('[Upload API] Error:', error);

    // 返回用户友好的错误信息
    const errorMessage = error instanceof Error
      ? error.message
      : 'Failed to upload file';

    // 判断是否为客户端错误
    const isClientError = errorMessage.includes('Unsupported') ||
                          errorMessage.includes('too large') ||
                          errorMessage.includes('Invalid');

    return NextResponse.json(
      { success: false, error: isClientError ? errorMessage : 'Failed to upload file' },
      { status: isClientError ? 400 : 500 }
    );
  }
}

// 配置 Next.js 路由 - 增加请求体大小限制
// Note: App Router 使用 route segment config
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
