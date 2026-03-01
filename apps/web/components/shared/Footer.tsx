import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-dark-bg border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-block">
              <span className="text-xl font-display font-bold tracking-tight">
                VID<span className="text-brand-500">★</span>LUXE
              </span>
            </Link>
            <p className="mt-4 text-sm text-content-tertiary">
              AI 驱动的高级感升级引擎
              <br />
              让每一帧都高级
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-medium text-content-primary mb-4">产品</h4>
            <ul className="space-y-2">
              <FooterLink href="/try">体验中心</FooterLink>
              <FooterLink href="/gallery">案例库</FooterLink>
              <FooterLink href="/pricing">定价</FooterLink>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-medium text-content-primary mb-4">支持</h4>
            <ul className="space-y-2">
              <FooterLink href="/help">帮助中心</FooterLink>
              <FooterLink href="/contact">联系我们</FooterLink>
              <FooterLink href="/feedback">反馈建议</FooterLink>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-medium text-content-primary mb-4">法律</h4>
            <ul className="space-y-2">
              <FooterLink href="/privacy">隐私政策</FooterLink>
              <FooterLink href="/terms">服务条款</FooterLink>
            </ul>
          </div>
        </div>

        {/* Social & Copyright */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <SocialLink href="https://xiaohongshu.com" label="小红书">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
              </svg>
            </SocialLink>
            <SocialLink href="https://weixin.qq.com" label="微信">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.5 11a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm7 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              </svg>
            </SocialLink>
          </div>

          <div className="flex flex-col items-center md:items-end gap-1">
            <p className="text-sm text-content-tertiary">
              © 2026 VidLuxe. All rights reserved.
            </p>
            <p className="text-xs text-content-tertiary/60">
              <a
                href="https://beian.miit.gov.cn/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-content-tertiary transition-colors"
              >
                蒙ICP备2026001535号
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-content-tertiary hover:text-content-primary transition-colors"
      >
        {children}
      </Link>
    </li>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-content-tertiary hover:text-content-primary hover:bg-white/10 transition-all"
    >
      {children}
    </a>
  );
}
