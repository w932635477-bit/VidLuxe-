/**
 * 文件上传 Hook
 *
 * 处理文件上传、拖拽上传和文件验证
 */

import { useState, useCallback } from 'react';
import type { ContentType, UploadResponse, BatchFileItem, UploadMode } from '../types/try-page';

interface UseFileUploadReturn {
  // 现有
  uploadedFile: File | null;
  uploadedFileUrl: string | null;
  previewUrl: string | null;
  contentType: ContentType;
  isUploading: boolean;
  uploadError: string | null;
  handleFileChange: (file: File) => Promise<void>;
  handleDrop: (e: React.DragEvent) => Promise<void>;
  resetUpload: () => void;
  // 新增
  batchFiles: BatchFileItem[];
  uploadMode: UploadMode;
  handleBatchFilesChange: (files: File[]) => Promise<void>;
  removeBatchFile: (id: string) => void;
  clearBatchFiles: () => void;
}

export function useFileUpload(): UseFileUploadReturn {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [contentType, setContentType] = useState<ContentType>('image');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // 批量上传状态
  const [batchFiles, setBatchFiles] = useState<BatchFileItem[]>([]);
  const [uploadMode, setUploadMode] = useState<UploadMode>('single');

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

  // 清空批量文件
  const clearBatchFiles = useCallback(() => {
    setBatchFiles(prev => {
      prev.forEach(item => {
        if (item.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
      return [];
    });
    setUploadMode('single');
  }, []);

  // 批量上传文件
  const handleBatchFilesChange = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    // 过滤只保留图片，最多9张
    const imageFiles = files
      .filter(f => f.type.startsWith('image/'))
      .slice(0, 9);

    if (imageFiles.length === 0) {
      setUploadError('请上传图片文件');
      return;
    }

    setUploadMode('batch');
    setIsUploading(true);
    setUploadError(null);

    // 创建批量项目
    const newItems: BatchFileItem[] = imageFiles.map(file => ({
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      uploadedUrl: null,
      status: 'pending' as const,
    }));

    // 清理旧的批量文件
    setBatchFiles(prev => {
      prev.forEach(item => {
        if (item.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
      return newItems;
    });

    // 并发上传所有文件
    const uploadPromises = newItems.map(async (item) => {
      try {
        const formData = new FormData();
        formData.append('file', item.file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data: UploadResponse = await response.json();

        if (data.success && data.file) {
          setBatchFiles(prev =>
            prev.map(f =>
              f.id === item.id
                ? { ...f, uploadedUrl: data.file!.url, status: 'success' as const }
                : f
            )
          );
        } else {
          throw new Error(data.error || '上传失败');
        }
      } catch (error) {
        setBatchFiles(prev =>
          prev.map(f =>
            f.id === item.id
              ? { ...f, status: 'error' as const, error: error instanceof Error ? error.message : '上传失败' }
              : f
          )
        );
      }
    });

    await Promise.all(uploadPromises);
    setIsUploading(false);
  }, []);

  // 移除单个批量文件
  const removeBatchFile = useCallback((id: string) => {
    setBatchFiles(prev => {
      const item = prev.find(f => f.id === id);
      if (item?.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter(f => f.id !== id);
    });
  }, []);

  const resetUpload = useCallback(() => {
    // 清理单文件
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setUploadedFile(null);
    setUploadedFileUrl(null);
    setPreviewUrl(null);
    setContentType('image');
    setUploadError(null);

    // 清理批量
    clearBatchFiles();
  }, [previewUrl, clearBatchFiles]);

  return {
    // 现有
    uploadedFile,
    uploadedFileUrl,
    previewUrl,
    contentType,
    isUploading,
    uploadError,
    handleFileChange,
    handleDrop,
    resetUpload,
    // 新增
    batchFiles,
    uploadMode,
    handleBatchFilesChange,
    removeBatchFile,
    clearBatchFiles,
  };
}
