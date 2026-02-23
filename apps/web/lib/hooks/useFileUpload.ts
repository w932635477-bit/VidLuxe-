/**
 * 文件上传 Hook
 *
 * 处理文件上传、拖拽上传和文件验证
 */

import { useState, useCallback } from 'react';
import type { ContentType, UploadResponse } from '../types/try-page';

interface UseFileUploadReturn {
  uploadedFile: File | null;
  uploadedFileUrl: string | null;
  previewUrl: string | null;
  contentType: ContentType;
  isUploading: boolean;
  uploadError: string | null;
  handleFileChange: (file: File) => Promise<void>;
  handleDrop: (e: React.DragEvent) => Promise<void>;
  resetUpload: () => void;
}

export function useFileUpload(): UseFileUploadReturn {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [contentType, setContentType] = useState<ContentType>('image');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = useCallback(async (file: File) => {
    setIsUploading(true);
    setUploadError(null);

    try {
      // 判断文件类型
      const isVideo = file.type.startsWith('video/');
      setContentType(isVideo ? 'video' : 'image');

      // 创建预览 URL
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
      setUploadedFile(file);

      // 上传文件到服务器
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data: UploadResponse = await response.json();

      if (!data.success || !data.file) {
        throw new Error(data.error || '上传失败');
      }

      setUploadedFileUrl(data.file.url);
      setContentType(data.file.type);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : '上传失败');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) {
        await handleFileChange(file);
      }
    },
    [handleFileChange]
  );

  const resetUpload = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setUploadedFile(null);
    setUploadedFileUrl(null);
    setPreviewUrl(null);
    setContentType('image');
    setUploadError(null);
  }, [previewUrl]);

  return {
    uploadedFile,
    uploadedFileUrl,
    previewUrl,
    contentType,
    isUploading,
    uploadError,
    handleFileChange,
    handleDrop,
    resetUpload,
  };
}
