/**
 * Try Batch 页面 - 批量处理流程
 * 用户必须登录才能使用
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ImageBatchFlow } from '@/components/features/try/flows/ImageBatchFlow';
import { useAuth } from '@/components/auth/AuthProvider';

export default function TryBatchPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // 登录检查：用户必须登录才能使用
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth?redirect=/try-batch');
    }
  }, [user, loading, router]);

  // 加载中状态
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff'
      }}>
        <p>加载中...</p>
      </div>
    );
  }

  // 未登录时不渲染内容（等待跳转）
  if (!user) {
    return null;
  }

  return <ImageBatchFlow />;
}
