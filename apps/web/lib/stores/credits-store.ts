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
  hasUsedInviteCode: boolean; // 是否已使用过邀请码
}

interface CreditsActions {
  // 操作
  setCredits: (credits: { total: number; paid: number; free: number; hasUsedInviteCode?: boolean }) => void;
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
  hasUsedInviteCode: false,
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
            hasUsedInviteCode: credits.hasUsedInviteCode ?? get().hasUsedInviteCode,
          },
          false,
          'setCredits'
        ),

      setIsLoading: (isLoading) => set({ isLoading }, false, 'setIsLoading'),
      setError: (error) => set({ error }, false, 'setError'),

      // 获取额度
      fetchCredits: async (anonymousId?: string) => {
        set({ isLoading: true, error: null }, false, 'fetchCredits/start');

        try {
          // 如果没有传入 anonymousId，尝试从 localStorage 获取
          const id = anonymousId || (typeof window !== 'undefined' ? localStorage.getItem('vidluxe_anonymous_id') : null);

          // 构建请求 URL：即使没有 anonymousId 也发起请求
          // API 会通过 cookie 检测登录用户，从 Supabase 获取额度
          const url = id ? `/api/credits?anonymousId=${id}` : '/api/credits';

          console.log('[Credits Store] Fetching from:', url);
          const response = await fetch(url);
          console.log('[Credits Store] Response status:', response.status);

          const data = await response.json();
          console.log('[Credits Store] Response data:', JSON.stringify(data).substring(0, 200));

          if (response.ok && data.success) {
            console.log('[Credits Store] Setting credits:', data.data);
            set(
              {
                total: data.data.total,
                paid: data.data.paid,
                free: data.data.free,
                hasUsedInviteCode: data.data.hasUsedInviteCode || false,
                isLoading: false,
              },
              false,
              'fetchCredits/success'
            );
          } else {
            console.error('[Credits Store] API error:', data.error);
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
          console.error('[Credits Store] Network error:', error);
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
