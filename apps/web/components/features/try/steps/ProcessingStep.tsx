/**
 * ProcessingStep - 处理中步骤组件
 *
 * 显示处理进度和状态
 */

'use client';

import { useTryStore } from '@/lib/stores/try-store';
import { StepIndicator } from '@/components/features/try';

export function ProcessingStep() {
  const {
    progress,
    currentStage,
    contentType,
    uploadMode,
    batchFiles,
    batchResults,
    selectedStyles,
  } = useTryStore();

  // 处理步骤
  const processingSteps = [
    { label: '分析内容特征', threshold: 20 },
    { label: '提取主体轮廓', threshold: 40 },
    { label: contentType === 'video' ? '逐帧抠像处理' : 'AI 重构场景', threshold: 70 },
    { label: '融合调色', threshold: 90 },
    { label: '生成种草力评分', threshold: 100 },
  ];

  return (
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

      {/* 动态进度环 */}
      <div style={{ width: '140px', height: '140px', marginBottom: '48px', position: 'relative' }}>
        {/* 外层旋转光环 */}
        <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', position: 'absolute', inset: 0 }}>
          <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(212, 175, 55, 0.15)" strokeWidth="1" />
          <circle
            cx="50"
            cy="50"
            r="48"
            fill="none"
            stroke="url(#goldGradient)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="30 270"
            style={{ animation: 'spin 2s linear infinite' }}
          />
          <defs>
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#D4AF37" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
        {/* 内层进度环 */}
        <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="4" />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="#D4AF37"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${progress * 2.64} 264`}
            style={{
              transition: 'stroke-dasharray 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              filter: 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.5))',
            }}
          />
        </svg>
        {/* 中心内容 */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '32px', fontWeight: 600, letterSpacing: '-0.02em' }}>
            {Math.round(progress)}%
          </div>
          {uploadMode === 'batch' && batchResults.length > 0 && (
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '4px' }}>
              {batchResults.length} / {batchFiles.length * selectedStyles.length}
            </div>
          )}
        </div>
      </div>

      <h2 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '12px', letterSpacing: '-0.02em' }}>
        正在升级
        <span style={{ animation: 'dotPulse 1.5s ease-in-out infinite' }}>...</span>
      </h2>
      <p
        style={{
          fontSize: '17px',
          color: 'rgba(255, 255, 255, 0.5)',
          marginBottom: '32px',
          minHeight: '24px',
        }}
      >
        {currentStage || (contentType === 'video' ? 'AI 正在逐帧处理...' : 'AI 正在重构场景...')}
      </p>

      {/* 批量处理进度指示 */}
      {uploadMode === 'batch' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'rgba(212, 175, 55, 0.1)',
            borderRadius: '20px',
            marginBottom: '24px',
            border: '1px solid rgba(212, 175, 55, 0.2)',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#D4AF37',
              animation: 'pulse 1s ease-in-out infinite',
            }}
          />
          <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>
            批量处理中 · {batchFiles.length} 张图片 × {selectedStyles.length} 种风格
          </span>
        </div>
      )}

      {/* 处理步骤列表 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          width: '100%',
          maxWidth: '320px',
        }}
      >
        {processingSteps.map((item, index) => {
          const isCompleted = progress >= item.threshold;
          const isCurrent =
            progress < item.threshold &&
            (index === 0 || progress >= processingSteps[index - 1].threshold);

          return (
            <div
              key={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '12px',
                background: isCompleted
                  ? 'rgba(212, 175, 55, 0.1)'
                  : isCurrent
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'transparent',
                border: isCompleted
                  ? '1px solid rgba(212, 175, 55, 0.2)'
                  : '1px solid rgba(255, 255, 255, 0.05)',
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
                  background: isCompleted
                    ? '#D4AF37'
                    : isCurrent
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(255, 255, 255, 0.05)',
                  transition: 'all 0.3s ease',
                }}
              >
                {isCompleted ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 12L10 17L19 8"
                      stroke="#000"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : isCurrent ? (
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#D4AF37',
                      animation: 'pulse 1s ease-in-out infinite',
                    }}
                  />
                ) : null}
              </div>
              <span
                style={{
                  fontSize: '14px',
                  color: isCompleted
                    ? '#D4AF37'
                    : isCurrent
                      ? 'rgba(255, 255, 255, 0.8)'
                      : 'rgba(255, 255, 255, 0.3)',
                }}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes dotPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
