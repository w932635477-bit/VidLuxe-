/**
 * 独立流程类型定义
 *
 * 三种流程各有独立的步骤和状态
 */

// ============================================
// 流程类型
// ============================================

export type FlowType = 'image-single' | 'image-batch' | 'video';

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
// 多图批量流程步骤
// ============================================

export type ImageBatchStep =
  | 'upload'
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
  | 'colorGrade'
  | 'keyframe'
  | 'processing'
  | 'result';

// ============================================
// 通用类型
// ============================================

export type StyleType = 'magazine' | 'soft' | 'urban' | 'vintage';

export type StyleSourceType = 'preset' | 'reference';

// ============================================
// 批量文件项（扩展：包含独立的风格选择）
// ============================================

export interface BatchFileItem {
  id: string;
  file: File;
  previewUrl: string;
  uploadedUrl: string | null;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  // 每张图片独立的风格选择
  selectedStyles: StyleType[];
  // 处理状态
  processingProgress?: number;
  processingStatus?: 'pending' | 'processing' | 'completed' | 'error';
  // 结果
  results?: BatchResultItem[];
}

// ============================================
// 批量结果项
// ============================================

export interface BatchResultItem {
  id: string;
  fileIndex: number;
  originalUrl: string;
  enhancedUrl: string;
  style: StyleType;
  score?: {
    overall: number;
    grade: string;
    dimensions: {
      visualAttraction: number;
      contentMatch: number;
      authenticity: number;
      emotionalImpact: number;
      actionGuidance: number;
    };
    feedback: string[];
    improvementSuggestions: string[];
  };
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

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
  score?: BatchResultItem['score'];
}