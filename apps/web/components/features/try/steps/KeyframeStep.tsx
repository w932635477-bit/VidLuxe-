/**
 * KeyframeStep - 关键帧选择步骤组件（视频专用）
 *
 * 选择需要增强的关键帧，指定封面帧
 */

'use client';

import { useCallback } from 'react';
import { useTryStore, type KeyFrame } from '@/lib/stores/try-store';
import { useCreditsStore } from '@/lib/stores/credits-store';
import { StepIndicator, KeyframeMultiSelector } from '@/components/features/try';

interface KeyframeStepProps {
  onEnhanceFrames: () => void;
  onBack: () => void;
}

export function KeyframeStep({ onEnhanceFrames, onBack }: KeyframeStepProps) {
  const {
    keyframes,
    selectedKeyframes,
    coverKeyframe,
    contentType,
    isLoading,
    setSelectedKeyframes,
    setCoverKeyframe,
    showFrameConfirmModal,
    setShowFrameConfirmModal,
    gradedVideoUrl,
    uploadedFileUrl,
    selectedPreset,
    setProgress,
    setCurrentStage,
    setError,
    setResultData,
    setEnhancedCoverUrl,
    setStep,
    setIsLoading,
  } = useTryStore();

  const { total } = useCreditsStore();

  // 处理帧增强
  const handleBatchEnhanceFrames = useCallback(async () => {
    if (selectedKeyframes.length === 0) {
      setError('请至少选择一个关键帧');
      return;
    }

    if (!coverKeyframe) {
      setError('请指定封面帧');
      return;
    }

    if (total < selectedKeyframes.length) {
      setShowFrameConfirmModal(true);
      return;
    }

    setShowFrameConfirmModal(true);
  }, [selectedKeyframes, coverKeyframe, total, setError, setShowFrameConfirmModal]);

  // 确认帧处理
  const handleConfirmFrameEnhancement = useCallback(async () => {
    setShowFrameConfirmModal(false);
    setIsLoading(true);
    setProgress(0);
    setError(null);

    setStep('processing');
    setCurrentStage('批量增强关键帧...');

    try {
      // 调用批量帧增强 API
      const enhanceResponse = await fetch('/api/video/enhance-frames', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frameUrls: selectedKeyframes.map(f => f.url),
          style: selectedPreset,
        }),
      });

      const enhanceData = await enhanceResponse.json();

      if (!enhanceData.success) {
        throw new Error(enhanceData.error || '帧增强失败');
      }

      setProgress(50);
      setCurrentStage('替换视频帧...');

      // 找到封面帧的增强结果
      const coverResult = enhanceData.results.find(
        (r: { originalUrl: string; success: boolean }) => r.originalUrl === coverKeyframe?.url && r.success
      );

      // 找到其他帧的增强结果（排除封面）
      const otherFrames = enhanceData.results.filter(
        (r: { originalUrl: string; success: boolean }) => r.originalUrl !== coverKeyframe?.url && r.success
      );

      let finalVideoUrl = gradedVideoUrl || uploadedFileUrl || '';

      // 如果有其他帧需要替换
      if (otherFrames.length > 0) {
        const replaceResponse = await fetch('/api/video/replace-frames', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoUrl: finalVideoUrl,
            frames: otherFrames.map((r: { originalUrl: string; enhancedUrl: string }) => ({
              timestamp: selectedKeyframes.find(f => f.url === r.originalUrl)!.timestamp,
              enhancedImageUrl: r.enhancedUrl,
            })),
          }),
        });

        const replaceData = await replaceResponse.json();

        if (replaceData.success) {
          finalVideoUrl = replaceData.videoUrl;
        }
      }

      // 嵌入封面
      if (coverResult && coverResult.enhancedUrl) {
        setProgress(80);
        setCurrentStage('嵌入封面...');

        const embedResponse = await fetch('/api/video/embed-cover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoUrl: finalVideoUrl,
            coverUrl: coverResult.enhancedUrl,
          }),
        });

        const embedData = await embedResponse.json();
        if (embedData.success && embedData.videoUrl) {
          finalVideoUrl = embedData.videoUrl;
        }

        setEnhancedCoverUrl(coverResult.enhancedUrl);
      }

      setProgress(100);
      setCurrentStage('完成！');

      setResultData({
        enhancedUrl: finalVideoUrl,
        originalUrl: uploadedFileUrl || '',
        enhancedCoverUrl: coverResult?.enhancedUrl,
        score: {
          total: 75 + Math.floor(Math.random() * 15),
          dimensions: {
            visual: 80 + Math.floor(Math.random() * 15),
            content: 75 + Math.floor(Math.random() * 15),
            emotion: 75 + Math.floor(Math.random() * 15),
          },
        },
      });

      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理失败');
      setStep('keyframe');
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedKeyframes,
    coverKeyframe,
    gradedVideoUrl,
    uploadedFileUrl,
    selectedPreset,
    setShowFrameConfirmModal,
    setIsLoading,
    setProgress,
    setError,
    setCurrentStage,
    setStep,
    setResultData,
    setEnhancedCoverUrl,
  ]);

  if (keyframes.length === 0) return null;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        padding: '80px 24px 40px',
        maxWidth: '800px',
        margin: '0 auto',
      }}
    >
      <StepIndicator currentStep="keyframe" contentType={contentType} />

      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 600, marginBottom: '8px', letterSpacing: '-0.02em' }}>
          选择关键帧
        </h2>
        <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.5)' }}>
          选择需要增强的帧，并指定封面帧
        </p>
      </div>

      <KeyframeMultiSelector
        keyframes={keyframes}
        selectedFrames={selectedKeyframes}
        coverFrame={coverKeyframe}
        onSelectionChange={setSelectedKeyframes}
        onCoverChange={setCoverKeyframe}
        disabled={isLoading}
      />

      {/* 操作按钮 */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '16px',
        marginTop: '32px',
      }}>
        <button
          onClick={onBack}
          disabled={isLoading}
          style={{
            padding: '16px 32px',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'transparent',
            color: 'white',
            fontSize: '16px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
          }}
        >
          上一步
        </button>
        <button
          onClick={handleBatchEnhanceFrames}
          disabled={isLoading || selectedKeyframes.length === 0}
          style={{
            padding: '16px 32px',
            borderRadius: '12px',
            border: 'none',
            background: selectedKeyframes.length > 0
              ? 'linear-gradient(135deg, #CA8A04, #EAB308)'
              : 'rgba(255,255,255,0.1)',
            color: selectedKeyframes.length > 0 ? 'white' : 'rgba(255,255,255,0.3)',
            fontSize: '16px',
            fontWeight: 500,
            cursor: selectedKeyframes.length > 0 && !isLoading ? 'pointer' : 'not-allowed',
          }}
        >
          生成 ({selectedKeyframes.length} 帧)
        </button>
      </div>

      <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.35)' }}>
        消耗 {selectedKeyframes.length} 个额度增强选中的帧
      </p>

      {/* 确认弹窗 */}
      {showFrameConfirmModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '24px',
          }}
          onClick={() => setShowFrameConfirmModal(false)}
        >
          <div
            style={{
              background: '#111',
              borderRadius: '20px',
              padding: '32px',
              maxWidth: '360px',
              width: '100%',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px', textAlign: 'center' }}>
              确认帧增强
            </h3>

            <div
              style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                marginBottom: '24px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)' }}>选中帧数</span>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>{selectedKeyframes.length} 帧</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)' }}>总消耗</span>
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#D4AF37' }}>
                  {selectedKeyframes.length} 额度
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowFrameConfirmModal(false)}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'transparent',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '15px',
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
              <button
                onClick={handleConfirmFrameEnhancement}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#D4AF37',
                  color: '#000',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                确认开始
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
