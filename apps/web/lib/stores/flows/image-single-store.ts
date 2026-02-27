/**
 * 单图流程 Store
 *
 * 管理单图上传、识别、风格选择、处理、结果
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import type { CategoryType, SeedingType } from '@/lib/types/seeding';
import type {
  ImageSingleStep,
  StyleType,
  StyleSourceType,
  ResultData,
} from '@/lib/types/flow';

// ============================================
// 状态接口
// ============================================

interface ImageSingleState {
  // 步骤
  step: ImageSingleStep;

  // 上传
  uploadedFile: File | null;
  uploadedFileUrl: string | null;
  previewUrl: string | null;

  // 处理状态
  isLoading: boolean;
  progress: number;
  currentStage: string;
  error: string | null;

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

  // 结果
  resultData: ResultData | null;

  // 弹窗
  showCreditModal: boolean;
  creditRequired: number;
}

interface ImageSingleActions {
  // 步骤操作
  setStep: (step: ImageSingleStep) => void;
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

  // 品类操作
  setSelectedCategory: (category: CategoryType | null) => void;
  setSelectedSeedingType: (type: SeedingType | null) => void;
  setAiRecognition: (recognition: ImageSingleState['aiRecognition']) => void;

  // 风格操作
  setStyleSourceType: (type: StyleSourceType) => void;
  setSelectedPreset: (preset: StyleType) => void;
  setReferenceFile: (file: File | null) => void;
  setReferenceFileUrl: (url: string | null) => void;

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

const STEP_ORDER: ImageSingleStep[] = [
  'upload',
  'recognition',
  'style',
  'processing',
  'result',
];

// ============================================
// 初始状态
// ============================================

const initialState: ImageSingleState = {
  step: 'upload',
  uploadedFile: null,
  uploadedFileUrl: null,
  previewUrl: null,
  isLoading: false,
  progress: 0,
  currentStage: '',
  error: null,
  selectedCategory: null,
  selectedSeedingType: null,
  aiRecognition: null,
  styleSourceType: 'preset',
  selectedPreset: 'magazine',
  referenceFile: null,
  referenceFileUrl: null,
  resultData: null,
  showCreditModal: false,
  creditRequired: 0,
};

// ============================================
// Store
// ============================================

export const useImageSingleStore = create<ImageSingleState & ImageSingleActions>()(
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

      // 品类操作
      setSelectedCategory: (selectedCategory) => set({ selectedCategory }, false, 'setSelectedCategory'),
      setSelectedSeedingType: (selectedSeedingType) => set({ selectedSeedingType }, false, 'setSelectedSeedingType'),
      setAiRecognition: (aiRecognition) => set({ aiRecognition }, false, 'setAiRecognition'),

      // 风格操作
      setStyleSourceType: (styleSourceType) => set({ styleSourceType }, false, 'setStyleSourceType'),
      setSelectedPreset: (selectedPreset) => set({ selectedPreset }, false, 'setSelectedPreset'),
      setReferenceFile: (referenceFile) => set({ referenceFile }, false, 'setReferenceFile'),
      setReferenceFileUrl: (referenceFileUrl) => set({ referenceFileUrl }, false, 'setReferenceFileUrl'),

      // 结果操作
      setResultData: (resultData) => set({ resultData }, false, 'setResultData'),

      // 弹窗操作
      setShowCreditModal: (showCreditModal) => set({ showCreditModal }, false, 'setShowCreditModal'),
      setCreditRequired: (creditRequired) => set({ creditRequired }, false, 'setCreditRequired'),

      // 重置
      reset: () => set(initialState, false, 'reset'),
    })),
    { name: 'image-single-store' }
  )
);

// ============================================
// Selectors
// ============================================

export const selectStep = (state: ImageSingleState) => state.step;
export const selectIsLoading = (state: ImageSingleState) => state.isLoading;
export const selectPreviewUrl = (state: ImageSingleState) => state.previewUrl;
export const selectResultData = (state: ImageSingleState) => state.resultData;
