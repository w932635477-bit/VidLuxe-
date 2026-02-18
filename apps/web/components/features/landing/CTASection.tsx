import Link from 'next/link';

export function CTASection() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <div className="glass-card">
          <div className="glass-card-inner py-12">
            <h2 className="text-h1 font-light text-content-primary mb-4">
              你的内容，值得更高级
            </h2>
            <p className="text-xl text-content-secondary mb-8">
              10 秒体验，感受变化
            </p>

            <Link href="/try" className="btn-primary text-lg inline-flex">
              立即免费体验
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                className="ml-2"
              >
                <path
                  d="M4 10H16M16 10L11 5M16 10L11 15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>

            <p className="mt-6 text-sm text-content-tertiary">
              已有 10,000+ 博主正在使用
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
