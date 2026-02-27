/**
 * VideoFlow - 视频流程
 *
 * upload → recognition → style → colorGrade → keyframe → processing → result
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useVideoStore } from '@/lib/stores/flows';
import { useCreditsStore } from '@/lib/stores/credits-store';
import { ProcessingAnimation } from '@/components/features/try/flows/shared/ProcessingAnimation';
import { KeyframeSelector } from './KeyframeSelector';
import type { StyleType, StyleSourceType, KeyFrame } from '@/lib/types/flow';

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

export function VideoFlow() {
  const [anonymousId, setAnonymousId] = useState<string>('');
  const [replaceFrames, setReplaceFrames] = useState<KeyFrame[]>([]);

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
    referenceFileUrl,
    colorGradeExplanation,
    gradedVideoUrl,
    keyframes,
    selectedKeyframe,
    enhancedCoverUrl,
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
    setReferenceFileUrl,
    setColorGradeExplanation,
    setGradedVideoUrl,
    setKeyframes,
    setSelectedKeyframe,
    setEnhancedCoverUrl,
    setResultData,
    reset,
  } = useVideoStore();

  const { total, fetchCredits } = useCreditsStore();

  // 替换帧切换
  const handleReplaceToggle = useCallback((frame: KeyFrame) => {
    setReplaceFrames((prev) =>
      prev.some((f) => f.timestamp === frame.timestamp && f.url === frame.url)
        ? prev.filter((f) => !(f.timestamp === frame.timestamp && f.url === frame.url))
        : [...prev, frame]
    );
  }, []);

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

  // 处理视频上传
  const handleFileChange = useCallback(async (file: File) => {
    const isVideo = file.type.startsWith('video/');
    if (!isVideo) {
      setError('此页面仅支持视频上传，请使用图片上传页面');
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
        }, 1500);
      } else {
        setError(data.error || '上传失败');
      }
    } catch {
      setError('网络错误');
    } finally {
      setIsLoading(false);
    }
  }, [setPreviewUrl, setUploadedFile, setIsLoading, setUploadedFileUrl, setStep, setSelectedCategory, setError]);

  // 风格确认后进入调色
  const handleStyleConfirm = useCallback(() => {
    setStep('colorGrade');
    analyzeAndGrade();
  }, [setStep]);

  // 分析并调色
  const analyzeAndGrade = useCallback(async () => {
    if (!uploadedFileUrl) return;

    setIsLoading(true);
    setProgress(0);
    setCurrentStage('正在分析视频色彩...');

    try {
      const response = await fetch('/api/video/color-grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: uploadedFileUrl }),
      });

      const data = await response.json();

      if (data.success) {
        setColorGradeExplanation(data.explanation || '已优化视频色彩');
        setGradedVideoUrl(data.gradedVideoUrl || uploadedFileUrl);
        setProgress(100);

        // 自动进入关键帧选择
        setTimeout(() => {
          fetchKeyframes();
        }, 1000);
      } else {
        setError(data.error || '调色失败');
        // 即使失败也继续
        fetchKeyframes();
      }
    } catch {
      setError('调色请求失败');
      fetchKeyframes();
    } finally {
      setIsLoading(false);
    }
  }, [uploadedFileUrl, setColorGradeExplanation, setGradedVideoUrl]);

  // 获取关键帧
  const fetchKeyframes = useCallback(async () => {
    if (!uploadedFileUrl) return;

    setStep('keyframe');
    setIsLoading(true);
    setCurrentStage('正在提取关键帧...');

    try {
      const response = await fetch('/api/video/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: uploadedFileUrl }),
      });

      const data = await response.json();

      if (data.success && data.keyframes && data.keyframes.length > 0) {
        setKeyframes(data.keyframes);
        setSelectedKeyframe(data.keyframes[0]);
      } else {
        setError(data.error || '提取关键帧失败，请重试');
        setStep('upload');
      }
    } catch (error) {
      console.error('提取关键帧失败:', error);
      setError('提取关键帧失败，请检查视频格式后重试');
      setStep('upload');
    } finally {
      setIsLoading(false);
      setCurrentStage('');
    }
  }, [uploadedFileUrl, previewUrl, setStep, setKeyframes, setSelectedKeyframe]);

  // 关键帧确认后开始处理
  const handleKeyframeConfirm = useCallback(async () => {
    if (!selectedKeyframe) {
      setError('请选择一个关键帧');
      return;
    }

    setStep('processing');
    setProgress(0);
    setCurrentStage('正在增强封面...');

    try {
      // 增强封面
      const enhanceResponse = await fetch('/api/video/enhance-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyframeUrl: selectedKeyframe.url,
          style: selectedPreset,
        }),
      });

      const enhanceData = await enhanceResponse.json();

      if (enhanceData.success && enhanceData.enhancedUrl) {
        setEnhancedCoverUrl(enhanceData.enhancedUrl);
      }

      setProgress(100);
      setCurrentStage('处理完成！');

      // 设置结果
      setResultData({
        enhancedUrl: enhancedCoverUrl || selectedKeyframe.url,
        originalUrl: uploadedFileUrl || '',
        enhancedCoverUrl: enhancedCoverUrl,
      });

      fetchCredits(anonymousId);
      setStep('result');
    } catch {
      setError('处理失败');
      setStep('keyframe');
    }
  }, [selectedKeyframe, selectedPreset, uploadedFileUrl, enhancedCoverUrl, anonymousId, setStep, setProgress, setCurrentStage, setEnhancedCoverUrl, setResultData, fetchCredits, setError]);

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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h1 style={{ fontSize: '48px', fontWeight: 600, letterSpacing: '-0.03em', marginBottom: '16px' }}>视频升级</h1>
            <p style={{ fontSize: '21px', color: 'rgba(255, 255, 255, 0.5)', maxWidth: '400px' }}>上传视频，AI 自动优化</p>
          </div>

          <div
            onClick={() => !isLoading && document.getElementById('video-file-input')?.click()}
            style={{
              width: '100%', maxWidth: '320px', aspectRatio: '9/16',
              borderRadius: '24px', border: '2px dashed rgba(255, 255, 255, 0.15)',
              background: 'rgba(255, 255, 255, 0.02)', cursor: isLoading ? 'wait' : 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <input id="video-file-input" type="file" accept="video/*" style={{ display: 'none' }} onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileChange(file); e.target.value = ''; }} disabled={isLoading} />
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
                <p style={{ fontSize: '21px', fontWeight: 500, marginBottom: '8px' }}>拖入你的视频</p>
                <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.4)' }}>MP4 / MOV 最大 500MB</p>
              </>
            )}
          </div>

          <div style={{ padding: '16px 20px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', maxWidth: '480px', width: '100%', marginTop: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div><p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px' }}>我的额度</p><p style={{ fontSize: '21px', fontWeight: 600 }}><span style={{ color: '#D4AF37' }}>{total}</span><span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.4)', marginLeft: '4px' }}>次</span></p></div>
          </div>
        </div>
      )}

      {/* 风格选择步骤 */}
      {step === 'style' && previewUrl && (
        <div style={{ display: 'flex', flexDirection: 'column', padding: '24px', maxWidth: '480px', margin: '0 auto' }}>
          {/* 视频预览 */}
          <div style={{ marginBottom: '24px', borderRadius: '16px', overflow: 'hidden', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <video src={previewUrl} style={{ width: '100%', maxHeight: '60vh', display: 'block', margin: '0 auto' }} muted autoPlay loop playsInline />
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
            <button onClick={handleStyleConfirm} style={{ flex: 2, padding: '16px', borderRadius: '12px', border: 'none', background: '#D4AF37', color: '#000', fontSize: '16px', fontWeight: 600, cursor: 'pointer' }}>继续</button>
          </div>
        </div>
      )}

      {/* 调色步骤 */}
      {step === 'colorGrade' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ width: '80px', height: '80px', marginBottom: '32px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#D4AF37', animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: '21px', fontWeight: 500, marginBottom: '8px' }}>{currentStage || '正在调色...'}</p>
          {colorGradeExplanation && <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center', maxWidth: '320px' }}>{colorGradeExplanation}</p>}
        </div>
      )}

      {/* 关键帧选择步骤 */}
      {step === 'keyframe' && (
        <div style={{ display: 'flex', flexDirection: 'column', padding: '24px', maxWidth: '480px', margin: '0 auto' }}>
          {isLoading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#D4AF37', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                <p style={{ color: 'rgba(255,255,255,0.6)' }}>{currentStage || '提取关键帧...'}</p>
              </div>
            </div>
          ) : (
            <>
              <KeyframeSelector
                keyframes={keyframes}
                coverFrame={selectedKeyframe}
                replaceFrames={replaceFrames}
                onCoverSelect={setSelectedKeyframe}
                onReplaceToggle={handleReplaceToggle}
                previewUrl={previewUrl || ''}
              />

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button onClick={() => setStep('style')} style={{ flex: 1, padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'transparent', color: 'white', fontSize: '16px', fontWeight: 500, cursor: 'pointer' }}>返回</button>
                <button onClick={handleKeyframeConfirm} disabled={!selectedKeyframe} style={{ flex: 2, padding: '16px', borderRadius: '12px', border: 'none', background: selectedKeyframe ? '#D4AF37' : 'rgba(255, 255, 255, 0.1)', color: selectedKeyframe ? '#000' : 'rgba(255, 255, 255, 0.3)', fontSize: '16px', fontWeight: 600, cursor: selectedKeyframe ? 'pointer' : 'not-allowed' }}>
                  开始增强 ({replaceFrames.length + 1} 张)
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* 处理步骤 */}
      {step === 'processing' && (
        <ProcessingAnimation
          progress={progress}
          currentStage={currentStage}
          mode="video"
        />
      )}

      {/* 结果步骤 */}
      {step === 'result' && resultData && (
        <div style={{ display: 'flex', flexDirection: 'column', padding: '24px', maxWidth: '480px', margin: '0 auto' }}>
          <p style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', textAlign: 'center' }}>
            {replaceFrames.length > 0 ? '视频增强完成！' : '封面生成完成！'}
          </p>

          {/* 封面预览 */}
          {enhancedCoverUrl && (
            <div style={{ marginBottom: '24px', borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>
              <img src={enhancedCoverUrl} alt="增强封面" style={{ width: '100%', aspectRatio: '9/16', objectFit: 'cover' }} />
              {/* 封面下载按钮 - 右上角 */}
              <button
                onClick={async () => {
                  try {
                    const response = await fetch(enhancedCoverUrl);
                    const blob = await response.blob();
                    const blobUrl = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = blobUrl;
                    link.download = 'vidluxe_cover.jpg';
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
          )}

          {/* 下载按钮区域 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            {/* 下载封面按钮 */}
            {enhancedCoverUrl && (
              <button
                onClick={async () => {
                  try {
                    const response = await fetch(enhancedCoverUrl);
                    const blob = await response.blob();
                    const blobUrl = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = blobUrl;
                    link.download = 'vidluxe_cover.jpg';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(blobUrl);
                  } catch {
                    alert('下载失败，请重试');
                  }
                }}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                下载封面图片
              </button>
            )}

            {/* 下载增强视频按钮 - 金色 */}
            {resultData.enhancedVideoUrl && (
              <button
                onClick={async () => {
                  try {
                    const response = await fetch(resultData.enhancedVideoUrl!);
                    const blob = await response.blob();
                    const blobUrl = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = blobUrl;
                    link.download = 'vidluxe_enhanced_video.mp4';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(blobUrl);
                  } catch {
                    alert('下载失败，请重试');
                  }
                }}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#D4AF37',
                  color: '#000',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
                下载增强视频
              </button>
            )}
          </div>

          <button onClick={handleReset} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'transparent', color: 'white', fontSize: '16px', fontWeight: 500, cursor: 'pointer' }}>继续使用</button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

export default VideoFlow;
