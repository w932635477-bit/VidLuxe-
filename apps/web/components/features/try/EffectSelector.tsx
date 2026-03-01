/**
 * EffectSelector - 效果选择器
 *
 * 横向滑动选择效果，带大图预览和 Before/After 对比
 */

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { ContentType } from '@/lib/content-types';
import {
  getEffectsByContentType,
  getDefaultEffectId,
  type EffectPreset,
} from '@/lib/effect-presets';

interface EffectSelectorProps {
  contentType: ContentType;
  selectedEffectId: string;
  onSelect: (effectId: string) => void;
  effectIntensity?: number;
  onIntensityChange?: (intensity: number) => void;
}

export function EffectSelector({
  contentType,
  selectedEffectId,
  onSelect,
  effectIntensity = 100,
  onIntensityChange,
}: EffectSelectorProps) {
  const effects = getEffectsByContentType(contentType);
  const selectedEffect = effects.find((e) => e.id === selectedEffectId) || effects[0];

  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const thumbnailScrollRef = useRef<HTMLDivElement>(null);

  // 处理 Before/After 滑块移动
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

  // 滚动到选中效果
  useEffect(() => {
    if (thumbnailScrollRef.current) {
      const selectedIndex = effects.findIndex((e) => e.id === selectedEffectId);
      if (selectedIndex >= 0) {
        const thumbnailWidth = 96; // 缩略图宽度 + gap
        thumbnailScrollRef.current.scrollTo({
          left: selectedIndex * thumbnailWidth - thumbnailScrollRef.current.clientWidth / 2 + thumbnailWidth / 2,
          behavior: 'smooth',
        });
      }
    }
  }, [selectedEffectId, effects]);

  return (
    <div>
      {/* 大图预览区 - Before/After 对比 */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '4/3',
          borderRadius: '16px',
          overflow: 'hidden',
          background: 'rgba(0, 0, 0, 0.3)',
          cursor: 'ew-resize',
          userSelect: 'none',
        }}
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
      >
        {/* 原图 (底层) */}
        <div style={{ position: 'absolute', inset: 0 }}>
          <img
            src={selectedEffect.preview.before}
            alt="原图"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              pointerEvents: 'none',
            }}
            draggable={false}
          />
          {/* 原图标签 */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              opacity: isHovered || isDragging ? 1 : 0.6,
              transition: 'opacity 0.3s',
            }}
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
              }}
            >
              原图
            </span>
          </div>
        </div>

        {/* 效果图 (顶层，左侧裁剪) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
          }}
        >
          <img
            src={selectedEffect.preview.after}
            alt="效果图"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              pointerEvents: 'none',
            }}
            draggable={false}
          />
          {/* 效果标签 */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              opacity: isHovered || isDragging ? 1 : 0.6,
              transition: 'opacity 0.3s',
            }}
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
              }}
            >
              {selectedEffect.shortName}
            </span>
          </div>
        </div>

        {/* 滑块分隔线 */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${sliderPosition}%`,
            transform: 'translateX(-50%)',
            width: '1px',
            background: 'rgba(255, 255, 255, 0.7)',
            boxShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
          }}
        />

        {/* 滑块手柄 */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${sliderPosition}%`,
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.98)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25), 0 2px 8px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: isDragging ? 'scale(1.05)' : 'scale(1)',
              transition: 'transform 0.15s',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ opacity: 0.5 }}>
              <path d="M7 14L4 10L7 6" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13 6L16 10L13 14" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* 底部渐变 */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '48px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.3), transparent)',
            pointerEvents: 'none',
          }}
        />

        {/* 效果名称 */}
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            right: '16px',
          }}
        >
          <div
            style={{
              fontSize: '17px',
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.95)',
              letterSpacing: '-0.02em',
              marginBottom: '4px',
            }}
          >
            {selectedEffect.name}
          </div>
          {selectedEffect.isHot && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                background: 'rgba(212, 175, 55, 0.15)',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 500,
                color: '#D4AF37',
              }}
            >
              <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor">
                <path d="M6 1L7.5 4.5L11 5L8.5 7.5L9 11L6 9.5L3 11L3.5 7.5L1 5L4.5 4.5L6 1Z" />
              </svg>
              热门
            </div>
          )}
        </div>
      </div>

      {/* 横向滑动缩略图列表 */}
      <div
        ref={thumbnailScrollRef}
        style={{
          display: 'flex',
          gap: '8px',
          marginTop: '16px',
          overflowX: 'auto',
          paddingBottom: '8px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {effects.map((effect) => (
          <button
            key={effect.id}
            onClick={() => onSelect(effect.id)}
            style={{
              flexShrink: 0,
              width: '80px',
              padding: 0,
              border: selectedEffectId === effect.id
                ? `2px solid ${effect.accentColor}`
                : '2px solid transparent',
              borderRadius: '12px',
              background: 'transparent',
              cursor: 'pointer',
              overflow: 'hidden',
              transition: 'all 0.2s ease',
              transform: selectedEffectId === effect.id ? 'scale(1.02)' : 'scale(1)',
            }}
          >
            {/* 缩略图 */}
            <div
              style={{
                width: '100%',
                aspectRatio: '1',
                borderRadius: '10px',
                overflow: 'hidden',
                background: 'rgba(0, 0, 0, 0.3)',
              }}
            >
              <img
                src={effect.preview.after}
                alt={effect.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>
            {/* 名称 */}
            <div
              style={{
                padding: '6px 4px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  color: selectedEffectId === effect.id
                    ? effect.accentColor
                    : 'rgba(255, 255, 255, 0.6)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {effect.shortName}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* 效果强度滑块 */}
      {onIntensityChange && (
        <div
          style={{
            marginTop: '20px',
            padding: '16px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}
          >
            <span
              style={{
                fontSize: '14px',
                fontWeight: 500,
                color: 'rgba(255, 255, 255, 0.8)',
              }}
            >
              效果强度
            </span>
            <span
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#D4AF37',
              }}
            >
              {effectIntensity}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={effectIntensity}
            onChange={(e) => onIntensityChange(Number(e.target.value))}
            style={{
              width: '100%',
              height: '4px',
              borderRadius: '2px',
              background: `linear-gradient(to right, #D4AF37 ${effectIntensity}%, rgba(255, 255, 255, 0.1) ${effectIntensity}%)`,
              appearance: 'none',
              cursor: 'pointer',
            }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '8px',
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.4)',
            }}
          >
            <span>轻柔</span>
            <span>强烈</span>
          </div>
        </div>
      )}
    </div>
  );
}
