/**
 * 匿名 ID Hook
 *
 * 管理用户的匿名标识符，用于额度追踪
 */

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'vidluxe_anonymous_id';

function generateAnonymousId(): string {
  return `anon_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

export function useAnonymousId(): string {
  const [anonymousId, setAnonymousId] = useState<string>('');

  useEffect(() => {
    // 只在客户端执行
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setAnonymousId(stored);
    } else {
      const id = generateAnonymousId();
      localStorage.setItem(STORAGE_KEY, id);
      setAnonymousId(id);
    }
  }, []);

  return anonymousId;
}
