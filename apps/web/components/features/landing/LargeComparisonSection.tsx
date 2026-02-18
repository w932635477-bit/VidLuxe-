'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';

interface LargeSliderProps {
  originalImage: string;  // 用户原图
  enhancedImage: string;  // AI 升级后图片
  title: string;
}

function LargeComparisonSlider({ originalImage, enhancedImage, title }: LargeSliderProps) {
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
    <div className="relative w-full">
      {/* 标题 */}
      <h3 className="text-xl md:text-2xl font-semibold text-white mb-4 text-center">{title}</h3>

      {/* 滑块容器 */}
      <div
        ref={containerRef}
        className="relative w-full aspect-video md:aspect-[21/9] rounded-2xl overflow-hidden cursor-ew-resize select-none shadow-2xl ring-1 ring-white/10"
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
          />
          <div className="absolute top-4 right-4 z-20">
            <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full">
              <span className="text-white text-xs font-medium">原图</span>
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
          />
          <div className="absolute top-4 left-4 z-20">
            <div className="bg-brand-500/90 backdrop-blur-md px-3 py-1.5 rounded-full">
              <span className="text-white text-xs font-medium">✨ 升级版</span>
            </div>
          </div>
        </div>

        {/* 分隔线 */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-xl z-30"
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        />

        {/* 手柄 */}
        <div
          className="absolute top-0 bottom-0 flex items-center justify-center z-40"
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        >
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white shadow-xl flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-gray-600">
              <path d="M6 10L4 8M6 10L4 12M6 10H14M14 10L16 8M14 10L16 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* 底部渐变 */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}

interface ComparisonData {
  id: string;
  title: string;
  original: string;   // 用户原图
  enhanced: string;   // AI 升级后图片
}

// 临时使用 Hero 图片作为演示，等生成完成后替换
const DEMO_COMPARISONS: ComparisonData[] = [
  {
    id: 'hero',
    title: '人像升级',
    original: '/hero/hero-before.jpg',  // 原图
    enhanced: '/hero/hero-after.jpg',   // 升级版
  },
  {
    id: 'fashion-1',
    title: '穿搭升级',
    original: '/cases/images/fashion-1-after.jpg',  // 原图
    enhanced: '/cases/images/fashion-1-before.jpg', // 升级版
  },
  {
    id: 'beauty-1',
    title: '美妆升级',
    original: '/cases/images/beauty-1-after.jpg',
    enhanced: '/cases/images/beauty-1-before.jpg',
  },
  {
    id: 'cafe-1',
    title: '咖啡探店升级',
    original: '/cases/images/cafe-1-after.jpg',
    enhanced: '/cases/images/cafe-1-before.jpg',
  },
];

export function LargeComparisonSection() {
  const [comparisons, setComparisons] = useState<ComparisonData[]>(DEMO_COMPARISONS);

  // 加载生成的配置，并进行字段映射
  useEffect(() => {
    fetch('/comparisons/config.json')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0) {
          // 映射旧字段到新字段
          const mappedData = data.map((item: any) => ({
            id: item.id,
            title: item.title,
            // 兼容新旧两种配置格式
            original: item.original || item.after,   // 原图
            enhanced: item.enhanced || item.before,  // 升级版
          }));
          setComparisons(mappedData);
        }
      })
      .catch(() => {
        // 使用默认数据
      });
  }, []);

  return (
    <section className="py-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* 标题区 */}
        <div className="text-center mb-16 scroll-reveal">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">
            见证升级效果 ✨
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            主体不变，背景重构，光影升级。拖动滑块查看升级前后对比
          </p>
        </div>

        {/* 大幅对比图展示 */}
        <div className="space-y-16">
          {comparisons.map((comp, index) => (
            <div key={comp.id} className="scroll-reveal">
              <LargeComparisonSlider
                originalImage={comp.original}
                enhancedImage={comp.enhanced}
                title={comp.title}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
