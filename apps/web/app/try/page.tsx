/**
 * TryPage - 主页面
 *
 * 使用新的独立流程架构，支持单图、批量、视频三种模式切换
 */

'use client';

import { useState } from 'react';
import { ModeTabs, type FlowMode } from '@/components/features/try/ModeTabs';
import { MinimalNav } from '@/components/features/try';
import { ImageSingleFlow } from '@/components/features/try/flows/ImageSingleFlow';
import { ImageBatchFlow } from '@/components/features/try/flows/ImageBatchFlow';
import { VideoFlow } from '@/components/features/try/flows/VideoFlow';

export default function TryPage() {
  const [activeMode, setActiveMode] = useState<FlowMode>('batch');

  const renderFlow = () => {
    switch (activeMode) {
      case 'single':
        return <ImageSingleFlow />;
      case 'batch':
        return <ImageBatchFlow />;
      case 'video':
        return <VideoFlow />;
      default:
        return <ImageBatchFlow />;
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
