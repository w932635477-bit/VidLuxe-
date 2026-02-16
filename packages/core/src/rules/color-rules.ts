/**
 * ColorRules - Premium Color Rules Library
 *
 * Defines rules for premium color quality
 */

import type { PremiumProfile, PremiumStyle } from '@vidluxe/types';

// ============================================================================
// Color Rules
// ============================================================================

export interface ColorRule {
  id: string;
  name: string;
  description: string;
  check: (value: number) => { passed: boolean; score: number; message: string };
}

// ============================================================================
// Saturation Rules
// ============================================================================

export const saturationRules: ColorRule[] = [
  {
    id: 'saturation_premium_range',
    name: '高级感饱和度范围',
    description: '高级感视频的饱和度通常在 35%-55% 之间',
    check: (value: number) => {
      if (value >= 0.35 && value <= 0.55) {
        const optimal = value >= 0.40 && value <= 0.50;
        return {
          passed: true,
          score: optimal ? 100 : 85,
          message: optimal
            ? '饱和度完美，符合高级感标准'
            : '饱和度在合理范围内',
        };
      }
      if (value < 0.35) {
        return {
          passed: false,
          score: Math.max(40, 60 + (value - 0.20) * 100),
          message: `饱和度过低 (${(value * 100).toFixed(0)}%)，建议提升至 40-50%`,
        };
      }
      return {
        passed: false,
        score: Math.max(30, 100 - (value - 0.55) * 200),
        message: `饱和度过高 (${(value * 100).toFixed(0)}%)，建议降低至 40-50%`,
      };
    },
  },
];

// ============================================================================
// Color Count Rules
// ============================================================================

export const colorCountRules: ColorRule[] = [
  {
    id: 'color_count_limited',
    name: '颜色种类克制',
    description: '高级感视频的主色调通常不超过 3-4 种',
    check: (value: number) => {
      if (value <= 3) {
        return {
          passed: true,
          score: 100,
          message: '颜色种类克制，符合高级感标准',
        };
      }
      if (value <= 4) {
        return {
          passed: true,
          score: 85,
          message: '颜色种类在合理范围内',
        };
      }
      return {
        passed: false,
        score: Math.max(30, 100 - (value - 4) * 15),
        message: `颜色种类过多 (${value}种)，建议精简至 3 种以内`,
      };
    },
  },
];

// ============================================================================
// Color Harmony Rules
// ============================================================================

export const colorHarmonyRules: ColorRule[] = [
  {
    id: 'color_harmony_high',
    name: '色彩和谐度高',
    description: '高级感视频的色彩和谐度通常在 0.7 以上',
    check: (value: number) => {
      if (value >= 0.8) {
        return {
          passed: true,
          score: 100,
          message: '色彩和谐度优秀',
        };
      }
      if (value >= 0.7) {
        return {
          passed: true,
          score: 85,
          message: '色彩和谐度良好',
        };
      }
      return {
        passed: false,
        score: Math.max(40, value * 100),
        message: `色彩和谐度不足 (${(value * 100).toFixed(0)}%)，建议使用相邻色或互补色搭配`,
      };
    },
  },
];

// ============================================================================
// Contrast Rules
// ============================================================================

export const contrastRules: ColorRule[] = [
  {
    id: 'contrast_balanced',
    name: '对比度适中',
    description: '高级感视频的对比度通常在 0.15-0.35 之间',
    check: (value: number) => {
      if (value >= 0.15 && value <= 0.35) {
        return {
          passed: true,
          score: 100,
          message: '对比度适中，画面层次感好',
        };
      }
      if (value < 0.15) {
        return {
          passed: false,
          score: Math.max(50, value / 0.15 * 80),
          message: '对比度过低，画面显得平淡',
        };
      }
      return {
        passed: false,
        score: Math.max(50, 100 - (value - 0.35) * 100),
        message: '对比度过高，可能显得生硬',
      };
    },
  },
];

// ============================================================================
// All Rules
// ============================================================================

export const allColorRules: ColorRule[] = [
  ...saturationRules,
  ...colorCountRules,
  ...colorHarmonyRules,
  ...contrastRules,
];
