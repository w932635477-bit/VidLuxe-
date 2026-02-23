'use client';

import { BeforeAfterSlider } from './BeforeAfterSlider';
import Link from 'next/link';
import { getHeroCases, type Case } from '@/lib/cases';

interface HeroSectionProps {
  cases?: Case[];
}

export function HeroSection({ cases }: HeroSectionProps) {
  // 使用传入的案例或默认获取
  const heroCases = cases || getHeroCases(3);
  const [primaryCase, ...otherCases] = heroCases;

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-16 overflow-hidden">
      {/* 背景光斑 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="bg-orb bg-orb-purple w-96 h-96 top-0 -left-48" />
        <div className="bg-orb bg-orb-pink w-80 h-80 top-1/3 right-0" />
        <div className="bg-orb bg-orb-blue w-72 h-72 bottom-0 left-1/4" />
      </div>

      {/* 内容 */}
      <div className="relative z-10 text-center max-w-4xl mx-auto">
        <h1 className="text-hero font-light text-content-primary mb-4 animate-fade-in-up">
          一键升级你的内容
          <span className="block text-brand-500">高级感</span>
        </h1>
        <p className="text-xl text-content-secondary mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          让普通素材秒变小红书爆款
        </p>

        {/* 主视觉 - Before/After 滑块 */}
        {primaryCase && (
          <div className="relative max-w-sm mx-auto mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="aspect-9-16 rounded-2xl overflow-hidden shadow-2xl">
              <BeforeAfterSlider
                originalImage={primaryCase.originalUrl}
                enhancedImage={primaryCase.enhancedUrl}
              />
            </div>

            {/* 轮播指示器 */}
            <div className="flex justify-center gap-2 mt-4">
              {heroCases.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === 0 ? 'bg-brand-500 w-6' : 'bg-white/30'
                  }`}
                  aria-label={`查看案例 ${index + 1}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* CTA 按钮 */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <Link href="/try" className="btn-primary text-lg">
            免费体验
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              className="ml-2"
            >
              <path
                d="M4 10H16M16 10L11 5M16 10L11 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <Link href="/gallery" className="btn-secondary">
            查看更多案例
          </Link>
        </div>

        {/* 信任背书 */}
        <div className="mt-12 text-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <p className="text-sm text-content-tertiary mb-3">已有 10,000+ 博主正在使用</p>
          <div className="flex items-center justify-center gap-6 text-content-tertiary">
            <span className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm3.78 5.28l-4.5 6a.75.75 0 01-1.18.02l-2.25-2.5a.75.75 0 011.14-.98l1.63 1.81 3.9-5.2a.75.75 0 111.26.82z" />
              </svg>
              数据加密
            </span>
            <span className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm3.78 5.28l-4.5 6a.75.75 0 01-1.18.02l-2.25-2.5a.75.75 0 011.14-.98l1.63 1.81 3.9-5.2a.75.75 0 111.26.82z" />
              </svg>
              隐私保护
            </span>
            <span className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm3.78 5.28l-4.5 6a.75.75 0 01-1.18.02l-2.25-2.5a.75.75 0 011.14-.98l1.63 1.81 3.9-5.2a.75.75 0 111.26.82z" />
              </svg>
              随时删除
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
