'use client';

import { useState, useCallback } from 'react';
import { Navbar } from '@/components/shared/Navbar';
import { StyleSelector, type StyleType } from '@/components/features/try/StyleSelector';
import { BeforeAfterSlider } from '@/components/features/landing/BeforeAfterSlider';
import { ScoreCard, type PremiumScore } from '@/components/features/landing/ScoreCard';

type Step = 'upload' | 'processing' | 'result';

// 小贴士轮播
const TIPS = [
  '低饱和色彩 + 柔和光线 + 干净背景 = 高级感公式',
  '人像照片建议选择「暖调奢华」风格',
  '产品照片建议选择「极简」风格',
  '美食照片建议选择「莫兰迪」风格',
];

// 演示用结果数据
const DEMO_RESULT = {
  beforeUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1422&fit=crop',
  afterUrl: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&h=1422&fit=crop',
  score: {
    total: 82,
    grade: 'A' as const,
    dimensions: {
      color: { score: 88, weight: 0.3 },
      composition: { score: 80, weight: 0.25 },
      typography: { score: 75, weight: 0.25 },
      detail: { score: 82, weight: 0.2 },
    },
    improvement: 18,
  },
};

export default function TryPage() {
  const [step, setStep] = useState<Step>('upload');
  const [selectedStyle, setSelectedStyle] = useState<StyleType>('warmLuxury');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentTip, setCurrentTip] = useState(0);

  // 处理文件上传
  const handleFileChange = useCallback((file: File) => {
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件');
      return;
    }

    // 验证文件大小（10MB）
    if (file.size > 10 * 1024 * 1024) {
      alert('文件大小不能超过 10MB');
      return;
    }

    setUploadedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }, []);

  // 拖拽上传
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleFileChange(file);
  }, [handleFileChange]);

  // 开始处理
  const handleStartProcessing = () => {
    setStep('processing');
    setProgress(0);

    // 模拟处理进度
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setStep('result');
          return 100;
        }
        return prev + Math.random() * 10;
      });
    }, 500);

    // 轮播小贴士
    const tipInterval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % TIPS.length);
    }, 3000);

    // 清理
    return () => {
      clearInterval(interval);
      clearInterval(tipInterval);
    };
  };

  // 重新开始
  const handleReset = () => {
    setStep('upload');
    setUploadedFile(null);
    setPreviewUrl(null);
    setProgress(0);
  };

  return (
    <main className="min-h-screen bg-dark-bg">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 pt-24 pb-12">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-h1 font-light text-content-primary mb-2">
            体验中心
          </h1>
          <p className="text-content-secondary">
            上传图片，选择风格，一键升级
          </p>
        </div>

        {/* 上传步骤 */}
        {step === 'upload' && (
          <div className="space-y-8">
            {/* 上传区 */}
            <div
              className="upload-zone"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              />

              {previewUrl ? (
                <div className="text-center">
                  <div className="w-48 h-auto mx-auto rounded-lg overflow-hidden mb-4">
                    <img
                      src={previewUrl}
                      alt="预览"
                      className="w-full h-auto"
                    />
                  </div>
                  <p className="text-content-primary">{uploadedFile?.name}</p>
                  <p className="text-sm text-content-tertiary">
                    点击更换图片
                  </p>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="text-content-tertiary"
                    >
                      <path
                        d="M4 16L8.586 11.414C9.367 10.633 10.633 10.633 11.414 11.414L16 16M14 14L15.586 12.414C16.367 11.633 17.633 11.633 18.414 12.414L20 14M14 8H14.01M6 20H18C19.105 20 20 19.105 20 18V6C20 4.895 19.105 4 18 4H6C4.895 4 4 4.895 4 6V18C4 19.105 4.895 20 6 20Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <p className="text-lg text-content-primary mb-2">
                    拖拽或点击上传
                  </p>
                  <p className="text-sm text-content-tertiary">
                    支持 JPG / PNG，最大 10MB
                  </p>
                </>
              )}
            </div>

            {/* 小贴士 */}
            <div className="text-center">
              <p className="text-sm text-content-tertiary">
                💡 小贴士：人像 / 产品 / 美食效果最佳
              </p>
            </div>

            {/* 风格选择 */}
            <StyleSelector
              selectedStyle={selectedStyle}
              onSelect={setSelectedStyle}
            />

            {/* 开始按钮 */}
            <div className="text-center">
              <button
                onClick={handleStartProcessing}
                disabled={!uploadedFile}
                className={`btn-primary text-lg ${
                  !uploadedFile ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                ✨ 一键升级
              </button>
              <p className="mt-3 text-sm text-content-tertiary">
                使用 1/10 次免费额度
              </p>
            </div>
          </div>
        )}

        {/* 处理中步骤 */}
        {step === 'processing' && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-medium text-content-primary mb-8">
              正在升级中...
            </h2>

            {/* 进度条 */}
            <div className="max-w-md mx-auto mb-8">
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <p className="text-content-tertiary mt-2">
                {Math.round(Math.min(progress, 100))}%
              </p>
            </div>

            {/* 处理步骤 */}
            <div className="space-y-2 mb-8">
              <ProcessStep done={progress > 20}>分析图片特征</ProcessStep>
              <ProcessStep done={progress > 40}>提取主体轮廓</ProcessStep>
              <ProcessStep active={progress > 40 && progress <= 60}>
                AI 重构场景
              </ProcessStep>
              <ProcessStep done={progress > 80}>融合调色</ProcessStep>
              <ProcessStep done={progress >= 100}>生成评分</ProcessStep>
            </div>

            {/* 小贴士 */}
            <div className="glass-card max-w-md mx-auto">
              <div className="glass-card-inner py-4">
                <p className="text-sm text-content-secondary">
                  💡 高级感秘诀
                </p>
                <p className="text-content-primary mt-1">
                  {TIPS[currentTip]}
                </p>
              </div>
            </div>

            <p className="mt-6 text-content-tertiary">
              预计剩余 {Math.max(0, Math.round((100 - progress) / 20))} 秒
            </p>
          </div>
        )}

        {/* 结果步骤 */}
        {step === 'result' && (
          <div className="space-y-8">
            {/* 对比预览 */}
            <div className="glass-card">
              <div className="glass-card-inner p-0 overflow-hidden rounded-3xl">
                <div className="aspect-9-16 max-w-sm mx-auto">
                  <BeforeAfterSlider
                    beforeImage={DEMO_RESULT.beforeUrl}
                    afterImage={DEMO_RESULT.afterUrl}
                  />
                </div>
              </div>
            </div>

            {/* 评分结果 */}
            <div className="grid md:grid-cols-2 gap-6">
              <ScoreCard score={DEMO_RESULT.score} />
              <div className="glass-card">
                <div className="glass-card-inner">
                  <h3 className="text-lg font-medium text-content-primary mb-4">
                    下载选项
                  </h3>

                  {/* 尺寸选择 */}
                  <div className="mb-4">
                    <label className="block text-sm text-content-secondary mb-2">
                      尺寸
                    </label>
                    <div className="flex gap-2">
                      <button className="flex-1 py-2 rounded-lg bg-brand-500/20 text-brand-500 text-sm">
                        小红书竖版 (1080×1920)
                      </button>
                      <button className="flex-1 py-2 rounded-lg bg-white/5 text-content-tertiary text-sm">
                        方图 (1080×1080)
                      </button>
                    </div>
                  </div>

                  {/* 水印选项 */}
                  <div className="mb-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded" />
                      <span className="text-sm text-content-secondary">
                        添加 VidLuxe 水印（获得 +1 次免费额度）
                      </span>
                    </label>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleReset}
                      className="btn-secondary flex-1"
                    >
                      换个风格
                    </button>
                    <button className="btn-primary flex-1">
                      下载高清图
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 分享按钮 */}
            <div className="text-center">
              <button className="btn-secondary inline-flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 12C4 12 5.5 6 12 6C18.5 6 20 12 20 12M12 6V4M12 6L10 4M12 6L14 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                分享到小红书
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function ProcessStep({
  children,
  done,
  active,
}: {
  children: React.ReactNode;
  done?: boolean;
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 ${
        done
          ? 'text-green-500'
          : active
          ? 'text-brand-500'
          : 'text-content-tertiary'
      }`}
    >
      {done ? (
        <span>✓</span>
      ) : active ? (
        <span className="animate-pulse">◐</span>
      ) : (
        <span>○</span>
      )}
      <span>{children}</span>
    </div>
  );
}
