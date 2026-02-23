/**
 * 最小化导航栏组件
 */

'use client';

import Link from 'next/link';

export function MinimalNav() {
  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        zIndex: 100,
      }}
    >
      <Link href="/" style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.02em' }}>
        VidLuxe
      </Link>
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        <Link
          href="/pricing"
          style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.6)',
            textDecoration: 'none',
          }}
        >
          价格
        </Link>
        <Link
          href="/demo"
          style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.6)',
            textDecoration: 'none',
          }}
        >
          示例
        </Link>
      </div>
    </nav>
  );
}
