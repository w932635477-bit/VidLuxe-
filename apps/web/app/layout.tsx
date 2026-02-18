import type { Metadata, Viewport } from 'next';
import { Inter, Noto_Sans_SC, Noto_Serif_SC } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-noto-sans-sc',
  display: 'swap',
});

const notoSerifSC = Noto_Serif_SC({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-noto-serif-sc',
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
      className={`${inter.variable} ${notoSansSC.variable} ${notoSerifSC.variable}`}
    >
      <body className="font-sans">
        {children}
      </body>
    </html>
  );
}
