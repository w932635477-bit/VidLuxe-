'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';

// 积分包配置
const CREDIT_PACKAGES = [
  { id: 'small', name: '尝鲜包', credits: 10, price: 2900 },
  { id: 'medium', name: '标准包', credits: 30, price: 7900, popular: true },
  { id: 'large', name: '超值包', credits: 100, price: 19900 },
  { id: 'xlarge', name: '专业包', credits: 300, price: 49900 },
];

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2);
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState<any>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [status, setStatus] = useState<'loading' | 'pending' | 'paid' | 'expired' | 'error'>('loading');
  const [countdown, setCountdown] = useState(7200); // 2小时倒计时
  const [error, setError] = useState<string>('');

  // 获取订单信息
  const fetchOrder = useCallback(async () => {
    if (!orderId) return;

    try {
      const response = await fetch(`/api/payment/query?orderId=${orderId}`);
      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setStatus('error');
        return;
      }

      setOrder(data.order);

      if (data.order.status === 'paid') {
        setStatus('paid');
        // 跳转到成功页面
        setTimeout(() => {
          router.push(`/payment/result?status=success&orderId=${orderId}`);
        }, 1500);
      } else if (data.order.status === 'expired') {
        setStatus('expired');
      } else {
        setStatus('pending');
      }
    } catch (err) {
      console.error('Failed to fetch order:', err);
      setError('获取订单信息失败');
      setStatus('error');
    }
  }, [orderId, router]);

  // 初始加载
  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // 生成二维码
  useEffect(() => {
    if (order?.code_url) {
      QRCode.toDataURL(order.code_url, {
        width: 256,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      }).then(setQrCodeUrl);
    }
  }, [order?.code_url]);

  // 轮询订单状态
  useEffect(() => {
    if (status !== 'pending') return;

    const interval = setInterval(() => {
      fetchOrder();
    }, 3000); // 每3秒轮询一次

    return () => clearInterval(interval);
  }, [status, fetchOrder]);

  // 倒计时
  useEffect(() => {
    if (status !== 'pending') return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setStatus('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  // 格式化倒计时
  const formatCountdown = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 获取套餐信息
  const pkg = CREDIT_PACKAGES.find((p) => p.id === order?.package_id);

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#fff', padding: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
          <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>出错了</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '24px' }}>{error}</p>
          <Link href="/pricing" style={{ color: '#D4AF37' }}>返回定价页面</Link>
        </div>
      </div>
    );
  }

  if (status === 'paid') {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
          <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>支付成功</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>正在跳转...</p>
        </div>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#fff', padding: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏰</div>
          <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>订单已过期</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '24px' }}>请重新下单</p>
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

  return (
    <div style={{ minHeight: '100vh', background: '#000' }}>
      {/* 导航 */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          padding: '0 24px',
          height: '52px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '0.5px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <Link href="/" style={{ color: '#fff', fontSize: '17px', fontWeight: 600 }}>
          VidLuxe
        </Link>
      </nav>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '80px 24px',
        }}
      >
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '16px',
            border: '0.5px solid rgba(255, 255, 255, 0.06)',
            padding: '48px',
            maxWidth: '480px',
            width: '100%',
          }}
        >
          {/* 标题 */}
          <h1 style={{ fontSize: '28px', fontWeight: 600, textAlign: 'center', marginBottom: '8px' }}>
            微信扫码支付
          </h1>
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', marginBottom: '32px' }}>
            请使用微信扫描下方二维码完成支付
          </p>

          {/* 订单信息 */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>套餐</span>
              <span>{pkg?.name || order?.package_id}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>额度</span>
              <span>{order?.credits} 次</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>金额</span>
              <span style={{ color: '#D4AF37', fontWeight: 600 }}>¥{formatPrice(order?.amount || 0)}</span>
            </div>
          </div>

          {/* 二维码 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '24px',
            }}
          >
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt="微信支付二维码"
                style={{
                  width: '240px',
                  height: '240px',
                  background: '#fff',
                  padding: '16px',
                  borderRadius: '12px',
                }}
              />
            ) : (
              <div
                style={{
                  width: '240px',
                  height: '240px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>生成中...</span>
              </div>
            )}
          </div>

          {/* 倒计时 */}
          <div style={{ textAlign: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
              请在 {formatCountdown(countdown)} 内完成支付
            </span>
          </div>

          {/* 订单号 */}
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>
              订单号：{order?.out_trade_no}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentCheckoutPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <p>加载中...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
