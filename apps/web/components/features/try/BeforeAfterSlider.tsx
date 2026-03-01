/**
 * BeforeAfterSlider - Before/After 滑块对比组件
 *
 * 支持拖动滑块实时对比原图和效果图
 */

'use client';

import { useState, useRef, useCallback } from 'react';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  className?: string;
}

export function BeforeAfterSlider({
  beforeImage,
  afterImage,
  className = '',
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    handleMove(e.clientX);
  }, [handleMove]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
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

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '9/12',
        overflow: 'hidden',
        borderRadius: '16px',
        cursor: isDragging ? 'ew-resize' : 'pointer',
        userSelect: 'none',
        touchAction: 'none',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
    >
      {/* After 图片（底层） */}
      <img
        src={afterImage}
        alt="After"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
        draggable={false}
      />

      {/* Before 图片（上层，带裁剪） */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${sliderPosition}%`,
          height: '100%',
          overflow: 'hidden',
        }}
      >
        <img
          src={beforeImage}
          alt="Before"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${100 / (sliderPosition / 100)}%`,
            maxWidth: 'none',
            height: '100%',
            objectFit: 'cover',
          }}
          draggable={false}
        />
      </div>

      {/* 滑块线 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: `${sliderPosition}%`,
          width: '3px',
          background: 'white',
          transform: 'translateX(-50%)',
          boxShadow: '0 0 10px rgba(0,0,0,0.3)',
          zIndex: 10,
        }}
      />

      {/* 滑块手柄 */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: `${sliderPosition}%`,
          transform: 'translate(-50%, -50%)',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'white',
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 20,
          transition: isDragging ? 'none' : 'transform 0.2s ease',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M8 4L4 8L8 12"
            stroke="#333"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16 4L20 8L16 12"
            stroke="#333"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* 标签 */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          padding: '4px 10px',
          background: 'rgba(0,0,0,0.6)',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 500,
          color: 'white',
        }}
      >
        原图
      </div>
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          padding: '4px 10px',
          background: 'rgba(212, 175, 55, 0.9)',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 500,
          color: '#000',
        }}
      >
        效果
      </div>
    </div>
  );
}
