'use client';

import { useState } from 'react';
import Link from 'next/link';

interface NavbarProps {
  transparent?: boolean;
}

export function Navbar({ transparent = false }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 ${
        transparent
          ? 'bg-transparent'
          : 'bg-dark-bg/80 backdrop-blur-xl border-b border-white/5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-display font-bold tracking-tight">
              VID<span className="text-brand-500">★</span>LUXE
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink href="/try">体验中心</NavLink>
            <NavLink href="/dashboard">Dashboard</NavLink>
            <NavLink href="/pricing">定价</NavLink>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/auth"
              className="text-content-secondary hover:text-content-primary transition-colors"
            >
              登录
            </Link>
            <Link href="/try" className="btn-primary py-2.5 px-6 text-sm">
              免费体验
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-content-secondary hover:text-content-primary"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {mobileMenuOpen ? (
                <path d="M6 6L18 18M6 18L18 6" strokeLinecap="round" />
              ) : (
                <path d="M4 6H20M4 12H20M4 18H20" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-dark-card border-b border-white/5">
          <div className="px-4 py-4 space-y-4">
            <MobileNavLink href="/try" onClick={() => setMobileMenuOpen(false)}>
              体验中心
            </MobileNavLink>
            <MobileNavLink href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
              Dashboard
            </MobileNavLink>
            <MobileNavLink href="/pricing" onClick={() => setMobileMenuOpen(false)}>
              定价
            </MobileNavLink>
            <div className="pt-4 border-t border-white/10">
              <Link
                href="/auth"
                className="block py-2 text-content-secondary"
                onClick={() => setMobileMenuOpen(false)}
              >
                登录
              </Link>
              <Link
                href="/try"
                className="block mt-2 btn-primary py-3 text-center text-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                免费体验
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-content-secondary hover:text-content-primary transition-colors text-sm font-medium"
    >
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      className="block py-2 text-content-primary text-lg"
      onClick={onClick}
    >
      {children}
    </Link>
  );
}
