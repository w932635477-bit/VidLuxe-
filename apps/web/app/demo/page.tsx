'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';

// ============================================
// Apple Design System Demo
// ============================================

// 苹果式缓动曲线
const APPLE_EASE = 'cubic-bezier(0.25, 0.1, 0.25, 1)';
const APPLE_EASE_BOUNCE = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

// 苹果式对比滑块
function AppleComparisonSlider({ beforeSrc, afterSrc }: { beforeSrc: string; afterSrc: string }) {
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setPosition(Math.max(0, Math.min(100, percentage)));
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const handleTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX);
    const handleEnd = () => setIsDragging(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, handleMove]);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[16/9] md:aspect-[21/9] cursor-ew-resize select-none overflow-hidden"
      style={{ borderRadius: '24px' }}
      onMouseDown={(e) => { setIsDragging(true); handleMove(e.clientX); }}
      onTouchStart={(e) => { setIsDragging(true); handleMove(e.touches[0].clientX); }}
    >
      {/* Before - 底层 */}
      <Image src={beforeSrc} alt="Before" fill className="object-cover" />

      {/* After - 顶层 */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <Image src={afterSrc} alt="After" fill className="object-cover" />
      </div>

      {/* 分隔线 - 极细 */}
      <div
        className="absolute top-0 bottom-0 z-20"
        style={{
          left: `${position}%`,
          transform: 'translateX(-50%)',
          width: '1px',
          background: 'rgba(255, 255, 255, 0.6)',
        }}
      />

      {/* 手柄 - 苹果式圆角 */}
      <div
        className="absolute top-1/2 z-30 -translate-y-1/2 flex items-center justify-center"
        style={{
          left: `${position}%`,
          transform: 'translate(-50%, -50%)',
          transition: isDragging ? 'none' : `left 0.1s ${APPLE_EASE}`,
        }}
      >
        <div
          className="flex items-center gap-2 px-3 py-2"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '20px',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="opacity-40">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="opacity-40">
            <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* 标签 - 极简 */}
      <div className="absolute top-6 right-6 z-10">
        <span
          className="text-xs font-medium tracking-wide"
          style={{
            padding: '6px 14px',
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '20px',
            color: 'rgba(255, 255, 255, 0.9)',
          }}
        >
          Before
        </span>
      </div>
      <div
        className="absolute top-6 left-6 z-10"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <span
          className="text-xs font-medium tracking-wide"
          style={{
            padding: '6px 14px',
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '20px',
            color: 'rgba(255, 255, 255, 0.9)',
          }}
        >
          After
        </span>
      </div>
    </div>
  );
}

// 苹果式卡片
function AppleCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={className}
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '0.5px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '24px',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08)',
      }}
    >
      {children}
    </div>
  );
}

// 苹果式按钮
function AppleButton({ children, primary = false }: { children: React.ReactNode; primary?: boolean }) {
  return (
    <button
      className="inline-flex items-center justify-center font-medium tracking-wide"
      style={{
        padding: primary ? '16px 40px' : '14px 32px',
        fontSize: primary ? '15px' : '14px',
        background: primary ? '#D4AF37' : 'transparent',
        color: primary ? '#000000' : 'rgba(255, 255, 255, 0.8)',
        border: primary ? 'none' : '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '980px',
        letterSpacing: '0.02em',
        transition: `all 0.3s ${APPLE_EASE}`,
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        if (primary) {
          e.currentTarget.style.background = '#E5C04B';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(212, 175, 55, 0.3)';
        } else {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
        }
      }}
      onMouseLeave={(e) => {
        if (primary) {
          e.currentTarget.style.background = '#D4AF37';
          e.currentTarget.style.boxShadow = 'none';
        } else {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
        }
      }}
    >
      {children}
    </button>
  );
}

// 滚动动画 Hook
function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px' }
    );

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

