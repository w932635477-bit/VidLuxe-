'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface HorizontalHeroSliderProps {
  originalImage: string;  // 用户原图
  enhancedImage: string;  // AI 升级后图片
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
    <div className="relative w-full h-screen overflow-hidden bg-[#0a0a12]">
      {/* 导航栏 */}
      <nav className="absolute top-0 left-0 right-0 z-50 px-6 py-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tight text-white">
              VID<span className="text-brand-500">★</span>LUXE
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/try" className="text-white/70 hover:text-white transition-colors text-sm">
              体验中心
            </Link>
            <Link href="/dashboard" className="text-white/70 hover:text-white transition-colors text-sm">
              Dashboard
            </Link>
            <Link href="/pricing" className="text-white/70 hover:text-white transition-colors text-sm">
              定价
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth" className="text-white/70 hover:text-white transition-colors text-sm">
              登录
            </Link>
            <Link
              href="/try"
              className="px-5 py-2.5 bg-gradient-to-r from-brand-600 to-brand-500 rounded-full text-sm font-medium text-white hover:shadow-lg hover:shadow-brand-500/25 transition-all"
            >
              免费体验 ✨
            </Link>
          </div>
        </div>
      </nav>

      {/* 超大对比滑块 - 占满整个屏幕 */}
      <div
        ref={containerRef}
        className="absolute inset-0 cursor-ew-resizer select-none"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* 原图 - 底层（全部可见） */}
        <div className="absolute inset-0">
          <Image
            src={originalImage}
            alt="原图"
            fill
            className="object-cover"
            draggable={false}
            priority
          />
          {/* 原图标签 */}
          <div className="absolute top-24 right-6 z-20">
            <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
              <span className="text-white text-sm font-medium">原图</span>
            </div>
          </div>
        </div>

        {/* 升级版 - 顶层（左侧部分可见） */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <Image
            src={enhancedImage}
            alt="升级版"
            fill
            className="object-cover"
            draggable={false}
            priority
          />
          {/* 升级版标签 */}
          <div className="absolute top-24 left-6 z-20">
            <div className="bg-brand-500/90 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
              <span className="text-white text-sm font-medium">✨ 升级版</span>
            </div>
          </div>
        </div>

        {/* 滑块分隔线 */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl z-30"
          style={{
            left: `${sliderPosition}%`,
            transform: 'translateX(-50%)',
          }}
        />

        {/* 滑块手柄 */}
        <div
          className={`absolute top-0 bottom-0 flex items-center justify-center z-40 transition-transform duration-100 ${
            isDragging ? 'scale-110' : ''
          }`}
          style={{
            left: `${sliderPosition}%`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white shadow-2xl flex items-center justify-center">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="text-gray-700"
            >
              <path
                d="M8 12L5 9M8 12L5 15M8 12H16M16 12L19 9M16 12L19 15"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* 顶部渐变 */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-10" />

        {/* 底部渐变和内容区 */}
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <div className="bg-gradient-to-t from-black/80 via-black/50 to-transparent pt-32 pb-12 px-6">
            <div className="max-w-4xl mx-auto text-center">
              {/* 主标题 */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight text-white">
                <span className="bg-gradient-to-r from-brand-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  让普通素材 秒变高级感 ✨
                </span>
              </h1>

              {/* 副标题 */}
              <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-8">
                专为小红书博主打造，AI 保留主体、重构背景，一键升级内容质感
              </p>

              {/* CTA 按钮 */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/try"
                  className="px-8 py-4 bg-gradient-to-r from-brand-600 to-brand-500 rounded-full text-lg font-medium text-white hover:shadow-xl hover:shadow-brand-500/30 hover:scale-105 transition-all"
                >
                  免费体验 ✨
                </Link>
                <span className="text-white/50 text-sm">
                  无需注册 · 10 次免费额度
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 滚动提示 */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 animate-bounce">
          <div className="text-white/40 text-sm flex items-center gap-2">
            <span>向下滚动</span>
            <span>↓</span>
          </div>
        </div>
      </div>
    </div>
  );
}
