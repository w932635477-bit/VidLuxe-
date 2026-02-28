'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const status = searchParams.get('status');
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    // 获取订单信息
    if (orderId) {
      fetch(`/api/payment/query?orderId=${orderId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.order) {
            setOrder(data.order);
          }
        })
        .catch(console.error);
    }
  }, [orderId]);

  if (status === 'success') {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#fff', padding: '24px' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(52, 199, 89, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}
          >
            <span style={{ fontSize: '40px' }}>✓</span>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 600, marginBottom: '12px' }}>
            支付成功
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '32px' }}>
            您的额度已到账，可以开始使用了
          </p>

          {order && (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '32px',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>获得额度</span>
                <span style={{ color: '#D4AF37', fontWeight: 600 }}>{order.credits} 次</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>订单号</span>
                <span style={{ fontSize: '14px' }}>{order.out_trade_no}</span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <Link
              href="/try"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '14px 32px',
                borderRadius: '980px',
                background: '#D4AF37',
                color: '#000',
                fontSize: '16px',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              立即使用
            </Link>
            <Link
              href="/dashboard"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '14px 32px',
                borderRadius: '980px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                fontSize: '16px',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              查看订单
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#fff', padding: '24px' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(255, 59, 48, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}
          >
            <span style={{ fontSize: '40px' }}>✕</span>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 600, marginBottom: '12px' }}>
            支付失败
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '32px' }}>
            支付遇到问题，请重新尝试
          </p>
          <Link
            href="/pricing"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '14px 32px',
              borderRadius: '980px',
              background: '#D4AF37',
              color: '#000',
              fontSize: '16px',
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            重新购买
          </Link>
        </div>
      </div>
    );
  }

  // 未知状态，重定向到定价页面
  router.push('/pricing');
  return null;
}

export default function PaymentResultPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#fff' }}>加载中...</div>
      </div>
    }>
      <PaymentResultContent />
    </Suspense>
  );
}
