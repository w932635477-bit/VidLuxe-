const FEATURES = [
  {
    icon: '📊',
    title: '4 维评分',
    description: '量化色彩、构图、排版、细节',
    subtext: '精准定位提升空间',
  },
  {
    icon: '🎨',
    title: '4 种风格',
    description: '极简 / 暖调 / 冷调 / 莫兰迪',
    subtext: '一键切换高级感',
  },
  {
    icon: '🇨🇳',
    title: '中文优化',
    description: '专为小红书场景设计',
    subtext: '9:16 竖版原生支持',
  },
  {
    icon: '⚡',
    title: '秒级出片',
    description: 'AI 快速处理',
    subtext: '告别长期后期',
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-h2 font-medium text-content-primary mb-4">
            为什么选择 VidLuxe
          </h2>
          <p className="text-content-secondary">
            专为小红书博主打造的高级感升级工具
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {FEATURES.map((feature, index) => (
            <div
              key={feature.title}
              className="glass-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="glass-card-inner text-center">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-medium text-content-primary mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-content-secondary mb-1">
                  {feature.description}
                </p>
                <p className="text-xs text-content-tertiary">
                  {feature.subtext}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
