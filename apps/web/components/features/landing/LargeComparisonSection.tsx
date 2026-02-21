'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';

interface LargeSliderProps {
  originalImage: string;
  enhancedImage: string;
  title: string;
}

function LargeComparisonSlider({ originalImage, enhancedImage, title }: LargeSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [imageLoaded, setImageLoaded] = useState({ original: false, enhanced: false });
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
      {/* 标题 - Apple 风格：更简洁 */}
      <h3
        style={{
          fontSize: '15px',
          fontWeight: 500,
          letterSpacing: '0.02em',
          marginBottom: '24px',
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.5)',
        }}
      >
        {title}
      </h3>

      {/* 滑块容器 - Magnific.ai 风格：大尺寸横向展示 */}
      <div
        ref={containerRef}
        className="relative w-full cursor-ew-resize select-none overflow-hidden"
        style={{
          borderRadius: '28px',
          background: '#0a0a0a',
          aspectRatio: '16/9',
          boxShadow: '0 20px 80px rgba(0, 0, 0, 0.5)',
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* 加载占位符 */}
        {(!imageLoaded.original || !imageLoaded.enhanced) && (
          <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/50">
            <div className="flex items-center gap-3 text-white/60">
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>加载图片中...</span>
            </div>
          </div>
        )}

        {/* 原图 - 底层 */}
        <div className="absolute inset-0">
          <Image
            src={originalImage}
            alt="原图"
            fill
            sizes="100vw"
            className="object-cover"
            draggable={false}
            unoptimized
            onLoad={() => setImageLoaded(prev => ({ ...prev, original: true }))}
            onError={(e) => console.error('原图加载失败:', originalImage, e)}
          />
          <div className="absolute top-5 right-5 z-20">
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
            unoptimized
            onLoad={() => setImageLoaded(prev => ({ ...prev, enhanced: true }))}
            onError={(e) => console.error('升级版加载失败:', enhancedImage, e)}
          />
          <div className="absolute top-5 left-5 z-20">
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
              width: '52px',
              height: '52px',
              background: 'rgba(255, 255, 255, 0.98)',
              borderRadius: '50%',
              boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3), 0 2px 10px rgba(0, 0, 0, 0.2)',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ opacity: 0.4 }}>
              <path d="M9 15L5 11L9 7" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13 7L17 11L13 15" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ComparisonData {
  id: string;
  title: string;
  original: string;
  enhanced: string;
}

const DEMO_COMPARISONS: ComparisonData[] = [
  {
    id: 'hero',
    title: '美妆升级',
    original: '/hero/hero-beauty-before.jpg',
    enhanced: '/hero/hero-beauty-after.jpg',
  },
  {
    id: 'fashion-1',
    title: '街拍升级',
    original: '/comparisons/fashion-1-original.jpg',
    enhanced: '/comparisons/fashion-1-enhanced.jpg',
  },
  {
    id: 'product-1',
    title: '美妆产品升级',
    original: '/comparisons/product-1-original.jpg',
    enhanced: '/comparisons/product-1-enhanced.jpg',
  },
  {
    id: 'cafe-1',
    title: '咖啡探店升级',
    original: '/comparisons/cafe-1-original.jpg',
    enhanced: '/comparisons/cafe-1-enhanced.jpg',
  },
];

export function LargeComparisonSection() {
  const [comparisons, setComparisons] = useState<ComparisonData[]>(DEMO_COMPARISONS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch('/comparisons/config.json')
      .then((res) => {
        if (!res.ok) throw new Error('Config not found');
        return res.json();
      })
      .then((data) => {
        if (data && data.length > 0) {
          const mappedData = data.map((item: any) => ({
            id: item.id,
            title: item.title,
            original: item.original || item.after,
            enhanced: item.enhanced || item.before,
          }));
          setComparisons(mappedData);
        }
      })
      .catch((error) => {
        console.log('Using default comparison data:', error);
        setComparisons(DEMO_COMPARISONS);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <section style={{ padding: '200px 32px' }}>
      <div className="max-w-6xl mx-auto">
        {/* 标题区 - Apple 风格 */}
        <div className="text-center mb-32 reveal">
          <h2 style={{ marginBottom: '12px', fontSize: '48px' }}>
            见证升级
          </h2>
          <p style={{ fontSize: '21px', color: 'rgba(255, 255, 255, 0.5)' }}>
            主体不变，背景重构
          </p>
        </div>

        {/* 加载状态 */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-3 text-secondary">
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>加载中...</span>
            </div>
          </div>
        )}

        {/* 大幅对比图展示 - Magnific.ai 风格 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '120px' }}>
          {comparisons.map((comp) => (
            <div key={comp.id} className="reveal">
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
