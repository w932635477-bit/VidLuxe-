'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { StyleSelector, type StyleType } from '@/components/features/try/StyleSelector';
import { BeforeAfterSlider } from '@/components/features/landing/BeforeAfterSlider';

type Step = 'upload' | 'style' | 'processing' | 'result';

// 演示用结果数据
const DEMO_RESULT = {
  beforeUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1422&fit=crop',
  afterUrl: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&h=1422&fit=crop',
};

// Apple 风格：极简导航
function MinimalNav() {
  return (
    <nav style={{
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
    }}>
      <Link href="/" style={{ fontSize: '17px', fontWeight: 600, letterSpacing: '-0.02em' }}>
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

export default function TryPage() {
  const [step, setStep] = useState<Step>('upload');
  const [selectedStyle, setSelectedStyle] = useState<StyleType>('warmLuxury');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // 处理文件上传
  const handleFileChange = useCallback((file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 10 * 1024 * 1024) return;

    setUploadedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setStep('style');
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

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setStep('result'), 300);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 400);
  };

  // 重新开始
  const handleReset = () => {
    setStep('upload');
    setUploadedFile(null);
    setPreviewUrl(null);
    setProgress(0);
  };

  return (
    <main style={{ minHeight: '100vh', background: '#000000' }}>
      <MinimalNav />

      {/* ===== 步骤 1: 上传 - Apple 风格：全屏沉浸式 ===== */}
      {step === 'upload' && (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 24px',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h1 style={{
              fontSize: '48px',
              fontWeight: 600,
              letterSpacing: '-0.03em',
              marginBottom: '16px',
            }}>
              上传图片
            </h1>
            <p style={{
              fontSize: '21px',
              color: 'rgba(255, 255, 255, 0.5)',
              maxWidth: '400px',
            }}>
              让 AI 为你的内容注入高级感
            </p>
          </div>

          {/* 上传区 - Apple 风格：大而简洁 */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => document.getElementById('file-input')?.click()}
            style={{
              width: '100%',
              maxWidth: '480px',
              aspectRatio: '4/3',
              borderRadius: '24px',
              border: '2px dashed rgba(255, 255, 255, 0.15)',
              background: 'rgba(255, 255, 255, 0.02)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
            }}
          >
            <input
              id="file-input"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
            />

            <div style={{
              width: '80px',
              height: '80px',
              marginBottom: '24px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
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

            <p style={{
              fontSize: '21px',
              fontWeight: 500,
              marginBottom: '8px',
            }}>
              点击或拖拽上传
            </p>
            <p style={{
              fontSize: '15px',
              color: 'rgba(255, 255, 255, 0.4)',
            }}>
              JPG、PNG，最大 10MB
            </p>
          </div>
        </div>
      )}

      {/* ===== 步骤 2: 选择风格 ===== */}
      {step === 'style' && previewUrl && (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '80px 24px 40px',
        }}>
          {/* 预览图 */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '32px',
          }}>
            <div style={{
              maxWidth: '280px',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            }}>
              <img
                src={previewUrl}
                alt="预览"
                style={{ width: '100%', display: 'block' }}
              />
            </div>
          </div>

          {/* 风格选择 */}
          <div style={{ marginBottom: '32px' }}>
            <StyleSelector
              selectedStyle={selectedStyle}
              onSelect={setSelectedStyle}
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
              更换图片
            </button>
            <button
              onClick={handleStartProcessing}
              style={{
                flex: 2,
                padding: '16px',
                borderRadius: '12px',
                border: 'none',
                background: '#D4AF37',
                color: '#000000',
                fontSize: '17px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              开始升级
            </button>
          </div>

          <p style={{
            textAlign: 'center',
            marginTop: '16px',
            fontSize: '13px',
            color: 'rgba(255, 255, 255, 0.35)',
          }}>
            剩余 10 次免费额度
          </p>
        </div>
      )}

      {/* ===== 步骤 3: 处理中 - Apple 风格：极简动画 ===== */}
      {step === 'processing' && (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 24px',
        }}>
          {/* 圆形进度动画 */}
          <div style={{
            width: '120px',
            height: '120px',
            marginBottom: '48px',
            position: 'relative',
          }}>
            <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="4"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#D4AF37"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${progress * 2.83} 283`}
                style={{ transition: 'stroke-dasharray 0.3s ease' }}
              />
            </svg>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '28px',
              fontWeight: 600,
            }}>
              {Math.round(progress)}%
            </div>
          </div>

          <h2 style={{
            fontSize: '28px',
            fontWeight: 600,
            marginBottom: '12px',
          }}>
            正在升级
          </h2>
          <p style={{
            fontSize: '17px',
            color: 'rgba(255, 255, 255, 0.5)',
          }}>
            AI 正在重构场景...
          </p>
        </div>
      )}

      {/* ===== 步骤 4: 结果 - Apple 风格：图片为王 ===== */}
      {step === 'result' && (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '80px 24px 40px',
        }}>
          {/* 对比滑块 */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '32px',
          }}>
            <div style={{
              width: '100%',
              maxWidth: '360px',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 20px 80px rgba(0, 0, 0, 0.5)',
            }}>
              <BeforeAfterSlider
                originalImage={DEMO_RESULT.beforeUrl}
                enhancedImage={DEMO_RESULT.afterUrl}
              />
            </div>
          </div>

          {/* 评分徽章 */}
          <div style={{
            textAlign: 'center',
            marginBottom: '32px',
          }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '980px',
              background: 'rgba(212, 175, 55, 0.15)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
            }}>
              <span style={{ fontSize: '17px', fontWeight: 600, color: '#D4AF37' }}>A</span>
              <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>高级感评分 82</span>
            </span>
          </div>

          {/* 主按钮 */}
          <button style={{
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
          }}>
            下载高清图
          </button>

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
              再试一张
            </button>
            <button style={{
              flex: 1,
              padding: '14px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              background: 'transparent',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '15px',
              cursor: 'pointer',
            }}>
              分享
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
