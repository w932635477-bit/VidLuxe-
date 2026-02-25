'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BeforeAfterSlider } from '@/components/features/landing/BeforeAfterSlider';
import { HorizontalHeroSlider } from '@/components/features/landing/HorizontalHeroSlider';
import { LargeComparisonSection } from '@/components/features/landing/LargeComparisonSection';
import { PricingSection } from '@/components/features/pricing/PricingSection';
import { CASES, CATEGORIES } from '@/lib/cases';

// Apple 缓动曲线
const APPLE_EASE = 'cubic-bezier(0.25, 0.1, 0.25, 1)';

// 滚动动画 Hook
function useScrollReveal() {
  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal').forEach((el) => {
        el.classList.add('revealed');
      });
      return;
    }

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

    requestAnimationFrame(() => {
      document.querySelectorAll('.reveal').forEach((el) => {
        observer.observe(el);
      });

      document.querySelectorAll('.reveal').forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          el.classList.add('revealed');
        }
      });
    });

    return () => observer.disconnect();
  }, []);
}

// FAQ 手风琴组件 - Apple 风格
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ borderBottom: '0.5px solid rgba(255, 255, 255, 0.06)' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left group"
        style={{ padding: '24px 0' }}
      >
        <span
          style={{
            fontSize: '17px',
            fontWeight: 500,
            color: 'rgba(255, 255, 255, 0.95)',
            letterSpacing: '-0.02em',
            transition: `color 0.3s ${APPLE_EASE}`,
          }}
          className="group-hover:text-[#D4AF37]"
        >
          {question}
        </span>
        <span
          style={{
            fontSize: '20px',
            color: 'rgba(255, 255, 255, 0.3)',
            transition: `transform 0.3s ${APPLE_EASE}`,
            transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
          }}
        >
          +
        </span>
      </button>
      <div
        style={{
          overflow: 'hidden',
          maxHeight: isOpen ? '200px' : '0',
          transition: `max-height 0.4s ${APPLE_EASE}`,
        }}
      >
        <p
          style={{
            fontSize: '15px',
            lineHeight: 1.65,
            color: 'rgba(255, 255, 255, 0.5)',
            paddingBottom: '24px',
          }}
        >
          {answer}
        </p>
      </div>
    </div>
  );
}

// 评价卡片 - Apple 风格
function TestimonialCard({
  quote,
  author,
  handle,
}: {
  quote: string;
  author: string;
  handle: string;
}) {
  return (
    <div
      className="apple-card"
      style={{ padding: '28px' }}
    >
      <p
        style={{
          fontSize: '15px',
          lineHeight: 1.65,
          color: 'rgba(255, 255, 255, 0.85)',
          marginBottom: '20px',
        }}
      >
        &ldquo;{quote}&rdquo;
      </p>
      <div className="flex items-center gap-3">
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #D4AF37, #B8962E)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#000000',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          {author[0]}
        </div>
        <div>
          <p style={{ fontSize: '14px', fontWeight: 500 }}>{author}</p>
          <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.4)' }}>@{handle}</p>
        </div>
      </div>
    </div>
  );
}

