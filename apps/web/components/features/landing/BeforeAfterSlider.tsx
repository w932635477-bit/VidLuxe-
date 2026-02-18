'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';

interface ComparisonSliderProps {
  originalImage: string;  // 用户原图
  enhancedImage: string;  // AI 升级后图片
  originalLabel?: string;
  enhancedLabel?: string;
  className?: string;
  showLabels?: boolean;
}

export function BeforeAfterSlider({
  originalImage,
  enhancedImage,
  originalLabel = '原图',
  enhancedLabel = '升级版',
  className = '',
  showLabels = true,
}: ComparisonSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    handleMove(e.clientX);
  }, [handleMove]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  }, [isDragging, handleMove]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    handleMove(e.touches[0].clientX);
  }, [handleMove]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  }, [isDragging, handleMove]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove as any);
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove as any);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full cursor-ew-resize select-none ${className}`}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
    >
      {/* 原图（底层 - 全部可见） */}
      <div className="absolute inset-0">
        <Image
          src={originalImage}
          alt={originalLabel}
          fill
          className="object-cover"
          draggable={false}
          priority
        />
        {showLabels && (
          <div
            className={`absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full transition-opacity duration-300 ${
              isHovered || isDragging ? 'opacity-100' : 'opacity-70'
            }`}
          >
            <span className="text-white text-xs font-medium">{originalLabel}</span>
          </div>
        )}
      </div>

      {/* 升级版（顶层 - 左侧部分可见） */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <Image
          src={enhancedImage}
          alt={enhancedLabel}
          fill
          className="object-cover"
          draggable={false}
          priority
        />
        {showLabels && (
          <div
            className={`absolute top-3 left-3 bg-brand-500/90 backdrop-blur-md px-3 py-1.5 rounded-full transition-opacity duration-300 ${
              isHovered || isDragging ? 'opacity-100' : 'opacity-70'
            }`}
          >
            <span className="text-white text-xs font-medium">✨ {enhancedLabel}</span>
          </div>
        )}
      </div>

      {/* 滑块分隔线 */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white/80 shadow-lg transition-all duration-150"
        style={{
          left: `${sliderPosition}%`,
          transform: 'translateX(-50%)',
        }}
      />

      {/* 滑块手柄 */}
      <div
        className={`absolute top-0 bottom-0 flex items-center justify-center transition-transform duration-150 ${
          isDragging ? 'scale-110' : ''
        }`}
        style={{
          left: `${sliderPosition}%`,
          transform: 'translateX(-50%)',
        }}
      >
        <div
          className={`w-10 h-10 rounded-full bg-white shadow-xl flex items-center justify-center transition-all duration-300 ${
            isHovered || isDragging
              ? 'scale-110 shadow-2xl ring-4 ring-white/20'
              : 'scale-100'
          }`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="text-gray-600"
          >
            <path
              d="M5 8L3 6M5 8L3 10M5 8H11M11 8L13 6M11 8L13 10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* 底部渐变遮罩 */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
    </div>
  );
}
