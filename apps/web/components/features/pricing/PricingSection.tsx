'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

// 定价数据
const PLANS = [
  {
    id: 'free',
    name: '免费版',
    nameEn: 'Free',
    price: 0,
    period: '每月重置',
    description: '体验 AI 升级的魔力',
    features: [
      '每月 3 次免费额度',
      '4 种高级感风格',
      '邀请好友获得额外额度',
      '标准画质导出',
    ],
    cta: '开始体验',
    popular: false,
  },
  {
    id: 'small',
    name: '小包',
    nameEn: 'Starter',
    price: 29,
    period: '一次性购买',
    description: '轻度用户首选',
    features: [
      '20 个额度',
      '额度永不过期',
      '4 种高级感风格',
      '高清画质导出',
      '多风格批量生成',
    ],
    cta: '立即购买',
    popular: false,
  },
  {
    id: 'medium',
    name: '中包',
    nameEn: 'Pro',
    price: 79,
    period: '一次性购买',
    description: '专业创作者推荐',
    features: [
      '60 个额度',
      '额度永不过期',
      '4 种高级感风格',
      '高清画质导出',
      '多风格批量生成',
      '优先处理队列',
    ],
    cta: '立即购买',
    popular: true,
  },
  {
    id: 'large',
    name: '大包',
    nameEn: 'Business',
    price: 199,
    period: '一次性购买',
    description: '高频创作者必备',
    features: [
      '150 个额度',
      '额度永不过期',
      '4 种高级感风格',
      '高清画质导出',
      '多风格批量生成',
      '优先处理队列',
      '专属客服支持',
    ],
    cta: '立即购买',
    popular: false,
  },
  {
    id: 'xlarge',
    name: '超大包',
    nameEn: 'Enterprise',
    price: 499,
    period: '一次性购买',
    description: '无限创作可能',
    features: [
      '400 个额度',
      '额度永不过期',
      '4 种高级感风格',
      '4K 超清画质导出',
      '多风格批量生成',
      '最高优先级处理',
      '专属客服支持',
      'API 接入权限',
    ],
    cta: '立即购买',
    popular: false,
    badge: '最划算',
  },
];

interface PricingCardProps {
  plan: typeof PLANS[0];
  onPurchase: (packageId: string) => void;
  loading: boolean;
  purchasingId: string | null;
}

function PricingCard({ plan, onPurchase, loading, purchasingId }: PricingCardProps) {
  const { user } = useAuth();
  const isPurchasing = purchasingId === plan.id;

  const handleClick = () => {
    if (plan.price === 0) {
      // 免费方案直接跳转到体验页
      window.location.href = '/try';
    } else {
      onPurchase(plan.id);
    }
  };

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
      </div>

      {/* 功能列表 */}
      <ul style={{ flex: 1, marginBottom: '24px', listStyle: 'none', padding: 0, margin: 0 }}>
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
      <button
        onClick={handleClick}
        disabled={loading && isPurchasing}
        style={{
          display: 'block',
          textAlign: 'center',
          padding: '14px',
          borderRadius: '12px',
          background: plan.popular ? '#D4AF37' : 'rgba(255, 255, 255, 0.1)',
          color: plan.popular ? '#000' : 'rgba(255, 255, 255, 0.9)',
          fontSize: '15px',
          fontWeight: 500,
          border: 'none',
          cursor: loading && isPurchasing ? 'wait' : 'pointer',
          opacity: loading && isPurchasing ? 0.7 : 1,
          width: '100%',
          transition: 'all 0.2s ease',
        }}
      >
        {loading && isPurchasing ? '处理中...' : plan.cta}
      </button>
    </div>
  );
}

interface PricingSectionProps {
  showTitle?: boolean;
  compact?: boolean;
}

export function PricingSection({ showTitle = true, compact = false }: PricingSectionProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async (packageId: string) => {
    // 检查登录状态
    if (!user) {
      router.push('/auth?redirect=/pricing');
      return;
    }

    setLoading(true);
    setPurchasingId(packageId);
    setError(null);

    try {
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'PAYMENT_NOT_CONFIGURED') {
          // 支付未配置，显示联系方式
          setError('支付功能暂未开放，请联系客服：upgrade@vidluxe.com');
        } else {
          setError(data.error || '购买失败，请重试');
        }
        return;
      }

      // 支付创建成功，跳转到支付页面或显示支付信息
      if (data.mwebUrl) {
        // H5 支付：跳转到微信支付页面
        window.location.href = data.mwebUrl;
      } else {
        // 其他支付方式：显示成功信息
        router.push('/dashboard?payment=success');
      }
    } catch (err) {
      console.error('Purchase error:', err);
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
      setPurchasingId(null);
    }
  };

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

        {/* 错误提示 */}
        {error && (
          <div style={{
            textAlign: 'center',
            padding: '16px 24px',
            marginBottom: '32px',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            fontSize: '14px',
          }}>
            {error}
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
            <PricingCard
              key={plan.id}
              plan={plan}
              onPurchase={handlePurchase}
              loading={loading}
              purchasingId={purchasingId}
            />
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
          所有付费方案额度永不过期 · 支持 7 天无理由退款
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
      a: '免费版每月可使用 3 次免费额度，支持全部 4 种高级感风格，标准画质导出。邀请好友可获得额外额度。',
    },
    {
      q: '额度会过期吗？',
      a: '付费购买的额度永不过期，可以随时使用。免费额度每月重置。',
    },
    {
      q: '如何退款？',
      a: '购买后 7 天内，如对产品不满意，可联系客服全额退款，无需任何理由。',
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
