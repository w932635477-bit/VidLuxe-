'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

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
        <img
          src={originalImage}
          alt={originalLabel}
          className="w-full h-full object-cover"
          draggable={false}
        />
        {showLabels && (
          <div
            className={`absolute top-4 right-4 transition-opacity duration-300 ${
              isHovered || isDragging ? 'opacity-100' : 'opacity-60'
            }`}
          >
            <span
              style={{
                display: 'inline-flex',
                padding: '6px 14px',
                background: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '980px',
                fontSize: '12px',
                fontWeight: 500,
                color: 'rgba(255, 255, 255, 0.85)',
                letterSpacing: '0.02em',
              }}
            >
              {originalLabel}
            </span>
          </div>
        )}
      </div>

      {/* 升级版（顶层 - 左侧部分可见） */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img
          src={enhancedImage}
          alt={enhancedLabel}
          className="w-full h-full object-cover"
          draggable={false}
        />
        {showLabels && (
          <div
            className={`absolute top-4 left-4 transition-opacity duration-300 ${
              isHovered || isDragging ? 'opacity-100' : 'opacity-60'
            }`}
          >
            <span
              style={{
                display: 'inline-flex',
                padding: '6px 14px',
                background: 'rgba(212, 175, 55, 0.2)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                borderRadius: '980px',
                fontSize: '12px',
                fontWeight: 500,
                color: '#D4AF37',
                letterSpacing: '0.02em',
              }}
            >
              {enhancedLabel}
            </span>
          </div>
        )}
      </div>

      {/* 滑块分隔线 - 极细设计 */}
      <div
        className="absolute top-0 bottom-0"
        style={{
          left: `${sliderPosition}%`,
          transform: 'translateX(-50%)',
          width: '1px',
          background: 'rgba(255, 255, 255, 0.7)',
          boxShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
        }}
      />

      {/* 滑块手柄 - Magnific.ai 风格 */}
      <div
        className={`absolute top-0 bottom-0 flex items-center justify-center transition-transform duration-150 ${
          isDragging ? 'scale-105' : ''
        }`}
        style={{
          left: `${sliderPosition}%`,
          transform: 'translateX(-50%)',
        }}
      >
        <div
          className={`flex items-center justify-center transition-all duration-300 ${
            isHovered || isDragging
              ? 'scale-105 shadow-2xl'
              : 'scale-100'
          }`}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.98)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25), 0 2px 8px rgba(0, 0, 0, 0.15)',
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            style={{ opacity: 0.5 }}
          >
            <path
              d="M7 14L4 10L7 6"
              stroke="#1a1a1a"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M13 6L16 10L13 14"
              stroke="#1a1a1a"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* 底部微弱渐变 - 不干扰视觉 */}
      <div
        className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.2), transparent)' }}
      />
    </div>
  );
}
