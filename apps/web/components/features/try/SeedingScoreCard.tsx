'use client';

import type { SeedingScore } from '@/lib/types/seeding';

interface SeedingScoreCardProps {
  score: SeedingScore;
}

const DIMENSION_LABELS: Record<string, { label: string; weight: string }> = {
  visualAttraction: { label: '视觉吸引力', weight: '30%' },
  contentMatch: { label: '内容匹配度', weight: '25%' },
  authenticity: { label: '真实可信度', weight: '20%' },
  emotionalImpact: { label: '情绪感染力', weight: '15%' },
  actionGuidance: { label: '行动引导力', weight: '10%' },
};

const GRADE_LABELS: Record<string, string> = {
  S: '完美',
  A: '优秀',
  B: '良好',
  C: '一般',
  D: '需改进',
};

export function SeedingScoreCard({ score }: SeedingScoreCardProps) {
  const dimensions = Object.entries(score.dimensions).map(([key, value]) => ({
    key,
    ...DIMENSION_LABELS[key],
    score: value,
  }));

  return (
    <div
      style={{
        padding: '20px',
        borderRadius: '20px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* 总分区域 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px' }}>
            种草力评分
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '36px', fontWeight: 600, color: '#D4AF37', letterSpacing: '-0.02em' }}>
              {score.overall}
            </span>
            <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)' }}>/ 100</span>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '100px',
            background: 'rgba(212, 175, 55, 0.15)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
          }}
        >
          <span style={{ fontSize: '20px', fontWeight: 700, color: '#D4AF37' }}>
            {score.grade}
          </span>
          <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
            {GRADE_LABELS[score.grade]}
          </span>
        </div>
      </div>

      {/* 维度分数 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {dimensions.map((dim) => (
          <div key={dim.key} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', width: '72px', flexShrink: 0 }}>
              {dim.label}
            </span>
            <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${dim.score}%`,
                  height: '100%',
                  borderRadius: '2px',
                  background: dim.score >= 80 ? '#D4AF37' : dim.score >= 60 ? '#B8962E' : '#8E8E93',
                  transition: 'width 0.6s ease',
                }}
              />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#D4AF37', width: '28px', textAlign: 'right' }}>
              {dim.score}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
