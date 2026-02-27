/**
 * ImageBatchFlow - 多图批量流程
 *
 * upload → style → processing → result
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useImageBatchStore } from '@/lib/stores/flows';
import { useCreditsStore } from '@/lib/stores/credits-store';
import { MinimalNav } from '@/components/features/try';
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
    selectedStyles,
    batchResults,
    isLoading,
    progress,
    currentStage,
    error,
    showConfirmModal,
    setStep,
    setBatchFiles,
    updateBatchFile,
    removeBatchFile,
    clearBatchFiles,
    setIsLoading,
    setProgress,
    setCurrentStage,
    setError,
    setSelectedStyles,
    setBatchResults,
    setShowConfirmModal,
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

  // 开始批量处理
  const handleStartProcessing = useCallback(async () => {
    const successFiles = batchFiles.filter((f) => f.status === 'success' && f.uploadedUrl);
    if (successFiles.length === 0) {
      setError('没有可用的图片');
      return;
    }

    const imageCount = successFiles.length;
    const styleCount = selectedStyles.length > 0 ? selectedStyles.length : 1;
    const totalCost = imageCount * styleCount;

    if (total < totalCost) {
      setShowConfirmModal(true);
      return;
    }

    await processBatch(successFiles, selectedStyles.length > 0 ? selectedStyles : ['magazine']);
  }, [batchFiles, selectedStyles, total, setError, setShowConfirmModal]);

  // 批量处理
  const processBatch = async (files: BatchFileItem[], styles: StyleType[]) => {
    const results: typeof batchResults = [];
    const totalTasks = files.length * styles.length;
    let completed = 0;

    setStep('processing');
    setProgress(0);
    setCurrentStage('准备批量生成...');

    for (const file of files) {
      for (const style of styles) {
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
                results.push({
                  originalUrl: file.uploadedUrl!,
                  enhancedUrl: statusData.result.enhancedUrl,
                  style,
                  score: statusData.result.score,
                });
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
    setBatchResults(results);
    setStep('result');
  };

  // 重置
  const handleReset = useCallback(() => {
    clearBatchFiles();
    reset();
  }, [clearBatchFiles, reset]);

  return (
    <main style={{ minHeight: '100vh', background: '#000000' }}>
      <MinimalNav />

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
          selectedStyles={selectedStyles}
          onStylesChange={setSelectedStyles}
          onStartProcessing={handleStartProcessing}
          onBack={() => setStep('upload')}
          credits={{ total, paid: 0, free: total }}
        />
      )}

      {step === 'processing' && (
        <ProcessingStep progress={progress} currentStage={currentStage} />
      )}

      {step === 'result' && (
        <ResultStep
          results={batchResults}
          onReset={handleReset}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px' }}>
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
                  aspectRatio: '1',
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

function StyleStep({ batchFiles, selectedStyles, onStylesChange, onStartProcessing, onBack, credits }: {
  batchFiles: BatchFileItem[];
  selectedStyles: StyleType[];
  onStylesChange: (styles: StyleType[]) => void;
  onStartProcessing: () => void;
  onBack: () => void;
  credits: { total: number; paid: number; free: number };
}) {
  const styles: { id: StyleType; name: string; desc: string }[] = [
    { id: 'magazine', name: '杂志大片', desc: '时尚杂志封面质感' },
    { id: 'soft', name: '温柔日系', desc: '清新温柔文艺感' },
    { id: 'urban', name: '都市职场', desc: '专业干练可信赖' },
    { id: 'vintage', name: '复古胶片', desc: '复古怀旧电影感' },
  ];

  const successFiles = batchFiles.filter((f) => f.status === 'success' && f.uploadedUrl);
  const imageCount = successFiles.length;
  const styleCount = selectedStyles.length > 0 ? selectedStyles.length : 1;
  const totalCost = imageCount * styleCount;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '80px 24px 40px', maxWidth: '480px', margin: '0 auto' }}>
      {/* 步骤指示器 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '32px' }}>
        {['upload', 'style', 'processing', 'result'].map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s === 'style' ? '#D4AF37' : 'rgba(255, 255, 255, 0.2)' }} />
            {i < 3 && <div style={{ width: '24px', height: '2px', background: 'rgba(255, 255, 255, 0.1)' }} />}
          </div>
        ))}
      </div>

      {/* 图片预览 */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontSize: '15px', fontWeight: 500, marginBottom: '12px' }}>已选择 {imageCount} 张图片</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {successFiles.slice(0, 6).map((item) => (
            <div key={item.id} style={{ aspectRatio: '1', borderRadius: '12px', overflow: 'hidden' }}>
              <img src={item.previewUrl} alt="预览" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      </div>

      {/* 风格选择 */}
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '17px', fontWeight: 500, marginBottom: '16px' }}>选择风格（可多选）</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {styles.map((style) => (
            <div
              key={style.id}
              onClick={() => {
                if (selectedStyles.includes(style.id)) {
                  onStylesChange(selectedStyles.filter((s) => s !== style.id));
                } else {
                  onStylesChange([...selectedStyles, style.id]);
                }
              }}
              style={{
                padding: '16px',
                borderRadius: '12px',
                border: selectedStyles.includes(style.id) ? '2px solid #D4AF37' : '1px solid rgba(255, 255, 255, 0.1)',
                background: selectedStyles.includes(style.id) ? 'rgba(212, 175, 55, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                cursor: 'pointer',
              }}
            >
              <p style={{ fontSize: '15px', fontWeight: 500, marginBottom: '4px' }}>{style.name}</p>
              <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)' }}>{style.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 费用信息 */}
      <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', marginBottom: '12px' }}>
        <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px' }}>批量生成</p>
        <p style={{ fontSize: '15px', fontWeight: 500, color: '#D4AF37' }}>
          {imageCount} 张图片 × {styleCount} 种风格 = {totalCost} 个额度
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
          disabled={selectedStyles.length === 0}
          style={{
            flex: 2,
            padding: '16px',
            borderRadius: '12px',
            border: 'none',
            background: selectedStyles.length > 0 ? '#D4AF37' : 'rgba(255, 255, 255, 0.1)',
            color: selectedStyles.length > 0 ? '#000' : 'rgba(255, 255, 255, 0.3)',
            fontSize: '16px',
            fontWeight: 600,
            cursor: selectedStyles.length > 0 ? 'pointer' : 'not-allowed',
          }}
        >
          开始升级
        </button>
      </div>
    </div>
  );
}

function ProcessingStep({ progress, currentStage }: { progress: number; currentStage: string }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px' }}>
      <div style={{ width: '80px', height: '80px', marginBottom: '32px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#D4AF37', animation: 'spin 1s linear infinite' }} />
      <p style={{ fontSize: '21px', fontWeight: 500, marginBottom: '8px' }}>{currentStage}</p>
      <p style={{ fontSize: '48px', fontWeight: 600, color: '#D4AF37' }}>{progress}%</p>
    </div>
  );
}

function ResultStep({ results, onReset }: { results: BatchResultItem[]; onReset: () => void }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '80px 24px 40px', maxWidth: '480px', margin: '0 auto' }}>
      <p style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', textAlign: 'center' }}>生成完成！</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {results.map((result, index) => (
          <div key={index} style={{ aspectRatio: '1', borderRadius: '12px', overflow: 'hidden' }}>
            <img src={result.enhancedUrl} alt="结果" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ))}
      </div>

      <button onClick={onReset} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', background: '#D4AF37', color: '#000', fontSize: '16px', fontWeight: 600, cursor: 'pointer' }}>
        继续使用
      </button>
    </div>
  );
}

export default ImageBatchFlow;
