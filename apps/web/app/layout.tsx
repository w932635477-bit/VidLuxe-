import type { Metadata, Viewport } from 'next';
import { Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google';
import { AuthProvider } from '@/components/auth/AuthProvider';
import './globals.css';

// Playfair Display - 优雅衬线体，用于标题，传递奢华感
const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-serif',
  display: 'swap',
});

// Plus Jakarta Sans - 现代几何无衬线体，用于正文，清晰精致
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

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
    <html
      lang="zh"
      className={`${playfairDisplay.variable} ${plusJakartaSans.variable}`}
    >
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
