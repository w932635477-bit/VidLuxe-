'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface HorizontalHeroSliderProps {
  originalImage: string;
  enhancedImage: string;
}

export function HorizontalHeroSlider({ originalImage, enhancedImage }: HorizontalHeroSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
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

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    handleMove(e.touches[0].clientX);
  }, [handleMove]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  }, [isDragging, handleMove]);

  const handleTouchEnd = useCallback(() => setIsDragging(false), []);

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
    <div className="relative w-full min-h-screen overflow-hidden bg-black">
      {/* 导航栏 - Apple 风格 */}
      <nav
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '0.5px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div className="max-w-6xl mx-auto px-8 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.02em' }}>
              VidLuxe
            </span>
            <span style={{ fontSize: '9px', color: '#D4AF37', marginTop: '-6px', letterSpacing: '0.05em' }}>PRO</span>
          </Link>
          <div className="hidden md:flex items-center gap-10">
            <Link href="/try" className="text-secondary hover:text-primary transition-colors" style={{ fontSize: '13px', letterSpacing: '0.02em' }}>
              体验
            </Link>
            <Link href="/dashboard" className="text-secondary hover:text-primary transition-colors" style={{ fontSize: '13px', letterSpacing: '0.02em' }}>
              Dashboard
            </Link>
            <Link href="/pricing" className="text-secondary hover:text-primary transition-colors" style={{ fontSize: '13px', letterSpacing: '0.02em' }}>
              定价
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth" className="text-secondary hover:text-primary transition-colors" style={{ fontSize: '13px' }}>
              登录
            </Link>
            <Link
              href="/try"
              className="btn-primary"
              style={{ padding: '8px 20px', fontSize: '13px' }}
            >
              免费体验
            </Link>
          </div>
        </div>
      </nav>

      {/* 超大对比滑块 */}
      <div
        ref={containerRef}
        className="absolute inset-0 cursor-ew-resize select-none"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* 原图 - 底层 */}
        <div className="absolute inset-0">
          <Image
            src={originalImage}
            alt="原图"
            fill
            sizes="100vw"
            className="object-cover"
            draggable={false}
            priority
          />
          {/* 原图标签 - Apple 风格 */}
          <div className="absolute top-24 right-8 z-20">
            <span
              style={{
                display: 'inline-flex',
                padding: '6px 14px',
                background: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '980px',
                fontSize: '13px',
                color: 'rgba(255, 255, 255, 0.8)',
                letterSpacing: '0.02em',
              }}
            >
              原图
            </span>
          </div>
        </div>

        {/* 升级版 - 顶层 */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <Image
            src={enhancedImage}
            alt="升级版"
            fill
            sizes="100vw"
            className="object-cover"
            draggable={false}
            priority
          />
          {/* 升级版标签 - Apple 风格 */}
          <div className="absolute top-24 left-8 z-20">
            <span
              style={{
                display: 'inline-flex',
                padding: '6px 14px',
                background: 'rgba(212, 175, 55, 0.2)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                borderRadius: '980px',
                fontSize: '13px',
                color: '#D4AF37',
                letterSpacing: '0.02em',
              }}
            >
              升级版
            </span>
          </div>
        </div>

        {/* 分隔线 - 极细设计 */}
        <div
          className="absolute top-0 bottom-0 z-30"
          style={{
            left: `${sliderPosition}%`,
            transform: 'translateX(-50%)',
            width: '1px',
            background: 'rgba(255, 255, 255, 0.7)',
            boxShadow: '0 0 12px rgba(255, 255, 255, 0.4)',
          }}
        />

        {/* 手柄 - Magnific.ai 风格 */}
        <div
          className="absolute top-0 bottom-0 flex items-center justify-center z-40"
          style={{
            left: `${sliderPosition}%`,
            transform: 'translateX(-50%)',
          }}
        >
          <div
            className="flex items-center justify-center"
            style={{
              width: '56px',
              height: '56px',
              background: 'rgba(255, 255, 255, 0.98)',
              borderRadius: '50%',
              boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3), 0 2px 10px rgba(0, 0, 0, 0.2)',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.4 }}>
              <path d="M10 16L6 12L10 8" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 8L18 12L14 16" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* 顶部渐变 */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-black/70 to-transparent pointer-events-none z-10" />

        {/* 底部渐变和内容区 */}
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <div
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)',
              paddingTop: '140px',
              paddingBottom: '80px',
              paddingLeft: '32px',
              paddingRight: '32px',
            }}
          >
            <div className="max-w-4xl mx-auto text-center">
              {/* 小标签 */}
              <div className="mb-6">
                <span
                  style={{
                    display: 'inline-block',
                    padding: '8px 20px',
                    background: 'rgba(212, 175, 55, 0.1)',
                    border: '1px solid rgba(212, 175, 55, 0.2)',
                    borderRadius: '980px',
                    fontSize: '13px',
                    color: '#D4AF37',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  Introducing VidLuxe 2.0
                </span>
              </div>

              {/* 主标题 - 超大衬线体 */}
              <h1 style={{ marginBottom: '28px' }}>
                <span style={{ color: '#D4AF37' }}>VidLuxe AI</span>
                <span style={{ color: '#FFFFFF' }}>学习了</span>
                <span style={{ color: '#D4AF37' }}>10000+</span>
                <span style={{ color: '#FFFFFF' }}>高级感设计</span>
              </h1>

              {/* 副标题 - 斜体衬线 */}
              <p className="text-lead mb-12">
                专治各种随手拍，秒变高级感
              </p>

              {/* CTA 按钮 */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/try"
                  className="btn-primary"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  立即免费体验
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginLeft: '8px' }}>
                    <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
                <span className="text-muted" style={{ fontSize: '13px' }}>
                  无需注册 · 10 次免费额度
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 滚动提示 */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 animate-bounce">
          <div className="flex items-center gap-2 text-white/25" style={{ fontSize: '12px' }}>
            <span>探索更多</span>
            <span>↓</span>
          </div>
        </div>
      </div>
    </div>
  );
}
