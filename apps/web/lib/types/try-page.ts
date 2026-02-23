/**
 * Try Page 类型定义
 */

import type { SeedingScore } from './seeding';

// 步骤类型
export type Step = 'upload' | 'recognition' | 'style' | 'keyframe' | 'processing' | 'result';

// 内容类型
export type ContentType = 'image' | 'video';

// 上传响应
export interface UploadResponse {
  success: boolean;
  file?: {
    id: string;
    url: string;
    type: ContentType;
    filename: string;
    size: number;
  };
  error?: string;
}

// 增强响应
export interface EnhanceResponse {
  success: boolean;
  taskId?: string;
  estimatedTime?: number;
  quota?: {
    remaining: number;
  };
  error?: string;
}

// 任务状态响应
export interface TaskStatusResponse {
  success: boolean;
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStage?: string;
  result?: {
    type: ContentType;
    enhancedUrl: string;
    originalUrl: string;
    score?: SeedingScore;
  };
  error?: string;
}

// 关键帧类型
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

// 视频分析响应
export interface VideoAnalyzeResponse {
  success: boolean;
  keyframes?: KeyFrame[];
  videoInfo?: {
    duration: number;
    hasAudio: boolean;
  };
  error?: string;
}

// 封面增强响应
export interface EnhanceCoverResponse {
  success: boolean;
  enhancedUrl?: string;
  error?: string;
}

// 结果数据
export interface ResultData {
  enhancedUrl: string;
  originalUrl: string;
  enhancedCoverUrl?: string;
  score?: SeedingScore;
}

// AI 识别结果
export interface AiRecognition {
  category: import('./seeding').CategoryType;
  seedingType: import('./seeding').SeedingType;
}

// Try Page 状态
export interface TryPageState {
  step: Step;
  contentType: ContentType;
  uploadedFile: File | null;
  uploadedFileUrl: string | null;
  previewUrl: string | null;
  progress: number;
  currentStage: string;
  isLoading: boolean;
  error: string | null;
  selectedCategory: import('./seeding').CategoryType | null;
  selectedSeedingType: import('./seeding').SeedingType | null;
  aiRecognition: AiRecognition | null;
  resultData: ResultData | null;
  quotaRemaining: number;
  styleSourceType: import('@/components/features/try/StyleSelector').StyleSourceType;
  selectedPreset: import('@/components/features/try/StyleSelector').StyleType;
  referenceFile: File | null;
  referenceFileUrl: string | null;
  keyframes: KeyFrame[];
  selectedKeyframe: KeyFrame | null;
  enhancedCoverUrl: string | null;
  anonymousId: string;
}