// Apple 风格：简化分类名称
const CATEGORY_NAMES: Record<string, string> = {
  fashion: '穿搭',
  beauty: '美妆',
  cafe: '探店',
  food: '美食',
  lifestyle: '生活',
  tech: '数码',
};

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useScrollReveal();

  const filteredCases = activeCategory
    ? CASES.filter((c) => c.category === activeCategory)
    : CASES;

  const faqs = [
    {
      question: 'VidLuxe 的 AI 升级是如何工作的？',
      answer:
        '就像魔法一样简单。VidLuxe 会智能识别你的图片主体，将其升级到更高分辨率，并根据你选择的风格重构背景。你可以通过自然语言描述来精确控制升级效果。',
    },
    {
      question: 'VidLuxe 适合新手使用吗？',
      answer:
        '完全适合。VidLuxe 专为各类创作者设计，无论你是专业博主还是刚起步的内容创作者。直观的界面设计让你能快速上手。',
    },
    {
      question: '哪些创作者最适合使用 VidLuxe？',
      answer:
        'VidLuxe 完美适配小红书生态中的各类创作者：穿搭博主、美妆达人、美食探店、生活方式分享者等。',
    },
    {
      question: '升级后的图片质量如何保证？',
      answer:
        '大多数情况下效果都非常出色。你可以通过调整创造力参数和使用精准的自然语言描述来精确控制效果。',
    },
    {
      question: '支持哪些图片格式？',
      answer:
        '支持 JPG、PNG、WebP 等主流图片格式。建议上传清晰度较高的原图以获得最佳升级效果。',
    },
  ];

  const testimonials = [
    {
      quote: '一张普通的咖啡店照片，瞬间升级成了杂志封面质感。',
      author: '小雨',
      handle: 'xiaoyu_cafe',
    },
    {
      quote: '终于找到了能完美保留穿搭风格，同时提升整体高级感的工具。',
      author: 'Mia',
      handle: 'mia_ootd',
    },
    {
      quote: '护肤品照片升级后像大牌广告，粉丝都在问我是不是换了专业摄影师。',
      author: '林琳',
      handle: 'linlin_beauty',
    },
    {
      quote: '每天省下两小时后期时间，一键升级，效率拉满。',
      author: '阿杰',
      handle: 'ajie_tech',
    },
  ];

  const features = [
    { icon: '✦', title: '智能主体锁定', desc: 'AI 精准识别并锁定人物、产品等核心主体' },
    { icon: '◈', title: '风格化重构', desc: '四种高级感风格一键切换' },
    { icon: '◎', title: '四维评分', desc: '全方位量化内容高级感' },
    { icon: '◇', title: '秒级处理', desc: '平均 15 秒完成升级' },
  ];

  return (
    <div style={{ background: '#000000', minHeight: '100vh' }}>
      {/* 全局动画样式 */}
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
      `}</style>

      {/* Hero 区 - 美妆对比图 */}
      <HorizontalHeroSlider
        originalImage="/hero/hero-beauty-before.jpg"
        enhancedImage="/hero/hero-beauty-after.jpg"
      />

      {/* 大对比展示区 */}
      <LargeComparisonSection />

      {/* 功能区 - Apple 风格：极简 */}
      <section style={{ padding: '200px 32px' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-32 reveal">
            <h2 style={{ marginBottom: '12px', fontSize: '48px' }}>核心能力</h2>
            <p style={{ fontSize: '21px', color: 'rgba(255, 255, 255, 0.5)' }}>四项技术，无限可能</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="reveal text-center" style={{ padding: '24px 0' }}>
                <div style={{ fontSize: '32px', marginBottom: '16px', color: '#D4AF37' }}>
                  {feature.icon}
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 600, marginBottom: '8px', letterSpacing: '-0.02em' }}>
                  {feature.title}
                </h3>
                <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.4)', lineHeight: 1.5 }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 案例展示区 - Apple 风格：大图为主 */}
      <section style={{ padding: '200px 32px', background: '#0a0a0a' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-32 reveal">
            <h2 style={{ marginBottom: '12px', fontSize: '48px' }}>全场景覆盖</h2>
            <p style={{ fontSize: '21px', color: 'rgba(255, 255, 255, 0.5)' }}>拖动对比，感受升级</p>
          </div>

          {/* 分类筛选 - Apple 风格：简洁 */}
          <div className="flex flex-wrap justify-center gap-2 mb-20 reveal">
            <button
              onClick={() => setActiveCategory(null)}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 500,
                borderRadius: '980px',
                border: 'none',
                cursor: 'pointer',
                transition: `all 0.3s ${APPLE_EASE}`,
                background: activeCategory === null ? '#D4AF37' : 'transparent',
                color: activeCategory === null ? '#000000' : 'rgba(255, 255, 255, 0.5)',
              }}
            >
              全部
            </button>
            {CATEGORIES.slice(0, 4).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 500,
                  borderRadius: '980px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: `all 0.3s ${APPLE_EASE}`,
                  background: activeCategory === cat.id ? '#D4AF37' : 'transparent',
                  color: activeCategory === cat.id ? '#000000' : 'rgba(255, 255, 255, 0.5)',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* 案例网格 - Magnific.ai 风格：横向大图展示 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 reveal">
            {filteredCases.map((caseItem) => (
              <div
                key={caseItem.id}
                className="relative overflow-hidden cursor-pointer group"
                style={{
                  borderRadius: '24px',
                  transition: `transform 0.4s ${APPLE_EASE}, box-shadow 0.4s ${APPLE_EASE}`,
                  aspectRatio: '16/10',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.01)';
                  e.currentTarget.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <BeforeAfterSlider
                  originalImage={caseItem.originalUrl}
                  enhancedImage={caseItem.enhancedUrl}
                />
                {/* 底部标签 */}
                <div
                  className="absolute bottom-0 left-0 right-0 p-5"
                  style={{
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.4), transparent)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: '15px', fontWeight: 500, color: 'rgba(255, 255, 255, 0.95)' }}>
                      {CATEGORY_NAMES[caseItem.category]}
                    </span>
                    <span
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{
                        fontSize: '13px',
                        color: '#D4AF37',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      拖动对比
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M5 10L2 7L5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M9 4L12 7L9 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 用户评价 - Apple 风格：精选 3 条 */}
      <section style={{ padding: '200px 32px' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-32 reveal">
            <h2 style={{ marginBottom: '12px', fontSize: '48px' }}>用户心声</h2>
            <p style={{ fontSize: '21px', color: 'rgba(255, 255, 255, 0.5)' }}>来自真实创作者的反馈</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 reveal">
            {testimonials.slice(0, 3).map((item, index) => (
              <div
                key={index}
                className="text-center"
                style={{ padding: '32px' }}
              >
                <p
                  style={{
                    fontSize: '17px',
                    lineHeight: 1.6,
                    color: 'rgba(255, 255, 255, 0.85)',
                    marginBottom: '24px',
                    fontStyle: 'italic',
                  }}
                >
                  "{item.quote}"
                </p>
                <div style={{ fontWeight: 500, color: '#D4AF37' }}>{item.author}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ - Apple 风格：精简为 3 个核心问题 */}
      <section style={{ padding: '200px 32px', background: '#0a0a0a' }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-32 reveal">
            <h2 style={{ marginBottom: '12px', fontSize: '48px' }}>常见问题</h2>
          </div>

          <div className="reveal">
            {faqs.slice(0, 3).map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* 定价 */}
      <PricingSection showTitle={true} compact={false} />

      {/* 底部 CTA - Apple 风格：更大更简洁 */}
      <section style={{ padding: '240px 32px', background: '#0a0a0a' }}>
        <div className="max-w-4xl mx-auto text-center reveal">
          <h2 style={{ marginBottom: '16px', fontSize: '56px', lineHeight: 1.1 }}>
            开始升级
          </h2>
          <p className="text-lead mb-16" style={{ fontSize: '21px' }}>
            免费体验，无需信用卡
          </p>
          <Link
            href="/try"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '18px 40px',
              fontSize: '17px',
              fontWeight: 500,
              borderRadius: '980px',
              background: '#D4AF37',
              color: '#000000',
              textDecoration: 'none',
              transition: 'all 0.3s ease',
            }}
          >
            立即体验
          </Link>
        </div>
      </section>

      {/* Footer - Apple 风格：极简 */}
      <footer
        style={{
          padding: '24px 32px',
          borderTop: '0.5px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255, 255, 255, 0.5)' }}>
            VidLuxe © 2026
          </span>
          <div className="flex items-center gap-6">
            <Link href="#" style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.35)' }}>
              隐私
            </Link>
            <Link href="#" style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.35)' }}>
              协议
            </Link>
            <Link href="#" style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.35)' }}>
              联系
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
