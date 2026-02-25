'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard', label: '概览', icon: '📊' },
  { href: '/dashboard/projects', label: '项目', icon: '📁' },
  { href: '/try', label: '新建', icon: '✨' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleUpgrade = () => {
    router.push('/pricing');
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 bg-dark-card/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-display text-brand-500">VID★LUXE</span>
            </Link>

            {/* 桌面端导航 */}
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    pathname === item.href
                      ? 'bg-brand-500/10 text-brand-500'
                      : 'text-content-secondary hover:text-content-primary hover:bg-white/5'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* 用户菜单 */}
            <div className="hidden md:flex items-center gap-4">
              <span className="text-sm text-content-secondary">免费版</span>
              <button onClick={handleUpgrade} className="btn-gold px-4 py-2 text-sm">
                升级 Pro
              </button>
            </div>

            {/* 移动端菜单按钮 */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-content-secondary"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* 移动端菜单 */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/5 bg-dark-card">
            <nav className="px-4 py-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                    pathname === item.href
                      ? 'bg-brand-500/10 text-brand-500'
                      : 'text-content-secondary'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
              <div className="pt-3 border-t border-white/5">
                <button onClick={handleUpgrade} className="w-full btn-gold px-4 py-2 text-sm">
                  升级 Pro
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
