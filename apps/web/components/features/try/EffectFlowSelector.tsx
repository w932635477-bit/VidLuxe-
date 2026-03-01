/**
 * EffectFlowSelector - 新的效果选择流程组件
 *
 * Step 1: 选择内容类型（穿搭、美妆、探店、旅游、美食）
 * Step 2: 选择效果（横向滑动 + Before/After 对比）
 */

'use client';

import type { ContentType } from '@/lib/content-types';
import { ContentTypeSelector } from './ContentTypeSelector';
import { EffectSelector } from './EffectSelector';
import { getDefaultEffectId } from '@/lib/effect-presets';
import { useEffect } from 'react';

interface EffectFlowSelectorProps {
  selectedEffectId: string;
  selectedContentType: ContentType;
  effectIntensity: number;
  onEffectSelect: (effectId: string) => void;
  onContentTypeSelect: (type: ContentType) => void;
  onIntensityChange?: (intensity: number) => void;
  className?: string;
}

export function EffectFlowSelector({
  selectedEffectId,
  selectedContentType,
  effectIntensity,
  onEffectSelect,
  onContentTypeSelect,
  onIntensityChange,
  className = '',
}: EffectFlowSelectorProps) {
  // 当内容类型改变时，自动选择该类型的默认效果
  useEffect(() => {
    if (!selectedEffectId) {
      const defaultId = getDefaultEffectId(selectedContentType);
      onEffectSelect(defaultId);
    }
  }, [selectedContentType, selectedEffectId, onEffectSelect]);

  return (
    <div className={className}>
      {/* Step 1: 内容类型选择 */}
      <ContentTypeSelector
        selectedType={selectedContentType}
        onSelect={onContentTypeSelect}
      />

      {/* 分隔线 */}
      <div style={{
        height: '0.5px',
        background: 'rgba(255, 255, 255, 0.06)',
        margin: '24px 0',
      }} />

      {/* Step 2: 效果选择 */}
      <EffectSelector
        contentType={selectedContentType}
        selectedEffectId={selectedEffectId}
        onSelect={onEffectSelect}
        effectIntensity={effectIntensity}
        onIntensityChange={onIntensityChange}
      />
    </div>
  );
}

export default EffectFlowSelector;
