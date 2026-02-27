/**
 * ImageSingleFlow - 单图流程
 *
 * upload → recognition → style → processing → result
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useImageSingleStore } from '@/lib/stores/flows';
import { useCreditsStore } from '@/lib/stores/credits-store';
import { ProcessingAnimation } from '@/components/features/try/flows/shared/ProcessingAnimation';
import type { StyleType, StyleSourceType, ResultData } from '@/lib/types/flow';

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

export function ImageSingleFlow() {
  const [anonymousId, setAnonymousId] = useState<string>('');

  const {
    step,
    uploadedFile,
    uploadedFileUrl,
    previewUrl,
    isLoading,
    progress,
    currentStage,
    error,
    selectedCategory,
    selectedPreset,
    styleSourceType,
    referenceFile,
    referenceFileUrl,
    resultData,
    setStep,
    setUploadedFile,
    setUploadedFileUrl,
    setPreviewUrl,
    setIsLoading,
    setProgress,
    setCurrentStage,
    setError,
    setSelectedCategory,
    setSelectedPreset,
    setStyleSourceType,
    setReferenceFile,
    setReferenceFileUrl,
    setResultData,
    reset,
  } = useImageSingleStore();

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

  // 处理单文件上传
  const handleFileChange = useCallback(async (file: File) => {
    const isVideo = file.type.startsWith('video/');
    if (isVideo) {
      setError('此页面仅支持图片上传，请使用视频上传页面');
      return;
    }

    // 创建预览
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
    setUploadedFile(file);

    // 上传文件
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await response.json();

      if (data.success && data.file) {
        setUploadedFileUrl(data.file.url);
        setStep('recognition');

        // 模拟 AI 识别
        setTimeout(() => {
          setSelectedCategory('fashion');
          setStep('style');
        }, 1000);
      } else {
        setError(data.error || '上传失败');
      }
    } catch {
      setError('网络错误');
    } finally {
      setIsLoading(false);
    }
  }, [setPreviewUrl, setUploadedFile, setIsLoading, setUploadedFileUrl, setStep, setSelectedCategory, setError]);

  // 开始处理
  const handleStartProcessing = useCallback(async () => {
    if (!uploadedFileUrl) {
      setError('请先上传图片');
      return;
    }

    if (total < 1) {
      setError('额度不足');
      return;
    }

    setStep('processing');
    setProgress(0);
    setCurrentStage('正在分析图片...');

    try {
      const response = await fetch('/api/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: { type: 'image', url: uploadedFileUrl },
          styleSource: {
            type: styleSourceType,
            presetStyle: styleSourceType === 'preset' ? selectedPreset : undefined,
            referenceUrl: styleSourceType === 'reference' ? referenceFileUrl : undefined,
          },
          anonymousId,
        }),
      });

      const data = await response.json();

      if (data.success && data.taskId) {
        // 轮询任务状态
        for (let i = 0; i < 60; i++) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          const statusResponse = await fetch(`/api/enhance/${data.taskId}`);
          const statusData = await statusResponse.json();

          setProgress(statusData.progress || 0);
          setCurrentStage(statusData.currentStage || '处理中...');

          if (statusData.status === 'completed' && statusData.result) {
            setResultData({
              enhancedUrl: statusData.result.enhancedUrl,
              originalUrl: statusData.result.originalUrl,
              score: statusData.result.score,
            });
            fetchCredits(anonymousId);
            setStep('result');
            return;
          }

          if (statusData.status === 'failed') {
            setError(statusData.error || '处理失败');
            setStep('style');
            return;
          }
        }

        setError('处理超时');
        setStep('style');
      } else {
        setError(data.error || '创建任务失败');
        setStep('style');
      }
    } catch {
      setError('网络错误');
      setStep('style');
    }
  }, [uploadedFileUrl, total, styleSourceType, selectedPreset, referenceFileUrl, anonymousId, setStep, setProgress, setCurrentStage, setResultData, setError, fetchCredits]);

  // 处理参考图上传
  const handleReferenceUpload = useCallback(async (file: File) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await response.json();

      if (data.success && data.file) {
        setReferenceFile(file);
        setReferenceFileUrl(data.file.url);
      } else {
        setError(data.error || '上传参考图失败');
      }
    } catch {
      setError('网络错误');
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setReferenceFile, setReferenceFileUrl, setError]);

  // 重置
  const handleReset = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    reset();
  }, [previewUrl, reset]);

  const styles: { id: StyleType; name: string; desc: string }[] = [
    { id: 'magazine', name: '杂志大片', desc: '时尚杂志封面质感' },
    { id: 'soft', name: '温柔日系', desc: '清新温柔文艺感' },
    { id: 'urban', name: '都市职场', desc: '专业干练可信赖' },
    { id: 'vintage', name: '复古胶片', desc: '复古怀旧电影感' },
  ];

  return (
    <>
      {/* 错误提示 */}
      {error && (
        <div style={{ position: 'fixed', top: '60px', left: '50%', transform: 'translateX(-50%)', padding: '12px 24px', borderRadius: '12px', background: 'rgba(255, 59, 48, 0.2)', border: '1px solid rgba(255, 59, 48, 0.3)', color: '#FF3B30', zIndex: 100 }}>
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: '12px', background: 'none', border: 'none', color: '#FF3B30', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* 上传步骤 */}
      {step === 'upload' && (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '130px 24px 80px' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h1 style={{ fontSize: '48px', fontWeight: 600, letterSpacing: '-0.03em', marginBottom: '16px' }}>让普通素材变爆款</h1>
            <p style={{ fontSize: '21px', color: 'rgba(255, 255, 255, 0.5)', maxWidth: '400px' }}>光线差、背景乱？一键提升高级感</p>
          </div>

          <div
            onClick={() => !isLoading && document.getElementById('single-file-input')?.click()}
            style={{
              width: '100%', maxWidth: '480px', aspectRatio: '9/16', maxHeight: '500px',
              borderRadius: '24px', border: '2px dashed rgba(255, 255, 255, 0.15)',
              background: 'rgba(255, 255, 255, 0.02)', cursor: isLoading ? 'wait' : 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <input id="single-file-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileChange(file); e.target.value = ''; }} disabled={isLoading} />
            {isLoading ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#D4AF37', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                <p style={{ color: 'rgba(255,255,255,0.6)' }}>上传中...</p>
              </div>
            ) : (
              <>
                <div style={{ width: '80px', height: '80px', marginBottom: '24px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.4 }}><path d="M12 16V4M12 4L8 8M12 4L16 8M4 16V18C4 19.1 4.9 20 6 20H18C19.1 20 20 19.1 20 18V16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <p style={{ fontSize: '21px', fontWeight: 500, marginBottom: '8px' }}>拖入你的原片</p>
                <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '16px' }}>图片</p>
              </>
            )}
          </div>

          <div style={{ padding: '16px 20px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', maxWidth: '480px', width: '100%', marginTop: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div><p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px' }}>我的额度</p><p style={{ fontSize: '21px', fontWeight: 600 }}><span style={{ color: '#D4AF37' }}>{total}</span><span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.4)', marginLeft: '4px' }}>次</span></p></div>
          </div>
        </div>
      )}

      {/* AI 识别步骤 */}
      {step === 'recognition' && (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '130px 24px 80px' }}>
          <div style={{ width: '80px', height: '80px', marginBottom: '32px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#D4AF37', animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: '21px', fontWeight: 500, marginBottom: '8px' }}>AI 正在分析图片...</p>
          <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.5)' }}>识别品类和最佳风格</p>
        </div>
      )}

      {/* 风格选择步骤 */}
      {step === 'style' && previewUrl && (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '130px 24px 40px', maxWidth: '480px', margin: '0 auto' }}>
          {/* 步骤指示器 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '32px' }}>
            {['upload', 'style', 'processing', 'result'].map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s === 'style' || s === 'upload' ? '#D4AF37' : 'rgba(255, 255, 255, 0.2)' }} />
                {i < 3 && <div style={{ width: '24px', height: '2px', background: s === 'upload' ? '#D4AF37' : 'rgba(255, 255, 255, 0.1)' }} />}
              </div>
            ))}
          </div>

          {/* 图片预览 */}
          <div style={{ marginBottom: '24px', borderRadius: '16px', overflow: 'hidden', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <img src={previewUrl} alt="预览" style={{ width: '100%', aspectRatio: '9/16', objectFit: 'cover', display: 'block' }} />
          </div>

          {/* 风格选择 */}
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '17px', fontWeight: 500, marginBottom: '16px' }}>选择风格</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {styles.map((style) => (
                <div
                  key={style.id}
                  onClick={() => setSelectedPreset(style.id)}
                  style={{
                    padding: '16px', borderRadius: '12px',
                    border: selectedPreset === style.id ? '2px solid #D4AF37' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: selectedPreset === style.id ? 'rgba(212, 175, 55, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                    cursor: 'pointer',
                  }}
                >
                  <p style={{ fontSize: '15px', fontWeight: 500, marginBottom: '4px' }}>{style.name}</p>
                  <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)' }}>{style.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 按钮 */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button onClick={() => setStep('upload')} style={{ flex: 1, padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'transparent', color: 'white', fontSize: '16px', fontWeight: 500, cursor: 'pointer' }}>返回</button>
            <button onClick={handleStartProcessing} style={{ flex: 2, padding: '16px', borderRadius: '12px', border: 'none', background: '#D4AF37', color: '#000', fontSize: '16px', fontWeight: 600, cursor: 'pointer' }}>开始升级</button>
          </div>
        </div>
      )}

      {/* 处理步骤 */}
      {step === 'processing' && (
        <ProcessingAnimation
          progress={progress}
          currentStage={currentStage}
          mode="image"
        />
      )}

      {/* 结果步骤 */}
      {step === 'result' && resultData && (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '130px 24px 40px', maxWidth: '480px', margin: '0 auto' }}>
          <p style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', textAlign: 'center' }}>升级完成！</p>

          <div style={{ marginBottom: '24px', borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>
            <img src={resultData.enhancedUrl} alt="结果" style={{ width: '100%', aspectRatio: '9/16', objectFit: 'cover' }} />
            {/* 下载按钮 */}
            <button
              onClick={async () => {
                try {
                  const response = await fetch(resultData.enhancedUrl);
                  const blob = await response.blob();
                  const blobUrl = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = blobUrl;
                  link.download = 'vidluxe_enhanced.jpg';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(blobUrl);
                } catch {
                  alert('下载失败，请重试');
                }
              }}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(0, 0, 0, 0.6)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
            </button>
          </div>

          {resultData.score && (
            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.2)', marginBottom: '24px' }}>
              <p style={{ fontSize: '15px', fontWeight: 500, color: '#D4AF37' }}>种草评分: {resultData.score.overall}分</p>
            </div>
          )}

          <button onClick={handleReset} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', background: '#D4AF37', color: '#000', fontSize: '16px', fontWeight: 600, cursor: 'pointer' }}>继续使用</button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

export default ImageSingleFlow;
