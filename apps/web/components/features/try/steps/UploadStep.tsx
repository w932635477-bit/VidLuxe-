/**
 * UploadStep - 上传步骤组件
 *
 * 处理文件上传和批量上传
 */

'use client';

import { useCallback, useState } from 'react';
import { useTryStore } from '@/lib/stores/try-store';
import { useCreditsStore } from '@/lib/stores/credits-store';
import { UploadSection, BatchPreviewGrid } from '@/components/features/try';

interface UploadStepProps {
  onUploadComplete: () => void;
}

export function UploadStep({ onUploadComplete }: UploadStepProps) {
  const {
    batchFiles,
    setBatchFiles,
    updateBatchFile,
    removeBatchFile,
    setStep,
    setContentType,
    setUploadedFile,
    setUploadedFileUrl,
    setPreviewUrl,
    setAiRecognition,
    setSelectedCategory,
    setSelectedSeedingType,
    isLoading,
  } = useTryStore();

  const { total, paid, free } = useCreditsStore();

  // 邀请码状态（临时保持在组件内，后续可以抽取到 store）
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [inviteApplied, setInviteApplied] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // 处理单文件上传
  const handleFileChange = useCallback(async (file: File) => {
    // 判断内容类型
    const isVideo = file.type.startsWith('video/');
    setContentType(isVideo ? 'video' : 'image');

    // 创建预览 URL
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
    setUploadedFile(file);

    // 上传文件
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.file) {
        setUploadedFileUrl(data.file.url);
        setStep('recognition');

        // 模拟 AI 识别（后续替换为真实 API）
        setTimeout(() => {
          setAiRecognition({
            category: 'fashion',
            seedingType: 'product',
          });
          setSelectedCategory('fashion');
          setSelectedSeedingType('product');
          onUploadComplete();
        }, 1000);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  }, [setContentType, setPreviewUrl, setUploadedFile, setUploadedFileUrl, setStep, setAiRecognition, setSelectedCategory, setSelectedSeedingType, onUploadComplete]);

  // 处理批量文件上传
  const handleBatchFilesChange = useCallback(async (files: File[]) => {
    const newItems = files.map((file) => ({
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      uploadedUrl: null,
      status: 'pending' as const,
    }));

    setBatchFiles(newItems);
    setContentType('image');

    // 并发上传所有文件
    await Promise.all(
      newItems.map(async (item) => {
        updateBatchFile(item.id, { status: 'uploading' });

        try {
          const formData = new FormData();
          formData.append('file', item.file);

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          const data = await response.json();

          if (data.success && data.file) {
            updateBatchFile(item.id, {
              status: 'success',
              uploadedUrl: data.file.url,
            });
          } else {
            updateBatchFile(item.id, {
              status: 'error',
              error: data.error || '上传失败',
            });
          }
        } catch (error) {
          updateBatchFile(item.id, {
            status: 'error',
            error: '网络错误',
          });
        }
      })
    );
  }, [setBatchFiles, setContentType, updateBatchFile]);

  // 处理拖拽上传
  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        if (files.length === 1) {
          handleFileChange(files[0]);
        } else {
          handleBatchFilesChange(files);
        }
      }
    },
    [handleFileChange, handleBatchFilesChange]
  );

  return (
    <>
      <UploadSection
        isLoading={isLoading}
        onFileChange={handleFileChange}
        onDrop={handleDrop}
        onMultipleFiles={handleBatchFilesChange}
        allowMultiple={true}
      />

      {/* 批量预览 */}
      {batchFiles.length > 0 && (
        <div style={{ maxWidth: '480px', margin: '-40px auto 0', padding: '0 24px 40px' }}>
          <BatchPreviewGrid
            items={batchFiles}
            onRemove={removeBatchFile}
            disabled={isLoading}
          />
        </div>
      )}

      {/* 额度显示 */}
      <div
        style={{
          padding: '16px 20px',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          maxWidth: '480px',
          width: 'calc(100% - 48px)',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px' }}>
            我的额度
          </p>
          <p style={{ fontSize: '21px', fontWeight: 600 }}>
            <span style={{ color: '#D4AF37' }}>{total}</span>
            <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.4)', marginLeft: '4px' }}>次</span>
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)' }}>
            付费 {paid} · 免费 {free}
          </p>
        </div>
      </div>

      {/* 邀请码输入 */}
      {!inviteApplied && total < 5 && (
        <div
          style={{
            marginTop: '16px',
            padding: '16px 20px',
            borderRadius: '12px',
            background: 'rgba(52, 199, 89, 0.06)',
            border: '1px solid rgba(52, 199, 89, 0.12)',
            maxWidth: '480px',
            width: 'calc(100% - 48px)',
            margin: '16px auto 0',
          }}
        >
          <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '12px' }}>
            🎁 <span style={{ color: '#34C759' }}>输入邀请码，双方各得 5 个额度</span>
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={inviteCodeInput}
              onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
              placeholder="输入6位邀请码"
              maxLength={6}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            />
            <button
              disabled={!inviteCodeInput || inviteCodeInput.length !== 6}
              style={{
                padding: '12px 20px',
                borderRadius: '8px',
                border: 'none',
                background: inviteCodeInput?.length === 6 ? '#34C759' : 'rgba(255, 255, 255, 0.1)',
                color: inviteCodeInput?.length === 6 ? '#000' : 'rgba(255, 255, 255, 0.3)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: inviteCodeInput?.length === 6 ? 'pointer' : 'not-allowed',
              }}
            >
              兑换
            </button>
          </div>
          {inviteError && (
            <p style={{ fontSize: '12px', color: '#FF3B30', marginTop: '8px' }}>
              {inviteError}
            </p>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
