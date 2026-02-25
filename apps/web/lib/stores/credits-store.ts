/**
 * Credits Store (Zustand)
 *
 * 管理用户额度状态
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools, persist } from 'zustand/middleware';

// ============================================
// 类型定义
// ============================================

interface CreditsState {
  // 状态
  total: number;
  paid: number;
  free: number;
  isLoading: boolean;
  error: string | null;
}

interface CreditsActions {
  // 操作
  setCredits: (credits: { total: number; paid: number; free: number }) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // API 操作
  fetchCredits: (anonymousId?: string) => Promise<void>;
  consumeCredits: (anonymousId: string, amount: number, description: string) => Promise<boolean>;
}

// ============================================
// 初始状态
// ============================================

const initialState: CreditsState = {
  total: 0,
  paid: 0,
  free: 0,
  isLoading: false,
  error: null,
};

// ============================================
// Store 创建
// ============================================

export const useCreditsStore = create<CreditsState & CreditsActions>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      // 设置额度
      setCredits: (credits) =>
        set(
          {
            total: credits.total,
            paid: credits.paid,
            free: credits.free,
          },
          false,
          'setCredits'
        ),

      setIsLoading: (isLoading) => set({ isLoading }, false, 'setIsLoading'),
      setError: (error) => set({ error }, false, 'setError'),

      // 获取额度
      fetchCredits: async (anonymousId?: string) => {
        // 如果没有传入 anonymousId，尝试从 localStorage 获取
        const id = anonymousId || (typeof window !== 'undefined' ? localStorage.getItem('vidluxe_anonymous_id') : null);
        if (!id) return;

        set({ isLoading: true, error: null }, false, 'fetchCredits/start');

        try {
          const response = await fetch(`/api/credits?anonymousId=${id}`);
          const data = await response.json();

          if (response.ok && data.success) {
            set(
              {
                total: data.data.total,
                paid: data.data.paid,
                free: data.data.free,
                isLoading: false,
              },
              false,
              'fetchCredits/success'
            );
          } else {
            set(
              {
                isLoading: false,
                error: data.error || '获取额度失败',
              },
              false,
              'fetchCredits/error'
            );
          }
        } catch (error) {
          set(
            {
              isLoading: false,
              error: '网络错误，请稍后重试',
            },
            false,
            'fetchCredits/error'
          );
        }
      },

      // 消耗额度
      consumeCredits: async (anonymousId: string, amount: number, description: string) => {
        if (!anonymousId) return false;

        set({ isLoading: true, error: null }, false, 'consumeCredits/start');

        try {
          const response = await fetch('/api/credits/spend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              anonymousId,
              amount,
              description,
            }),
          });

          const data = await response.json();

          if (response.ok && data.success) {
            // 更新本地额度
            const currentTotal = get().total;
            set(
              {
                total: data.data.newBalance,
                isLoading: false,
              },
              false,
              'consumeCredits/success'
            );
            return true;
          } else {
            set(
              {
                isLoading: false,
                error: data.error || '额度消耗失败',
              },
              false,
              'consumeCredits/error'
            );
            return false;
          }
        } catch (error) {
          set(
            {
              isLoading: false,
              error: '网络错误，请稍后重试',
            },
            false,
            'consumeCredits/error'
          );
          return false;
        }
      },
    })),
    { name: 'CreditsStore' }
  )
);

// ============================================
// Selectors
// ============================================

export const selectTotal = (state: CreditsState) => state.total;
export const selectPaid = (state: CreditsState) => state.paid;
export const selectFree = (state: CreditsState) => state.free;
export const selectIsLoading = (state: CreditsState) => state.isLoading;
export const selectHasCredits = (state: CreditsState) => state.total > 0;
