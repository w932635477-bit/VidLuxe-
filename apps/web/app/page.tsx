'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BeforeAfterSlider } from '@/components/features/landing/BeforeAfterSlider';
import { HorizontalHeroSlider } from '@/components/features/landing/HorizontalHeroSlider';
import { LargeComparisonSection } from '@/components/features/landing/LargeComparisonSection';
import { CASES, CATEGORIES } from '@/lib/cases';

// 滚动动画 Hook
function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.scroll-reveal').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);
}

// FAQ 手风琴组件
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-white/10">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left group"
      >
        <span className="text-lg font-medium text-white group-hover:text-brand-500 transition-colors pr-8">
          {question}
        </span>
        <span
          className={`text-2xl text-white/50 transition-transform duration-300 ${
            isOpen ? 'rotate-45' : ''
          }`}
        >
          +
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-96 pb-6' : 'max-h-0'
        }`}
      >
        <p className="text-white/60 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

// 评价卡片
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
    <div className="bg-[#1a1a2e] rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-colors">
      <p className="text-white mb-4 leading-relaxed">&ldquo;{quote}&rdquo;</p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-white font-bold">
          {author[0]}
        </div>
        <div>
          <p className="text-white font-medium">{author}</p>
          <p className="text-white/40 text-sm">@{handle}</p>
        </div>
      </div>
    </div>
  );
}

// 分类标签
const CATEGORY_EMOJIS: Record<string, string> = {
  fashion: '👗',
  beauty: '💄',
  cafe: '☕',
  food: '🍽️',
  lifestyle: '🌿',
  tech: '📱',
};

const CATEGORY_NAMES: Record<string, string> = {
  fashion: '穿搭 OOTD',
  beauty: '美妆护肤',
  cafe: '咖啡探店',
  food: '探店美食',
  lifestyle: '生活方式',
  tech: '数码产品',
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
        '就像拥有魔法棒一样！VidLuxe 会将你的图片升级到更高分辨率，并根据你选择的风格添加细节。你可以通过自然语言描述来引导升级过程，让 AI 按照你的想法重新构背景。',
    },
    {
      question: 'VidLuxe 适合新手吗？',
      answer:
        'VidLuxe 专为各类创作者设计，无论你是专业博主还是刚开始做内容。直观的界面、详细的教程和活跃的社区都会帮助你快速上手。',
    },
    {
      question: '谁可以使用 VidLuxe？',
      answer:
        'VidLuxe 适合穿搭博主、美妆达人、美食探店、生活方式分享者等各类小红书创作者。无论你是需要提升图片质感，还是想要统一账号风格，VidLuxe 都能帮你实现。',
    },
    {
      question: '升级后的图片会有瑕疵吗？',
      answer:
        '大多数情况下不会。你可以通过调整创造力参数和使用自然语言描述来控制效果。我们建议先用默认设置尝试，然后根据效果微调。',
    },
    {
      question: '支持哪些图片格式？',
      answer:
        '支持 JPG、PNG、WebP 等常见格式。建议上传清晰度较高的原图，以获得最佳升级效果。输出为高清 JPG 格式，完美适配小红书。',
    },
  ];

  const testimonials = [
    {
      quote: '这简直是魔法！一张普通的咖啡店照片瞬间变成了杂志封面质感。',
      author: '小雨',
      handle: 'xiaoyu_cafe',
    },
    {
      quote: '终于找到了能保持我穿搭风格同时提升整体质感的工具！',
      author: 'Mia',
      handle: 'mia_ootd',
    },
    {
      quote: '我的护肤品照片现在看起来像大牌广告，粉丝都问我是不是换了摄影师。',
      author: '林琳',
      handle: 'linlin_beauty',
    },
    {
      quote: '一键升级，省下了我每天两小时的后期时间。太强了！',
      author: '阿杰',
      handle: 'ajie_tech',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white overflow-x-hidden">
      {/* 超大横版 Hero 区 */}
      <HorizontalHeroSlider
        originalImage="/hero/hero-before.jpg"
        enhancedImage="/hero/hero-after.jpg"
      />

      {/* 多组大幅对比展示区 */}
      <LargeComparisonSection />

      {/* 视频滑块展示区 */}
      <section className="py-20 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              保留主体，重构背景 ✨
            </h2>
            <p className="text-white/60 text-lg">
              AI 理解你的内容，智能升级每一个细节
            </p>
          </div>

          {/* 三个滑块展示 */}
          <div className="grid md:grid-cols-3 gap-6 scroll-reveal">
            {['fashion-2', 'beauty-1', 'cafe-1'].map((caseId) => {
              const caseItem = CASES.find((c) => c.id === caseId);
              if (!caseItem) return null;
              return (
                <div
                  key={caseId}
                  className="relative aspect-[9/16] rounded-2xl overflow-hidden ring-1 ring-white/10 group hover:ring-white/20 transition-all hover:scale-[1.02]"
                >
                  <BeforeAfterSlider
                    originalImage={caseItem.originalUrl}
                    enhancedImage={caseItem.enhancedUrl}
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-sm font-medium">{CATEGORY_NAMES[caseItem.category]}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 功能标签 */}
          <div className="flex flex-wrap justify-center gap-4 mt-12 scroll-reveal">
            {['保留主体', '智能抠图', '背景重构', '光影优化', '质感提升'].map((tag) => (
              <span
                key={tag}
                className="px-4 py-2 bg-white/5 rounded-full text-sm text-white/60 border border-white/10"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 分类案例展示 */}
      <section className="py-20 px-6 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              覆盖小红书主流内容类型 ✨
            </h2>
            <p className="text-white/60 text-lg">
              选择你的内容类型，查看升级效果
            </p>
          </div>

          {/* 分类筛选 */}
          <div className="flex flex-wrap justify-center gap-3 mb-12 scroll-reveal">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeCategory === null
                  ? 'bg-brand-500 text-black'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
              }`}
            >
              全部
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat.id
                    ? 'bg-brand-500 text-black'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>

          {/* 案例网格 */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 scroll-reveal">
            {filteredCases.map((caseItem) => (
              <div
                key={caseItem.id}
                className="relative aspect-[9/16] rounded-2xl overflow-hidden ring-1 ring-white/10 group cursor-pointer hover:ring-brand-500/50 transition-all hover:scale-[1.02]"
              >
                <BeforeAfterSlider
                  originalImage={caseItem.originalUrl}
                  enhancedImage={caseItem.enhancedUrl}
                />
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/80">
                      {CATEGORY_EMOJIS[caseItem.category]} {CATEGORY_NAMES[caseItem.category]}
                    </span>
                    <span className="text-xs text-brand-400">查看详情 →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 核心功能展示 */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 scroll-reveal">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              四大核心功能 ✨
            </h2>
            <p className="text-white/60 text-lg">
              每一个细节都为提升内容质感而设计
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 scroll-reveal">
            {[
              {
                icon: '🎯',
                title: '智能保留主体',
                desc: 'AI 精准识别人物、产品等主体，确保升级后主体不变',
              },
              {
                icon: '🎨',
                title: '风格化背景',
                desc: '4 种高级感风格，一键重构背景，统一账号调性',
              },
              {
                icon: '📊',
                title: '4 维评分系统',
                desc: '色彩、构图、排版、细节，量化评估内容高级感',
              },
              {
                icon: '⚡',
                title: '快速处理',
                desc: '平均 15 秒完成升级，支持批量处理，高效省时',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-white/[0.03] rounded-2xl border border-white/5 hover:border-brand-500/30 hover:bg-white/[0.05] transition-all group"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 四种风格展示 */}
      <section className="py-20 px-6 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 scroll-reveal">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              四种高级感风格 ✨
            </h2>
            <p className="text-white/60 text-lg">
              选择最适合你内容调性的风格
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 scroll-reveal">
            {[
              {
                name: '极简',
                nameEn: 'Minimal',
                color: 'from-gray-600 to-gray-400',
                desc: '克制干净 · Apple 风',
                icon: '◻️',
              },
              {
                name: '暖调奢华',
                nameEn: 'Warm Luxury',
                color: 'from-amber-600 to-orange-400',
                desc: '温暖高级 · 有质感',
                icon: '🌅',
              },
              {
                name: '冷调专业',
                nameEn: 'Cool Pro',
                color: 'from-blue-600 to-cyan-400',
                desc: '专业冷静 · 可信赖',
                icon: '💎',
              },
              {
                name: '莫兰迪',
                nameEn: 'Morandi',
                color: 'from-stone-500 to-stone-400',
                desc: '低饱和 · 高级灰调',
                icon: '🎨',
              },
            ].map((style, index) => (
              <div
                key={index}
                className="relative p-6 bg-white/[0.03] rounded-2xl border border-white/5 overflow-hidden group hover:border-white/20 transition-all cursor-pointer"
              >
                <div
                  className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${style.color} opacity-20 blur-2xl group-hover:opacity-40 transition-opacity`}
                />
                <div className="relative">
                  <span className="text-3xl mb-4 block">{style.icon}</span>
                  <h3 className="text-xl font-semibold mb-1">{style.name}</h3>
                  <p className="text-white/40 text-sm mb-3">{style.nameEn}</p>
                  <p className="text-white/60 text-sm">{style.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 用户评价 */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              创作者们的真实反馈 ✨
            </h2>
            <p className="text-white/60 text-lg">
              超过 10,000+ 博主正在使用 VidLuxe
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 scroll-reveal">
            {testimonials.map((item, index) => (
              <TestimonialCard key={index} {...item} />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              常见问题 ✨
            </h2>
          </div>

          <div className="scroll-reveal">
            {faqs.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* 底部 CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center scroll-reveal">
          <div className="relative p-12 bg-gradient-to-br from-brand-600/20 via-purple-600/10 to-pink-600/20 rounded-3xl border border-white/10 overflow-hidden">
            {/* 装饰 */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl" />

            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                准备好升级你的内容了吗？ ✨
              </h2>
              <p className="text-white/60 text-lg mb-8">
                10 次免费额度，无需信用卡，立即开始
              </p>
              <Link
                href="/try"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-brand-600 to-brand-500 rounded-full text-lg font-medium hover:shadow-xl hover:shadow-brand-500/30 hover:scale-105 transition-all"
              >
                免费体验
                <span className="text-xl">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">
                VID<span className="text-brand-500">★</span>LUXE
              </span>
              <span className="text-white/40 text-sm">· AI 内容升级引擎</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-white/50">
              <Link href="#" className="hover:text-white transition-colors">
                用户协议
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                隐私政策
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                联系我们
              </Link>
            </div>
            <p className="text-white/40 text-sm">
              © 2026 VidLuxe. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* 滚动动画样式 */}
      <style jsx global>{`
        .scroll-reveal {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }
        .scroll-reveal.revealed {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}
