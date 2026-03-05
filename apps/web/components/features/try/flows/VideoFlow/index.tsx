/**
 * VideoFlow - 视频流程
 *
 * upload → style → keyframe → processing → result
 * 调色和增强合并到 processing 步骤
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useVideoStore } from '@/lib/stores/flows';
import { useCreditsStore } from '@/lib/stores/credits-store';
import { ProcessingAnimation } from '@/components/features/try/flows/shared/ProcessingAnimation';
import { KeyframeSelector } from './KeyframeSelector';
import { EffectFlowSelector } from '@/components/features/try/EffectFlowSelector';
import { uploadFile } from '@/lib/actions/upload';
import { getEffectById } from '@/lib/effect-presets';
import type { KeyFrame } from '@/lib/types/flow';
import type { ContentType } from '@/lib/content-types';

// 按钮样式 - Apple Premium Style
const BUTTON_STYLES = {
  // 返回按钮
  secondary: {
    flex: 1,
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'transparent',
    color: 'white',
    fontSize: '16px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 200ms cubic-bezier(0.25, 0.1, 0.25, 1)',
  } as const,
  // 主按钮
  primary: {
    flex: 2,
    padding: '16px',
    borderRadius: '12px',
    border: 'none',
    background: '#D4AF37',
    color: '#000',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 150ms cubic-bezier(0.25, 0.1, 0.25, 1)',
  } as const,
  // 禁用状态
  disabled: {
    flex: 2,
    padding: '16px',
    borderRadius: '12px',
    border: 'none',
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'not-allowed',
    transition: 'all 150ms cubic-bezier(0.25, 0.1, 0.25, 1)',
  } as const,
  // 继续使用按钮
  ghost: {
    width: '100%',
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    background: 'transparent',
    color: 'white',
    fontSize: '16px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 200ms cubic-bezier(0.25, 0.1, 0.25, 1)',
  } as const,
  // 下载按钮
  download: {
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
    transition: 'all 200ms cubic-bezier(0.25, 0.1, 0.25, 1)',
  } as const,
  // 金色下载按钮
  downloadPrimary: {
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
    transition: 'all 150ms cubic-bezier(0.25, 0.1, 0.25, 1)',
  } as const,
  // 小图标按钮
  icon: {
    position: 'absolute' as const,
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
    transition: 'all 150ms cubic-bezier(0.25, 0.1, 0.25, 1)',
  } as const,
};

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
    uploadedFileUrl,
    previewUrl,
    isLoading,
    progress,
    currentStage,
    error,
    selectedEffectId,
    effectIntensity,
    selectedContentType,
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
    setSelectedEffectId,
    setEffectIntensity,
    setSelectedContentType,
    setKeyframes,
    setSelectedKeyframe,
    setEnhancedCoverUrl,
    setResultData,
    reset,
  } = useVideoStore();

  const { total, fetchCredits } = useCreditsStore();

  // 我的邀请码状态
  const [myInviteCode, setMyInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

    // 获取我的邀请码
    if (id) {
      fetch(`/api/invite?anonymousId=${encodeURIComponent(id)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data?.code) {
            setMyInviteCode(data.data.code);
          }
        })
        .catch(err => console.error('Failed to fetch invite code:', err));
    }
  }, []);

  // 复制邀请链接
  const handleCopyInviteLink = useCallback(() => {
    if (!myInviteCode) return;
    const inviteUrl = `${window.location.origin}/try?invite=${myInviteCode}`;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [myInviteCode]);

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

    // 上传文件（使用 Server Action）
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const data = await uploadFile(formData);

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

  // 获取关键帧
  const fetchKeyframes = useCallback(async () => {
    if (!uploadedFileUrl) {
      console.log('[VideoFlow] fetchKeyframes: uploadedFileUrl is empty, skipping');
      return;
    }

    console.log('[VideoFlow] fetchKeyframes: starting with uploadedFileUrl:', uploadedFileUrl);
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
  }, [uploadedFileUrl, setStep, setKeyframes, setSelectedKeyframe, setIsLoading, setCurrentStage, setError]);

  // 风格确认后直接进入关键帧选择
  const handleStyleConfirm = useCallback(() => {
    console.log('[VideoFlow] handleStyleConfirm called, uploadedFileUrl:', uploadedFileUrl);
    fetchKeyframes();
  }, [uploadedFileUrl, fetchKeyframes]);

  // 关键帧确认后开始处理（包含调色和增强）
  const handleKeyframeConfirm = useCallback(async () => {
    if (!selectedKeyframe) {
      setError('请选择一个关键帧');
      return;
    }

    setStep('processing');
    setProgress(0);

    // 获取效果名称
    const effect = getEffectById(selectedEffectId);
    const effectName = effect?.name || '自定义风格';

    const stages = [
      '🎨 正在分析视频色彩...',
      '✨ 正在应用 ' + effectName + '...',
      '🖼️ 正在增强封面帧...',
    ];

    // 添加替换帧的阶段
    if (replaceFrames.length > 0) {
      stages.push(`📸 正在增强 ${replaceFrames.length} 张替换帧...`);
      stages.push('🎬 正在合成增强视频...');
    }
    stages.push('✅ 完成！');

    try {
      let currentProgress = 0;
      const progressPerStage = 100 / stages.length;

      // 1. 调色（可选，如果有替换帧）
      if (replaceFrames.length > 0) {
        setCurrentStage(stages[0]);
        const gradeResponse = await fetch('/api/video/color-grade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoUrl: uploadedFileUrl,
            effectId: selectedEffectId,
          }),
        });

        const gradeData = await gradeResponse.json();
        if (!gradeData.success) {
          console.warn('[VideoFlow] Color grade warning:', gradeData.error);
          // 继续处理，颜色分级不是必须的
        }
        currentProgress += progressPerStage;
        setProgress(Math.round(currentProgress));

        setCurrentStage(stages[1]);
        // 给用户一些反馈时间
        await new Promise(resolve => setTimeout(resolve, 500));
        currentProgress += progressPerStage;
        setProgress(Math.round(currentProgress));
      }

      // 2. 增强封面帧
      setCurrentStage(stages[2]);
      const enhanceResponse = await fetch('/api/video/enhance-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frameUrl: selectedKeyframe.url,
          effectId: selectedEffectId,
          intensity: effectIntensity,
          contentType: selectedContentType,
        }),
      });

      const enhanceData = await enhanceResponse.json();

      if (!enhanceData.success) {
        throw new Error(enhanceData.error || '封面增强失败');
      }

      let coverUrl = enhanceData.enhancedUrl || selectedKeyframe.url;
      setEnhancedCoverUrl(coverUrl);
      currentProgress += progressPerStage;
      setProgress(Math.round(currentProgress));

      // 3. 增强替换帧（如果有）
      const enhancedFrames: { timestamp: number; enhancedUrl: string }[] = [];

      if (replaceFrames.length > 0) {
        setCurrentStage(stages[3]);

        for (let i = 0; i < replaceFrames.length; i++) {
          const frame = replaceFrames[i];
          const frameResponse = await fetch('/api/video/enhance-cover', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              frameUrl: frame.url,
              effectId: selectedEffectId,
              intensity: effectIntensity,
              contentType: selectedContentType,
            }),
          });

          const frameData = await frameResponse.json();
          if (!frameData.success) {
            console.error(`替换帧 ${i + 1} 增强失败:`, frameData.error);
            continue;
          }
          if (frameData.enhancedUrl) {
            enhancedFrames.push({
              timestamp: frame.timestamp,
              enhancedUrl: frameData.enhancedUrl,
            });
          }
        }
        currentProgress += progressPerStage;
        setProgress(Math.round(currentProgress));

        // 4. 合成新视频
        setCurrentStage(stages[4]);
        let finalVideoUrl = uploadedFileUrl || '';

        if (enhancedFrames.length > 0) {
          const replaceResponse = await fetch('/api/video/replace-frames', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              videoUrl: uploadedFileUrl,
              frames: enhancedFrames,
            }),
          });

          const replaceData = await replaceResponse.json();
          if (replaceData.success && replaceData.outputUrl) {
            finalVideoUrl = replaceData.outputUrl;
            console.log('[VideoFlow] Video synthesized:', finalVideoUrl);
          }
        }
        currentProgress += progressPerStage;
        setProgress(Math.round(currentProgress));

        // 5. 完成
        setCurrentStage(stages[stages.length - 1]);
        setProgress(100);

        // 设置结果 - 使用合成后的视频 URL
        setResultData({
          enhancedUrl: coverUrl,
          originalUrl: uploadedFileUrl || '',
          enhancedCoverUrl: coverUrl,
          enhancedVideoUrl: finalVideoUrl, // 使用合成后的视频 URL
        });

        fetchCredits(anonymousId);

        // 短暂延迟后显示结果
        await new Promise(resolve => setTimeout(resolve, 500));
        setStep('result');
      } else {
        // 没有替换帧，只生成封面
        setCurrentStage(stages[stages.length - 1]);
        setProgress(100);

        setResultData({
          enhancedUrl: coverUrl,
          originalUrl: uploadedFileUrl || '',
          enhancedCoverUrl: coverUrl,
          enhancedVideoUrl: undefined,
        });

        fetchCredits(anonymousId);
        await new Promise(resolve => setTimeout(resolve, 500));
        setStep('result');
      }
    } catch (error) {
      console.error('处理失败:', error);
      setError(error instanceof Error ? error.message : '处理失败，请重试');
      setStep('keyframe');
    }
  }, [selectedKeyframe, selectedEffectId, effectIntensity, selectedContentType, uploadedFileUrl, replaceFrames, anonymousId, setStep, setProgress, setCurrentStage, setEnhancedCoverUrl, setResultData, fetchCredits, setError]);

  // 重置
  const handleReset = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    reset();
  }, [previewUrl, reset]);

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
            {myInviteCode && (
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '6px' }}>🎁 邀请码</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: '#34C759', letterSpacing: '0.05em' }}>{myInviteCode}</span>
                  <button onClick={handleCopyInviteLink} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(52, 199, 89, 0.3)', background: copied ? 'rgba(52, 199, 89, 0.2)' : 'rgba(52, 199, 89, 0.1)', color: copied ? '#34C759' : 'rgba(255, 255, 255, 0.8)', fontSize: '12px', cursor: 'pointer' }}>
                    {copied ? '已复制 ✓' : '复制'}
                  </button>
                </div>
              </div>
            )}
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

          {/* 内容类型 + 效果选择 */}
          <EffectFlowSelector
            selectedEffectId={selectedEffectId}
            selectedContentType={selectedContentType}
            effectIntensity={effectIntensity}
            onEffectSelect={setSelectedEffectId}
            onContentTypeSelect={setSelectedContentType}
            onIntensityChange={setEffectIntensity}
          />

          {/* 按钮 */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button onClick={() => setStep('upload')} style={BUTTON_STYLES.secondary}>返回</button>
            <button onClick={handleStyleConfirm} style={BUTTON_STYLES.primary}>继续</button>
          </div>
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
              />

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button onClick={() => setStep('style')} style={BUTTON_STYLES.secondary}>返回</button>
                <button
                  onClick={handleKeyframeConfirm}
                  disabled={!selectedKeyframe}
                  style={selectedKeyframe ? BUTTON_STYLES.primary : BUTTON_STYLES.disabled}
                >
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
            {resultData.enhancedVideoUrl ? '视频增强完成！' : '封面生成完成！'}
          </p>

          {/* 视频预览（如果有增强视频） */}
          {resultData.enhancedVideoUrl && (
            <div style={{ marginBottom: '24px', borderRadius: '16px', overflow: 'hidden', position: 'relative', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <video
                src={resultData.enhancedVideoUrl}
                style={{ width: '100%', maxHeight: '50vh', display: 'block', margin: '0 auto' }}
                controls
                playsInline
              />
              <p style={{ textAlign: 'center', fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', padding: '12px', margin: 0 }}>
                增强后视频预览
              </p>
            </div>
          )}

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
                style={BUTTON_STYLES.icon}
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
                style={BUTTON_STYLES.download}
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
                style={BUTTON_STYLES.downloadPrimary}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
                下载增强视频
              </button>
            )}
          </div>

          <button onClick={handleReset} style={BUTTON_STYLES.ghost}>继续使用</button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

export default VideoFlow;
