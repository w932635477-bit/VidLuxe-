'use client';

import { BeforeAfterSlider } from './BeforeAfterSlider';
import { CASES, CATEGORIES, getCasesByCategory, type Case } from '@/lib/cases';

interface GallerySectionProps {
  cases?: Case[];
}

export function GallerySection({ cases }: GallerySectionProps) {
  const allCases = cases || CASES;

  return (
    <section className="py-24 px-4 bg-dark-card/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-h2 font-medium text-content-primary mb-4">
            分类案例展示
          </h2>
          <p className="text-content-secondary">
            覆盖小红书主流内容类型
          </p>
        </div>

        <div className="space-y-12">
          {CATEGORIES.map((category) => {
            const categoryCases = allCases.filter((c) => c.category === category.id);
            if (categoryCases.length === 0) return null;

            return (
              <div key={category.id}>
                {/* 分类标题 */}
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-2xl">{category.icon}</span>
                  <h3 className="text-xl font-medium text-content-primary">
                    {category.label}
                  </h3>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* 案例卡片 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {categoryCases.map((caseItem) => (
                    <div
                      key={caseItem.id}
                      className="glass-card group cursor-pointer hover:scale-[1.02] transition-transform"
                    >
                      <div className="glass-card-inner p-0 overflow-hidden rounded-3xl">
                        <div className="aspect-9-16">
                          <BeforeAfterSlider
                            beforeImage={caseItem.beforeUrl}
                            afterImage={caseItem.afterUrl}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* AI 生成说明 */}
        <div className="mt-16 text-center">
          <div className="glass-card inline-block">
            <div className="glass-card-inner py-4 px-6">
              <p className="text-sm text-content-secondary">
                🤖 所有案例均由 AI 生成，仅供参考效果展示
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
