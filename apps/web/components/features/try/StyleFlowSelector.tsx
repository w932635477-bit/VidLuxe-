/**
 * StyleFlowSelector - 两步风格选择流程组件
 *
 * Step 1: 选择内容类型（穿搭、美妆、探店、旅游、美食）
 * Step 2: 选择风格（根据内容类型显示对应对比图）
 */

'use client';

import type { ContentType } from '@/lib/content-types';
import type { StyleType } from './StyleSelector';
import { ContentTypeSelector } from './ContentTypeSelector';
import { StyleSelector } from './StyleSelector';

interface StyleFlowSelectorProps {
  selectedStyle: StyleType;
  selectedContentType: ContentType;
  onStyleSelect: (style: StyleType) => void;
  onContentTypeSelect: (type: ContentType) => void;
  className?: string;
}

export function StyleFlowSelector({
  selectedStyle,
  selectedContentType,
  onStyleSelect,
  onContentTypeSelect,
  className = '',
}: StyleFlowSelectorProps) {
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

      {/* Step 2: 风格选择 */}
      <StyleSelector
        selectedStyle={selectedStyle}
        onSelect={onStyleSelect}
        contentType={selectedContentType}
      />
    </div>
  );
}

export default StyleFlowSelector;