export default function AppleDemoPage() {
  useScrollReveal();

  const features = [
    { icon: '✦', title: '智能主体锁定', desc: 'AI 精准识别并锁定核心主体' },
    { icon: '◈', title: '风格化重构', desc: '四种高级感风格一键切换' },
    { icon: '◎', title: '四维评分', desc: '全方位量化内容高级感' },
    { icon: '◇', title: '秒级处理', desc: '平均 15 秒完成升级' },
  ];

  const styles = [
    { name: '极简', nameEn: 'Minimal', color: '#8E8E93' },
    { name: '暖调奢华', nameEn: 'Warm Luxury', color: '#D4AF37' },
    { name: '冷调专业', nameEn: 'Cool Pro', color: '#5E6C84' },
    { name: '莫兰迪', nameEn: 'Morandi', color: '#9CAF88' },
  ];

  return (
    <div style={{ background: '#000000', minHeight: '100vh', color: '#FFFFFF' }}>
      {/* 全局样式 */}
      <style jsx global>{`
        .reveal {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.8s ${APPLE_EASE}, transform 0.8s ${APPLE_EASE};
        }
        .reveal.revealed {
          opacity: 1;
          transform: translateY(0);
        }
        .reveal-delay-1 { transition-delay: 0.1s; }
        .reveal-delay-2 { transition-delay: 0.2s; }
        .reveal-delay-3 { transition-delay: 0.3s; }
        .reveal-delay-4 { transition-delay: 0.4s; }
      `}</style>

      {/* 导航栏 - 极简 */}
      <nav
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '0.5px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div className="max-w-6xl mx-auto px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              style={{
                fontSize: '20px',
                fontWeight: 600,
                letterSpacing: '-0.02em',
              }}
            >
              VidLuxe
            </span>
            <span style={{ fontSize: '10px', color: '#D4AF37', marginTop: '-8px' }}>PRO</span>
          </div>
          <div className="flex items-center gap-10">
            <a href="#" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.02em' }}>features</a>
            <a href="#" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.02em' }}>pricing</a>
            <a href="#" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.02em' }}>about</a>
            <button
              style={{
                fontSize: '13px',
                padding: '8px 18px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '980px',
                color: '#FFFFFF',
                letterSpacing: '0.02em',
                cursor: 'pointer',
              }}
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero 区 - 超大留白 */}
      <section className="relative" style={{ paddingTop: '200px', paddingBottom: '200px' }}>
        <div className="max-w-5xl mx-auto px-8 text-center">
          {/* 小标签 */}
          <div className="reveal mb-8">
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

          {/* 主标题 - 超大 */}
          <h1
            className="reveal reveal-delay-1"
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 'clamp(56px, 10vw, 104px)',
              fontWeight: 500,
              letterSpacing: '-0.045em',
              lineHeight: 1.02,
              marginBottom: '32px',
            }}
          >
            Transform ordinary
            <br />
            <span style={{ color: '#D4AF37' }}>into extraordinary</span>
          </h1>

          {/* 副标题 - 优雅衬线斜体 */}
          <p
            className="reveal reveal-delay-2"
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: '21px',
              fontStyle: 'italic',
              color: 'rgba(255, 255, 255, 0.6)',
              lineHeight: 1.6,
              maxWidth: '600px',
              margin: '0 auto 48px',
              letterSpacing: '-0.01em',
            }}
          >
            AI-powered content enhancement for creators who demand excellence
          </p>

          {/* 按钮组 */}
          <div className="reveal reveal-delay-3 flex items-center justify-center gap-4">
            <AppleButton primary>Start Free Trial</AppleButton>
            <AppleButton>Learn More</AppleButton>
          </div>
        </div>
      </section>

      {/* 大对比图区 */}
      <section style={{ padding: '0 48px 160px' }}>
        <div className="max-w-6xl mx-auto">
          <AppleComparisonSlider
            beforeSrc="/hero/hero-new-before.jpg"
            afterSrc="/hero/hero-new-after.jpg"
          />
        </div>
      </section>

      {/* 功能区 - 大留白 */}
      <section style={{ padding: '160px 48px' }}>
        <div className="max-w-6xl mx-auto">
          {/* 标题 */}
          <div className="text-center mb-24 reveal">
            <h2
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: 'clamp(40px, 5vw, 56px)',
                fontWeight: 500,
                letterSpacing: '-0.035em',
                marginBottom: '20px',
              }}
            >
              Designed for perfection
            </h2>
            <p
              style={{
                fontSize: '19px',
                color: 'rgba(255, 255, 255, 0.5)',
                maxWidth: '500px',
                margin: '0 auto',
                lineHeight: 1.6,
              }}
            >
              Every feature crafted with intention
            </p>
          </div>

          {/* 功能卡片 */}
          <div className="grid md:grid-cols-4 gap-5">
            {features.map((feature, index) => (
              <AppleCard key={index}>
                <div className="p-8">
                  <div
                    style={{
                      fontSize: '28px',
                      marginBottom: '20px',
                      color: '#D4AF37',
                    }}
                  >
                    {feature.icon}
                  </div>
                  <h3
                    style={{
                      fontSize: '17px',
                      fontWeight: 600,
                      marginBottom: '12px',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '15px',
                      color: 'rgba(255, 255, 255, 0.5)',
                      lineHeight: 1.6,
                    }}
                  >
                    {feature.desc}
                  </p>
                </div>
              </AppleCard>
            ))}
          </div>
        </div>
      </section>

      {/* 风格展示区 */}
      <section style={{ padding: '160px 48px', background: '#0a0a0a' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-24 reveal">
            <h2
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: 'clamp(40px, 5vw, 56px)',
                fontWeight: 500,
                letterSpacing: '-0.035em',
                marginBottom: '20px',
              }}
            >
              Four distinct aesthetics
            </h2>
            <p
              style={{
                fontSize: '19px',
                color: 'rgba(255, 255, 255, 0.5)',
              }}
            >
              Define your visual identity
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-5">
            {styles.map((style, index) => (
              <div
                key={index}
                className="reveal"
                style={{
                  padding: '32px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '0.5px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '24px',
                  transition: `all 0.4s ${APPLE_EASE}`,
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: style.color,
                    marginBottom: '24px',
                  }}
                />
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    marginBottom: '6px',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {style.name}
                </h3>
                <p
                  style={{
                    fontSize: '13px',
                    color: 'rgba(255, 255, 255, 0.4)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  {style.nameEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA 区 */}
      <section style={{ padding: '200px 48px' }}>
        <div className="max-w-3xl mx-auto text-center reveal">
          <h2
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 'clamp(40px, 5vw, 56px)',
              fontWeight: 500,
              letterSpacing: '-0.035em',
              marginBottom: '24px',
            }}
          >
            Ready to elevate?
          </h2>
          <p
            style={{
              fontSize: '19px',
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: '40px',
              lineHeight: 1.6,
            }}
          >
            Start your journey to extraordinary content today
          </p>
          <AppleButton primary>
            Get Started Free
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              style={{ marginLeft: '8px' }}
            >
              <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </AppleButton>
          <p
            style={{
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.3)',
              marginTop: '20px',
            }}
          >
            No credit card required · 10 free trials
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: '48px',
          borderTop: '0.5px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '-0.01em' }}>
            VidLuxe
          </span>
          <div className="flex items-center gap-8">
            <a href="#" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Privacy</a>
            <a href="#" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Terms</a>
            <a href="#" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Contact</a>
          </div>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
            © 2026
          </span>
        </div>
      </footer>
    </div>
  );
}
