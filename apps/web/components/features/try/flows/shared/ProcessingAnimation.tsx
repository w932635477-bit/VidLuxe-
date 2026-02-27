/**
 * ProcessingAnimation - 增强的处理等待动画
 *
 * 包含：多阶段进度、进度条、趣味提示轮播、预估时间
 */

'use client';

import { useState, useEffect } from 'react';

interface ProcessingAnimationProps {
  progress: number;
  currentStage?: string;
  mode?: 'image' | 'video' | 'batch';
}

// 趣味提示文字
const tips = [
  'AI 正在精心打磨每一个像素...',
  '好的作品值得等待...',
  '正在为你调出最美的色调...',
  '让普通瞬间变高级...',
  'AI 画师正在工作中...',
  '正在注入高级感...',
  '马上就好，请稍候...',
  '精彩即将呈现...',
];

// 多阶段配置
const stages = {
  image: [
    { name: '分析', threshold: 20 },
    { name: '生成', threshold: 70 },
    { name: '优化', threshold: 100 },
  ],
  video: [
    { name: '分析', threshold: 15 },
    { name: '调色', threshold: 40 },
    { name: '生成', threshold: 80 },
    { name: '优化', threshold: 100 },
  ],
  batch: [
    { name: '准备', threshold: 10 },
    { name: '处理', threshold: 80 },
    { name: '优化', threshold: 100 },
  ],
};

export function ProcessingAnimation({ progress, currentStage, mode = 'image' }: ProcessingAnimationProps) {
  const [tipIndex, setTipIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedTotal] = useState(60); // 预估总时间60秒

  // 轮播提示文字
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // 计时器
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 计算预估剩余时间
  const getEstimatedRemaining = () => {
    if (progress <= 0) return '--:--';
    const elapsedMinutes = elapsedTime / 60;
    const estimatedTotalTime = (elapsedMinutes / progress) * 100;
    const remaining = Math.max(0, estimatedTotalTime - elapsedMinutes);
    const mins = Math.floor(remaining);
    const secs = Math.floor((remaining - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 获取当前阶段
  const getCurrentStageIndex = () => {
    const stageList = stages[mode];
    for (let i = stageList.length - 1; i >= 0; i--) {
      if (progress < stageList[i].threshold) {
        return i;
      }
    }
    return stageList.length - 1;
  };

  const stageList = stages[mode];
  const currentStageIndex = getCurrentStageIndex();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '80px 24px',
      background: 'linear-gradient(180deg, #000000 0%, #0a0a0a 100%)',
    }}>
      {/* 多阶段进度指示 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '48px',
        gap: '8px',
      }}>
        {stageList.map((stage, index) => (
          <div key={stage.name} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: index <= currentStageIndex ? '32px' : '24px',
              height: index <= currentStageIndex ? '32px' : '24px',
              borderRadius: '50%',
              background: index < currentStageIndex
                ? 'linear-gradient(135deg, #D4AF37 0%, #B8960C 100%)'
                : index === currentStageIndex
                  ? 'linear-gradient(135deg, #D4AF37 0%, #B8960C 100%)'
                  : 'rgba(255, 255, 255, 0.1)',
              border: index === currentStageIndex ? '2px solid rgba(212, 175, 55, 0.5)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              boxShadow: index <= currentStageIndex ? '0 0 20px rgba(212, 175, 55, 0.3)' : 'none',
            }}>
              {index < currentStageIndex ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <span style={{
                  fontSize: index === currentStageIndex ? '13px' : '11px',
                  fontWeight: 600,
                  color: index <= currentStageIndex ? 'white' : 'rgba(255, 255, 255, 0.4)',
                }}>
                  {index + 1}
                </span>
              )}
            </div>
            {index < stageList.length - 1 && (
              <div style={{
                width: '40px',
                height: '3px',
                background: index < currentStageIndex
                  ? 'linear-gradient(90deg, #D4AF37 0%, rgba(212, 175, 55, 0.3) 100%)'
                  : 'rgba(255, 255, 255, 0.1)',
                borderRadius: '2px',
                transition: 'all 0.3s ease',
              }} />
            )}
          </div>
        ))}
      </div>

      {/* 阶段名称 */}
      <div style={{
        display: 'flex',
        gap: '32px',
        marginBottom: '40px',
      }}>
        {stageList.map((stage, index) => (
          <span key={stage.name} style={{
            fontSize: '13px',
            fontWeight: index === currentStageIndex ? 600 : 400,
            color: index === currentStageIndex
              ? '#D4AF37'
              : index < currentStageIndex
                ? 'rgba(255, 255, 255, 0.6)'
                : 'rgba(255, 255, 255, 0.3)',
            transition: 'all 0.3s ease',
          }}>
            {stage.name}
          </span>
        ))}
      </div>

      {/* 主旋转动画 */}
      <div style={{
        position: 'relative',
        width: '120px',
        height: '120px',
        marginBottom: '40px',
      }}>
        {/* 外圈 */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '3px solid rgba(255, 255, 255, 0.05)',
        }} />
        {/* 进度圈 */}
        <svg style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }} viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="56"
            fill="none"
            stroke="url(#goldGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${(progress / 100) * 352} 352`}
            style={{ transition: 'stroke-dasharray 0.3s ease' }}
          />
          <defs>
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#B8960C" />
            </linearGradient>
          </defs>
        </svg>
        {/* 内圈旋转 */}
        <div style={{
          position: 'absolute',
          inset: '15px',
          borderRadius: '50%',
          border: '2px solid rgba(212, 175, 55, 0.2)',
          borderTopColor: '#D4AF37',
          animation: 'spin 1s linear infinite',
        }} />
        {/* 中心数字 */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{
            fontSize: '32px',
            fontWeight: 700,
            color: '#D4AF37',
            textShadow: '0 0 20px rgba(212, 175, 55, 0.3)',
          }}>
            {progress}%
          </span>
        </div>
      </div>

      {/* 当前进度条 */}
      <div style={{
        width: '280px',
        height: '6px',
        background: 'rgba(255, 255, 255, 0.08)',
        borderRadius: '3px',
        marginBottom: '32px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #D4AF37 0%, #F5D76E 50%, #D4AF37 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 2s linear infinite',
          borderRadius: '3px',
          transition: 'width 0.3s ease',
        }} />
      </div>

      {/* 当前阶段文字 */}
      <p style={{
        fontSize: '18px',
        fontWeight: 500,
        marginBottom: '12px',
        color: 'white',
      }}>
        {currentStage || stageList[currentStageIndex]?.name + '中...'}
      </p>

      {/* 趣味提示轮播 */}
      <div style={{
        height: '24px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
      }}>
        <p style={{
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.5)',
          animation: 'fadeInOut 4s ease-in-out infinite',
          textAlign: 'center',
        }}>
          {tips[tipIndex]}
        </p>
      </div>

      {/* 时间信息 */}
      <div style={{
        display: 'flex',
        gap: '32px',
        padding: '12px 24px',
        borderRadius: '12px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '4px' }}>已用时</p>
          <p style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)' }}>
            {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
          </p>
        </div>
        <div style={{ width: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '4px' }}>预计剩余</p>
          <p style={{ fontSize: '16px', fontWeight: 600, color: '#D4AF37' }}>
            {getEstimatedRemaining()}
          </p>
        </div>
      </div>

      {/* CSS 动画 */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes fadeInOut {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default ProcessingAnimation;
