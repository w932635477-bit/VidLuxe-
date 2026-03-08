/**
 * TryPage - 主页面
 *
 * 使用新的独立流程架构，支持单图、视频两种模式切换
 * 用户必须登录才能使用
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ModeTabs, type FlowMode } from '@/components/features/try/ModeTabs';
import { MinimalNav } from '@/components/features/try';
import { ImageSingleFlow } from '@/components/features/try/flows/ImageSingleFlow';
import { VideoFlow } from '@/components/features/try/flows/VideoFlow';
import { useAuth } from '@/components/auth/AuthProvider';

export default function TryPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [activeMode, setActiveMode] = useState<FlowMode>('single');

  // 登录检查：用户必须登录才能使用
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth?redirect=/try');
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

  const renderFlow = () => {
    switch (activeMode) {
      case 'single':
        return <ImageSingleFlow />;
      case 'video':
        return <VideoFlow />;
      default:
        return <ImageSingleFlow />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#000000' }}>
      <MinimalNav />
      <ModeTabs activeMode={activeMode} onModeChange={setActiveMode} />
      <div style={{ paddingTop: '120px' }}>
        {renderFlow()}
      </div>
    </div>
  );
}
