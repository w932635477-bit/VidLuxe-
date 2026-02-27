/**
 * ImageBatchFlow - 多图批量流程
 *
 * upload → style → progress → result
 * 支持每张图片独立选择风格
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useImageBatchStore } from '@/lib/stores/flows';
import { useCreditsStore } from '@/lib/stores/credits-store';
import { ProcessingAnimation } from '@/components/features/try/flows/shared/ProcessingAnimation';
import type { BatchFileItem, StyleType, BatchResultItem } from '@/lib/types/flow';

// 生成匿名 ID
function generateAnonymousId(): string {
  if (typeof window === 'undefined') {
    return `anon_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }
  const stored = localStorage.getItem('vidluxe_anonymous_id');
  if (stored) return stored;
  const id = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  localStorage.setItem('vidluxe_anonymous_id', id);
  return id;
}

export function ImageBatchFlow() {
  const [anonymousId, setAnonymousId] = useState<string>('');
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    step,
    batchFiles,
    batchResults,
    isLoading,
    progress,
    currentStage,
    error,
    setStep,
    setBatchFiles,
    updateBatchFile,
    removeBatchFile,
    clearBatchFiles,
    setIsLoading,
    setProgress,
    setCurrentStage,
    setError,
    addBatchResult,
    clearResults,
    toggleFileStyle,
    reset,
  } = useImageBatchStore();

  const { total, fetchCredits } = useCreditsStore();

  // 初始化
  useEffect(() => {
    const id = generateAnonymousId();
    setAnonymousId(id);
  }, []);

  useEffect(() => {
    if (anonymousId) {
      fetchCredits(anonymousId);
    }
  }, [anonymousId, fetchCredits]);

  // 处理批量文件上传
  const handleBatchFilesChange = useCallback(async (files: File[]) => {
    const newItems: BatchFileItem[] = files.map((file) => ({
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      uploadedUrl: null,
      status: 'pending' as const,
      selectedStyles: [], // 初始化为空，用户后续选择
    }));

    setBatchFiles(newItems);

    // 并发上传所有文件
    await Promise.all(
      newItems.map(async (item) => {
        updateBatchFile(item.id, { status: 'uploading' });
        try {
          const formData = new FormData();
          formData.append('file', item.file);
          const response = await fetch('/api/upload', { method: 'POST', body: formData });
          const data = await response.json();
          if (data.success && data.file) {
            updateBatchFile(item.id, { status: 'success', uploadedUrl: data.file.url });
          } else {
            updateBatchFile(item.id, { status: 'error', error: data.error || '上传失败' });
          }
        } catch {
          updateBatchFile(item.id, { status: 'error', error: '网络错误' });
        }
      })
    );

    // 上传完成后进入风格选择
    setStep('style');
  }, [setBatchFiles, updateBatchFile, setStep]);

  // 计算总任务数
  const calculateTotalTasks = useCallback(() => {
    return batchFiles.reduce((total, file) => {
      if (file.status === 'success' && file.uploadedUrl) {
        return total + (file.selectedStyles.length > 0 ? file.selectedStyles.length : 1);
      }
      return total;
    }, 0);
  }, [batchFiles]);

  // 检查是否所有图片都选择了风格
  const allFilesHaveStyles = batchFiles
    .filter((f) => f.status === 'success')
    .every((f) => f.selectedStyles.length > 0);

  // 开始批量处理
  const handleStartProcessing = useCallback(async () => {
    const successFiles = batchFiles.filter((f) => f.status === 'success' && f.uploadedUrl);
    if (successFiles.length === 0) {
      setError('没有可用的图片');
      return;
    }

    const totalCost = calculateTotalTasks();

    if (total < totalCost) {
      setError('额度不足');
      return;
    }

    await processBatch(successFiles);
  }, [batchFiles, total, calculateTotalTasks, setError]);

  // 批量处理
  const processBatch = async (files: BatchFileItem[]) => {
    const results: BatchResultItem[] = [];
    let completed = 0;

    // 计算总任务数
    const totalTasks = files.reduce((total, file) => {
      return total + (file.selectedStyles.length > 0 ? file.selectedStyles.length : 1);
    }, 0);

    setStep('progress');
    setProgress(0);
    setCurrentStage('准备批量生成...');
    clearResults();

    for (const file of files) {
      // 使用该图片选择的风格，如果没选择则默认用 magazine
      const stylesToProcess = file.selectedStyles.length > 0 ? file.selectedStyles : ['magazine' as StyleType];

      for (const style of stylesToProcess) {
        try {
          setCurrentStage(`处理中... (${completed + 1}/${totalTasks})`);

          const enhanceResponse = await fetch('/api/enhance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: { type: 'image', url: file.uploadedUrl },
              styleSource: { type: 'preset', presetStyle: style },
              anonymousId,
            }),
          });

          const enhanceData = await enhanceResponse.json();

          if (enhanceData.success && enhanceData.taskId) {
            const maxAttempts = 60;
            let taskCompleted = false;

            for (let i = 0; i < maxAttempts; i++) {
              await new Promise((resolve) => setTimeout(resolve, 2000));
              const statusResponse = await fetch(`/api/enhance/${enhanceData.taskId}`);
              const statusData = await statusResponse.json();

              if (statusData.status === 'completed' && statusData.result) {
                const result: BatchResultItem = {
                  id: `${file.id}_${style}`,
                  fileIndex: batchFiles.indexOf(file),
                  originalUrl: file.uploadedUrl!,
                  enhancedUrl: statusData.result.enhancedUrl,
                  style,
                  status: 'completed',
                };
                if (statusData.result.score) {
                  result.score = statusData.result.score;
                }
                results.push(result);
                addBatchResult(result);
                taskCompleted = true;
                break;
              }

              if (statusData.status === 'failed') {
                console.error(`Task ${enhanceData.taskId} failed:`, statusData.error);
                break;
              }
            }

            if (!taskCompleted) {
              console.warn(`Task ${enhanceData.taskId} did not complete in time`);
            }
          }
        } catch (err) {
          console.error('Failed to process:', err);
        }

        completed++;
        setProgress(Math.round((completed / totalTasks) * 100));
      }
    }

    fetchCredits(anonymousId);
    setStep('result');
  };

  // 重置
  const handleReset = useCallback(() => {
    clearBatchFiles();
    clearResults();
    reset();
  }, [clearBatchFiles, clearResults, reset]);

  return (
    <>
      {/* 错误提示 */}
      {error && (
        <div
          style={{
            position: 'fixed',
            top: '60px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 24px',
            borderRadius: '12px',
            background: 'rgba(255, 59, 48, 0.2)',
            border: '1px solid rgba(255, 59, 48, 0.3)',
            color: '#FF3B30',
            zIndex: 100,
          }}
        >
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: '12px', background: 'none', border: 'none', color: '#FF3B30', cursor: 'pointer' }}>
            ✕
          </button>
        </div>
      )}

      {/* 步骤渲染 */}
      {step === 'upload' && (
        <UploadStep
          batchFiles={batchFiles}
          isLoading={isLoading}
          onFilesChange={handleBatchFilesChange}
          onRemove={removeBatchFile}
          onClear={clearBatchFiles}
          credits={{ total, paid: 0, free: total }}
        />
      )}

      {step === 'style' && (
        <StyleStep
          batchFiles={batchFiles}
          onToggleStyle={toggleFileStyle}
          onStartProcessing={handleStartProcessing}
          onBack={() => setStep('upload')}
          credits={{ total, paid: 0, free: total }}
          calculateTotalTasks={calculateTotalTasks}
          allFilesHaveStyles={allFilesHaveStyles}
        />
      )}

      {step === 'progress' && (
        <ProcessingAnimation
          progress={progress}
          currentStage={currentStage}
          mode="batch"
        />
      )}

      {step === 'result' && (
        <ResultStep
          results={batchResults}
          onReset={handleReset}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

// ============================================
// 子组件
// ============================================

function UploadStep({ batchFiles, isLoading, onFilesChange, onRemove, onClear, credits }: {
  batchFiles: BatchFileItem[];
  isLoading: boolean;
  onFilesChange: (files: File[]) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  credits: { total: number; paid: number; free: number };
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px' }}>
      {/* 标题 */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h1 style={{ fontSize: '48px', fontWeight: 600, letterSpacing: '-0.03em', marginBottom: '16px' }}>
          让普通素材变爆款
        </h1>
        <p style={{ fontSize: '21px', color: 'rgba(255, 255, 255, 0.5)', maxWidth: '400px' }}>
          光线差、背景乱？一键提升高级感
        </p>
      </div>

      {/* 上传区 */}
      {batchFiles.length > 0 ? (
        <div style={{ width: '100%', maxWidth: '480px', borderRadius: '24px', border: '2px dashed rgba(255, 255, 255, 0.15)', background: 'rgba(255, 255, 255, 0.02)', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '17px', fontWeight: 500 }}>已选择 {batchFiles.length} 张图片</span>
            <button onClick={onClear} style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>
              清空重选
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {batchFiles.map((item) => (
              <div
                key={item.id}
                onClick={() => !isLoading && item.status !== 'uploading' && onRemove(item.id)}
                style={{
                  position: 'relative',
                  aspectRatio: '9/16',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  cursor: isLoading || item.status === 'uploading' ? 'default' : 'pointer',
                  opacity: item.status === 'error' ? 0.5 : 1,
                }}
              >
                <img src={item.previewUrl} alt="预览" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {item.status === 'uploading' && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '24px', height: '24px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#D4AF37', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  </div>
                )}
                {item.status === 'success' && (
                  <div style={{ position: 'absolute', top: '6px', right: '6px', width: '18px', height: '18px', borderRadius: '50%', background: '#4CAF50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'white', fontSize: '10px' }}>✓</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 添加更多 */}
          {batchFiles.length < 9 && (
            <label style={{ display: 'block', marginTop: '16px', padding: '12px', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.2)', textAlign: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
              <input
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => {
                  const files = e.target.files;
                  if (files && files.length > 0) {
                    onFilesChange(Array.from(files).slice(0, 9 - batchFiles.length));
                  }
                  e.target.value = '';
                }}
              />
              + 添加更多图片
            </label>
          )}
        </div>
      ) : (
        <div
          onClick={() => !isLoading && document.getElementById('batch-file-input')?.click()}
          style={{
            width: '100%',
            maxWidth: '480px',
            aspectRatio: '4/3',
            borderRadius: '24px',
            border: '2px dashed rgba(255, 255, 255, 0.15)',
            background: 'rgba(255, 255, 255, 0.02)',
            cursor: isLoading ? 'wait' : 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <input
            id="batch-file-input"
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              const files = e.target.files;
              if (files && files.length > 0) {
                onFilesChange(Array.from(files));
              }
              e.target.value = '';
            }}
          />
          <div style={{ width: '80px', height: '80px', marginBottom: '24px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.4 }}>
              <path d="M12 16V4M12 4L8 8M12 4L16 8M4 16V18C4 19.1 4.9 20 6 20H18C19.1 20 20 19.1 20 18V16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p style={{ fontSize: '21px', fontWeight: 500, marginBottom: '8px' }}>拖入你的原片（可多选）</p>
          <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '16px' }}>图片或视频</p>
          <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.35)' }}>
            <span>JPG / PNG 最大 10MB</span>
            <span>·</span>
            <span>最多9张图片</span>
          </div>
        </div>
      )}

      {/* 额度显示 */}
      <div style={{ padding: '16px 20px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', maxWidth: '480px', width: '100%', marginTop: batchFiles.length > 0 ? '32px' : '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px' }}>我的额度</p>
          <p style={{ fontSize: '21px', fontWeight: 600 }}>
            <span style={{ color: '#D4AF37' }}>{credits.total}</span>
            <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.4)', marginLeft: '4px' }}>次</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function StyleStep({ batchFiles, onToggleStyle, onStartProcessing, onBack, credits, calculateTotalTasks, allFilesHaveStyles }: {
  batchFiles: BatchFileItem[];
  onToggleStyle: (fileId: string, style: StyleType) => void;
  onStartProcessing: () => void;
  onBack: () => void;
  credits: { total: number; paid: number; free: number };
  calculateTotalTasks: () => number;
  allFilesHaveStyles: boolean;
}) {
  const styles: { id: StyleType; name: string; desc: string }[] = [
    { id: 'magazine', name: '杂志大片', desc: '时尚杂志封面质感' },
    { id: 'soft', name: '温柔日系', desc: '清新温柔文艺感' },
    { id: 'urban', name: '都市职场', desc: '专业干练可信赖' },
    { id: 'vintage', name: '复古胶片', desc: '复古怀旧电影感' },
  ];

  const successFiles = batchFiles.filter((f) => f.status === 'success' && f.uploadedUrl);
  const totalCost = calculateTotalTasks();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '24px', maxWidth: '680px', margin: '0 auto' }}>
      {/* 步骤指示器 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '32px' }}>
        {['upload', 'style', 'progress', 'result'].map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s === 'style' ? '#D4AF37' : 'rgba(255, 255, 255, 0.2)' }} />
            {i < 3 && <div style={{ width: '24px', height: '2px', background: 'rgba(255, 255, 255, 0.1)' }} />}
          </div>
        ))}
      </div>

      {/* 标题 */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontSize: '21px', fontWeight: 600, marginBottom: '8px' }}>为每张图片选择风格</p>
        <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)' }}>
          点击图片下方的风格标签，为每张图片单独选择 1-4 种风格
        </p>
      </div>

      {/* 每张图片的风格选择 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {successFiles.map((file, fileIndex) => (
          <div
            key={file.id}
            style={{
              padding: '16px',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            {/* 图片预览 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
                <img src={file.previewUrl} alt="预览" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div>
                <p style={{ fontSize: '15px', fontWeight: 500, marginBottom: '4px' }}>图片 {fileIndex + 1}</p>
                <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)' }}>
                  已选择 {file.selectedStyles.length} 种风格
                </p>
              </div>
            </div>

            {/* 风格选择按钮 */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {styles.map((style) => {
                const isSelected = file.selectedStyles.includes(style.id);
                return (
                  <button
                    key={style.id}
                    onClick={() => onToggleStyle(file.id, style.id)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      border: isSelected ? '2px solid #D4AF37' : '1px solid rgba(255, 255, 255, 0.15)',
                      background: isSelected ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      color: isSelected ? '#D4AF37' : 'rgba(255, 255, 255, 0.7)',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {style.name}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 费用信息 */}
      <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', marginBottom: '12px', marginTop: '20px' }}>
        <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px' }}>批量生成</p>
        <p style={{ fontSize: '15px', fontWeight: 500, color: '#D4AF37' }}>
          共 {totalCost} 个任务 = 消耗 {totalCost} 个额度
        </p>
      </div>

      {/* 额度信息 */}
      <div style={{ padding: '10px 16px', borderRadius: '8px', background: credits.total >= totalCost ? 'rgba(52, 199, 89, 0.08)' : 'rgba(255, 59, 48, 0.08)', border: `1px solid ${credits.total >= totalCost ? 'rgba(52, 199, 89, 0.15)' : 'rgba(255, 59, 48, 0.15)'}`, marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '14px', color: credits.total >= totalCost ? '#34C759' : '#FF3B30' }}>
          {credits.total >= totalCost ? `剩余 ${credits.total - totalCost} 个额度` : `额度不足，缺少 ${totalCost - credits.total} 个`}
        </span>
        <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>
          当前 {credits.total} 次
        </span>
      </div>

      {/* 按钮 */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button onClick={onBack} style={{ flex: 1, padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'transparent', color: 'white', fontSize: '16px', fontWeight: 500, cursor: 'pointer' }}>
          返回
        </button>
        <button
          onClick={onStartProcessing}
          disabled={!allFilesHaveStyles || credits.total < totalCost}
          style={{
            flex: 2,
            padding: '16px',
            borderRadius: '12px',
            border: 'none',
            background: allFilesHaveStyles && credits.total >= totalCost ? '#D4AF37' : 'rgba(255, 255, 255, 0.1)',
            color: allFilesHaveStyles && credits.total >= totalCost ? '#000' : 'rgba(255, 255, 255, 0.3)',
            fontSize: '16px',
            fontWeight: 600,
            cursor: allFilesHaveStyles && credits.total >= totalCost ? 'pointer' : 'not-allowed',
          }}
        >
          {allFilesHaveStyles ? '开始升级' : '请为每张图片选择风格'}
        </button>
      </div>
    </div>
  );
}

function ResultStep({ results, onReset }: { results: BatchResultItem[]; onReset: () => void }) {
  const [selectedResult, setSelectedResult] = useState<BatchResultItem | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);

  const styleNames: Record<StyleType, string> = {
    magazine: '杂志大片',
    soft: '温柔日系',
    urban: '都市职场',
    vintage: '复古胶片',
  };

  // 下载单张图片
  const downloadImage = async (url: string, filename: string) => {
    try {
      setDownloading(true);
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('下载失败:', error);
      alert('下载失败，请重试');
    } finally {
      setDownloading(false);
    }
  };

  // 批量下载所有图片（ZIP 打包）
  const downloadAllAsZip = async () => {
    try {
      setDownloadingAll(true);

      const response = await fetch('/api/download/zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls: results.map(r => r.enhancedUrl),
          filenames: results.map((r, i) => `vidluxe_${styleNames[r.style]}_${i + 1}.jpg`),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create ZIP');
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'vidluxe_images.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('批量下载失败:', error);
      alert('下载失败，请重试');
    } finally {
      setDownloadingAll(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '24px', maxWidth: '680px', margin: '0 auto' }}>
      <p style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px', textAlign: 'center' }}>生成完成！</p>
      <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '24px', textAlign: 'center' }}>
        共生成 {results.length} 张图片，点击图片查看大图
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {results.map((result, index) => (
          <div
            key={result.id}
            onClick={() => setSelectedResult(result)}
            style={{
              position: 'relative',
              aspectRatio: '9/16',
              borderRadius: '12px',
              overflow: 'hidden',
              cursor: 'pointer',
            }}
          >
            <img src={result.enhancedUrl} alt="结果" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{
              position: 'absolute',
              bottom: '8px',
              left: '8px',
              padding: '4px 8px',
              borderRadius: '6px',
              background: 'rgba(0, 0, 0, 0.6)',
              fontSize: '12px',
              color: 'white',
            }}>
              {styleNames[result.style]}
            </div>
            {/* 下载按钮 */}
            <button
              onClick={async (e) => {
                e.stopPropagation();
                const filename = `vidluxe_${styleNames[result.style]}_${index + 1}.jpg`;
                await downloadImage(result.enhancedUrl, filename);
              }}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(0, 0, 0, 0.6)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* 选中图片详情 */}
      {selectedResult && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '24px',
          }}
          onClick={() => setSelectedResult(null)}
        >
          <div style={{ maxWidth: '90vw', maxHeight: '90vh' }}>
            <img
              src={selectedResult.enhancedUrl}
              alt="结果大图"
              style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '12px' }}
              onClick={(e) => e.stopPropagation()}
            />
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  const index = results.findIndex(r => r.id === selectedResult.id);
                  const filename = `vidluxe_${styleNames[selectedResult.style]}_${index + 1}.jpg`;
                  await downloadImage(selectedResult.enhancedUrl, filename);
                }}
                disabled={downloading}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  background: '#D4AF37',
                  color: '#000',
                  border: 'none',
                  fontWeight: 600,
                  cursor: downloading ? 'wait' : 'pointer',
                  opacity: downloading ? 0.7 : 1,
                }}
              >
                {downloading ? '下载中...' : '下载图片'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedResult(null);
                }}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: 'none',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 批量下载按钮 */}
      {results.length > 1 && (
        <button
          onClick={downloadAllAsZip}
          disabled={downloadingAll}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            background: 'transparent',
            color: 'white',
            fontSize: '15px',
            fontWeight: 500,
            cursor: downloadingAll ? 'wait' : 'pointer',
            marginBottom: '12px',
            opacity: downloadingAll ? 0.7 : 1,
          }}
        >
          {downloadingAll ? '打包中...' : `下载全部 ZIP (${results.length} 张)`}
        </button>
      )}

      <button onClick={onReset} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', background: '#D4AF37', color: '#000', fontSize: '16px', fontWeight: 600, cursor: 'pointer' }}>
        继续使用
      </button>
    </div>
  );
}

export default ImageBatchFlow;
