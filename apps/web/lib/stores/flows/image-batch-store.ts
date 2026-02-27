/**
 * 多图批量流程 Store
 *
 * 管理多图上传、风格选择、批量处理、结果
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import type { CategoryType, SeedingType } from '@/lib/types/seeding';
import type {
  ImageBatchStep,
  StyleType,
  BatchFileItem,
  BatchResultItem,
} from '@/lib/types/flow';

// ============================================
// 状态接口
// ============================================

interface ImageBatchState {
  // 步骤
  step: ImageBatchStep;

  // 批量文件
  batchFiles: BatchFileItem[];

  // 处理状态
  isLoading: boolean;
  progress: number;
  currentStage: string;
  error: string | null;

  // 品类（批量模式简化）
  selectedCategory: CategoryType | null;
  selectedSeedingType: SeedingType | null;

  // 风格（多选）
  selectedStyles: StyleType[];

  // 批量结果
  batchResults: BatchResultItem[];

  // 弹窗
  showConfirmModal: boolean;
  showCreditModal: boolean;
  creditRequired: number;
}

interface ImageBatchActions {
  // 步骤操作
  setStep: (step: ImageBatchStep) => void;
  nextStep: () => void;
  prevStep: () => void;

  // 批量文件操作
  setBatchFiles: (files: BatchFileItem[]) => void;
  addBatchFiles: (files: BatchFileItem[]) => void;
  updateBatchFile: (id: string, updates: Partial<BatchFileItem>) => void;
  removeBatchFile: (id: string) => void;
  clearBatchFiles: () => void;

  // 处理状态
  setIsLoading: (loading: boolean) => void;
  setProgress: (progress: number) => void;
  setCurrentStage: (stage: string) => void;
  setError: (error: string | null) => void;

  // 品类操作
  setSelectedCategory: (category: CategoryType | null) => void;
  setSelectedSeedingType: (type: SeedingType | null) => void;

  // 风格操作
  setSelectedStyles: (styles: StyleType[]) => void;
  toggleStyle: (style: StyleType) => void;

  // 结果操作
  setBatchResults: (results: BatchResultItem[]) => void;
  addBatchResult: (result: BatchResultItem) => void;

  // 弹窗操作
  setShowConfirmModal: (show: boolean) => void;
  setShowCreditModal: (show: boolean) => void;
  setCreditRequired: (required: number) => void;

  // 重置
  reset: () => void;
}

// ============================================
// 步骤顺序
// ============================================

const STEP_ORDER: ImageBatchStep[] = ['upload', 'style', 'processing', 'result'];

// ============================================
// 初始状态
// ============================================

const initialState: ImageBatchState = {
  step: 'upload',
  batchFiles: [],
  isLoading: false,
  progress: 0,
  currentStage: '',
  error: null,
  selectedCategory: 'fashion',
  selectedSeedingType: 'product',
  selectedStyles: ['magazine'],
  batchResults: [],
  showConfirmModal: false,
  showCreditModal: false,
  creditRequired: 0,
};

// ============================================
// Store
// ============================================

export const useImageBatchStore = create<ImageBatchState & ImageBatchActions>()(
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

      // 批量文件操作
      setBatchFiles: (batchFiles) => set({ batchFiles }, false, 'setBatchFiles'),
      addBatchFiles: (files) => set((state) => {
        state.batchFiles.push(...files);
      }, false, 'addBatchFiles'),
      updateBatchFile: (id, updates) => set((state) => {
        const index = state.batchFiles.findIndex((f) => f.id === id);
        if (index !== -1) {
          state.batchFiles[index] = { ...state.batchFiles[index], ...updates };
        }
      }, false, 'updateBatchFile'),
      removeBatchFile: (id) => set((state) => {
        const file = state.batchFiles.find((f) => f.id === id);
        if (file?.previewUrl) {
          URL.revokeObjectURL(file.previewUrl);
        }
        state.batchFiles = state.batchFiles.filter((f) => f.id !== id);
      }, false, 'removeBatchFile'),
      clearBatchFiles: () => set((state) => {
        state.batchFiles.forEach((f) => {
          if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
        });
        state.batchFiles = [];
      }, false, 'clearBatchFiles'),

      // 处理状态
      setIsLoading: (isLoading) => set({ isLoading }, false, 'setIsLoading'),
      setProgress: (progress) => set({ progress }, false, 'setProgress'),
      setCurrentStage: (currentStage) => set({ currentStage }, false, 'setCurrentStage'),
      setError: (error) => set({ error }, false, 'setError'),

      // 品类操作
      setSelectedCategory: (selectedCategory) => set({ selectedCategory }, false, 'setSelectedCategory'),
      setSelectedSeedingType: (selectedSeedingType) => set({ selectedSeedingType }, false, 'setSelectedSeedingType'),

      // 风格操作
      setSelectedStyles: (selectedStyles) => set({ selectedStyles }, false, 'setSelectedStyles'),
      toggleStyle: (style) => set((state) => {
        const index = state.selectedStyles.indexOf(style);
        if (index === -1) {
          state.selectedStyles.push(style);
        } else {
          state.selectedStyles.splice(index, 1);
        }
      }, false, 'toggleStyle'),

      // 结果操作
      setBatchResults: (batchResults) => set({ batchResults }, false, 'setBatchResults'),
      addBatchResult: (result) => set((state) => {
        state.batchResults.push(result);
      }, false, 'addBatchResult'),

      // 弹窗操作
      setShowConfirmModal: (showConfirmModal) => set({ showConfirmModal }, false, 'setShowConfirmModal'),
      setShowCreditModal: (showCreditModal) => set({ showCreditModal }, false, 'setShowCreditModal'),
      setCreditRequired: (creditRequired) => set({ creditRequired }, false, 'setCreditRequired'),

      // 重置
      reset: () => {
        const state = get();
        state.batchFiles.forEach((f) => {
          if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
        });
        return set(initialState, false, 'reset');
      },
    })),
    { name: 'image-batch-store' }
  )
);

// ============================================
// Selectors
// ============================================

export const selectStep = (state: ImageBatchState) => state.step;
export const selectBatchFiles = (state: ImageBatchState) => state.batchFiles;
export const selectSuccessfulFiles = (state: ImageBatchState) =>
  state.batchFiles.filter((f) => f.status === 'success' && f.uploadedUrl);
export const selectBatchResults = (state: ImageBatchState) => state.batchResults;
export const selectSelectedStyles = (state: ImageBatchState) => state.selectedStyles;
