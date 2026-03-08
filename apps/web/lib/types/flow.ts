/**
 * 独立流程类型定义
 *
 * 两种流程各有独立的步骤和状态
 */

// ============================================
// 流程类型
// ============================================

export type FlowType = 'image-single' | 'video';

// ============================================
// 单图流程步骤
// ============================================

export type ImageSingleStep =
  | 'upload'
  | 'recognition'
  | 'style'
  | 'processing'
  | 'result';

// ============================================
// 视频流程步骤
// ============================================

export type VideoStep =
  | 'upload'
  | 'recognition'
  | 'style'
  | 'keyframe'
  | 'processing'
  | 'result';

// ============================================
// 通用类型
// ============================================

export type StyleType = 'magazine' | 'soft' | 'urban' | 'vintage';

export type StyleSourceType = 'preset' | 'reference';

// ============================================
// 关键帧
// ============================================

export interface KeyFrame {
  url: string;
  timestamp: number;
  score: number;
  details: {
    sharpness: number;
    composition: number;
    brightness: number;
    hasFace: boolean;
  };
}

// ============================================
// 品类类型（从 seeding 导入）
// ============================================

export type { CategoryType, SeedingType } from './seeding';

// ============================================
// 结果数据
// ============================================

export interface ResultData {
  enhancedUrl: string;
  originalUrl: string;
  enhancedCoverUrl?: string;
  enhancedVideoUrl?: string;
  enhancedFrames?: { originalUrl: string; enhancedUrl: string }[];
  score?: {
    overall: number;
    grade: 'S' | 'A' | 'B' | 'C' | 'D';
    dimensions: {
      visualAttraction: number;
      contentMatch: number;
      authenticity: number;
      emotionalImpact: number;
      actionGuidance: number;
    };
    feedback?: string[];
    improvementSuggestions?: string[];
  };
}
