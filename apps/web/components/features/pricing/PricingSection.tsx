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
    period: '新用户专属',
    description: '体验 AI 升级的魔力',
    features: [
      '8 次免费额度',
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
  onPurchase: (packageId: string, simulate?: boolean) => void;
  loading: boolean;
  purchasingId: string | null;
  authLoading: boolean;
}

function PricingCard({ plan, onPurchase, loading, purchasingId, authLoading }: PricingCardProps) {
  const isPurchasing = purchasingId === plan.id;

  const handleClick = () => {
    if (plan.price === 0) {
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

      <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '20px' }}>
        {plan.description}
      </p>

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

      <button
        onClick={handleClick}
        disabled={(loading && isPurchasing) || authLoading}
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
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<typeof PLANS[0] | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingPackageId, setPendingPackageId] = useState<string | null>(null);

  const handlePurchase = async (packageId: string, simulate = false) => {
    // 等待认证加载完成
    if (authLoading) {
      return;
    }

    if (!user) {
      // 显示登录提示弹窗
      setPendingPackageId(packageId);
      setSelectedPackage(PLANS.find(p => p.id === packageId) || null);
      setShowLoginModal(true);
      return;
    }

    setLoading(true);
    setPurchasingId(packageId);

    try {
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId,
          userId: user.id,
          simulate
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'PAYMENT_NOT_CONFIGURED') {
          // 显示联系方式
          setSelectedPackage(PLANS.find(p => p.id === packageId) || null);
          setShowContactModal(true);
        } else {
          alert(data.error || '购买失败，请重试');
        }
        return;
      }

      // 模拟支付成功
      if (data.simulated) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          router.push('/try?payment=success');
        }, 2000);
        return;
      }

      // 真实支付 - 跳转到checkout页面
      if (data.order?.id) {
        router.push(`/payment/checkout?orderId=${data.order.id}`);
      } else if (data.codeUrl) {
        // 如果直接返回二维码URL，也跳转到checkout
        router.push(`/payment/checkout?orderId=${data.order?.id || ''}`);
      } else {
        router.push('/try?payment=success');
      }
    } catch (err) {
      console.error('Purchase error:', err);
      alert('网络错误，请重试');
    } finally {
      setLoading(false);
      setPurchasingId(null);
    }
  };

  // 模拟支付（仅测试用）
  const handleSimulatePurchase = async () => {
    if (!selectedPackage) return;
    setShowContactModal(false);
    await handlePurchase(selectedPackage.id, true);
  };

  // 确认登录并跳转
  const handleConfirmLogin = () => {
    if (!pendingPackageId) return;
    // 保存购买意图到 sessionStorage
    sessionStorage.setItem('purchaseIntent', JSON.stringify({
      packageId: pendingPackageId,
      timestamp: Date.now()
    }));
    setShowLoginModal(false);
    // 跳转到登录，带完整参数
    router.push(`/auth?redirect=/checkout?package=${pendingPackageId}`);
  };

  return (
    <section
      style={{
        padding: compact ? '120px 24px' : '160px 24px',
        background: compact ? 'transparent' : '#0a0a0a',
      }}
    >
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
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

        {/* 成功提示 */}
        {showSuccess && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            padding: '32px 48px',
            borderRadius: '20px',
            background: 'rgba(74, 222, 128, 0.15)',
            border: '1px solid rgba(74, 222, 128, 0.3)',
            zIndex: 1000,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
            <div style={{ fontSize: '20px', fontWeight: 600, color: '#4ade80' }}>
              模拟支付成功！
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '8px' }}>
              额度已发放到您的账户
            </div>
          </div>
        )}

        {/* 登录提示弹窗 */}
        {showLoginModal && selectedPackage && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '24px',
            }}
            onClick={() => setShowLoginModal(false)}
          >
            <div
              style={{
                background: '#111',
                borderRadius: '20px',
                padding: '32px',
                maxWidth: '400px',
                width: '100%',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                textAlign: 'center',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                width: '64px',
                height: '64px',
                margin: '0 auto 20px',
                borderRadius: '50%',
                background: 'rgba(212, 175, 55, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span style={{ fontSize: '28px' }}>👤</span>
              </div>

              <h3 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '12px' }}>
                请先登录
              </h3>

              <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '8px', fontSize: '15px' }}>
                购买 <span style={{ color: '#D4AF37', fontWeight: 500 }}>{selectedPackage.name}</span> (¥{selectedPackage.price})
              </p>

              <p style={{ color: 'rgba(255, 255, 255, 0.4)', marginBottom: '28px', fontSize: '14px' }}>
                登录后即可完成购买
              </p>

              <button
                onClick={handleConfirmLogin}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#D4AF37',
                  color: '#000',
                  fontSize: '16px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  marginBottom: '12px',
                }}
              >
                去登录
              </button>

              <button
                onClick={() => setShowLoginModal(false)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* 联系客服弹窗 */}
        {showContactModal && selectedPackage && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '24px',
            }}
            onClick={() => setShowContactModal(false)}
          >
            <div
              style={{
                background: '#111',
                borderRadius: '20px',
                padding: '32px',
                maxWidth: '400px',
                width: '100%',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>
                购买 {selectedPackage.name} (¥{selectedPackage.price})
              </h3>

              <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '24px', fontSize: '14px', lineHeight: 1.6 }}>
                在线支付暂未开放，您可以通过以下方式完成购买：
              </p>

              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px',
              }}>
                <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px' }}>
                  邮箱
                </div>
                <div style={{ fontSize: '16px', color: '#D4AF37' }}>
                  upgrade@vidluxe.com
                </div>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px',
              }}>
                <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px' }}>
                  微信
                </div>
                <div style={{ fontSize: '16px', color: '#D4AF37' }}>
                  vidluxe_support
                </div>
              </div>

              {/* 测试用：模拟支付按钮 */}
              <button
                onClick={handleSimulatePurchase}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px dashed rgba(212, 175, 55, 0.5)',
                  background: 'rgba(212, 175, 55, 0.1)',
                  color: '#D4AF37',
                  fontSize: '14px',
                  cursor: 'pointer',
                  marginBottom: '12px',
                }}
              >
                🧪 模拟支付（仅测试用）
              </button>

              <button
                onClick={() => setShowContactModal(false)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                关闭
              </button>
            </div>
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
              authLoading={authLoading}
            />
          ))}
        </div>

        <p
          style={{
            textAlign: 'center',
            marginTop: '32px',
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.35)',
          }}
        >
          所有付费方案额度永不过期
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
      a: '新用户可获得 8 次免费额度，支持全部 4 种高级感风格，标准画质导出。邀请好友可获得额外额度。',
    },
    {
      q: '额度会过期吗？',
      a: '付费购买的额度永不过期，可以随时使用。免费额度用完后需购买额度继续使用。',
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
