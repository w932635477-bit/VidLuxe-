import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ContextStatusBar } from '@/components/layout/ContextStatusBar';
import './globals.css';

// 使用系统字体栈，避免网络依赖
// Serif: Georgia, Times New Roman 等 - 用于标题，传递奢华感
// Sans: -apple-system, BlinkMacSystemFont, Segoe UI 等 - 用于正文，清晰精致

export const metadata: Metadata = {
  metadataBase: new URL('https://vidluxe.com'),
  title: {
    default: 'VidLuxe - AI 驱动的高级感升级引擎',
    template: '%s | VidLuxe',
  },
  description: '帮助小红书博主将普通素材一键升级为杂志级质感内容。AI 场景重构，4 维评分，4 种高级感风格。',
  keywords: ['小红书', '高级感', 'AI 图片处理', '内容升级', '博主工具'],
  authors: [{ name: 'VidLuxe Team' }],
  creator: 'VidLuxe',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: '/icon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: 'https://vidluxe.com',
    siteName: 'VidLuxe',
    title: 'VidLuxe - AI 驱动的高级感升级引擎',
    description: '帮助小红书博主将普通素材一键升级为杂志级质感内容',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'VidLuxe',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VidLuxe - AI 驱动的高级感升级引擎',
    description: '帮助小红书博主将普通素材一键升级为杂志级质感内容',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0a0f',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body className="antialiased">
        <AuthProvider>
          {children}
          <ContextStatusBar />
        </AuthProvider>
      </body>
    </html>
  );
}
