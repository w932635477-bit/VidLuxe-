/**
 * TryPage - 主页面（重构版）
 *
 * 使用 Zustand 状态管理和组件化步骤
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTryStore, type BatchResultItem } from '@/lib/stores/try-store';
import { useCreditsStore } from '@/lib/stores/credits-store';
import {
  UploadStep,
  RecognitionStep,
  StyleStep,
  ColorGradeStep,
  KeyframeStep,
  ProcessingStep,
  ResultStep,
} from '@/components/features/try/steps';
import { MinimalNav } from '@/components/features/try';

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

export default function TryPage() {
  const [anonymousId, setAnonymousId] = useState<string>('');
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    step,
    contentType,
    uploadMode,
    batchFiles,
    batchResults,
    selectedStyles,
    uploadedFileUrl,
    selectedCategory,
    selectedSeedingType,
    styleSourceType,
    referenceFileUrl,
    selectedPreset,
    previewUrl,
    keyframes,
    resultData,
    error,
    isLoading,
    setStep,
    setError,
    setIsLoading,
    setProgress,
    setCurrentStage,
    setResultData,
    setBatchResults,
    setKeyframes,
    setSelectedKeyframes,
    setCoverKeyframe,
    setSelectedKeyframe,
    setGradedVideoUrl,
    setColorGradeExplanation,
    setEnhancedCoverUrl,
    reset,
  } = useTryStore();

  const { total, fetchCredits } = useCreditsStore();

  // 初始化
  useEffect(() => {
    const id = generateAnonymousId();
    setAnonymousId(id);
  }, []);

  // 当 anonymousId 变化时获取额度
  useEffect(() => {
    if (anonymousId) {
      fetchCredits(anonymousId);
    }
  }, [anonymousId, fetchCredits]);

  // 模拟进度动画
  const startSimulatedProgress = useCallback((targetProgress: number = 90) => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    let currentProgress = 0;
    const stageMessages = [
      '分析图像特征...',
      '提取主体轮廓...',
      'AI 构思场景...',
      '渲染高级质感...',
      '优化光影效果...',
      '精细调色处理...',
      '生成最终画面...',
    ];
    let messageIndex = 0;

    progressIntervalRef.current = setInterval(() => {
      if (currentProgress < targetProgress) {
        const increment = Math.max(0.5, (targetProgress - currentProgress) / 20);
        currentProgress = Math.min(currentProgress + increment, targetProgress);
        setProgress(Math.round(currentProgress));

        if (currentProgress > (messageIndex + 1) * (targetProgress / stageMessages.length)) {
          messageIndex = Math.min(messageIndex + 1, stageMessages.length - 1);
          setCurrentStage(stageMessages[messageIndex]);
        }
      }
    }, 200);
  }, [setProgress, setCurrentStage]);

  const stopSimulatedProgress = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // 上传完成后进入识别步骤
  const handleUploadComplete = useCallback(() => {
    setStep('recognition');
  }, [setStep]);

  // 识别确认后进入风格选择
  const handleRecognitionConfirm = useCallback(() => {
    if (selectedCategory && selectedSeedingType) {
      setStep('style');
    }
  }, [selectedCategory, selectedSeedingType, setStep]);

  // 开始处理
  const handleStartProcessing = useCallback(async () => {
    // 批量图片处理
    if (uploadMode === 'batch' && batchFiles.length > 0) {
      const successFiles = batchFiles.filter(f => f.status === 'success' && f.uploadedUrl);
      if (successFiles.length === 0) {
        setError('没有可用的图片');
        return;
      }

      const imageCount = successFiles.length;
      const styleCount = selectedStyles.length > 0 ? selectedStyles.length : 1;
      const totalCost = imageCount * styleCount;

      if (total < totalCost) {
        // 显示额度不足弹窗由 StyleStep 处理
        return;
      }

      await handleBatchProcessing(successFiles, selectedStyles.length > 0 ? selectedStyles : ['magazine']);
      return;
    }

    if (!uploadedFileUrl) {
      setError('请先上传文件');
      return;
    }

    // 视频处理：先调色
    if (contentType === 'video') {
      setIsLoading(true);
      setError(null);
      setProgress(0);
      setCurrentStage('分析视频色彩...');

      try {
        const colorGradeResponse = await fetch('/api/video/color-grade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoUrl: uploadedFileUrl,
            action: 'analyze',
          }),
        });

        const colorGradeData = await colorGradeResponse.json();

        if (!colorGradeData.success) {
          throw new Error(colorGradeData.error || '色彩分析失败');
        }

        setColorGradeExplanation(colorGradeData.explanation || '');
        setStep('colorGrade');
      } catch (err) {
        setError(err instanceof Error ? err.message : '色彩分析失败');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // 图片处理：直接开始
    const creditsToSpend = selectedStyles.length > 0 ? selectedStyles.length : 1;

    if (total < creditsToSpend) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setProgress(0);
    setCurrentStage('准备中...');
    setStep('processing');

    try {
      await createEnhanceTask(uploadedFileUrl, styleSourceType === 'reference' ? referenceFileUrl : null, selectedPreset);
      fetchCredits(anonymousId);
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理失败');
      setStep('style');
    } finally {
      setIsLoading(false);
    }
  }, [
    uploadMode,
    batchFiles,
    selectedStyles,
    uploadedFileUrl,
    contentType,
    total,
    styleSourceType,
    referenceFileUrl,
    selectedPreset,
    setError,
    setIsLoading,
    setProgress,
    setCurrentStage,
    setStep,
    setColorGradeExplanation,
    fetchCredits,
  ]);

  // 创建增强任务
  const createEnhanceTask = async (
    imageUrl: string,
    refUrl: string | null,
    style: string
  ) => {
    const enhanceResponse = await fetch('/api/enhance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: { type: 'image', url: imageUrl },
        styleSource: {
          type: refUrl ? 'reference' : 'preset',
          referenceUrl: refUrl,
          presetStyle: style,
        },
        category: selectedCategory,
        seedingType: selectedSeedingType,
        anonymousId,
      }),
    });

    const enhanceData = await enhanceResponse.json();

    if (!enhanceData.success || !enhanceData.taskId) {
      throw new Error(enhanceData.error || '创建任务失败');
    }

    await pollTaskStatus(enhanceData.taskId);
  };

  // 轮询任务状态
  const pollTaskStatus = async (taskId: string) => {
    const pollInterval = 2000;
    const maxAttempts = 180;
    const stageLabels = ['AI 分析中...', '生成高级感...', '优化细节...', '最终润色...'];

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(`/api/enhance/${taskId}`);
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || '查询任务失败');
        }

        setProgress(data.progress);
        if (data.currentStage) {
          setCurrentStage(data.currentStage);
        } else {
          const stageIndex = Math.floor((i % 8) / 2);
          setCurrentStage(stageLabels[stageIndex]);
        }

        if (data.status === 'completed' && data.result) {
          setResultData({
            enhancedUrl: data.result.enhancedUrl,
            originalUrl: data.result.originalUrl,
            score: data.result.score,
          });
          setStep('result');
          return;
        }

        if (data.status === 'failed') {
          throw new Error(data.error || '任务失败');
        }

        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (err) {
        throw err;
      }
    }

    throw new Error('任务超时');
  };

  // 批量处理
  const handleBatchProcessing = async (
    files: { uploadedUrl: string }[],
    styles: string[]
  ) => {
    const results: BatchResultItem[] = [];
    const total = files.length * styles.length;
    let completed = 0;

    setStep('processing');
    setProgress(0);
    setCurrentStage('准备批量生成...');

    for (const file of files) {
      for (const style of styles) {
        try {
          setCurrentStage(`处理中... (${completed + 1}/${total})`);

          const enhanceResponse = await fetch('/api/enhance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: { type: 'image', url: file.uploadedUrl },
              styleSource: { type: 'preset', presetStyle: style },
              category: selectedCategory,
              seedingType: selectedSeedingType,
              anonymousId,
            }),
          });

          const enhanceData = await enhanceResponse.json();

          if (enhanceData.success && enhanceData.taskId) {
            const maxAttempts = 60;
            let taskCompleted = false;
            const stageLabels = ['分析图片...', 'AI 生成中...', '优化细节...'];

            for (let i = 0; i < maxAttempts; i++) {
              const stageIndex = Math.min(Math.floor(i / 15), 2);
              setCurrentStage(`${stageLabels[stageIndex]} (${completed + 1}/${total})`);

              await new Promise(resolve => setTimeout(resolve, 2000));

              const statusResponse = await fetch(`/api/enhance/${enhanceData.taskId}`);
              const statusData = await statusResponse.json();

              if (statusData.status === 'completed' && statusData.result) {
                results.push({
                  originalUrl: file.uploadedUrl,
                  enhancedUrl: statusData.result.enhancedUrl,
                  style: style,
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
        setProgress(Math.round((completed / total) * 100));
      }
    }

    fetchCredits(anonymousId);
    setBatchResults(results);
    setStep('result');
  };

  // 跳过调色直接进入关键帧选择
  const handleSkipColorGrade = useCallback(async () => {
    if (!uploadedFileUrl) {
      setError('视频URL丢失');
      return;
    }

    setIsLoading(true);
    setError(null);
    setProgress(0);
    setCurrentStage('分析视频...');

    try {
      const analyzeResponse = await fetch('/api/video/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: uploadedFileUrl }),
      });

      const analyzeData = await analyzeResponse.json();

      if (!analyzeData.success || !analyzeData.keyframes?.length) {
        throw new Error(analyzeData.error || '视频分析失败');
      }

      setKeyframes(analyzeData.keyframes);
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
    setError,
    setIsLoading,
    setProgress,
    setCurrentStage,
    setKeyframes,
    setSelectedKeyframes,
    setCoverKeyframe,
    setSelectedKeyframe,
    setStep,
  ]);

  // 重置
  const handleReset = useCallback(() => {
    stopSimulatedProgress();
    reset();
  }, [stopSimulatedProgress, reset]);

  // 重试
  const handleRetry = useCallback(() => {
    setStep('style');
  }, [setStep]);

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
          <button
            onClick={() => setError(null)}
            style={{
              marginLeft: '12px',
              background: 'none',
              border: 'none',
              color: '#FF3B30',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 步骤渲染 */}
      {step === 'upload' && (
        <UploadStep onUploadComplete={handleUploadComplete} />
      )}

      {step === 'recognition' && (
        <RecognitionStep
          onConfirm={handleRecognitionConfirm}
          onBack={() => setStep('upload')}
        />
      )}

      {step === 'style' && (
        <StyleStep
          onStartProcessing={handleStartProcessing}
          onBack={() => setStep('recognition')}
        />
      )}

      {step === 'colorGrade' && contentType === 'video' && (
        <ColorGradeStep
          onConfirm={() => {
            // ColorGradeStep 内部处理确认逻辑
          }}
          onSkip={handleSkipColorGrade}
        />
      )}

      {step === 'keyframe' && contentType === 'video' && keyframes.length > 0 && (
        <KeyframeStep
          onEnhanceFrames={() => {
            // KeyframeStep 内部处理帧增强逻辑
          }}
          onBack={() => setStep('colorGrade')}
        />
      )}

      {step === 'processing' && <ProcessingStep />}

      {step === 'result' && (
        <ResultStep
          onReset={handleReset}
          onRetry={handleRetry}
        />
      )}
    </main>
  );
}
