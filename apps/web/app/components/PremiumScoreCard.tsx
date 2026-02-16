'use client';

import { GRADE_THRESHOLDS } from '@vidluxe/core';

// Demo data for preview
const demoScore = {
  total: 72,
  grade: 'B' as const,
  dimensions: {
    color: { score: 78, issues: ['饱和度偏高'], suggestions: ['降低至 40-50%'] },
    typography: { score: 65, issues: [], suggestions: [] },
    composition: { score: 72, issues: [], suggestions: [] },
    motion: { score: 70, issues: [], suggestions: [] },
    audio: { score: 68, issues: [], suggestions: [] },
    detail: { score: 75, issues: [], suggestions: [] },
  },
};

const gradeColors: Record<string, string> = {
  'S': '#FFD700',
  'A': '#4CAF50',
  'B': '#2196F3',
  'C': '#FF9800',
  'D': '#F44336',
};

const gradeLabels: Record<string, string> = {
  'S': '顶级',
  'A': '优秀',
  'B': '良好',
  'C': '普通',
  'D': '需改进',
};

const dimensionLabels: Record<string, string> = {
  color: '色彩协调度',
  typography: '排版舒适度',
  composition: '构图美感度',
  motion: '动效流畅度',
  audio: '音频品质度',
  detail: '细节精致度',
};

export default function PremiumScoreCard() {
  const { total, grade, dimensions } = demoScore;
  const gradeColor = gradeColors[grade];

  return (
    <div className="bg-gray-800/50 rounded-2xl p-8 backdrop-blur">
      <h2 className="text-2xl font-semibold text-white mb-6">
        高级感评分
      </h2>

      {/* Score Circle */}
      <div className="flex justify-center mb-8">
        <div
          className="relative w-48 h-48 rounded-full flex items-center justify-center"
          style={{
            background: `conic-gradient(${gradeColor} ${total * 3.6}deg, rgba(255,255,255,0.1) 0deg)`,
          }}
        >
          <div className="w-40 h-40 rounded-full bg-gray-900 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold text-white">{total}</span>
            <span
              className="text-xl font-semibold mt-1"
              style={{ color: gradeColor }}
            >
              Grade {grade} · {gradeLabels[grade]}
            </span>
          </div>
        </div>
      </div>

      {/* Dimension Bars */}
      <div className="space-y-4">
        {Object.entries(dimensions).map(([key, value]) => (
          <div key={key}>
            <div className="flex justify-between mb-1">
              <span className="text-gray-300">{dimensionLabels[key]}</span>
              <span className="text-white font-medium">{value.score}</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${value.score}%`,
                  backgroundColor: getDimensionColor(value.score),
                }}
              />
            </div>
            {value.issues.length > 0 && (
              <p className="text-orange-400 text-sm mt-1">
                ⚠️ {value.issues[0]}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Action Button */}
      <button className="w-full mt-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors">
        一键升级高级感
      </button>
    </div>
  );
}

function getDimensionColor(score: number): string {
  if (score >= 85) return '#FFD700';
  if (score >= 75) return '#4CAF50';
  if (score >= 65) return '#2196F3';
  if (score >= 55) return '#FF9800';
  return '#F44336';
}
