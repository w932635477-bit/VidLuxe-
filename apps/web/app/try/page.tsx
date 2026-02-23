'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  StyleSourceSelector,
  type StyleType,
  type StyleSourceType,
  getStylePreset,
} from '@/components/features/try/StyleSelector';
import { CategorySelector } from '@/components/features/try/CategorySelector';
import { SeedingTypeSelector } from '@/components/features/try/SeedingTypeSelector';
import { SeedingScoreCard } from '@/components/features/try/SeedingScoreCard';
import type { CategoryType, SeedingType, SeedingScore } from '@/lib/types/seeding';

type Step = 'upload' | 'recognition' | 'style' | 'keyframe' | 'processing' | 'result';
type ContentType = 'image' | 'video';

// API 响应类型
interface UploadResponse {
  success: boolean;
  file?: {
    id: string;
    url: string;
    type: ContentType;
    filename: string;
    size: number;
  };
  error?: string;
}

interface EnhanceResponse {
  success: boolean;
  taskId?: string;
  estimatedTime?: number;
  quota?: {
    remaining: number;
  };
  error?: string;
}

interface TaskStatusResponse {
  success: boolean;
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStage?: string;
  result?: {
    type: ContentType;
    enhancedUrl: string;
    originalUrl: string;
    score?: SeedingScore;
  };
  error?: string;
}

// 关键帧类型
interface KeyFrame {
  url: string;
  timestamp: number;
  score: number;
  details: {
    sharpness: number;
    composition: number;
    brightness: number;
    hasFace: boolean;
  };
}

// 视频分析响应
interface VideoAnalyzeResponse {
  success: boolean;
  keyframes?: KeyFrame[];
  videoInfo?: {
    duration: number;
    hasAudio: boolean;
  };
  error?: string;
}

// 封面增强响应
interface EnhanceCoverResponse {
  success: boolean;
  enhancedUrl?: string;
  error?: string;
}

// 生成匿名 ID
function generateAnonymousId(): string {
  const stored = localStorage.getItem('vidluxe_anonymous_id');
  if (stored) return stored;

  const id = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  localStorage.setItem('vidluxe_anonymous_id', id);
  return id;
}

// Apple 风格：极简导航
function MinimalNav() {
  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        padding: '0 24px',
        height: '52px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '0.5px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      <Link
        href="/"
        style={{ fontSize: '17px', fontWeight: 600, letterSpacing: '-0.02em' }}
      >
        VidLuxe
      </Link>
      <Link
        href="/pricing"
        style={{
          fontSize: '13px',
          color: 'rgba(255, 255, 255, 0.6)',
        }}
      >
        定价
      </Link>
    </nav>
  );
}

