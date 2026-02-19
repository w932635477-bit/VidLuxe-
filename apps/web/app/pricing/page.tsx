'use client';

import Link from 'next/link';
import { PricingSection, PricingFAQ } from '@/components/features/pricing/PricingSection';

// Apple 风格极简导航
function PricingNav() {
  return (
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
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '0.5px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      <Link href="/" style={{ fontSize: '17px', fontWeight: 600, letterSpacing: '-0.02em' }}>
        VidLuxe
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link
          href="/try"
          style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.6)',
          }}
        >
          体验
        </Link>
        <Link
          href="/dashboard"
          style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.6)',
          }}
        >
          Dashboard
        </Link>
      </div>
    </nav>
  );
}

export default function PricingPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#000000' }}>
      <PricingNav />

      <div style={{ paddingTop: '100px' }}>
        {/* 定价方案 */}
        <PricingSection showTitle={true} />

        {/* FAQ */}
        <PricingFAQ />

        {/* 底部 CTA */}
        <div
          style={{
            textAlign: 'center',
            padding: '80px 24px 120px',
          }}
        >
          <h2 style={{ fontSize: '32px', fontWeight: 600, marginBottom: '16px' }}>
            准备好了吗？
          </h2>
          <p
            style={{
              fontSize: '17px',
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: '32px',
            }}
          >
            从免费版开始，随时升级
          </p>
          <Link
            href="/try"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px 40px',
              borderRadius: '980px',
              background: '#D4AF37',
              color: '#000000',
              fontSize: '17px',
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            立即体验
          </Link>
        </div>
      </div>
    </main>
  );
}
