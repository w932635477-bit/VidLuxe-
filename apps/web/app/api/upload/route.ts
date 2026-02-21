/**
 * 文件上传 API
 *
 * POST /api/upload
 * 支持图片和视频上传
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFileStorage, detectFileType } from '@/lib/file-storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // 检测文件类型
    const fileType = detectFileType(file.type);
    if (!fileType) {
      return NextResponse.json(
        { success: false, error: `Unsupported file type: ${file.type}` },
        { status: 400 }
      );
    }

    // 检查文件大小
    const maxSize = fileType === 'video' ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: `File too large. Max size: ${maxSize / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // 保存文件
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
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
