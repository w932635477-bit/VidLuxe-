'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const packageId = searchParams.get('package');

  const [processing, setProcessing] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // 登录检查
  useEffect(() => {
    if (!loading && !user) {
      // 保存购买意图
      if (packageId) {
        sessionStorage.setItem('purchaseIntent', JSON.stringify({
          packageId,
          timestamp: Date.now()
        }));
      }
      router.push(`/auth?redirect=/checkout?package=${packageId || ''}`);
    }
  }, [user, loading, router, packageId]);

  // 恢复购买意图
  useEffect(() => {
    if (user && !loading) {
      const savedIntent = sessionStorage.getItem('purchaseIntent');
      if (savedIntent && !packageId) {
        try {
          const { packageId: savedPackageId, timestamp } = JSON.parse(savedIntent);
          // 10分钟内有效
          if (Date.now() - timestamp < 10 * 60 * 1000) {
            router.replace(`/checkout?package=${savedPackageId}`);
          }
          sessionStorage.removeItem('purchaseIntent');
        } catch (e) {
          console.error('Failed to parse purchase intent:', e);
        }
      }
    }
  }, [user, loading, packageId, router]);

  // 创建订单
  useEffect(() => {
    if (user && packageId && !order && !processing) {
      createOrder();
    }
  }, [user, packageId, order, processing]);

  const createOrder = async () => {
    if (!user || !packageId) return;

    setProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId,
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'PAYMENT_NOT_CONFIGURED') {
          setError('支付功能暂未开放，请联系客服');
        } else {
          setError(data.error || '创建订单失败');
        }
        return;
      }

      setOrder(data);

      // 如果有订单ID，跳转到支付页面
      if (data.order?.id) {
        router.push(`/payment/checkout?orderId=${data.order.id}`);
      }
    } catch (err) {
      console.error('Create order error:', err);
      setError('网络错误，请重试');
    } finally {
      setProcessing(false);
    }
  };

  // 加载中
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  // 未登录（等待跳转）
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <p>正在跳转到登录页面...</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#fff', padding: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
          <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>出错了</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '24px' }}>{error}</p>
          <Link
            href="/pricing"
            style={{
              display: 'inline-block',
              padding: '12px 32px',
              background: '#D4AF37',
              color: '#000',
              borderRadius: '8px',
              textDecoration: 'none',
            }}
          >
            返回定价页面
          </Link>
        </div>
      </div>
    );
  }

  // 处理中
  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#fff' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
        <p>正在创建订单...</p>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <p>加载中...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
