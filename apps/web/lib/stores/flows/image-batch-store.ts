/**
 * 多图批量流程 Store
 *
 * 管理多图上传、每图风格选择、批量处理、结果
 * 支持为每张图片单独选择风格
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useCreditsStore } from '@/lib/stores/credits-store';
import type {
  BatchFileItem,
  BatchResultItem,
  StyleType,
} from '@/lib/types/flow';

// ============================================
// 状态接口
// ============================================

interface ImageBatchState {
  // 步骤
  step: 'upload' | 'style' | 'progress' | 'result';

  // 批量文件
  batchFiles: BatchFileItem[];

  // 通用设置
  isLoading: boolean;
  progress: number;
  currentStage: string;
  error: string | null;

  // 批量结果
  batchResults: BatchResultItem[];

  // 弹窗
  showConfirmModal: boolean;
  showCreditModal: boolean;
  creditRequired: number;

  // 当前处理的文件索引（用于顺序处理）
  currentProcessingIndex: number;
  totalTasks: number;
  completedTasks: number;
}

interface ImageBatchActions {
  // 步骤操作
  setStep: (step: ImageBatchState['step']) => void;
  nextStep: () => void;
  prevStep: () => void;

  // 批量文件操作
  setBatchFiles: (files: BatchFileItem[]) => void;
  addBatchFiles: (files: BatchFileItem[]) => void;
  updateBatchFile: (id: string, updates: Partial<BatchFileItem>) => void;
  removeBatchFile: (id: string) => void;
  clearBatchFiles: () => void;

  // 每图风格操作
  setFileStyles: (id: string, styles: StyleType[]) => void;
  toggleFileStyle: (id: string, style: StyleType) => void;

  // 处理状态
  setIsLoading: (loading: boolean) => void;
  setProgress: (progress: number) => void;
  setCurrentStage: (stage: string) => void;
  setError: (error: string | null) => void;

  // 结果操作
  addBatchResult: (result: BatchResultItem) => void;
  clearResults: () => void;

  // 弹窗操作
  setShowConfirmModal: (show: boolean) => void;
  setShowCreditModal: (show: boolean) => void;
  setCreditRequired: (required: number) => void;

  // 处理进度
  setProcessingProgress: (completed: number, total: number) => void;

  // 重置
  reset: () => void;
  resetToUpload: () => void;
}

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
  batchResults: [],
  showConfirmModal: false,
  showCreditModal: false,
  creditRequired: 0,
  currentProcessingIndex: 0,
  totalTasks: 0,
  completedTasks: 0,
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
        const steps: ImageBatchState['step'][] = ['upload', 'style', 'progress', 'result'];
        const currentIndex = steps.indexOf(currentStep);
        if (currentIndex < steps.length - 1) {
          set({ step: steps[currentIndex + 1] }, false, 'nextStep');
        }
      },
      prevStep: () => {
        const currentStep = get().step;
        const steps: ImageBatchState['step'][] = ['upload', 'style', 'progress', 'result'];
        const currentIndex = steps.indexOf(currentStep);
        if (currentIndex > 0) {
          set({ step: steps[currentIndex - 1] }, false, 'prevStep');
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

      // 每图风格操作
      setFileStyles: (id, styles) => set((state) => {
        const file = state.batchFiles.find((f) => f.id === id);
        if (file) {
          file.selectedStyles = styles;
        }
      }, false, 'setFileStyles'),
      toggleFileStyle: (id, style) => set((state) => {
        const file = state.batchFiles.find((f) => f.id === id);
        if (file) {
          const index = file.selectedStyles.indexOf(style);
          if (index === -1) {
            file.selectedStyles.push(style);
          } else {
            file.selectedStyles.splice(index, 1);
          }
        }
      }, false, 'toggleFileStyle'),

      // 处理状态
      setIsLoading: (isLoading) => set({ isLoading }, false, 'setIsLoading'),
      setProgress: (progress) => set({ progress }, false, 'setProgress'),
      setCurrentStage: (currentStage) => set({ currentStage }, false, 'setCurrentStage'),
      setError: (error) => set({ error }, false, 'setError'),

      // 结果操作
      addBatchResult: (result) => set((state) => {
        state.batchResults.push(result);
      }, false, 'addBatchResult'),
      clearResults: () => set({ batchResults: [] }, false, 'clearResults'),

      // 弹窗操作
      setShowConfirmModal: (showConfirmModal) => set({ showConfirmModal }, false, 'setShowConfirmModal'),
      setShowCreditModal: (showCreditModal) => set({ showCreditModal }, false, 'setShowCreditModal'),
      setCreditRequired: (creditRequired) => set({ creditRequired }, false, 'setCreditRequired'),

      // 处理进度
      setProcessingProgress: (completed, total) => set({
        completedTasks: completed,
        totalTasks: total,
        progress: Math.round((completed / total) * 100)
      }, false, 'setProcessingProgress'),

      // 重置
      reset: () => {
        const state = get();
        state.batchFiles.forEach((f) => {
          if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
        });
        return set(initialState, false, 'reset');
      },

      // 仅重置到上传步骤
      resetToUpload: () => set((state) => {
        state.step = 'upload';
        state.batchResults = [];
        state.progress = 0;
        state.currentStage = '';
        state.error = null;
        state.showConfirmModal = false;
        state.showCreditModal = false;
        state.currentProcessingIndex = 0;
        state.totalTasks = 0;
        state.completedTasks = 0;
      }, false, 'resetToUpload'),
    })),
    { name: 'image-batch-store' }
  )
);

// ============================================
// Selector hooks
// ============================================

export const useBatchStep = () => useImageBatchStore((state) => state.step);
export const useBatchFiles = () => useImageBatchStore((state) => state.batchFiles);
export const useIsBatchLoading = () => useImageBatchStore((state) => state.isLoading);
export const useBatchProgress = () => useImageBatchStore((state) => ({
  progress: state.progress,
  currentStage: state.currentStage,
  completedTasks: state.completedTasks,
  total: state.totalTasks,
}));

// 计算总任务数
export const useTotalTasks = () => {
  const batchFiles = useImageBatchStore((state) => state.batchFiles);
  return batchFiles.reduce((total, file) => total + (file.selectedStyles.length > 0 ? file.selectedStyles.length : 1), 0);
};

// 计算成功上传的文件
export const useSuccessfulFiles = () => {
  const batchFiles = useImageBatchStore((state) => state.batchFiles);
  return batchFiles.filter((f) => f.status === 'success' && f.uploadedUrl);
};

// 获取文件的选中风格
export const useFileStyles = (fileId: string) => {
  const batchFiles = useImageBatchStore((state) => state.batchFiles);
  const file = batchFiles.find((f) => f.id === fileId);
  return file?.selectedStyles || [];
};

// 检查是否所有文件都已选择风格
export const useAllFilesHaveStyles = () => {
  const batchFiles = useImageBatchStore((state) => state.batchFiles);
  return batchFiles.every((f) => f.selectedStyles.length > 0);
};
