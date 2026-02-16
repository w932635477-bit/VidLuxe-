/**
 * PremiumScorer - Premium Quality Scoring Engine
 *
 * Calculates comprehensive premium scores for video content
 */

import type {
  PremiumScore,
  PremiumGrade,
  DimensionScore,
  ColorAnalysis,
  GRADE_THRESHOLDS,
} from '@vidluxe/types';
import { GRADE_THRESHOLDS } from '@vidluxe/types';

// ============================================================================
// Configuration
// ============================================================================

export interface PremiumScorerConfig {
  weights?: {
    color: number;       // 色彩协调度
    typography: number;  // 排版舒适度
    composition: number; // 构图美感度
    motion: number;      // 动效流畅度
    audio: number;       // 音频品质度
    detail: number;      // 细节精致度
  };
}

const DEFAULT_WEIGHTS = {
  color: 0.25,
  typography: 0.20,
  composition: 0.20,
  motion: 0.15,
  audio: 0.10,
  detail: 0.10,
};

// ============================================================================
// Premium Scorer
// ============================================================================

export class PremiumScorer {
  private readonly weights: typeof DEFAULT_WEIGHTS;

  constructor(config: PremiumScorerConfig = {}) {
    this.weights = config.weights ?? DEFAULT_WEIGHTS;

    // 验证权重总和为1
    const total = Object.values(this.weights).reduce((a, b) => a + b, 0);
    if (Math.abs(total - 1) > 0.001) {
      throw new Error(`Weights must sum to 1, got ${total}`);
    }
  }

  /**
   * Calculate comprehensive premium score from color analysis
   * MVP: Only color dimension is fully implemented
   */
  calculateFromColor(colorAnalysis: ColorAnalysis): PremiumScore {
    // MVP 阶段：只实现色彩维度
    const colorScore = this.scoreColor(colorAnalysis);

    // 其他维度使用默认值（待后续实现）
    const defaultScore = this.createDefaultDimensionScore();

    const dimensions = {
      color: colorScore,
      typography: defaultScore,
      composition: defaultScore,
      motion: defaultScore,
      audio: defaultScore,
      detail: defaultScore,
    };

    // 计算总分（只考虑已实现的维度）
    let total = 0;
    let implementedWeight = this.weights.color;

    total += colorScore.score * this.weights.color;

    // 其他维度使用基准分
    const baseScore = 70;
    total += baseScore * (1 - implementedWeight);

    const grade = this.calculateGrade(total);

    return {
      total: Math.round(total),
      grade,
      dimensions,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Calculate grade from score
   */
  calculateGrade(score: number): PremiumGrade {
    if (score >= GRADE_THRESHOLDS.S) return 'S';
    if (score >= GRADE_THRESHOLDS.A) return 'A';
    if (score >= GRADE_THRESHOLDS.B) return 'B';
    if (score >= GRADE_THRESHOLDS.C) return 'C';
    return 'D';
  }

  /**
   * Get grade color for UI display
   */
  getGradeColor(grade: PremiumGrade): string {
    const colors: Record<PremiumGrade, string> = {
      'S': '#FFD700',  // 金色
      'A': '#4CAF50',  // 绿色
      'B': '#2196F3',  // 蓝色
      'C': '#FF9800',  // 橙色
      'D': '#F44336',  // 红色
    };
    return colors[grade];
  }

  /**
   * Get grade label for UI display
   */
  getGradeLabel(grade: PremiumGrade): string {
    const labels: Record<PremiumGrade, string> = {
      'S': '顶级',
      'A': '优秀',
      'B': '良好',
      'C': '普通',
      'D': '需改进',
    };
    return labels[grade];
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  private scoreColor(analysis: ColorAnalysis): DimensionScore {
    return {
      score: analysis.premiumScore,
      weight: this.weights.color,
      issues: analysis.issues,
      suggestions: analysis.suggestions,
    };
  }

  private createDefaultDimensionScore(): DimensionScore {
    return {
      score: 70,
      weight: 0,
      issues: ['此维度分析尚未实现'],
      suggestions: ['敬请期待后续更新'],
    };
  }
}
