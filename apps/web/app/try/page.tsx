'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  StyleSourceSelector,
  type StyleType,
  type StyleSourceType,
  getStylePreset,
} from '@/components/features/try/StyleSelector';
import { BeforeAfterSlider } from '@/components/features/landing/BeforeAfterSlider';

type Step = 'upload' | 'style' | 'processing' | 'result';
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
    score?: {
      overall: number;
      grade: string;
      dimensions: {
        color: number;
        composition: number;
        typography: number;
        detail: number;
      };
    };
  };
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

// 内容类型检测
function detectContentType(file: File): ContentType {
  if (file.type.startsWith('video/')) return 'video';
  return 'image';
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

// 处理步骤指示器
function StepIndicator({ currentStep }: { currentStep: Step }) {
  const steps = [
    { id: 'upload', label: '上传' },
    { id: 'style', label: '风格' },
    { id: 'processing', label: '处理' },
    { id: 'result', label: '完成' },
  ];

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

  // 结果
  const [resultData, setResultData] = useState<{
    enhancedUrl: string;
    originalUrl: string;
    score?: {
      overall: number;
      grade: string;
      dimensions: {
        color: number;
        composition: number;
        typography: number;
        detail: number;
      };
    };
  } | null>(null);

  // 额度
  const [quotaRemaining, setQuotaRemaining] = useState(10);

  // 风格相关
  const [styleSourceType, setStyleSourceType] = useState<StyleSourceType>('preset');
  const [selectedPreset, setSelectedPreset] = useState<StyleType>('magazine');
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referenceFileUrl, setReferenceFileUrl] = useState<string | null>(null);

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
    const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
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
        setStep('style');
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
              让 AI 为你的内容注入高级感
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
                  <span>MP4 / MOV 最大 100MB</span>
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

      {/* ===== 步骤 2: 选择风格 ===== */}
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
          <StepIndicator currentStep="style" />

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
                更换内容
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

      {/* ===== 步骤 3: 处理中 ===== */}
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
          <StepIndicator currentStep="processing" />

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
              { label: '生成评分', threshold: 100 },
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

      {/* ===== 步骤 4: 结果 ===== */}
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
          <StepIndicator currentStep="result" />

          {/* 对比滑块 */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
            <div style={{ width: '100%', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 80px rgba(0, 0, 0, 0.5)' }}>
              <BeforeAfterSlider
                originalImage={resultData.originalUrl}
                enhancedImage={resultData.enhancedUrl}
              />
            </div>
          </div>

          {/* 评分区域 */}
          {resultData.score && (
            <div
              style={{
                padding: '20px',
                borderRadius: '20px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px' }}>
                    高级感评分
                  </p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ fontSize: '36px', fontWeight: 600, color: '#D4AF37', letterSpacing: '-0.02em' }}>
                      {resultData.score.overall}
                    </span>
                    <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)' }}>/ 100</span>
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    borderRadius: '100px',
                    background: 'rgba(212, 175, 55, 0.15)',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                  }}
                >
                  <span style={{ fontSize: '20px', fontWeight: 700, color: '#D4AF37' }}>
                    {resultData.score.grade}
                  </span>
                  <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
                    {resultData.score.grade === 'S' ? '完美' : resultData.score.grade === 'A' ? '优秀' : resultData.score.grade === 'B' ? '良好' : '一般'}
                  </span>
                </div>
              </div>

              {/* 维度分数 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: '色彩协调', score: resultData.score.dimensions.color },
                  { label: '构图美感', score: resultData.score.dimensions.composition },
                  { label: '排版舒适', score: resultData.score.dimensions.typography },
                  { label: '细节精致', score: resultData.score.dimensions.detail },
                ].map((item) => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', width: '56px', flexShrink: 0 }}>
                      {item.label}
                    </span>
                    <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${item.score}%`,
                          height: '100%',
                          borderRadius: '2px',
                          background: item.score >= 80 ? '#D4AF37' : item.score >= 60 ? '#B8962E' : '#8E8E93',
                          transition: 'width 0.6s ease',
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#D4AF37', width: '28px', textAlign: 'right' }}>
                      {item.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 主按钮 */}
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
              cursor: 'pointer',
              marginBottom: '12px',
              textAlign: 'center',
              textDecoration: 'none',
              display: 'block',
            }}
          >
            {contentType === 'video' ? '下载高清视频' : '下载高清图'}
          </a>

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
