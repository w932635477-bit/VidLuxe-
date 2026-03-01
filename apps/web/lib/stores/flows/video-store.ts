/**
 * 视频流程 Store
 *
 * 管理视频上传、识别、风格选择、调色、关键帧、处理、结果
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import type { CategoryType, SeedingType } from '@/lib/types/seeding';
import type {
  VideoStep,
  StyleType,
  StyleSourceType,
  KeyFrame,
  ResultData,
} from '@/lib/types/flow';
import type { ContentType } from '@/lib/content-types';

// ============================================
// 状态接口
// ============================================

interface VideoState {
  // 步骤
  step: VideoStep;

  // 上传
  uploadedFile: File | null;
  uploadedFileUrl: string | null;
  previewUrl: string | null;

  // 处理状态
  isLoading: boolean;
  progress: number;
  currentStage: string;
  error: string | null;
  loadingStepIndex: number;

  // 品类识别
  selectedCategory: CategoryType | null;
  selectedSeedingType: SeedingType | null;
  aiRecognition: {
    category: CategoryType;
    seedingType: SeedingType;
  } | null;

  // 风格
  styleSourceType: StyleSourceType;
  selectedPreset: StyleType;
  referenceFile: File | null;
  referenceFileUrl: string | null;

  // 效果系统（新）
  selectedEffectId: string;
  effectIntensity: number;
  selectedContentType: ContentType;

  // 调色
  colorGradeExplanation: string;
  gradedVideoUrl: string | null;

  // 关键帧
  keyframes: KeyFrame[];
  selectedKeyframe: KeyFrame | null;
  selectedKeyframes: KeyFrame[];
  coverKeyframe: KeyFrame | null;
  enhancedCoverUrl: string | null;
  showFrameConfirmModal: boolean;

  // 结果
  resultData: ResultData | null;

  // 弹窗
  showCreditModal: boolean;
  creditRequired: number;
}

interface VideoActions {
  // 步骤操作
  setStep: (step: VideoStep) => void;
  nextStep: () => void;
  prevStep: () => void;

  // 上传操作
  setUploadedFile: (file: File | null) => void;
  setUploadedFileUrl: (url: string | null) => void;
  setPreviewUrl: (url: string | null) => void;

  // 处理状态
  setIsLoading: (loading: boolean) => void;
  setProgress: (progress: number) => void;
  setCurrentStage: (stage: string) => void;
  setError: (error: string | null) => void;
  setLoadingStepIndex: (index: number) => void;

  // 品类操作
  setSelectedCategory: (category: CategoryType | null) => void;
  setSelectedSeedingType: (type: SeedingType | null) => void;
  setAiRecognition: (recognition: VideoState['aiRecognition']) => void;

  // 风格操作
  setStyleSourceType: (type: StyleSourceType) => void;
  setSelectedPreset: (preset: StyleType) => void;
  setReferenceFile: (file: File | null) => void;
  setReferenceFileUrl: (url: string | null) => void;

  // 效果系统操作（新）
  setSelectedEffectId: (id: string) => void;
  setEffectIntensity: (intensity: number) => void;
  setSelectedContentType: (type: ContentType) => void;

  // 调色操作
  setColorGradeExplanation: (explanation: string) => void;
  setGradedVideoUrl: (url: string | null) => void;

  // 关键帧操作
  setKeyframes: (frames: KeyFrame[]) => void;
  setSelectedKeyframe: (frame: KeyFrame | null) => void;
  setSelectedKeyframes: (frames: KeyFrame[]) => void;
  setCoverKeyframe: (frame: KeyFrame | null) => void;
  setEnhancedCoverUrl: (url: string | null) => void;
  setShowFrameConfirmModal: (show: boolean) => void;

  // 结果操作
  setResultData: (data: ResultData | null) => void;

  // 弹窗操作
  setShowCreditModal: (show: boolean) => void;
  setCreditRequired: (required: number) => void;

  // 重置
  reset: () => void;
}

// ============================================
// 步骤顺序
// ============================================

const STEP_ORDER: VideoStep[] = [
  'upload',
  'recognition',
  'style',
  'keyframe',
  'processing',
  'result',
];

// ============================================
// 初始状态
// ============================================

const initialState: VideoState = {
  step: 'upload',
  uploadedFile: null,
  uploadedFileUrl: null,
  previewUrl: null,
  isLoading: false,
  progress: 0,
  currentStage: '',
  error: null,
  loadingStepIndex: 0,
  selectedCategory: null,
  selectedSeedingType: null,
  aiRecognition: null,
  styleSourceType: 'preset',
  selectedPreset: 'magazine',
  referenceFile: null,
  referenceFileUrl: null,
  selectedEffectId: 'outfit-magazine',
  effectIntensity: 100,
  selectedContentType: 'outfit',
  colorGradeExplanation: '',
  gradedVideoUrl: null,
  keyframes: [],
  selectedKeyframe: null,
  selectedKeyframes: [],
  coverKeyframe: null,
  enhancedCoverUrl: null,
  showFrameConfirmModal: false,
  resultData: null,
  showCreditModal: false,
  creditRequired: 0,
};

// ============================================
// Store
// ============================================

export const useVideoStore = create<VideoState & VideoActions>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      // 步骤操作
      setStep: (step) => set({ step }, false, 'setStep'),
      nextStep: () => {
        const currentStep = get().step;
        const currentIndex = STEP_ORDER.indexOf(currentStep);
        if (currentIndex < STEP_ORDER.length - 1) {
          set({ step: STEP_ORDER[currentIndex + 1] }, false, 'nextStep');
        }
      },
      prevStep: () => {
        const currentStep = get().step;
        const currentIndex = STEP_ORDER.indexOf(currentStep);
        if (currentIndex > 0) {
          set({ step: STEP_ORDER[currentIndex - 1] }, false, 'prevStep');
        }
      },

      // 上传操作
      setUploadedFile: (uploadedFile) => set({ uploadedFile }, false, 'setUploadedFile'),
      setUploadedFileUrl: (uploadedFileUrl) => set({ uploadedFileUrl }, false, 'setUploadedFileUrl'),
      setPreviewUrl: (previewUrl) => set({ previewUrl }, false, 'setPreviewUrl'),

      // 处理状态
      setIsLoading: (isLoading) => set({ isLoading }, false, 'setIsLoading'),
      setProgress: (progress) => set({ progress }, false, 'setProgress'),
      setCurrentStage: (currentStage) => set({ currentStage }, false, 'setCurrentStage'),
      setError: (error) => set({ error }, false, 'setError'),
      setLoadingStepIndex: (loadingStepIndex) => set({ loadingStepIndex }, false, 'setLoadingStepIndex'),

      // 品类操作
      setSelectedCategory: (selectedCategory) => set({ selectedCategory }, false, 'setSelectedCategory'),
      setSelectedSeedingType: (selectedSeedingType) => set({ selectedSeedingType }, false, 'setSelectedSeedingType'),
      setAiRecognition: (aiRecognition) => set({ aiRecognition }, false, 'setAiRecognition'),

      // 风格操作
      setStyleSourceType: (styleSourceType) => set({ styleSourceType }, false, 'setStyleSourceType'),
      setSelectedPreset: (selectedPreset) => set({ selectedPreset }, false, 'setSelectedPreset'),
      setReferenceFile: (referenceFile) => set({ referenceFile }, false, 'setReferenceFile'),
      setReferenceFileUrl: (referenceFileUrl) => set({ referenceFileUrl }, false, 'setReferenceFileUrl'),

      // 效果系统操作（新）
      setSelectedEffectId: (selectedEffectId) => set({ selectedEffectId }, false, 'setSelectedEffectId'),
      setEffectIntensity: (effectIntensity) => set({ effectIntensity }, false, 'setEffectIntensity'),
      setSelectedContentType: (selectedContentType) => set({ selectedContentType }, false, 'setSelectedContentType'),

      // 调色操作
      setColorGradeExplanation: (colorGradeExplanation) => set({ colorGradeExplanation }, false, 'setColorGradeExplanation'),
      setGradedVideoUrl: (gradedVideoUrl) => set({ gradedVideoUrl }, false, 'setGradedVideoUrl'),

      // 关键帧操作
      setKeyframes: (keyframes) => set({ keyframes }, false, 'setKeyframes'),
      setSelectedKeyframe: (selectedKeyframe) => set({ selectedKeyframe }, false, 'setSelectedKeyframe'),
      setSelectedKeyframes: (selectedKeyframes) => set({ selectedKeyframes }, false, 'setSelectedKeyframes'),
      setCoverKeyframe: (coverKeyframe) => set({ coverKeyframe }, false, 'setCoverKeyframe'),
      setEnhancedCoverUrl: (enhancedCoverUrl) => set({ enhancedCoverUrl }, false, 'setEnhancedCoverUrl'),
      setShowFrameConfirmModal: (showFrameConfirmModal) => set({ showFrameConfirmModal }, false, 'setShowFrameConfirmModal'),

      // 结果操作
      setResultData: (resultData) => set({ resultData }, false, 'setResultData'),

      // 弹窗操作
      setShowCreditModal: (showCreditModal) => set({ showCreditModal }, false, 'setShowCreditModal'),
      setCreditRequired: (creditRequired) => set({ creditRequired }, false, 'setCreditRequired'),

      // 重置
      reset: () => set(initialState, false, 'reset'),
    })),
    { name: 'video-store' }
  )
);

// ============================================
// Selectors
// ============================================

export const selectStep = (state: VideoState) => state.step;
export const selectIsLoading = (state: VideoState) => state.isLoading;
export const selectPreviewUrl = (state: VideoState) => state.previewUrl;
export const selectKeyframes = (state: VideoState) => state.keyframes;
export const selectResultData = (state: VideoState) => state.resultData;