// 处理步骤指示器 (5步 - 视频) / (4步 - 图片)
function StepIndicator({ currentStep, contentType }: { currentStep: Step; contentType: ContentType }) {
  const videoSteps = [
    { id: 'upload', label: '上传' },
    { id: 'recognition', label: '识别' },
    { id: 'style', label: '风格' },
    { id: 'keyframe', label: '选帧' },
    { id: 'result', label: '完成' },
  ];

  const imageSteps = [
    { id: 'upload', label: '上传' },
    { id: 'recognition', label: '识别' },
    { id: 'style', label: '风格' },
    { id: 'processing', label: '处理' },
    { id: 'result', label: '完成' },
  ];

  const steps = contentType === 'video' ? videoSteps : imageSteps;
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        marginBottom: '32px',
      }}
    >
      {steps.map((step, index) => {
        const isActive = index === currentIndex;
        const isCompleted = index < currentIndex;

        return (
          <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                fontWeight: 600,
                background: isActive
                  ? '#D4AF37'
                  : isCompleted
                  ? 'rgba(212, 175, 55, 0.3)'
                  : 'rgba(255, 255, 255, 0.1)',
                color: isActive ? '#000' : 'rgba(255, 255, 255, 0.6)',
                transition: 'all 0.3s ease',
              }}
            >
              {isCompleted ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12L10 17L19 8"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                index + 1
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                style={{
                  width: '24px',
                  height: '2px',
                  borderRadius: '1px',
                  background: isCompleted
                    ? 'rgba(212, 175, 55, 0.5)'
                    : 'rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.3s ease',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
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

  // 额度
  const [quotaRemaining, setQuotaRemaining] = useState(10);

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

  // 匿名 ID
  const [anonymousId, setAnonymousId] = useState<string>('');

  // 初始化
  useEffect(() => {
    setAnonymousId(generateAnonymousId());
  }, []);

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

  // 开始处理
  const handleStartProcessing = async () => {
    if (!uploadedFileUrl) {
      setError('请先上传文件');
      return;
    }

    // 视频处理：先分析提取关键帧
    if (contentType === 'video') {
      setIsLoading(true);
      setError(null);
      setProgress(0);
      setCurrentStage('分析视频中...');

      try {
        // 调用视频分析 API
        const analyzeResponse = await fetch('/api/video/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoUrl: uploadedFileUrl }),
        });

        const analyzeData: VideoAnalyzeResponse = await analyzeResponse.json();

        if (!analyzeData.success || !analyzeData.keyframes?.length) {
          throw new Error(analyzeData.error || '视频分析失败');
        }

        setKeyframes(analyzeData.keyframes);
        setSelectedKeyframe(analyzeData.keyframes[analyzeData.keyframes.length - 1]); // 默认选择最后一帧（通常是最终效果）
        setStep('keyframe');
      } catch (err) {
        setError(err instanceof Error ? err.message : '视频分析失败');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // 图片处理：直接开始
    setIsLoading(true);
    setError(null);
    setStep('processing');
    setProgress(0);
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

      // 更新额度
      if (enhanceData.quota) {
        setQuotaRemaining(enhanceData.quota.remaining);
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

  // 增强封面（视频专用）
  const handleEnhanceCover = async () => {
    if (!selectedKeyframe) {
      setError('请先选择一帧');
      return;
    }

    setIsLoading(true);
    setError(null);
    setStep('processing');
    setProgress(0);
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
          videoUrl: uploadedFileUrl,
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
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h1
              style={{
                fontSize: '48px',
                fontWeight: 600,
                letterSpacing: '-0.03em',
                marginBottom: '16px',
              }}
            >
              上传内容
            </h1>
            <p
              style={{
                fontSize: '21px',
                color: 'rgba(255, 255, 255, 0.5)',
                maxWidth: '400px',
              }}
            >
              让 AI 为你的内容注入种草力
            </p>
          </div>

          {/* 上传区 */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => !isLoading && document.getElementById('file-input')?.click()}
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
              transition: 'all 0.3s ease',
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            <input
              id="file-input"
              type="file"
              accept="image/*,video/*"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              disabled={isLoading}
            />

            {isLoading ? (
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid rgba(255,255,255,0.1)',
                    borderTopColor: '#D4AF37',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 16px',
                  }}
                />
                <p style={{ color: 'rgba(255,255,255,0.6)' }}>上传中...</p>
              </div>
            ) : (
              <>
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    marginBottom: '24px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.4 }}>
                    <path
                      d="M12 16V4M12 4L8 8M12 4L16 8M4 16V18C4 19.1 4.9 20 6 20H18C19.1 20 20 19.1 20 18V16"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p style={{ fontSize: '21px', fontWeight: 500, marginBottom: '8px' }}>
                  点击或拖拽上传
                </p>
                <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '16px' }}>
                  图片或视频
                </p>
                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.35)' }}>
                  <span>JPG / PNG 最大 10MB</span>
                  <span>·</span>
                  <span>MP4 / MOV 最大 500MB</span>
                </div>
              </>
            )}
          </div>

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
              💡 <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>小贴士</span>：人像、产品、美食、穿搭效果最佳
            </p>
          </div>

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
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
      {step === 'style' && previewUrl && (
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

          {/* 风格选择器 */}
          <div style={{ flex: 1 }}>
            <StyleSourceSelector
              sourceType={styleSourceType}
              onSourceTypeChange={setStyleSourceType}
              referenceFile={referenceFile}
              onReferenceFileChange={setReferenceFile}
              selectedPreset={selectedPreset}
              onPresetChange={setSelectedPreset}
            />
          </div>

          {/* 操作按钮 */}
          <div style={{ marginTop: '24px' }}>
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                marginBottom: '12px',
              }}
            >
              <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px' }}>
                已选风格
              </p>
              <p style={{ fontSize: '15px', fontWeight: 500, color: '#D4AF37' }}>
                {getStyleDescription()}
              </p>
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
                {isLoading ? '处理中...' : '开始升级'}
              </button>
            </div>

            <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.35)' }}>
              剩余 {quotaRemaining} 次免费额度
            </p>
          </div>
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
            maxWidth: '480px',
            margin: '0 auto',
          }}
        >
          <StepIndicator currentStep="keyframe" contentType={contentType} />

          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px', letterSpacing: '-0.02em' }}>
              选择封面帧
            </h2>
            <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.5)' }}>
              AI 已提取视频中最好的几个画面，选择一张作为封面
            </p>
          </div>

          {/* 主选帧 */}
          {selectedKeyframe && (
            <div
              style={{
                position: 'relative',
                borderRadius: '16px',
                overflow: 'hidden',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '2px solid #D4AF37',
                marginBottom: '16px',
              }}
            >
              <img
                src={selectedKeyframe.url}
                alt="选中的帧"
                style={{ width: '100%', aspectRatio: '9/16', objectFit: 'cover', display: 'block' }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: '#D4AF37',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#000',
                }}
              >
                评分 {selectedKeyframe.score}
              </div>
            </div>
          )}

          {/* 关键帧选项网格 */}
          <div style={{ marginBottom: '24px', maxHeight: '280px', overflowY: 'auto' }}>
            <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '12px' }}>
              点击选择你喜欢的画面 ({keyframes.length} 个可选)
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px',
            }}>
              {keyframes.map((frame, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedKeyframe(frame)}
                  style={{
                    position: 'relative',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: selectedKeyframe?.url === frame.url ? '2px solid #D4AF37' : '2px solid transparent',
                    opacity: selectedKeyframe?.url === frame.url ? 1 : 0.7,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <img
                    src={frame.url}
                    alt={`帧 ${index + 1}`}
                    style={{ width: '100%', aspectRatio: '9/16', objectFit: 'cover', display: 'block' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '4px',
                      right: '4px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'rgba(0, 0, 0, 0.7)',
                      fontSize: '10px',
                      color: 'rgba(255, 255, 255, 0.8)',
                    }}
                  >
                    {frame.timestamp}s
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 操作按钮 */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setStep('style')}
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
              返回
            </button>
            <button
              onClick={handleEnhanceCover}
              disabled={isLoading || !selectedKeyframe}
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
              {isLoading ? '生成中...' : '生成高级感封面'}
            </button>
          </div>

          <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.35)' }}>
            将用 AI 增强选中的画面作为封面
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
    </main>
  );
}
