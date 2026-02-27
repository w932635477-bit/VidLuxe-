/**
 * ContentTypeSelector - 内容类型选择组件
 *
 * 用于选择小红书内容类型（穿搭、美妆、探店、旅游、美食）
 */

'use client';

import { useState } from 'react';
import type { ContentType, ContentTypeConfig } from '@/lib/content-types';
import { getAllContentTypes, getContentTypeConfig } from '@/lib/content-types';

interface ContentTypeSelectorProps {
  selectedType: ContentType;
  onSelect: (type: ContentType) => void;
  className?: string;
}

// 单个内容类型 Chip
function ContentTypeChip({
  config,
  isSelected,
  onClick,
}: {
  config: ContentTypeConfig;
  isSelected: boolean;
  onClick: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px 20px',
        borderRadius: '20px',
        border: isSelected
          ? '1px solid var(--brand-primary)'
          : '1px solid var(--border-subtle)',
        background: isSelected
          ? 'rgba(212, 175, 55, 0.08)'
          : 'var(--bg-card)',
        cursor: 'pointer',
        transition: 'all 200ms cubic-bezier(0.25, 0.1, 0.25, 1)',
        minWidth: '72px',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isSelected
          ? '0 0 0 3px rgba(212, 175, 55, 0.15)'
          : isHovered
          ? '0 4px 16px rgba(0, 0, 0, 0.15)'
          : 'none',
        flexShrink: 0,
      }}
    >
      {/* 图标 */}
      <span style={{
        fontSize: '24px',
        marginBottom: '6px',
        filter: isSelected ? 'none' : 'grayscale(0.3)',
      }}>
        {config.icon}
      </span>
      {/* 名称 */}
      <span style={{
        fontSize: '14px',
        fontWeight: 500,
        color: isSelected ? 'var(--brand-primary)' : 'var(--text-secondary)',
        letterSpacing: '-0.01em',
      }}>
        {config.name}
      </span>
    </button>
  );
}

// 主组件
export function ContentTypeSelector({
  selectedType,
  onSelect,
  className = '',
}: ContentTypeSelectorProps) {
  const contentTypes = getAllContentTypes();
  const selectedConfig = getContentTypeConfig(selectedType);

  return (
    <div className={className}>
      {/* 标题 */}
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{
          fontSize: '17px',
          fontWeight: 600,
          color: 'rgba(255, 255, 255, 0.95)',
          letterSpacing: '-0.02em',
          marginBottom: '4px',
        }}>
          选择内容类型
        </h3>
        <p style={{
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.45)',
        }}>
          选择你的内容类型，获得更精准的增强效果
        </p>
      </div>

      {/* 内容类型 Chip 列表 */}
      <div style={{
        display: 'flex',
        gap: '12px',
        overflowX: 'auto',
        paddingBottom: '8px',
        WebkitOverflowScrolling: 'touch',
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
      }}>
        {contentTypes.map((config) => (
          <ContentTypeChip
            key={config.id}
            config={config}
            isSelected={selectedType === config.id}
            onClick={() => onSelect(config.id)}
          />
        ))}
      </div>

      {/* 选中内容说明 */}
      <div style={{
        marginTop: '16px',
        padding: '12px 16px',
        borderRadius: '12px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '4px',
        }}>
          <span style={{ fontSize: '16px' }}>{selectedConfig.icon}</span>
          <span style={{
            fontSize: '14px',
            fontWeight: 500,
            color: 'rgba(255, 255, 255, 0.9)',
          }}>
            {selectedConfig.name}
          </span>
        </div>
        <p style={{
          fontSize: '13px',
          color: 'rgba(255, 255, 255, 0.5)',
          lineHeight: 1.5,
        }}>
          {selectedConfig.description}
        </p>
      </div>
    </div>
  );
}

export default ContentTypeSelector;
