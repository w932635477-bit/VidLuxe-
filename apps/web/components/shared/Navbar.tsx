'use client';

import { useState } from 'react';
import Link from 'next/link';

interface NavbarProps {
  transparent?: boolean;
  showAuth?: boolean;
}

export function Navbar({ transparent = false, showAuth = true }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: transparent
          ? 'transparent'
          : 'rgba(0, 0, 0, 0.8)',
        backdropFilter: transparent ? undefined : 'blur(20px)',
        WebkitBackdropFilter: transparent ? undefined : 'blur(20px)',
        borderBottom: transparent ? 'none' : '0.5px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 24px',
        height: '52px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Logo - Apple 风格 */}
        <Link href="/" style={{ fontSize: '17px', fontWeight: 600, letterSpacing: '-0.02em' }}>
          VidLuxe
        </Link>

        {/* Desktop Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <NavLink href="/try">体验</NavLink>
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/pricing">定价</NavLink>
        </div>

        {/* Desktop CTA */}
        {showAuth && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link
              href="/auth"
              style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}
            >
              登录
            </Link>
            <Link
              href="/try"
              style={{
                padding: '8px 20px',
                borderRadius: '980px',
                background: '#D4AF37',
                color: '#000',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              免费体验
            </Link>
          </div>
        )}

        {/* Mobile Menu Button */}
        <button
          style={{
            display: 'none',
            padding: '8px',
            color: 'rgba(255, 255, 255, 0.6)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileMenuOpen ? (
              <path d="M6 6L18 18M6 18L18 6" strokeLinecap="round" />
            ) : (
              <path d="M4 6H20M4 12H20M4 18H20" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div style={{
          padding: '16px 24px',
          background: 'rgba(0, 0, 0, 0.95)',
          borderBottom: '0.5px solid rgba(255, 255, 255, 0.06)',
        }}>
          <Link href="/try" style={{ display: 'block', padding: '12px 0', color: 'rgba(255, 255, 255, 0.9)' }}>
            体验
          </Link>
          <Link href="/dashboard" style={{ display: 'block', padding: '12px 0', color: 'rgba(255, 255, 255, 0.9)' }}>
            Dashboard
          </Link>
          <Link href="/pricing" style={{ display: 'block', padding: '12px 0', color: 'rgba(255, 255, 255, 0.9)' }}>
            定价
          </Link>
          <Link href="/auth" style={{ display: 'block', padding: '12px 0', color: 'rgba(255, 255, 255, 0.6)' }}>
            登录
          </Link>
        </div>
      )}
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        fontSize: '14px',
        color: 'rgba(255, 255, 255, 0.6)',
        transition: 'color 0.2s ease',
      }}
    >
      {children}
    </Link>
  );
}
