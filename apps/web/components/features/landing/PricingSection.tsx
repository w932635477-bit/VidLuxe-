import Link from 'next/link';

const PLANS = [
  {
    name: '免费版',
    price: '¥0',
    period: '/月',
    description: '适合偶尔使用的用户',
    features: [
      { text: '10 张图/月', included: true },
      { text: '基础风格', included: true },
      { text: '标准画质', included: true },
      { text: '评分预览', included: true },
      { text: '高清画质', included: false },
      { text: '优先处理', included: false },
    ],
    cta: '开始使用',
    ctaLink: '/try',
    highlighted: false,
  },
  {
    name: 'Pro 版',
    price: '¥99',
    period: '/月',
    description: '适合活跃的内容创作者',
    features: [
      { text: '无限图片', included: true },
      { text: '4 种风格', included: true },
      { text: '高清画质', included: true },
      { text: '评分详情', included: true },
      { text: '优先处理', included: true },
      { text: '批量导出', included: true },
    ],
    cta: '升级 Pro',
    ctaLink: '/pricing',
    highlighted: true,
  },
  {
    name: '企业版',
    price: '定制',
    period: '',
    description: '适合团队和品牌方',
    features: [
      { text: 'API 接入', included: true },
      { text: '批量处理', included: true },
      { text: '专属客服', included: true },
      { text: '定制风格', included: true },
      { text: '私有部署', included: true },
      { text: 'SLA 保障', included: true },
    ],
    cta: '联系我们',
    ctaLink: '/contact',
    highlighted: false,
  },
];

export function PricingSection() {
  return (
    <section className="py-24 px-4 bg-dark-card/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-h2 font-medium text-content-primary mb-4">
            选择适合你的方案
          </h2>
          <p className="text-content-secondary">
            从免费开始，随时升级
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`glass-card ${plan.highlighted ? 'ring-2 ring-brand-500' : ''}`}
            >
              <div className="glass-card-inner">
                {/* 推荐标签 */}
                {plan.highlighted && (
                  <div className="text-center mb-4">
                    <span className="inline-block px-3 py-1 rounded-full bg-brand-500 text-sm font-medium text-white">
                      推荐
                    </span>
                  </div>
                )}

                {/* 价格 */}
                <div className="text-center mb-6">
                  <h3 className="text-lg font-medium text-content-primary mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-content-primary">
                      {plan.price}
                    </span>
                    <span className="text-content-tertiary">{plan.period}</span>
                  </div>
                  <p className="text-sm text-content-tertiary mt-2">
                    {plan.description}
                  </p>
                </div>

                {/* 功能列表 */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li
                      key={index}
                      className={`flex items-center gap-2 text-sm ${
                        feature.included
                          ? 'text-content-primary'
                          : 'text-content-disabled'
                      }`}
                    >
                      {feature.included ? (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          className="text-green-500 shrink-0"
                        >
                          <path
                            d="M3 8L6.5 11.5L13 5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          className="text-content-disabled shrink-0"
                        >
                          <path
                            d="M4 4L12 12M12 4L4 12"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      )}
                      {feature.text}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href={plan.ctaLink}
                  className={`block w-full text-center py-3 rounded-xl font-medium transition-all ${
                    plan.highlighted
                      ? 'btn-primary'
                      : 'btn-secondary'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
