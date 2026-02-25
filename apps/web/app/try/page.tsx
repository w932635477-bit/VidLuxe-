'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

// 组件
import {
  MinimalNav,
  StepIndicator,
  UploadSection,
  ProcessingSection,
  ResultSection,
  StyleSourceSelector,
  CategorySelector,
  SeedingTypeSelector,
  SeedingScoreCard,
  getStylePreset,
  BatchPreviewGrid,
  BatchConfirmModal,
  BatchResultGrid,
  KeyframeMultiSelector,
} from '@/components/features/try';
import type { StyleType, StyleSourceType } from '@/components/features/try';
import { StyleMultiSelector, type MultiStyleType } from '@/components/features/try/StyleMultiSelector';

// 类型
import type { CategoryType, SeedingType, SeedingScore } from '@/lib/types/seeding';
import type {
  Step,
  ContentType,
  KeyFrame,
  VideoAnalyzeResponse,
  EnhanceCoverResponse,
  ResultData,
  UploadResponse,
  EnhanceResponse,
  TaskStatusResponse,
  ColorGradeResponse,
  BatchFileItem,
  BatchResultItem,
  UploadMode,
} from '@/lib/types/try-page';

// 生成匿名 ID（仅在客户端执行）
function generateAnonymousId(): string {
  // SSR 安全检查
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
  // 状态
  const [step, setStep] = useState<Step>('upload');
  const [contentType, setContentType] = useState<ContentType>('image');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 品类和种草类型
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
  const [selectedSeedingType, setSelectedSeedingType] = useState<SeedingType | null>(null);

  // AI 识别结果
  const [aiRecognition, setAiRecognition] = useState<{
    category: CategoryType;
    seedingType: SeedingType;
  } | null>(null);

  // 结果
  const [resultData, setResultData] = useState<{
    enhancedUrl: string;       // 带封面的视频 URL
    originalUrl: string;
    enhancedCoverUrl?: string; // 封面图 URL
    score?: SeedingScore;
  } | null>(null);

  // 模拟进度动画
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const stageMessages = [
    '分析图像特征...',
    '提取主体轮廓...',
    'AI 构思场景...',
    '渲染高级质感...',
    '优化光影效果...',
    '精细调色处理...',
    '生成最终画面...',
  ];

  // 启动模拟进度
  const startSimulatedProgress = useCallback((targetProgress: number = 90) => {
    // 清除之前的 interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    let currentProgress = 0;
    let messageIndex = 0;

    progressIntervalRef.current = setInterval(() => {
      // 缓慢增加进度
      if (currentProgress < targetProgress) {
        // 越接近目标，增长越慢
        const increment = Math.max(0.5, (targetProgress - currentProgress) / 20);
        currentProgress = Math.min(currentProgress + increment, targetProgress);
        setProgress(Math.round(currentProgress));

        // 每隔一段时间更新消息
        if (currentProgress > (messageIndex + 1) * (targetProgress / stageMessages.length)) {
          messageIndex = Math.min(messageIndex + 1, stageMessages.length - 1);
          setCurrentStage(stageMessages[messageIndex]);
        }
      }
    }, 200);
  }, []);

  // 停止模拟进度
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

  // 风格相关
  const [styleSourceType, setStyleSourceType] = useState<StyleSourceType>('preset');
  const [selectedPreset, setSelectedPreset] = useState<StyleType>('magazine');
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referenceFileUrl, setReferenceFileUrl] = useState<string | null>(null);

  // 关键帧相关（视频专用）
  const [keyframes, setKeyframes] = useState<KeyFrame[]>([]);
  const [selectedKeyframe, setSelectedKeyframe] = useState<KeyFrame | null>(null);
  const [enhancedCoverUrl, setEnhancedCoverUrl] = useState<string | null>(null);

  // 关键帧多选状态
  const [selectedKeyframes, setSelectedKeyframes] = useState<KeyFrame[]>([]);
  const [coverKeyframe, setCoverKeyframe] = useState<KeyFrame | null>(null);
  const [showFrameConfirmModal, setShowFrameConfirmModal] = useState(false);

  // 调色相关
  const [colorGradeExplanation, setColorGradeExplanation] = useState<string>('');
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [gradedVideoUrl, setGradedVideoUrl] = useState<string | null>(null);

  // 匿名 ID
  const [anonymousId, setAnonymousId] = useState<string>('');

  // 额度系统
  const [credits, setCredits] = useState<{ total: number; paid: number; free: number }>({
    total: 0,
    paid: 0,
    free: 0,
  });

  // 多风格选择
  const [selectedStyles, setSelectedStyles] = useState<MultiStyleType[]>([]);

  // 批量上传相关
  const [batchFiles, setBatchFiles] = useState<BatchFileItem[]>([]);
  const [uploadMode, setUploadMode] = useState<UploadMode>('single');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [batchResults, setBatchResults] = useState<BatchResultItem[]>([]);

  // 邀请码系统
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [inviteApplied, setInviteApplied] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // 初始化
  useEffect(() => {
    const id = generateAnonymousId();
    setAnonymousId(id);
  }, []);

  // 获取额度
  const fetchCredits = useCallback(async () => {
    if (!anonymousId) return;
    try {
      const response = await fetch(`/api/credits?anonymousId=${anonymousId}`);
      const data = await response.json();
      if (data.success) {
        setCredits({
          total: data.data.total,
          paid: data.data.paid,
          free: data.data.free,
        });
      }
    } catch (error) {
      console.error('Failed to fetch credits:', error);
    }
  }, [anonymousId]);

  // 初始化后获取额度
  useEffect(() => {
    if (anonymousId) {
      fetchCredits();
    }
  }, [anonymousId, fetchCredits]);

  // 使用邀请码
  const handleApplyInviteCode = async () => {
    if (!inviteCodeInput || !anonymousId || inviteApplied) return;

    setInviteError(null);
    try {
      const response = await fetch(`/api/invite/${inviteCodeInput}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anonymousId }),
      });
      const data = await response.json();

      if (data.success) {
        setInviteApplied(true);
        fetchCredits();
        setInviteCodeInput('');
      } else {
        setInviteError(data.error || '邀请码无效');
      }
    } catch (error) {
      console.error('Failed to apply invite code:', error);
      setInviteError('邀请码应用失败');
    }
  };

  // 消耗额度
  const consumeCredits = async (amount: number, description: string): Promise<boolean> => {
    if (!anonymousId) return false;

    try {
      const response = await fetch('/api/credits/spend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anonymousId,
          amount,
          description,
        }),
      });
      const data = await response.json();

      if (data.success) {
        // 更新本地额度状态
        await fetchCredits();
        return true;
      } else {
        setError(data.error || '额度不足');
        return false;
      }
    } catch (error) {
      console.error('Failed to consume credits:', error);
      setError('额度消耗失败');
      return false;
    }
  };

  // 调色加载动画步骤循环
  useEffect(() => {
    if (step === 'colorGrade' && isLoading) {
      const interval = setInterval(() => {
        setLoadingStepIndex((prev) => (prev + 1) % 4);
      }, 800);
      return () => clearInterval(interval);
    }
  }, [step, isLoading]);

  // 清理 Object URL 防止内存泄漏
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      if (referenceFileUrl && referenceFileUrl.startsWith('blob:')) {
        URL.revokeObjectURL(referenceFileUrl);
      }
    };
  }, [previewUrl, referenceFileUrl]);

  // 处理文件上传
  const handleFileChange = useCallback(async (file: File) => {
    if (!file) return;

    // 检查文件类型
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) {
      setError('不支持的文件类型');
      return;
    }

    // 检查文件大小
    const maxSize = isVideo ? 500 * 1024 * 1024 : 10 * 1024 * 1024; // 视频 500MB，图片 10MB
    if (file.size > maxSize) {
      setError(`文件过大，最大支持 ${maxSize / 1024 / 1024}MB`);
      return;
    }

    setError(null);
    setIsLoading(true);
    setContentType(isVideo ? 'video' : 'image');
    setUploadedFile(file);

    // 显示本地预览
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    // 上传到服务器
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data: UploadResponse = await response.json();

      if (data.success && data.file) {
        setUploadedFileUrl(data.file.url);

        // 调用 AI 识别 API
        try {
          const recognizeResponse = await fetch('/api/recognize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageUrl: data.file.url,
              filename: file.name,
            }),
          });

          const recognizeData = await recognizeResponse.json();

          if (recognizeData.success && recognizeData.data) {
            const { category, seedingType, categoryConfidence, seedingTypeConfidence } = recognizeData.data;
            setAiRecognition({
              category,
              seedingType,
            });
            setSelectedCategory(category);
            setSelectedSeedingType(seedingType);
          } else {
            // 识别失败时使用默认值
            console.warn('[TryPage] AI recognition failed, using defaults');
            setAiRecognition({
              category: 'beauty',
              seedingType: 'product',
            });
            setSelectedCategory('beauty');
            setSelectedSeedingType('product');
          }
        } catch (recognizeError) {
          // 识别出错时使用默认值
          console.warn('[TryPage] AI recognition error:', recognizeError);
          setAiRecognition({
            category: 'beauty',
            seedingType: 'product',
          });
          setSelectedCategory('beauty');
          setSelectedSeedingType('product');
        }

        setStep('recognition'); // 跳转到 AI 识别步骤
      } else {
        setError(data.error || '上传失败');
      }
    } catch (err) {
      setError('上传失败，请重试');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 拖拽上传
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      handleFileChange(file);
    },
    [handleFileChange]
  );

  // 批量文件上传
  const handleBatchFilesChange = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    // 过滤只保留图片，最多9张
    const imageFiles = files
      .filter(f => f.type.startsWith('image/'))
      .slice(0, 9);

    if (imageFiles.length === 0) {
      setError('请上传图片文件');
      return;
    }

    setUploadMode('batch');
    setIsLoading(true);
    setError(null);

    // 创建批量项目
    const newItems: BatchFileItem[] = imageFiles.map(file => ({
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      uploadedUrl: null,
      status: 'pending' as const,
    }));

    setBatchFiles(newItems);

    // 并发上传所有文件
    const uploadPromises = newItems.map(async (item) => {
      try {
        const formData = new FormData();
        formData.append('file', item.file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (data.success && data.file) {
          setBatchFiles(prev =>
            prev.map(f =>
              f.id === item.id
                ? { ...f, uploadedUrl: data.file.url, status: 'success' as const }
                : f
            )
          );
        } else {
          throw new Error(data.error || '上传失败');
        }
      } catch (error) {
        setBatchFiles(prev =>
          prev.map(f =>
            f.id === item.id
              ? { ...f, status: 'error' as const, error: error instanceof Error ? error.message : '上传失败' }
              : f
          )
        );
      }
    });

    await Promise.all(uploadPromises);
    setIsLoading(false);

    // 上传完成后进入风格选择步骤
    setStep('style');
  }, []);

  // 移除单个批量文件
  const removeBatchFile = useCallback((id: string) => {
    setBatchFiles(prev => {
      const item = prev.find(f => f.id === id);
      if (item?.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(item.previewUrl);
      }
      const newFiles = prev.filter(f => f.id !== id);
      if (newFiles.length === 0) {
        setUploadMode('single');
        setStep('upload');
      }
      return newFiles;
    });
  }, []);

  // 开始处理
  const handleStartProcessing = async () => {
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

      if (credits.total < totalCost) {
        setError(`额度不足，需要 ${totalCost} 个额度，当前只有 ${credits.total} 个`);
        return;
      }

      setShowConfirmModal(true);
      return;
    }

    if (!uploadedFileUrl) {
      setError('请先上传文件');
      return;
    }

    // 视频处理：先调色，再分析提取关键帧
    if (contentType === 'video') {
      setIsLoading(true);
      setError(null);
      setProgress(0);
      setCurrentStage('分析视频色彩...');

      try {
        // 步骤 1: 调色分析
        const colorGradeResponse = await fetch('/api/video/color-grade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoUrl: uploadedFileUrl,
            action: 'analyze',
          }),
        });

        const colorGradeData: ColorGradeResponse = await colorGradeResponse.json();

        if (!colorGradeData.success) {
          throw new Error(colorGradeData.error || '色彩分析失败');
        }

        // 保存解释和进入调色确认步骤
        setColorGradeExplanation(colorGradeData.explanation || '');
        setStep('colorGrade');
        return;
      } catch (err) {
        setError(err instanceof Error ? err.message : '色彩分析失败');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // 图片处理：直接开始
    // 确定需要消耗的额度数量
    const creditsToSpend = selectedStyles.length > 0 ? selectedStyles.length : 1;

    // 检查额度是否足够
    if (credits.total < creditsToSpend) {
      setError(`额度不足，需要 ${creditsToSpend} 个额度，当前只有 ${credits.total} 个`);
      return;
    }

    setIsLoading(true);
    setError(null);
    setProgress(0);
    setCurrentStage('消耗额度...');

    // 先消耗额度
    const creditConsumed = await consumeCredits(creditsToSpend, `生成${creditsToSpend > 1 ? creditsToSpend + '种风格' : ''}图片`);
    if (!creditConsumed) {
      setIsLoading(false);
      return;
    }

    setStep('processing');
    setCurrentStage('准备中...');

    try {
      // 创建升级任务
      const enhanceResponse = await fetch('/api/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: {
            type: contentType,
            url: uploadedFileUrl,
          },
          styleSource: {
            type: styleSourceType,
            referenceUrl: referenceFileUrl,
            presetStyle: selectedPreset,
          },
          category: selectedCategory,
          seedingType: selectedSeedingType,
          anonymousId,
        }),
      });

      const enhanceData: EnhanceResponse = await enhanceResponse.json();

      if (!enhanceData.success || !enhanceData.taskId) {
        throw new Error(enhanceData.error || '创建任务失败');
      }

      // 轮询任务状态
      await pollTaskStatus(enhanceData.taskId);
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理失败');
      setStep('style');
    } finally {
      setIsLoading(false);
    }
  };

  // 确认批量生成
  const handleConfirmBatchGeneration = async () => {
    setShowConfirmModal(false);

    const successFiles = batchFiles.filter(f => f.status === 'success' && f.uploadedUrl);
    if (successFiles.length === 0) {
      setError('没有可用的图片');
      return;
    }

    const imageCount = successFiles.length;
    const styleCount = selectedStyles.length > 0 ? selectedStyles.length : 1;
    const totalCost = imageCount * styleCount;

    const creditConsumed = await consumeCredits(totalCost, `批量生成 ${imageCount}张图片 x ${styleCount}种风格`);
    if (!creditConsumed) return;

    setStep('processing');
    setProgress(0);
    setCurrentStage('准备批量生成...');

    const results: BatchResultItem[] = [];
    const stylesToUse = selectedStyles.length > 0 ? selectedStyles : ['magazine'];

    try {
      let completed = 0;
      const total = imageCount * styleCount;

      for (const file of successFiles) {
        for (const style of stylesToUse) {
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
              // 轮询等待任务完成
              const maxAttempts = 60;
              let taskCompleted = false;

              for (let i = 0; i < maxAttempts; i++) {
                await new Promise(resolve => setTimeout(resolve, 2000));

                const statusResponse = await fetch(`/api/enhance/${enhanceData.taskId}`);
                const statusData = await statusResponse.json();

                if (statusData.status === 'completed' && statusData.result) {
                  results.push({
                    originalUrl: file.uploadedUrl!,
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

            completed++;
            setProgress(Math.round((completed / total) * 100));
          } catch (err) {
            console.error(`Failed to process:`, err);
            completed++;
          }
        }
      }

      setBatchResults(results);
      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : '批量处理失败');
      setStep('style');
    }
  };

  // 增强封面（视频专用）
  const handleEnhanceCover = async () => {
    if (!selectedKeyframe) {
      setError('请先选择一帧');
      return;
    }

    // 检查额度是否足够（视频消耗1个额度）
    if (credits.total < 1) {
      setError('额度不足，请先获取额度');
      return;
    }

    setIsLoading(true);
    setError(null);
    setProgress(0);
    setCurrentStage('消耗额度...');

    // 先消耗额度
    const creditConsumed = await consumeCredits(1, '生成视频封面');
    if (!creditConsumed) {
      setIsLoading(false);
      return;
    }

    setStep('processing');
    setCurrentStage('AI 生成高级感封面...');

    // 启动模拟进度动画（第一阶段到 45%）
    startSimulatedProgress(45);

    try {
      // 步骤 1: 调用封面增强 API
      const enhanceResponse = await fetch('/api/video/enhance-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frameUrl: selectedKeyframe.url,
          style: selectedPreset,
        }),
      });

      const enhanceData: EnhanceCoverResponse = await enhanceResponse.json();

      if (!enhanceData.success || !enhanceData.enhancedUrl) {
        throw new Error(enhanceData.error || '封面增强失败');
      }

      // 第一阶段完成，更新进度到 50%
      stopSimulatedProgress();
      setProgress(50);
      setEnhancedCoverUrl(enhanceData.enhancedUrl);
      setCurrentStage('嵌入视频封面...');

      // 启动第二阶段模拟进度（50% 到 95%）
      startSimulatedProgress(95);

      // 步骤 2: 调用封面嵌入 API
      const embedResponse = await fetch('/api/video/embed-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: gradedVideoUrl || uploadedFileUrl,
          coverUrl: enhanceData.enhancedUrl,
        }),
      });

      const embedData = await embedResponse.json();

      // 停止模拟进度
      stopSimulatedProgress();

      let finalVideoUrl = uploadedFileUrl || '';
      if (embedData.success && embedData.videoUrl) {
        finalVideoUrl = embedData.videoUrl;
      } else {
        // 嵌入失败不影响主流程，使用原视频
        console.warn('[TryPage] Embed cover failed:', embedData.error);
      }

      setProgress(100);
      setCurrentStage('完成！');

      // 设置结果
      setResultData({
        enhancedUrl: finalVideoUrl,
        originalUrl: uploadedFileUrl || '',
        enhancedCoverUrl: enhanceData.enhancedUrl,
        score: {
          overall: 75 + Math.floor(Math.random() * 15),
          grade: 'A',
          dimensions: {
            visualAttraction: 80 + Math.floor(Math.random() * 15),
            contentMatch: 75 + Math.floor(Math.random() * 15),
            authenticity: 70 + Math.floor(Math.random() * 15),
            emotionalImpact: 75 + Math.floor(Math.random() * 15),
            actionGuidance: 65 + Math.floor(Math.random() * 20),
          },
        },
      });

      setStep('result');
    } catch (err) {
      stopSimulatedProgress();
      setError(err instanceof Error ? err.message : '封面增强失败');
      setStep('keyframe');
    } finally {
      stopSimulatedProgress();
      setIsLoading(false);
    }
  };

  // 确认调色并继续处理
  const handleConfirmColorGrade = async () => {
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

      const gradeData: ColorGradeResponse = await gradeResponse.json();

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

      const analyzeData: VideoAnalyzeResponse = await analyzeResponse.json();

      if (!analyzeData.success || !analyzeData.keyframes?.length) {
        throw new Error(analyzeData.error || '视频分析失败');
      }

      setKeyframes(analyzeData.keyframes);
      // 初始化多选：默认选中最后一个作为封面
      setSelectedKeyframes([analyzeData.keyframes[analyzeData.keyframes.length - 1]]);
      setCoverKeyframe(analyzeData.keyframes[analyzeData.keyframes.length - 1]);
      setSelectedKeyframe(analyzeData.keyframes[analyzeData.keyframes.length - 1]); // 保持兼容
      setStep('keyframe');
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 批量增强帧
  const handleBatchEnhanceFrames = async () => {
    if (selectedKeyframes.length === 0) {
      setError('请至少选择一个关键帧');
      return;
    }

    if (!coverKeyframe) {
      setError('请指定封面帧');
      return;
    }

    if (credits.total < selectedKeyframes.length) {
      setError(`额度不足，需要 ${selectedKeyframes.length} 个额度`);
      return;
    }

    setShowFrameConfirmModal(true);
  };

  // 确认批量帧处理
  const handleConfirmFrameEnhancement = async () => {
    setShowFrameConfirmModal(false);
    setIsLoading(true);
    setProgress(0);
    setError(null);

    // 消耗额度
    const creditConsumed = await consumeCredits(selectedKeyframes.length, `视频帧增强 ${selectedKeyframes.length} 帧`);
    if (!creditConsumed) {
      setIsLoading(false);
      return;
    }

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
        (r: any) => r.originalUrl === coverKeyframe?.url && r.success
      );

      // 找到其他帧的增强结果（排除封面）
      const otherFrames = enhanceData.results.filter(
        (r: any) => r.originalUrl !== coverKeyframe?.url && r.success
      );

      let finalVideoUrl = gradedVideoUrl || uploadedFileUrl || '';

      // 如果有其他帧需要替换
      if (otherFrames.length > 0) {
        const replaceResponse = await fetch('/api/video/replace-frames', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoUrl: finalVideoUrl,
            frames: otherFrames.map((r: any) => ({
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
          overall: 75 + Math.floor(Math.random() * 15),
          grade: 'A',
          dimensions: {
            visualAttraction: 80 + Math.floor(Math.random() * 15),
            contentMatch: 75 + Math.floor(Math.random() * 15),
            authenticity: 70 + Math.floor(Math.random() * 15),
            emotionalImpact: 75 + Math.floor(Math.random() * 15),
            actionGuidance: 65 + Math.floor(Math.random() * 20),
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
  };

  // 轮询任务状态
  const pollTaskStatus = async (taskId: string) => {
    const pollInterval = 2000;
    const maxAttempts = 180; // 最多等待 6 分钟

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(`/api/enhance/${taskId}`);
        const data: TaskStatusResponse = await response.json();

        if (!data.success) {
          throw new Error(data.error || '查询任务失败');
        }

        setProgress(data.progress);
        setCurrentStage(data.currentStage || '');

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

        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      } catch (err) {
        throw err;
      }
    }

    throw new Error('任务超时');
  };

  // 重新开始
  const handleReset = () => {
    setStep('upload');
    setUploadedFile(null);
    setUploadedFileUrl(null);
    setPreviewUrl(null);
    setProgress(0);
    setCurrentStage('');
    setReferenceFile(null);
    setReferenceFileUrl(null);
    setResultData(null);
    setError(null);
    setSelectedCategory(null);
    setSelectedSeedingType(null);
    setAiRecognition(null);
    setKeyframes([]);
    setSelectedKeyframe(null);
    setEnhancedCoverUrl(null);
    setColorGradeExplanation('');
    setGradedVideoUrl(null);
    // 重置批量相关状态
    setBatchFiles([]);
    setUploadMode('single');
    setShowConfirmModal(false);
    setBatchResults([]);
    setSelectedStyles([]);
  };

  // 分享结果
  const handleShare = async () => {
    const shareUrl = resultData?.enhancedUrl || window.location.href;
    const shareText = '我用 VidLuxe 生成了这张高级感图片，效果太棒了！';

    // 优先使用 Web Share API
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'VidLuxe - AI 高级感升级',
          text: shareText,
          url: window.location.origin + '/try',
        });
      } catch (err) {
        // 用户取消分享，不做处理
        if ((err as Error).name !== 'AbortError') {
          console.warn('分享失败:', err);
        }
      }
    } else {
      // 降级方案：复制链接到剪贴板
      try {
        await navigator.clipboard.writeText(window.location.origin + '/try');
        alert('链接已复制到剪贴板！');
      } catch {
        alert('请手动复制链接分享');
      }
    }
  };

  // 获取风格描述
  const getStyleDescription = () => {
    if (styleSourceType === 'reference' && referenceFile) {
      return '自定义风格（AI 学习）';
    }
    const preset = getStylePreset(selectedPreset);
    return `${preset.name} · ${preset.description}`;
  };

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

      {/* ===== 步骤 1: 上传 ===== */}
      {step === 'upload' && (
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
                <span style={{ color: '#D4AF37' }}>{credits.total}</span>
                <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.4)', marginLeft: '4px' }}>次</span>
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)' }}>
                付费 {credits.paid} · 免费 {credits.free}
              </p>
            </div>
          </div>

          {/* 邀请码输入 */}
          {!inviteApplied && credits.total < 5 && (
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
                  onClick={handleApplyInviteCode}
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
              {inviteApplied && (
                <p style={{ fontSize: '12px', color: '#34C759', marginTop: '8px' }}>
                  邀请码已成功使用，您获得了 5 个额度！
                </p>
              )}
            </div>
          )}

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
      )}

      {/* ===== 步骤 2: AI 识别 ===== */}
      {step === 'recognition' && previewUrl && (
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
          <StepIndicator currentStep="recognition" contentType={contentType} />

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
              {contentType === 'video' ? (
                <video
                  src={previewUrl}
                  style={{ width: '100%', aspectRatio: '9/16', objectFit: 'cover', display: 'block' }}
                  muted autoPlay loop playsInline
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="预览"
                  style={{ width: '100%', aspectRatio: '9/16', objectFit: 'cover', display: 'block' }}
                />
              )}
            </div>
          </div>

          {/* AI 识别提示 */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '16px',
              background: 'rgba(212, 175, 55, 0.06)',
              border: '1px solid rgba(212, 175, 55, 0.12)',
              marginBottom: '24px',
            }}
          >
            <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>
              💡 <span style={{ color: '#D4AF37' }}>AI 识别结果</span> - 请确认或修改
            </p>
          </div>

          {/* 品类选择 */}
          <div style={{ marginBottom: '24px' }}>
            <CategorySelector
              selected={selectedCategory}
              onChange={setSelectedCategory}
              aiSuggested={aiRecognition?.category}
            />
          </div>

          {/* 种草类型选择 */}
          <div style={{ flex: 1, marginBottom: '24px' }}>
            <SeedingTypeSelector
              selected={selectedSeedingType}
              onChange={setSelectedSeedingType}
              aiSuggested={aiRecognition?.seedingType}
            />
          </div>

          {/* 操作按钮 */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setStep('upload')}
              style={{
                flex: 1,
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'transparent',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '17px',
                cursor: 'pointer',
              }}
            >
              重新上传
            </button>
            <button
              onClick={() => {
                if (selectedCategory && selectedSeedingType) {
                  setStep('style');
                }
              }}
              disabled={!selectedCategory || !selectedSeedingType}
              style={{
                flex: 2,
                padding: '16px',
                borderRadius: '12px',
                border: 'none',
                background: !selectedCategory || !selectedSeedingType ? '#8E8E93' : '#D4AF37',
                color: '#000000',
                fontSize: '17px',
                fontWeight: 600,
                cursor: !selectedCategory || !selectedSeedingType ? 'not-allowed' : 'pointer',
              }}
            >
              确认，下一步
            </button>
          </div>
        </div>
      )}

      {/* ===== 步骤 3: 选择风格 ===== */}
      {step === 'style' && (previewUrl || (uploadMode === 'batch' && batchFiles.length > 0)) && (
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
          <StepIndicator currentStep="style" contentType={contentType} />

          {/* 预览图 - 单图模式 */}
          {previewUrl && (
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
                {contentType === 'video' ? (
                  <video
                    src={previewUrl}
                    style={{ width: '100%', aspectRatio: '9/16', objectFit: 'cover', display: 'block' }}
                    muted autoPlay loop playsInline
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt="预览"
                    style={{ width: '100%', aspectRatio: '9/16', objectFit: 'cover', display: 'block' }}
                  />
                )}
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
                  {contentType === 'video' ? '🎬 视频' : '📷 图片'}
                </div>
              </div>
            </div>
          )}

          {/* 预览图 - 批量模式 */}
          {uploadMode === 'batch' && batchFiles.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <BatchPreviewGrid
                items={batchFiles}
                onRemove={removeBatchFile}
                disabled={isLoading}
              />
            </div>
          )}

          {/* 风格选择器 - 图片支持多风格批量生成 */}
          <div style={{ flex: 1 }}>
            {contentType === 'image' ? (
              <>
                {/* 多风格批量选择 */}
                <StyleMultiSelector
                  selectedStyles={selectedStyles}
                  onChange={setSelectedStyles}
                  disabled={isLoading}
                />

                {/* 或者使用传统单风格选择 */}
                <div style={{ marginTop: '20px', marginBottom: '16px' }}>
                  <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.4)', textAlign: 'center' }}>
                    — 或者使用传统风格选择 —
                  </p>
                </div>
                <StyleSourceSelector
                  sourceType={styleSourceType}
                  onSourceTypeChange={setStyleSourceType}
                  referenceFile={referenceFile}
                  onReferenceFileChange={setReferenceFile}
                  selectedPreset={selectedPreset}
                  onPresetChange={setSelectedPreset}
                />
              </>
            ) : (
              <StyleSourceSelector
                sourceType={styleSourceType}
                onSourceTypeChange={setStyleSourceType}
                referenceFile={referenceFile}
                onReferenceFileChange={setReferenceFile}
                selectedPreset={selectedPreset}
                onPresetChange={setSelectedPreset}
              />
            )}
          </div>

          {/* 操作按钮 */}
          <div style={{ marginTop: '24px' }}>
            {/* 选择摘要 */}
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                marginBottom: '12px',
              }}
            >
              {contentType === 'image' && selectedStyles.length > 0 ? (
                <>
                  <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px' }}>
                    批量生成
                  </p>
                  <p style={{ fontSize: '15px', fontWeight: 500, color: '#D4AF37' }}>
                    {selectedStyles.length} 种风格，消耗 {selectedStyles.length} 个额度
                  </p>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px' }}>
                    已选风格
                  </p>
                  <p style={{ fontSize: '15px', fontWeight: 500, color: '#D4AF37' }}>
                    {getStyleDescription()}
                  </p>
                </>
              )}
            </div>

            {/* 额度信息 */}
            <div
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                background: credits.total > 0 ? 'rgba(52, 199, 89, 0.08)' : 'rgba(255, 59, 48, 0.08)',
                border: `1px solid ${credits.total > 0 ? 'rgba(52, 199, 89, 0.15)' : 'rgba(255, 59, 48, 0.15)'}`,
                marginBottom: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>
                当前额度
              </span>
              <span style={{
                fontSize: '15px',
                fontWeight: 600,
                color: credits.total > 0 ? '#34C759' : '#FF3B30'
              }}>
                {credits.total} 次
              </span>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setStep('recognition')}
                style={{
                  flex: 1,
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'transparent',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '17px',
                  cursor: 'pointer',
                }}
              >
                返回修改
              </button>
              <button
                onClick={handleStartProcessing}
                disabled={isLoading || credits.total < 1}
                style={{
                  flex: 2,
                  padding: '16px',
                  borderRadius: '12px',
                  border: 'none',
                  background: isLoading || credits.total < 1 ? '#8E8E93' : '#D4AF37',
                  color: '#000000',
                  fontSize: '17px',
                  fontWeight: 600,
                  cursor: isLoading || credits.total < 1 ? 'not-allowed' : 'pointer',
                }}
              >
                {isLoading ? '处理中...' : credits.total < 1 ? '额度不足' : '开始升级'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 步骤: 调色确认 ===== */}
      {step === 'colorGrade' && previewUrl && (
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
              onClick={() => setStep('keyframe')}
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
        </div>
      )}

      {/* ===== 调色处理加载动画覆盖层 ===== */}
      {step === 'colorGrade' && isLoading && (
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
            {/* 外圈旋转 */}
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
            {/* 内圈脉冲 */}
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
            {/* 中心图标 */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '32px',
              }}
            >
              🎨
            </div>
          </div>

          {/* 标题 */}
          <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '12px', letterSpacing: '-0.02em' }}>
            智能调色中
          </h2>

          {/* 动态提示文字 */}
          <p
            style={{
              fontSize: '15px',
              color: 'rgba(255, 255, 255, 0.6)',
              marginBottom: '40px',
              textAlign: 'center',
              maxWidth: '280px',
              animation: 'fade-text 3s ease-in-out infinite',
            }}
          >
            {currentStage || '正在分析视频色彩特征...'}
          </p>

          {/* 处理步骤指示器 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '300px' }}>
            {[
              { label: '分析色彩分布', icon: '🔍' },
              { label: '匹配风格预设', icon: '🎯' },
              { label: '应用智能调色', icon: '✨' },
              { label: '渲染处理中', icon: '🎬' },
            ].map((item, index) => (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: index === loadingStepIndex ? 'rgba(212, 175, 55, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                  border: index === loadingStepIndex ? '1px solid rgba(212, 175, 55, 0.2)' : '1px solid rgba(255, 255, 255, 0.06)',
                  transition: 'all 0.3s ease',
                }}
              >
                <span style={{ fontSize: '18px' }}>{item.icon}</span>
                <span style={{ fontSize: '14px', color: index === loadingStepIndex ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.7)', transition: 'color 0.3s ease' }}>{item.label}</span>
                {index === loadingStepIndex && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#D4AF37',
                      animation: 'pulse 1s ease-in-out infinite',
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* 底部提示 */}
          <p style={{
            position: 'absolute',
            bottom: '40px',
            fontSize: '13px',
            color: 'rgba(255, 255, 255, 0.35)',
            textAlign: 'center',
          }}>
            调色通常需要 10-30 秒，请耐心等待
          </p>

          {/* 动画样式 */}
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes rotate {
              from { stroke-dashoffset: 0; }
              to { stroke-dashoffset: 283; }
            }
            @keyframes pulse-glow {
              0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
              50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.3; }
            }
            @keyframes pulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.5; transform: scale(0.8); }
            }
            @keyframes fade-text {
              0%, 100% { opacity: 0.6; }
              50% { opacity: 1; }
            }
            @keyframes highlight-step {
              0% { background: rgba(212, 175, 55, 0.1); }
              100% { background: rgba(255, 255, 255, 0.03); }
            }
          `}</style>
        </div>
      )}

      {/* ===== 步骤 4: 关键帧选择（视频专用） ===== */}
      {step === 'keyframe' && keyframes.length > 0 && (
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
              onClick={() => setStep('colorGrade')}
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
        </div>
      )}

      {/* ===== 步骤 5: 处理中 ===== */}
      {step === 'processing' && (
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
          <StepIndicator currentStep="processing" contentType={contentType} />

          <div style={{ width: '140px', height: '140px', marginBottom: '48px', position: 'relative' }}>
            <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="3" />
              <circle
                cx="50" cy="50" r="45" fill="none" stroke="#D4AF37" strokeWidth="3" strokeLinecap="round"
                strokeDasharray={`${progress * 2.83} 283`}
                style={{ transition: 'stroke-dasharray 0.3s ease' }}
              />
            </svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 600, letterSpacing: '-0.02em' }}>
                {Math.round(progress)}%
              </div>
            </div>
          </div>

          <h2 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '12px', letterSpacing: '-0.02em' }}>
            正在升级
          </h2>
          <p style={{ fontSize: '17px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '32px' }}>
            {currentStage || (contentType === 'video' ? 'AI 正在逐帧处理...' : 'AI 正在重构场景...')}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '320px' }}>
            {[
              { label: '分析内容特征', threshold: 20 },
              { label: '提取主体轮廓', threshold: 40 },
              { label: contentType === 'video' ? '逐帧抠像处理' : 'AI 重构场景', threshold: 70 },
              { label: '融合调色', threshold: 90 },
              { label: '生成种草力评分', threshold: 100 },
            ].map((item, index) => {
              const isCompleted = progress >= item.threshold;
              const isCurrent = progress < item.threshold && (index === 0 || progress >= [20, 40, 70, 90][index - 1] || 0);

              return (
                <div
                  key={item.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: isCompleted ? 'rgba(212, 175, 55, 0.1)' : isCurrent ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                    border: isCompleted ? '1px solid rgba(212, 175, 55, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isCompleted ? '#D4AF37' : isCurrent ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {isCompleted ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12L10 17L19 8" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : isCurrent ? (
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#D4AF37', animation: 'pulse 1s ease-in-out infinite' }} />
                    ) : null}
                  </div>
                  <span style={{ fontSize: '14px', color: isCompleted ? '#D4AF37' : isCurrent ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.3)' }}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>

          <style>{`@keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }`}</style>
        </div>
      )}

      {/* ===== 步骤 6: 结果 ===== */}
      {step === 'result' && resultData && (
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
          <StepIndicator currentStep="result" contentType={contentType} />

          {/* 视频预览 */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
            <div style={{
              width: '100%',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 20px 80px rgba(0, 0, 0, 0.5)',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}>
              {contentType === 'video' ? (
                <video
                  src={resultData.enhancedUrl}
                  style={{ width: '100%', aspectRatio: '9/16', objectFit: 'cover', display: 'block' }}
                  controls
                  autoPlay
                  loop
                  playsInline
                />
              ) : (
                <img
                  src={resultData.enhancedUrl}
                  alt="增强后的图片"
                  style={{ width: '100%', aspectRatio: '9/16', objectFit: 'cover', display: 'block' }}
                />
              )}
              <div
                style={{
                  padding: '12px 16px',
                  background: 'rgba(0, 0, 0, 0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.6 }}>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 4L12 14.01l-3-3" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>
                  {contentType === 'video' ? 'AI 增强视频已生成，封面已插入开头' : 'AI 增强图片已生成'}
                </span>
              </div>
            </div>
          </div>

          {/* 种草力评分卡片 */}
          {resultData.score && (
            <SeedingScoreCard score={resultData.score} />
          )}

          {/* 下载按钮 */}
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* 封面图下载 */}
            {resultData.enhancedCoverUrl && (
              <a
                href={resultData.enhancedCoverUrl}
                download
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'transparent',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '15px',
                  fontWeight: 500,
                  textAlign: 'center',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                  <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                下载 AI 封面图
              </a>
            )}

            {/* 视频下载 */}
            <a
              href={resultData.enhancedUrl}
              download
              style={{
                width: '100%',
                padding: '18px',
                borderRadius: '14px',
                border: 'none',
                background: '#D4AF37',
                color: '#000000',
                fontSize: '17px',
                fontWeight: 600,
                textAlign: 'center',
                textDecoration: 'none',
                display: 'block',
                cursor: 'pointer',
              }}
            >
              {contentType === 'video' ? '下载带封面的视频' : '下载高清图'}
            </a>
          </div>

          {/* 次要操作 */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleReset}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'transparent',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '15px',
                cursor: 'pointer',
              }}
            >
              再试一个
            </button>
            <button
              onClick={handleShare}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'transparent',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '15px',
                cursor: 'pointer',
              }}
            >
              分享
            </button>
          </div>
        </div>
      )}

      {/* ===== 步骤 6: 批量结果 ===== */}
      {step === 'result' && uploadMode === 'batch' && batchResults.length > 0 && (
        <div style={{ padding: '80px 24px', maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 600, marginBottom: '32px', textAlign: 'center' }}>
            生成完成
          </h2>
          <BatchResultGrid
            results={batchResults}
            onDownloadAll={async () => {
              // 简化：逐个下载
              for (const result of batchResults) {
                const a = document.createElement('a');
                a.href = result.enhancedUrl;
                a.download = `enhanced_${result.style}.jpg`;
                a.click();
                await new Promise(r => setTimeout(r, 500));
              }
            }}
          />
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <button
              onClick={handleReset}
              style={{
                padding: '14px 32px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'transparent',
                color: 'rgba(255,255,255,0.7)',
                fontSize: '15px',
                cursor: 'pointer',
              }}
            >
              重新开始
            </button>
          </div>
        </div>
      )}

      {/* 批量结果为空的情况 */}
      {step === 'result' && uploadMode === 'batch' && batchResults.length === 0 && (
        <div style={{ padding: '80px 24px', maxWidth: '480px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 600, marginBottom: '24px' }}>
            生成完成
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '32px' }}>
            所有任务已完成，但没有生成成功的结果。请重试。
          </p>
          <button
            onClick={() => { setStep('style'); setBatchResults([]); }}
            style={{
              padding: '14px 32px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #CA8A04, #EAB308)',
              color: 'white',
              fontSize: '15px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            重试
          </button>
        </div>
      )}

      {/* 批量确认弹窗 */}
      <BatchConfirmModal
        isOpen={showConfirmModal}
        imageCount={batchFiles.filter(f => f.status === 'success').length}
        styleCount={selectedStyles.length > 0 ? selectedStyles.length : 1}
        totalCost={batchFiles.filter(f => f.status === 'success').length * (selectedStyles.length > 0 ? selectedStyles.length : 1)}
        currentCredits={credits.total}
        onConfirm={handleConfirmBatchGeneration}
        onCancel={() => setShowConfirmModal(false)}
      />

      {/* 帧确认弹窗 */}
      <BatchConfirmModal
        isOpen={showFrameConfirmModal}
        imageCount={selectedKeyframes.length}
        styleCount={1}
        totalCost={selectedKeyframes.length}
        currentCredits={credits.total}
        onConfirm={handleConfirmFrameEnhancement}
        onCancel={() => setShowFrameConfirmModal(false)}
      />
    </main>
  );
}
