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
import { uploadFile } from '@/lib/actions/upload';

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
    setUploadMode,
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

    // 上传文件（使用 Server Action）
    const formData = new FormData();
    formData.append('file', file);

    try {
      const data = await uploadFile(formData);

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
      } else {
        console.error('Upload failed:', data.error);
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
    setUploadMode('batch'); // 设置批量模式

    // 并发上传所有文件（使用 Server Action）
    await Promise.all(
      newItems.map(async (item) => {
        updateBatchFile(item.id, { status: 'uploading' });

        try {
          const formData = new FormData();
          formData.append('file', item.file);

          const data = await uploadFile(formData);

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

    // 上传完成后进入识别步骤（批量模式跳过识别，直接进入风格选择）
    setSelectedCategory('fashion');
    setSelectedSeedingType('product');
    onUploadComplete();
  }, [setBatchFiles, setContentType, setUploadMode, updateBatchFile, setSelectedCategory, setSelectedSeedingType, onUploadComplete]);

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
      {/* 批量上传时显示预览在上传区域内 */}
      {batchFiles.length > 0 ? (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 24px',
          }}
        >
          {/* 标题 */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h1
              style={{
                fontSize: '48px',
                fontWeight: 600,
                letterSpacing: '-0.03em',
                marginBottom: '16px',
              }}
            >
              让普通素材变爆款
            </h1>
            <p
              style={{
                fontSize: '21px',
                color: 'rgba(255, 255, 255, 0.5)',
                maxWidth: '400px',
              }}
            >
              光线差、背景乱？一键提升高级感
            </p>
          </div>

          {/* 上传区 - 显示批量预览 */}
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              borderRadius: '24px',
              border: '2px dashed rgba(255, 255, 255, 0.15)',
              background: 'rgba(255, 255, 255, 0.02)',
              padding: '24px',
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}>
              <span style={{ fontSize: '17px', fontWeight: 500 }}>
                已选择 {batchFiles.length} 张图片
              </span>
              <button
                onClick={() => {
                  batchFiles.forEach(f => URL.revokeObjectURL(f.previewUrl));
                  setBatchFiles([]);
                  setUploadMode('single');
                }}
                style={{
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.6)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 8px',
                }}
              >
                清空重选
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
            }}>
              {batchFiles.map((item) => (
                <div
                  key={item.id}
                  onClick={() => !isLoading && item.status !== 'uploading' && removeBatchFile(item.id)}
                  style={{
                    position: 'relative',
                    aspectRatio: '1',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    cursor: isLoading || item.status === 'uploading' ? 'default' : 'pointer',
                    opacity: item.status === 'error' ? 0.5 : 1,
                  }}
                >
                  <img
                    src={item.previewUrl}
                    alt="预览"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />

                  {/* 上传中遮罩 */}
                  {item.status === 'uploading' && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0,0,0,0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#D4AF37',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                      }} />
                    </div>
                  )}

                  {/* 上传成功标记 */}
                  {item.status === 'success' && (
                    <div style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: '#4CAF50',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <span style={{ color: 'white', fontSize: '10px' }}>✓</span>
                    </div>
                  )}

                  {/* 上传失败标记 */}
                  {item.status === 'error' && (
                    <div style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: '#EF4444',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <span style={{ color: 'white', fontSize: '10px' }}>✕</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 添加更多图片按钮 */}
            {batchFiles.length < 9 && (
              <label
                style={{
                  display: 'block',
                  marginTop: '16px',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px dashed rgba(255,255,255,0.2)',
                  textAlign: 'center',
                  cursor: 'pointer',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '14px',
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const files = e.target.files;
                    if (!files || files.length === 0) return;
                    const newFiles = Array.from(files).slice(0, 9 - batchFiles.length);
                    if (newFiles.length > 0) {
                      const additionalItems = newFiles.map((file) => ({
                        id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                        file,
                        previewUrl: URL.createObjectURL(file),
                        uploadedUrl: null,
                        status: 'pending' as const,
                      }));
                      setBatchFiles([...batchFiles, ...additionalItems]);

                      // 上传新文件（使用 Server Action）
                      for (const item of additionalItems) {
                        updateBatchFile(item.id, { status: 'uploading' });
                        try {
                          const formData = new FormData();
                          formData.append('file', item.file);
                          const data = await uploadFile(formData);
                          if (data.success && data.file) {
                            updateBatchFile(item.id, { status: 'success', uploadedUrl: data.file.url });
                          } else {
                            updateBatchFile(item.id, { status: 'error', error: data.error || '上传失败' });
                          }
                        } catch {
                          updateBatchFile(item.id, { status: 'error', error: '网络错误' });
                        }
                      }
                    }
                    e.target.value = '';
                  }}
                />
                + 添加更多图片
              </label>
            )}
          </div>

          {/* 小贴士 */}
          <div
            style={{
              marginTop: '32px',
              padding: '16px 20px',
              borderRadius: '12px',
              background: 'rgba(212, 175, 55, 0.06)',
              border: '1px solid rgba(212, 175, 55, 0.12)',
              maxWidth: '480px',
              width: '100%',
            }}
          >
            <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>
              💡 点击图片可移除，上传完成后将自动进入风格选择
            </p>
          </div>

          {/* 额度显示 */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              maxWidth: '480px',
              width: '100%',
              marginTop: '16px',
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

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <>
          <UploadSection
            isLoading={isLoading}
            onFileChange={handleFileChange}
            onDrop={handleDrop}
            onMultipleFiles={handleBatchFilesChange}
            allowMultiple={true}
          />

          {/* 非批量模式下的额度显示 */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              maxWidth: '480px',
              width: 'calc(100% - 48px)',
              margin: '-40px auto 0',
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
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
