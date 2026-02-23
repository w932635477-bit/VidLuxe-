/**
 * 进度模拟 Hook
 *
 * 在等待 API 响应时提供模拟进度动画，缓解用户等待焦虑
 */

import { useState, useCallback, useRef, useEffect } from 'react';

const STAGE_MESSAGES = [
  '分析图像特征...',
  '提取主体轮廓...',
  'AI 构思场景...',
  '渲染高级质感...',
  '优化光影效果...',
  '精细调色处理...',
  '生成最终画面...',
];

interface UseProgressSimulationReturn {
  progress: number;
  currentStage: string;
  startProgress: (targetProgress?: number) => void;
  stopProgress: () => void;
  setProgress: (value: number) => void;
  setCurrentStage: (stage: string) => void;
}

export function useProgressSimulation(): UseProgressSimulationReturn {
  const [progress, setProgressState] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startProgress = useCallback((targetProgress: number = 90) => {
    // 清除之前的 interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    let currentProgress = 0;
    let messageIndex = 0;

    progressIntervalRef.current = setInterval(() => {
      if (currentProgress < targetProgress) {
        // 越接近目标，增长越慢
        const increment = Math.max(0.5, (targetProgress - currentProgress) / 20);
        currentProgress = Math.min(currentProgress + increment, targetProgress);
        setProgressState(Math.round(currentProgress));

        // 每隔一段时间更新消息
        if (currentProgress > (messageIndex + 1) * (targetProgress / STAGE_MESSAGES.length)) {
          messageIndex = Math.min(messageIndex + 1, STAGE_MESSAGES.length - 1);
          setCurrentStage(STAGE_MESSAGES[messageIndex]);
        }
      }
    }, 200);
  }, []);

  const stopProgress = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const setProgress = useCallback((value: number) => {
    setProgressState(value);
  }, []);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  return {
    progress,
    currentStage,
    startProgress,
    stopProgress,
    setProgress,
    setCurrentStage,
  };
}
