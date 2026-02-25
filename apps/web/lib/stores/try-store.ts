/**
 * Try Page Store (Zustand)
 *
 * 管理 Try 页面的所有状态，遵循最佳实践：
 * - 状态与操作分离
 * - 初始状态单独定义
 * - 使用 immer middleware
 * - 导出 selectors
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import type { CategoryType, SeedingType } from '@/lib/types/seeding';
import type { KeyFrame as KeyFrameBase } from '@/lib/types/try-page';

// ============================================
// 类型定义
// ============================================

export type Step =
  | 'upload'
  | 'recognition'
  | 'style'
  | 'colorGrade'
  | 'keyframe'
  | 'processing'
  | 'result';

export type ContentType = 'image' | 'video';
export type UploadMode = 'single' | 'batch';
export type StyleSourceType = 'preset' | 'reference';

export type StyleType = 'magazine' | 'soft' | 'urban' | 'minimal' | 'vintage';
export type MultiStyleType = 'minimal' | 'warmLuxury' | 'coolPro' | 'morandi';

// 重新导出 seeding 类型，方便使用
export type { CategoryType, SeedingType } from '@/lib/types/seeding';

// 使用 try-page 中定义的 KeyFrame 类型
export type KeyFrame = KeyFrameBase;

export interface BatchFileItem {
  id: string;
  file: File;
  previewUrl: string;
  uploadedUrl: string | null;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export interface BatchResultItem {
  originalUrl: string;
  enhancedUrl: string;
  style: MultiStyleType | string;
  score?: SeedingScore;
}

export interface SeedingScore {
  total: number;
  dimensions: {
    visual: number;
    content: number;
    emotion: number;
  };
}

export interface ResultData {
  enhancedUrl: string;
  originalUrl: string;
  enhancedCoverUrl?: string;
  score?: SeedingScore;
}

// ============================================
// 状态接口
// ============================================

interface TryState {
  // 步骤状态
  step: Step;
  contentType: ContentType;
  uploadMode: UploadMode;

  // 上传状态
  uploadedFile: File | null;
  uploadedFileUrl: string | null;
  previewUrl: string | null;

  // 处理状态
  isLoading: boolean;
  progress: number;
  currentStage: string;
  error: string | null;

  // 品类和种草类型
  selectedCategory: CategoryType | null;
  selectedSeedingType: SeedingType | null;

  // AI 识别结果
  aiRecognition: {
    category: CategoryType;
    seedingType: SeedingType;
  } | null;

  // 结果
  resultData: ResultData | null;
  batchResults: BatchResultItem[];

  // 风格相关
  styleSourceType: StyleSourceType;
  selectedPreset: StyleType;
  referenceFile: File | null;
  referenceFileUrl: string | null;
  selectedStyles: MultiStyleType[];

  // 关键帧相关（视频专用）
  keyframes: KeyFrame[];
  selectedKeyframe: KeyFrame | null;
  enhancedCoverUrl: string | null;
  selectedKeyframes: KeyFrame[];
  coverKeyframe: KeyFrame | null;
  showFrameConfirmModal: boolean;

  // 调色相关
  colorGradeExplanation: string;
  loadingStepIndex: number;
  gradedVideoUrl: string | null;

  // 批量上传相关
  batchFiles: BatchFileItem[];
  showConfirmModal: boolean;

  // 弹窗状态
  showCreditModal: boolean;
  creditRequired: number;

  // 邀请码相关
  inviteCode: string | null;
  inviteCodeInput: string;
  inviteApplied: boolean;
  inviteError: string | null;
}

interface TryActions {
  // 步骤操作
  setStep: (step: Step) => void;
  setContentType: (type: ContentType) => void;
  setUploadMode: (mode: UploadMode) => void;

  // 上传操作
  setUploadedFile: (file: File | null) => void;
  setUploadedFileUrl: (url: string | null) => void;
  setPreviewUrl: (url: string | null) => void;

  // 处理操作
  setIsLoading: (loading: boolean) => void;
  setProgress: (progress: number) => void;
  setCurrentStage: (stage: string) => void;
  setError: (error: string | null) => void;

  // 品类操作
  setSelectedCategory: (category: CategoryType | null) => void;
  setSelectedSeedingType: (type: SeedingType | null) => void;
  setAiRecognition: (recognition: TryState['aiRecognition']) => void;

  // 结果操作
  setResultData: (data: ResultData | null) => void;
  setBatchResults: (results: BatchResultItem[]) => void;
  addBatchResult: (result: BatchResultItem) => void;

  // 风格操作
  setStyleSourceType: (type: StyleSourceType) => void;
  setSelectedPreset: (preset: StyleType) => void;
  setReferenceFile: (file: File | null) => void;
  setReferenceFileUrl: (url: string | null) => void;
  setSelectedStyles: (styles: MultiStyleType[]) => void;

  // 关键帧操作
  setKeyframes: (frames: KeyFrame[]) => void;
  setSelectedKeyframe: (frame: KeyFrame | null) => void;
  setEnhancedCoverUrl: (url: string | null) => void;
  setSelectedKeyframes: (frames: KeyFrame[]) => void;
  setCoverKeyframe: (frame: KeyFrame | null) => void;
  setShowFrameConfirmModal: (show: boolean) => void;

  // 调色操作
  setColorGradeExplanation: (explanation: string) => void;
  setLoadingStepIndex: (index: number) => void;
  setGradedVideoUrl: (url: string | null) => void;

  // 批量操作
  setBatchFiles: (files: BatchFileItem[]) => void;
  updateBatchFile: (id: string, updates: Partial<BatchFileItem>) => void;
  removeBatchFile: (id: string) => void;
  setShowConfirmModal: (show: boolean) => void;

  // 弹窗操作
  setShowCreditModal: (show: boolean) => void;
  setCreditRequired: (required: number) => void;

  // 邀请码操作
  setInviteCode: (code: string | null) => void;
  setInviteCodeInput: (input: string) => void;
  setInviteApplied: (applied: boolean) => void;
  setInviteError: (error: string | null) => void;

  // 重置
  reset: () => void;
  resetToUpload: () => void;
}

// ============================================
// 初始状态
// ============================================

const initialState: TryState = {
  // 步骤状态
  step: 'upload',
  contentType: 'image',
  uploadMode: 'single',

  // 上传状态
  uploadedFile: null,
  uploadedFileUrl: null,
  previewUrl: null,

  // 处理状态
  isLoading: false,
  progress: 0,
  currentStage: '',
  error: null,

  // 品类和种草类型
  selectedCategory: null,
  selectedSeedingType: null,

  // AI 识别结果
  aiRecognition: null,

  // 结果
  resultData: null,
  batchResults: [],

  // 风格相关
  styleSourceType: 'preset',
  selectedPreset: 'magazine',
  referenceFile: null,
  referenceFileUrl: null,
  selectedStyles: [],

  // 关键帧相关
  keyframes: [],
  selectedKeyframe: null,
  enhancedCoverUrl: null,
  selectedKeyframes: [],
  coverKeyframe: null,
  showFrameConfirmModal: false,

  // 调色相关
  colorGradeExplanation: '',
  loadingStepIndex: 0,
  gradedVideoUrl: null,

  // 批量上传相关
  batchFiles: [],
  showConfirmModal: false,

  // 弹窗状态
  showCreditModal: false,
  creditRequired: 0,

  // 邀请码相关
  inviteCode: null,
  inviteCodeInput: '',
  inviteApplied: false,
  inviteError: null,
};

// ============================================
// Store 创建
// ============================================

export const useTryStore = create<TryState & TryActions>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      // 步骤操作
      setStep: (step) => set({ step }, false, 'setStep'),
      setContentType: (contentType) => set({ contentType }, false, 'setContentType'),
      setUploadMode: (uploadMode) => set({ uploadMode }, false, 'setUploadMode'),

      // 上传操作
      setUploadedFile: (uploadedFile) => set({ uploadedFile }, false, 'setUploadedFile'),
      setUploadedFileUrl: (uploadedFileUrl) => set({ uploadedFileUrl }, false, 'setUploadedFileUrl'),
      setPreviewUrl: (previewUrl) => set({ previewUrl }, false, 'setPreviewUrl'),

      // 处理操作
      setIsLoading: (isLoading) => set({ isLoading }, false, 'setIsLoading'),
      setProgress: (progress) => set({ progress }, false, 'setProgress'),
      setCurrentStage: (currentStage) => set({ currentStage }, false, 'setCurrentStage'),
      setError: (error) => set({ error }, false, 'setError'),

      // 品类操作
      setSelectedCategory: (selectedCategory) => set({ selectedCategory }, false, 'setSelectedCategory'),
      setSelectedSeedingType: (selectedSeedingType) => set({ selectedSeedingType }, false, 'setSelectedSeedingType'),
      setAiRecognition: (aiRecognition) => set({ aiRecognition }, false, 'setAiRecognition'),

      // 结果操作
      setResultData: (resultData) => set({ resultData }, false, 'setResultData'),
      setBatchResults: (batchResults) => set({ batchResults }, false, 'setBatchResults'),
      addBatchResult: (result) =>
        set((state) => {
          state.batchResults.push(result);
        }, false, 'addBatchResult'),

      // 风格操作
      setStyleSourceType: (styleSourceType) => set({ styleSourceType }, false, 'setStyleSourceType'),
      setSelectedPreset: (selectedPreset) => set({ selectedPreset }, false, 'setSelectedPreset'),
      setReferenceFile: (referenceFile) => set({ referenceFile }, false, 'setReferenceFile'),
      setReferenceFileUrl: (referenceFileUrl) => set({ referenceFileUrl }, false, 'setReferenceFileUrl'),
      setSelectedStyles: (selectedStyles) => set({ selectedStyles }, false, 'setSelectedStyles'),

      // 关键帧操作
      setKeyframes: (keyframes) => set({ keyframes }, false, 'setKeyframes'),
      setSelectedKeyframe: (selectedKeyframe) => set({ selectedKeyframe }, false, 'setSelectedKeyframe'),
      setEnhancedCoverUrl: (enhancedCoverUrl) => set({ enhancedCoverUrl }, false, 'setEnhancedCoverUrl'),
      setSelectedKeyframes: (selectedKeyframes) => set({ selectedKeyframes }, false, 'setSelectedKeyframes'),
      setCoverKeyframe: (coverKeyframe) => set({ coverKeyframe }, false, 'setCoverKeyframe'),
      setShowFrameConfirmModal: (showFrameConfirmModal) => set({ showFrameConfirmModal }, false, 'setShowFrameConfirmModal'),

      // 调色操作
      setColorGradeExplanation: (colorGradeExplanation) => set({ colorGradeExplanation }, false, 'setColorGradeExplanation'),
      setLoadingStepIndex: (loadingStepIndex) => set({ loadingStepIndex }, false, 'setLoadingStepIndex'),
      setGradedVideoUrl: (gradedVideoUrl) => set({ gradedVideoUrl }, false, 'setGradedVideoUrl'),

      // 批量操作
      setBatchFiles: (batchFiles) => set({ batchFiles }, false, 'setBatchFiles'),
      updateBatchFile: (id, updates) =>
        set((state) => {
          const index = state.batchFiles.findIndex((f) => f.id === id);
          if (index !== -1) {
            state.batchFiles[index] = { ...state.batchFiles[index], ...updates };
          }
        }, false, 'updateBatchFile'),
      removeBatchFile: (id) =>
        set((state) => {
          state.batchFiles = state.batchFiles.filter((f) => f.id !== id);
        }, false, 'removeBatchFile'),
      setShowConfirmModal: (showConfirmModal) => set({ showConfirmModal }, false, 'setShowConfirmModal'),

      // 弹窗操作
      setShowCreditModal: (showCreditModal) => set({ showCreditModal }, false, 'setShowCreditModal'),
      setCreditRequired: (creditRequired) => set({ creditRequired }, false, 'setCreditRequired'),

      // 邀请码操作
      setInviteCode: (inviteCode) => set({ inviteCode }, false, 'setInviteCode'),
      setInviteCodeInput: (inviteCodeInput) => set({ inviteCodeInput }, false, 'setInviteCodeInput'),
      setInviteApplied: (inviteApplied) => set({ inviteApplied }, false, 'setInviteApplied'),
      setInviteError: (inviteError) => set({ inviteError }, false, 'setInviteError'),

      // 重置
      reset: () => set(initialState, false, 'reset'),
      resetToUpload: () =>
        set({
          ...initialState,
          step: 'upload',
        }, false, 'resetToUpload'),
    })),
    { name: 'TryStore' }
  )
);

// ============================================
// Selectors
// ============================================

export const selectStep = (state: TryState) => state.step;
export const selectContentType = (state: TryState) => state.contentType;
export const selectUploadMode = (state: TryState) => state.uploadMode;
export const selectIsLoading = (state: TryState) => state.isLoading;
export const selectProgress = (state: TryState) => state.progress;
export const selectCurrentStage = (state: TryState) => state.currentStage;
export const selectError = (state: TryState) => state.error;
export const selectResultData = (state: TryState) => state.resultData;
export const selectBatchResults = (state: TryState) => state.batchResults;
export const selectBatchFiles = (state: TryState) => state.batchFiles;
export const selectShowCreditModal = (state: TryState) => state.showCreditModal;
export const selectCreditRequired = (state: TryState) => state.creditRequired;
