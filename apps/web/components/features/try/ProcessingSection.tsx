/**
 * 处理中界面组件
 *
 * 显示处理进度和阶段信息
 */

'use client';

import type { ContentType } from '@/lib/types/try-page';

interface ProcessingSectionProps {
  progress: number;
  currentStage: string;
  contentType: ContentType;
}

export function ProcessingSection({ progress, currentStage, contentType }: ProcessingSectionProps) {
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
      {/* 进度环 */}
      <div style={{ width: '140px', height: '140px', marginBottom: '48px', position: 'relative' }}>
        <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="3" />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#D4AF37"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${progress * 2.83} 283`}
            style={{ transition: 'stroke-dasharray 0.3s ease' }}
          />
        </svg>
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
        </div>
      </div>

      {/* 标题 */}
      <h2 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '12px', letterSpacing: '-0.02em' }}>
        正在升级
      </h2>
      <p style={{ fontSize: '17px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '32px' }}>
        {currentStage || (contentType === 'video' ? 'AI 正在逐帧处理...' : 'AI 正在重构场景...')}
      </p>

      {/* 处理步骤列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '320px' }}>
        {processingSteps.map((item, index) => {
          const isCompleted = progress >= item.threshold;
          const isCurrent =
            progress < item.threshold &&
            (index === 0 || progress >= [20, 40, 70, 90][index - 1] || 0);

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
      `}</style>
    </div>
  );
}
