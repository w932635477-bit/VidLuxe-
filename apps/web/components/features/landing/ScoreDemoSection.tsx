'use client';

import { ScoreCard, type PremiumScore } from './ScoreCard';

// 演示用的评分数据
const DEMO_SCORE: PremiumScore = {
  total: 78,
  grade: 'B',
  dimensions: {
    color: { score: 85, weight: 0.3 },
    composition: { score: 72, weight: 0.25 },
    typography: { score: 68, weight: 0.25 },
    detail: { score: 76, weight: 0.2 },
  },
  improvement: 15,
};

const SUGGESTIONS = [
  '尝试「暖调奢华」风格，可提升 12 分',
  '增加画面留白，提升构图感',
  '使用低饱和色调，增强高级感',
];

export function ScoreDemoSection() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-h2 font-medium text-content-primary mb-4">
            4 维评分系统
          </h2>
          <p className="text-content-secondary">
            量化高级感，精准定位提升空间
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* 评分卡片 */}
          <ScoreCard score={DEMO_SCORE} />

          {/* 说明 */}
          <div className="space-y-6">
            {/* 等级说明 */}
            <div className="glass-card">
              <div className="glass-card-inner">
                <h3 className="text-lg font-medium text-content-primary mb-4">
                  评分等级
                </h3>
                <div className="grid grid-cols-5 gap-2 text-center">
                  <GradeInfo grade="S" label="顶级" threshold="85+" />
                  <GradeInfo grade="A" label="优秀" threshold="75+" />
                  <GradeInfo grade="B" label="良好" threshold="65+" />
                  <GradeInfo grade="C" label="普通" threshold="55+" />
                  <GradeInfo grade="D" label="需改进" threshold="<55" />
                </div>
              </div>
            </div>

            {/* 提升建议 */}
            <div className="glass-card">
              <div className="glass-card-inner">
                <h3 className="text-lg font-medium text-content-primary mb-4">
                  💡 提升建议
                </h3>
                <ul className="space-y-3">
                  {SUGGESTIONS.map((suggestion, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-content-secondary"
                    >
                      <span className="w-6 h-6 rounded-full bg-brand-500/20 flex items-center justify-center text-xs text-brand-500 shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 维度说明 */}
            <div className="glass-card">
              <div className="glass-card-inner">
                <h3 className="text-lg font-medium text-content-primary mb-4">
                  评分维度
                </h3>
                <div className="space-y-3 text-sm">
                  <DimensionInfo
                    name="色彩协调"
                    weight="30%"
                    desc="饱和度、和谐度、对比度"
                  />
                  <DimensionInfo
                    name="构图美感"
                    weight="25%"
                    desc="黄金比例、视觉重心、留白"
                  />
                  <DimensionInfo
                    name="排版舒适"
                    weight="25%"
                    desc="字体、间距、层次"
                  />
                  <DimensionInfo
                    name="细节精致"
                    weight="20%"
                    desc="清晰度、噪点、边缘"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function GradeInfo({
  grade,
  label,
  threshold,
}: {
  grade: string;
  label: string;
  threshold: string;
}) {
  const colors: Record<string, string> = {
    S: '#FFD700',
    A: '#4CAF50',
    B: '#2196F3',
    C: '#FF9800',
    D: '#EF4444',
  };

  return (
    <div className="flex flex-col items-center">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold text-white mb-1"
        style={{ backgroundColor: colors[grade] }}
      >
        {grade}
      </div>
      <span className="text-xs text-content-primary">{label}</span>
      <span className="text-xs text-content-tertiary">{threshold}</span>
    </div>
  );
}

function DimensionInfo({
  name,
  weight,
  desc,
}: {
  name: string;
  weight: string;
  desc: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <span className="text-content-primary">{name}</span>
        <span className="text-content-tertiary ml-2">({weight})</span>
      </div>
      <span className="text-content-tertiary">{desc}</span>
    </div>
  );
}
