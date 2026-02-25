/**
 * ColorGradeStep - 调色确认步骤组件（视频专用）
 *
 * 显示 AI 色彩分析结果，用户确认后应用调色
 */

'use client';

import { useCallback } from 'react';
import { useTryStore } from '@/lib/stores/try-store';
import { StepIndicator } from '@/components/features/try';

interface ColorGradeStepProps {
  onConfirm: () => void;
  onSkip: () => void;
}

export function ColorGradeStep({ onConfirm, onSkip }: ColorGradeStepProps) {
  const {
    previewUrl,
    contentType,
    colorGradeExplanation,
    isLoading,
    setIsLoading,
    setColorGradeExplanation,
    setGradedVideoUrl,
    setKeyframes,
    setSelectedKeyframes,
    setCoverKeyframe,
    setSelectedKeyframe,
    setStep,
    setProgress,
    setCurrentStage,
    setError,
    uploadedFileUrl,
  } = useTryStore();

  // 确认调色
  const handleConfirmColorGrade = useCallback(async () => {
    if (!uploadedFileUrl) {
      setError('视频URL丢失');
      return;
    }

    setIsLoading(true);
    setError(null);
    setProgress(0);
    setCurrentStage('应用智能调色...');

    try {
      // 步骤 1: 应用调色
      const gradeResponse = await fetch('/api/video/color-grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: uploadedFileUrl,
          action: 'process',
          previewOnly: false,
        }),
      });

      const gradeData = await gradeResponse.json();

      if (!gradeData.success || !gradeData.gradedVideoUrl) {
        throw new Error(gradeData.error || '调色处理失败');
      }

      setGradedVideoUrl(gradeData.gradedVideoUrl);
      setProgress(50);
      setCurrentStage('分析调色后视频...');

      // 步骤 2: 从调色后视频提取关键帧
      const analyzeResponse = await fetch('/api/video/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: gradeData.gradedVideoUrl }),
      });

      const analyzeData = await analyzeResponse.json();

      if (!analyzeData.success || !analyzeData.keyframes?.length) {
        throw new Error(analyzeData.error || '视频分析失败');
      }

      setKeyframes(analyzeData.keyframes);
      // 初始化多选：默认选中最后一个作为封面
      setSelectedKeyframes([analyzeData.keyframes[analyzeData.keyframes.length - 1]]);
      setCoverKeyframe(analyzeData.keyframes[analyzeData.keyframes.length - 1]);
      setSelectedKeyframe(analyzeData.keyframes[analyzeData.keyframes.length - 1]);
      setStep('keyframe');
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理失败');
    } finally {
      setIsLoading(false);
    }
  }, [
    uploadedFileUrl,
    setIsLoading,
    setError,
    setProgress,
    setCurrentStage,
    setGradedVideoUrl,
    setKeyframes,
    setSelectedKeyframes,
    setCoverKeyframe,
    setSelectedKeyframe,
    setStep,
  ]);

  if (!previewUrl) return null;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        padding: '80px 24px 40px',
        maxWidth: '480px',
        margin: '0 auto',
      }}
    >
      <StepIndicator currentStep="colorGrade" contentType={contentType} />

      {/* 预览图 */}
      <div style={{ marginBottom: '24px' }}>
        <div
          style={{
            position: 'relative',
            borderRadius: '16px',
            overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <video
            src={previewUrl}
            style={{ width: '100%', aspectRatio: '9/16', objectFit: 'cover', display: 'block' }}
            muted autoPlay loop playsInline
          />
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(8px)',
              fontSize: '12px',
              fontWeight: 500,
              color: 'rgba(255, 255, 255, 0.9)',
            }}
          >
            原视频
          </div>
        </div>
      </div>

      {/* AI 分析结果 */}
      <div
        style={{
          padding: '20px',
          borderRadius: '16px',
          background: 'rgba(212, 175, 55, 0.06)',
          border: '1px solid rgba(212, 175, 55, 0.12)',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ fontSize: '20px' }}></span>
          <span style={{ fontSize: '16px', fontWeight: 600, color: '#D4AF37' }}>
            AI 色彩分析结果
          </span>
        </div>
        <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'rgba(255, 255, 255, 0.85)' }}>
          {colorGradeExplanation}
        </p>
      </div>

      {/* 操作按钮 */}
      <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
        <button
          onClick={onSkip}
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            background: 'transparent',
            color: isLoading ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.7)',
            fontSize: '17px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          跳过调色
        </button>
        <button
          onClick={handleConfirmColorGrade}
          disabled={isLoading}
          style={{
            flex: 2,
            padding: '16px',
            borderRadius: '12px',
            border: 'none',
            background: isLoading ? '#8E8E93' : '#D4AF37',
            color: '#000000',
            fontSize: '17px',
            fontWeight: 600,
            cursor: isLoading ? 'wait' : 'pointer',
          }}
        >
          {isLoading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span style={{
                width: '16px',
                height: '16px',
                border: '2px solid transparent',
                borderTopColor: '#000',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
              处理中...
            </span>
          ) : '应用智能调色'}
        </button>
      </div>

      {/* 处理中覆盖层 */}
      {isLoading && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.92)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '24px',
          }}
        >
          {/* 动态进度环 */}
          <div style={{ width: '120px', height: '120px', marginBottom: '40px', position: 'relative' }}>
            <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', position: 'absolute', inset: 0 }}>
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(212, 175, 55, 0.15)" strokeWidth="2" />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#D4AF37"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="70 283"
                style={{ animation: 'rotate 2s linear infinite' }}
              />
            </svg>
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(212, 175, 55, 0.2) 0%, transparent 70%)',
                animation: 'pulse-glow 2s ease-in-out infinite',
              }}
            />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '32px' }}>
              🎨
            </div>
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '12px', letterSpacing: '-0.02em' }}>
            智能调色中
          </h2>
          <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '40px', textAlign: 'center' }}>
            正在分析视频色彩特征...
          </p>
          <p style={{ position: 'absolute', bottom: '40px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.35)' }}>
            调色通常需要 10-30 秒，请耐心等待
          </p>

          <style>{`
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            @keyframes rotate { from { stroke-dashoffset: 0; } to { stroke-dashoffset: 283; } }
            @keyframes pulse-glow { 0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; } 50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.3; } }
          `}</style>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
