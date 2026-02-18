'use client';

import { useMemo } from 'react';

// 与后端对齐的评分等级
export type PremiumGrade = 'S' | 'A' | 'B' | 'C' | 'D';

export const GRADE_THRESHOLDS: Record<PremiumGrade, number> = {
  'S': 85,  // 顶级
  'A': 75,  // 优秀
  'B': 65,  // 良好
  'C': 55,  // 普通
  'D': 0,   // 需改进
};

export const GRADE_COLORS: Record<PremiumGrade, string> = {
  'S': '#FFD700',  // 金色
  'A': '#4CAF50',  // 绿色
  'B': '#2196F3',  // 蓝色
  'C': '#FF9800',  // 橙色
  'D': '#EF4444',  // 红色
};

export const GRADE_LABELS: Record<PremiumGrade, string> = {
  'S': '顶级',
  'A': '优秀',
  'B': '良好',
  'C': '普通',
  'D': '需改进',
};

// MVP 4维评分
export interface DimensionScore {
  score: number;
  weight: number;
  issues?: string[];
  suggestions?: string[];
}

export interface PremiumScore {
  total: number;
  grade: PremiumGrade;
  dimensions: {
    color: DimensionScore;       // 色彩协调度
    composition: DimensionScore; // 构图美感度
    typography: DimensionScore;  // 排版舒适度
    detail: DimensionScore;      // 细节精致度
  };
  improvement?: number;  // 提升分数
}

export const DIMENSION_LABELS: Record<string, string> = {
  color: '色彩协调',
  composition: '构图美感',
  typography: '排版舒适',
  detail: '细节精致',
};

function calculateGrade(score: number): PremiumGrade {
  if (score >= GRADE_THRESHOLDS.S) return 'S';
  if (score >= GRADE_THRESHOLDS.A) return 'A';
  if (score >= GRADE_THRESHOLDS.B) return 'B';
  if (score >= GRADE_THRESHOLDS.C) return 'C';
  return 'D';
}

interface ScoreCardProps {
  score: PremiumScore;
  showImprovement?: boolean;
  className?: string;
}

export function ScoreCard({ score, showImprovement = true, className = '' }: ScoreCardProps) {
  const gradeColor = GRADE_COLORS[score.grade];
  const gradeLabel = GRADE_LABELS[score.grade];
  const circumference = 2 * Math.PI * 54; // r=54
  const strokeDashoffset = circumference - (score.total / 100) * circumference;

  return (
    <div className={`glass-card ${className}`}>
      <div className="glass-card-inner">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-content-primary">高级感评分</h3>
          {showImprovement && score.improvement && score.improvement > 0 && (
            <span className="text-green-400 text-sm">
              ↑ +{score.improvement} 分
            </span>
          )}
        </div>

        <div className="flex items-center gap-8">
          {/* 评分圆环 */}
          <div className="score-circle">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle
                className="score-circle-bg"
                cx="60"
                cy="60"
                r="54"
                strokeWidth="8"
              />
              <circle
                className="score-circle-progress"
                cx="60"
                cy="60"
                r="54"
                strokeWidth="8"
                stroke={gradeColor}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-content-primary">
                {score.total}
              </span>
              <span className="text-sm text-content-secondary">/100</span>
            </div>
          </div>

          {/* 等级标签 */}
          <div className="flex flex-col items-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-bold text-white mb-2"
              style={{ backgroundColor: gradeColor }}
            >
              {score.grade}
            </div>
            <span className="text-sm text-content-secondary">{gradeLabel}</span>
          </div>
        </div>

        {/* 维度详情 */}
        <div className="mt-6 space-y-3">
          {Object.entries(score.dimensions).map(([key, dim]) => (
            <DimensionBar
              key={key}
              label={DIMENSION_LABELS[key] || key}
              score={dim.score}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface DimensionBarProps {
  label: string;
  score: number;
}

function DimensionBar({ label, score }: DimensionBarProps) {
  const grade = calculateGrade(score);
  const color = GRADE_COLORS[grade];

  return (
    <div className="flex items-center gap-3">
      <span className="w-16 text-sm text-content-secondary">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${score}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <span className="w-8 text-sm text-right text-content-primary">{score}</span>
    </div>
  );
}

// 简化版评分展示（用于小卡片）
interface MiniScoreProps {
  score: number;
  className?: string;
}

export function MiniScore({ score, className = '' }: MiniScoreProps) {
  const grade = calculateGrade(score);
  const color = GRADE_COLORS[grade];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white"
        style={{ backgroundColor: color }}
      >
        {grade}
      </div>
      <span className="text-sm text-content-primary">{score}</span>
    </div>
  );
}
