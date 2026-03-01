/**
 * 文件上传 API
 *
 * POST /api/upload
 * 支持图片和视频上传
 *
 * 使用 Next.js 原生 formData() API
 *
 * 安全特性：
 * - 文件魔数验证
 * - 文件大小限制
 * - 安全的文件名处理
 */

import { NextRequest, NextResponse } from 'next/server';
import { detectFileType } from '@/lib/file-storage';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

// 文件大小限制
const FILE_SIZE_LIMITS = {
  image: 10 * 1024 * 1024, // 10MB
  video: 500 * 1024 * 1024, // 500MB（视频）
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

// 通过文件扩展名检测 MIME 类型
function detectMimeTypeFromExt(filename: string): string | null {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  return EXTENSION_TO_MIME[ext] || null;
}

// 判断 MIME 类型是否为图片或视频
function getFileType(mimetype: string): 'image' | 'video' | null {
  if (ALLOWED_MIME_TYPES.image.includes(mimetype as any)) return 'image';
  if (ALLOWED_MIME_TYPES.video.includes(mimetype as any)) return 'video';
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  return null;
}

// 生成唯一文件 ID
function generateFileId(): string {
  return `file_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { success: false, error: 'Content-Type must be multipart/form-data' },
        { status: 400 }
      );
    }

    // 使用 Next.js 原生的 formData() API
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // 检测 MIME 类型
    let mimetype = file.type;
    if (mimetype === 'application/octet-stream') {
      const detected = detectMimeTypeFromExt(file.name);
      if (detected) mimetype = detected;
    }

    // 判断文件类型
    const fileType = getFileType(mimetype);
    if (!fileType) {
      return NextResponse.json(
        { success: false, error: `Unsupported file type: ${mimetype}` },
        { status: 400 }
      );
    }

    // 检查文件大小
    const maxSize = FILE_SIZE_LIMITS[fileType];
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: `File too large. Max size: ${maxSize / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 验证文件魔数
    const headerBuffer = buffer.slice(0, 16);
    const { fileType: verifiedType, detectedMime } = detectFileType(mimetype, headerBuffer, file.name);

    if (!verifiedType) {
      return NextResponse.json(
        { success: false, error: `Unsupported or invalid file type: ${mimetype}` },
        { status: 400 }
      );
    }

    // 保存文件
    const finalFileId = generateFileId();
    const ext = Object.entries(EXTENSION_TO_MIME).find(([, mime]) => mime === detectedMime)?.[0] || '';
    const subDir = verifiedType === 'image' ? 'images' : 'videos';
    const finalDir = path.join(process.cwd(), 'public', 'uploads', subDir);
    if (!fs.existsSync(finalDir)) {
      fs.mkdirSync(finalDir, { recursive: true });
    }
    const finalFilename = `${finalFileId}${ext}`;
    const finalPath = path.join(finalDir, finalFilename);
    fs.writeFileSync(finalPath, buffer);

    return NextResponse.json({
      success: true,
      file: {
        id: finalFileId,
        url: `/uploads/${subDir}/${finalFilename}`,
        type: verifiedType,
        filename: file.name,
        size: file.size,
      },
    });
  } catch (error) {
    console.error('[Upload API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// 配置 Next.js 路由
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
