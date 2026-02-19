'use client';

import Link from 'next/link';
import { useState } from 'react';

// 定价数据
const PLANS = [
  {
    id: 'free',
    name: '免费版',
    nameEn: 'Free',
    price: 0,
    period: '永久免费',
    description: '体验 AI 升级的魔力',
    features: [
      '每月 10 次升级额度',
      '4 种高级感风格',
      '标准画质导出',
      '小红书尺寸适配',
    ],
    cta: '开始体验',
    ctaLink: '/try',
    popular: false,
  },
  {
    id: 'pro-monthly',
    name: 'Pro 月卡',
    nameEn: 'Pro',
    price: 39,
    period: '/月',
    description: '专业创作者的首选',
    features: [
      '每月 100 次升级额度',
      '4 种高级感风格',
      '高清画质导出',
      '所有尺寸适配',
      '优先处理队列',
      '专属客服支持',
    ],
    cta: '升级 Pro',
    ctaLink: '/checkout?plan=pro-monthly',
    popular: true,
  },
  {
    id: 'pro-annual',
    name: 'Pro 年卡',
    nameEn: 'Pro Annual',
    price: 299,
    period: '/年',
    originalPrice: 468,
    description: '无限创作，无限可能',
    features: [
      '无限次升级额度',
      '4 种高级感风格',
      '4K 超清画质导出',
      '所有尺寸适配',
      '优先处理队列',
      '专属客服支持',
      '新功能优先体验',
      'API 接入权限',
    ],
    cta: '立即订阅',
    ctaLink: '/checkout?plan=pro-annual',
    popular: false,
    badge: '省 ¥170',
  },
];

interface PricingCardProps {
  plan: typeof PLANS[0];
}

function PricingCard({ plan }: PricingCardProps) {
  return (
    <div
      style={{
        position: 'relative',
        padding: '32px 24px',
        borderRadius: '24px',
        background: plan.popular
          ? 'linear-gradient(180deg, rgba(212, 175, 55, 0.1) 0%, rgba(212, 175, 55, 0.02) 100%)'
          : 'rgba(255, 255, 255, 0.02)',
        border: plan.popular
          ? '1px solid rgba(212, 175, 55, 0.3)'
          : '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 推荐标签 */}
      {plan.popular && (
        <div
          style={{
            position: 'absolute',
            top: '-12px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '6px 16px',
            borderRadius: '980px',
            background: '#D4AF37',
            color: '#000',
            fontSize: '12px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          最受欢迎
        </div>
      )}

      {/* 省钱标签 */}
      {plan.badge && (
        <div
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            padding: '4px 10px',
            borderRadius: '6px',
            background: 'rgba(74, 222, 128, 0.15)',
            color: '#4ADE80',
            fontSize: '12px',
            fontWeight: 500,
          }}
        >
          {plan.badge}
        </div>
      )}

      {/* 方案名称 */}
      <div style={{ marginBottom: '8px' }}>
        <span style={{ fontSize: '17px', fontWeight: 600 }}>{plan.name}</span>
        <span
          style={{
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.35)',
            marginLeft: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {plan.nameEn}
        </span>
      </div>

      {/* 描述 */}
      <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '20px' }}>
        {plan.description}
      </p>

      {/* 价格 */}
      <div style={{ marginBottom: '24px' }}>
        <span style={{ fontSize: '48px', fontWeight: 700, letterSpacing: '-0.03em' }}>
          {plan.price === 0 ? '免费' : `¥${plan.price}`}
        </span>
        {plan.price > 0 && (
          <span style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.4)' }}>
            {plan.period}
          </span>
        )}
        {plan.originalPrice && (
          <span
            style={{
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.3)',
              textDecoration: 'line-through',
              marginLeft: '8px',
            }}
          >
            ¥{plan.originalPrice}/年
          </span>
        )}
      </div>

      {/* 功能列表 */}
      <ul style={{ flex: 1, marginBottom: '24px' }}>
        {plan.features.map((feature, index) => (
          <li
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 0',
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.7)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 8L6.5 11.5L13 5"
                stroke="#D4AF37"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {feature}
          </li>
        ))}
      </ul>

      {/* CTA 按钮 */}
      <Link
        href={plan.ctaLink}
        style={{
          display: 'block',
          textAlign: 'center',
          padding: '14px',
          borderRadius: '12px',
          background: plan.popular ? '#D4AF37' : 'rgba(255, 255, 255, 0.1)',
          color: plan.popular ? '#000' : 'rgba(255, 255, 255, 0.9)',
          fontSize: '15px',
          fontWeight: 500,
          textDecoration: 'none',
          transition: 'all 0.2s ease',
        }}
      >
        {plan.cta}
      </Link>
    </div>
  );
}

interface PricingSectionProps {
  showTitle?: boolean;
  compact?: boolean;
}

export function PricingSection({ showTitle = true, compact = false }: PricingSectionProps) {
  return (
    <section
      style={{
        padding: compact ? '120px 24px' : '160px 24px',
        background: compact ? 'transparent' : '#0a0a0a',
      }}
    >
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* 标题 */}
        {showTitle && (
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '48px', fontWeight: 600, marginBottom: '12px', letterSpacing: '-0.02em' }}>
              定价
            </h2>
            <p style={{ fontSize: '21px', color: 'rgba(255, 255, 255, 0.5)' }}>
              选择适合你的方案
            </p>
          </div>
        )}

        {/* 定价卡片 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
          }}
        >
          {PLANS.map((plan) => (
            <PricingCard key={plan.id} plan={plan} />
          ))}
        </div>

        {/* 底部说明 */}
        <p
          style={{
            textAlign: 'center',
            marginTop: '32px',
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.35)',
          }}
        >
          所有方案均支持 7 天无理由退款 · 随时可取消订阅
        </p>
      </div>
    </section>
  );
}

// FAQ 组件
export function PricingFAQ() {
  const faqs = [
    {
      q: '免费版有什么限制？',
      a: '免费版每月可升级 10 张图片，支持全部 4 种高级感风格，标准画质导出。足够体验产品核心功能。',
    },
    {
      q: 'Pro 年卡的「无限次」是什么意思？',
      a: 'Pro 年卡用户在订阅期内可以无限次使用升级功能，没有月度限制，适合高频创作者。',
    },
    {
      q: '如何退款？',
      a: '订阅后 7 天内，如对产品不满意，可联系客服全额退款，无需任何理由。',
    },
    {
      q: '支持哪些支付方式？',
      a: '支持微信支付、支付宝、信用卡等多种支付方式。',
    },
  ];

  return (
    <section style={{ padding: '80px 24px', maxWidth: '680px', margin: '0 auto' }}>
      <h3 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '32px', textAlign: 'center' }}>
        常见问题
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {faqs.map((faq, index) => (
          <div key={index}>
            <p style={{ fontSize: '17px', fontWeight: 500, marginBottom: '8px' }}>{faq.q}</p>
            <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.5)', lineHeight: 1.6 }}>
              {faq.a}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export { PLANS };
