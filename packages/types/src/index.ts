/**
 * VidLuxe Types - Type definitions for the Premium Video Engine
 *
 * @vidluxe/types
 */

// ============================================================================
// Premium Score Types
// ============================================================================

export type PremiumGrade = 'S' | 'A' | 'B' | 'C' | 'D';

export interface DimensionScore {
  score: number;           // 0-100
  weight: number;          // 权重
  issues: string[];        // 问题列表
  suggestions: string[];   // 优化建议
}

export interface PremiumScore {
  // 总分
  total: number;
  grade: PremiumGrade;

  // 各维度得分
  dimensions: {
    color: DimensionScore;       // 色彩协调度 (25%)
    typography: DimensionScore;  // 排版舒适度 (20%)
    composition: DimensionScore; // 构图美感度 (20%)
    motion: DimensionScore;      // 动效流畅度 (15%)
    audio: DimensionScore;       // 音频品质度 (10%)
    detail: DimensionScore;      // 细节精致度 (10%)
  };

  // 对比数据
  comparison?: {
    before: number;
    after: number;
    improvement: number;
    peerAverage: number;
    topCreator: number;
  };

  // 时间戳
  timestamp: string;
}

// ============================================================================
// Color Analysis Types
// ============================================================================

export interface ColorAnalysis {
  // 基础指标
  saturation: {
    mean: number;
    std: number;
    highRatio: number;
  };

  brightness: {
    mean: number;
    std: number;
  };

  contrast: {
    ratio: number;
    score: number;
  };

  // 高级指标
  dominantColors: RGBColor[];
  colorCount: number;
  colorTemperature: number;  // 色温 (K)
  colorHarmony: number;      // 色彩和谐度 (0-1)
  colorConsistency: number;  // 帧间一致性 (0-1)

  // 评分
  premiumScore: number;
  issues: string[];
  suggestions: string[];
}

export interface RGBColor {
  r: number;
  g: number;
  b: number;
  hex: string;
  name?: string;
}

// ============================================================================
// Premium Profile Types
// ============================================================================

export type PremiumStyle =
  | 'magazine'         // 杂志大片
  | 'soft'             // 温柔日系
  | 'urban'            // 都市职场
  | 'vintage';         // 复古胶片

export interface PremiumProfile {
  name: PremiumStyle;
  displayName: string;
  description: string;

  // 色彩参数
  saturation: number;      // 目标饱和度
  contrast: number;        // 目标对比度
  temperature: number;     // 目标色温 (K)
  highlights: number;      // 高光调整
  shadows: number;         // 阴影调整
  colorCountMax: number;   // 最大颜色数

  // 示例
  examples?: string[];
}

// ============================================================================
// Video Analysis Input/Output
// ============================================================================

export interface VideoAnalysisInput {
  videoPath: string;
  fps?: number;
  sampleFrames?: number;  // 采样帧数
}

export interface VideoAnalysisOutput {
  // 分析结果
  color: ColorAnalysis;
  // typography: TypographyAnalysis;  // 后续扩展
  // composition: CompositionAnalysis;
  // motion: MotionAnalysis;
  // audio: AudioAnalysis;
  // detail: DetailAnalysis;

  // 综合评分
  score: PremiumScore;

  // 元数据
  duration: number;
  resolution: { width: number; height: number };
  fps: number;
}

// ============================================================================
// Enhancement Options
// ============================================================================

export interface EnhancementOptions {
  style: PremiumStyle;
  intensity: 'light' | 'medium' | 'strong';  // 升级强度
  dimensions: ('color' | 'typography' | 'composition' | 'motion' | 'audio' | 'detail')[];
}

export interface EnhancementResult {
  success: boolean;
  output?: PremiumScore;
  changes: {
    dimension: string;
    before: number;
    after: number;
    description: string;
  }[];
  error?: string;
}

// ============================================================================
// Grade Thresholds
// ============================================================================

export const GRADE_THRESHOLDS: Record<PremiumGrade, number> = {
  'S': 85,  // 顶级
  'A': 75,  // 优秀
  'B': 65,  // 良好
  'C': 55,  // 普通
  'D': 0,   // 需改进
};

// ============================================================================
// Premium Profiles
// ============================================================================

export const PREMIUM_PROFILES: Record<PremiumStyle, PremiumProfile> = {
  magazine: {
    name: 'magazine',
    displayName: '杂志大片',
    description: '时尚杂志封面质感，高级奢华',
    saturation: 0.70,
    contrast: 0.85,
    temperature: 5800,
    highlights: -5,
    shadows: 10,
    colorCountMax: 3,
  },
  soft: {
    name: 'soft',
    displayName: '温柔日系',
    description: '清新温柔，文艺治愈感',
    saturation: 0.50,
    contrast: 0.80,
    temperature: 5200,
    highlights: -5,
    shadows: 5,
    colorCountMax: 3,
  },
  urban: {
    name: 'urban',
    displayName: '都市职场',
    description: '专业干练，可信赖感',
    saturation: 0.60,
    contrast: 0.95,
    temperature: 4800,
    highlights: -15,
    shadows: 0,
    colorCountMax: 4,
  },
  vintage: {
    name: 'vintage',
    displayName: '复古胶片',
    description: '复古怀旧，电影氛围感',
    saturation: 0.55,
    contrast: 0.85,
    temperature: 5600,
    highlights: -10,
    shadows: 5,
    colorCountMax: 3,
  },
};
