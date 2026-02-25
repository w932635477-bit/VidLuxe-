'use client';

import { useState } from 'react';
import type { MultiStyleType } from '@/lib/stores/try-store';

interface StyleMultiSelectorProps {
  selectedStyles: MultiStyleType[];
  onChange: (styles: MultiStyleType[]) => void;
  disabled?: boolean;
  recommendedStyles?: MultiStyleType[]; // 基于品类推荐的风格
  categoryLabel?: string; // 品类名称，用于显示推荐标签
}

const STYLE_OPTIONS: { id: MultiStyleType; name: string; description: string; preview: string }[] = [
  {
    id: 'minimal',
    name: '极简风格',
    description: 'Apple 风格，克制、干净',
    preview: '🏛️',
  },
  {
    id: 'warmLuxury',
    name: '暖调奢华',
    description: 'Chanel 风格，温暖高级',
    preview: '✨',
  },
  {
    id: 'coolPro',
    name: '冷调专业',
    description: '科技感，专业可信赖',
    preview: '💎',
  },
  {
    id: 'morandi',
    name: '莫兰迪',
    description: 'Kinfolk 风格，低饱和度',
    preview: '🎨',
  },
  {
    id: 'soft',
    name: '温柔日系',
    description: '柔和自然，清新治愈',
    preview: '🌸',
  },
];

export function StyleMultiSelector({
  selectedStyles,
  onChange,
  disabled = false,
  recommendedStyles = [],
  categoryLabel,
}: StyleMultiSelectorProps) {
  const toggleStyle = (styleId: MultiStyleType) => {
    if (disabled) return;

    if (selectedStyles.includes(styleId)) {
      onChange(selectedStyles.filter(s => s !== styleId));
    } else {
      onChange([...selectedStyles, styleId]);
    }
  };

  const selectAll = () => {
    if (disabled) return;
    onChange(STYLE_OPTIONS.map(s => s.id));
  };

  const clearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <span style={{ fontSize: '15px', fontWeight: 500 }}>
          选择风格（可多选）
        </span>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={selectAll}
            disabled={disabled}
            style={{
              fontSize: '13px',
              color: disabled ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.6)',
              background: 'none',
              border: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
          >
            全选
          </button>
          <button
            onClick={clearAll}
            disabled={disabled}
            style={{
              fontSize: '13px',
              color: disabled ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.6)',
              background: 'none',
              border: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
          >
            清空
          </button>
        </div>
      </div>

      {/* 推荐风格提示 */}
      {recommendedStyles.length > 0 && categoryLabel && (
        <div style={{
          marginBottom: '12px',
          padding: '10px 14px',
          borderRadius: '8px',
          background: 'rgba(212, 175, 55, 0.08)',
          border: '1px solid rgba(212, 175, 55, 0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{ fontSize: '14px' }}>✨</span>
          <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>
            为<span style={{ color: '#D4AF37', fontWeight: 500 }}>{categoryLabel}</span>内容推荐：
            {recommendedStyles.map(s => STYLE_OPTIONS.find(opt => opt.id === s)?.name).join('、')}
          </span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {STYLE_OPTIONS.map((style) => {
          const isSelected = selectedStyles.includes(style.id);
          const isRecommended = recommendedStyles.includes(style.id);
          return (
            <button
              key={style.id}
              onClick={() => toggleStyle(style.id)}
              disabled={disabled}
              style={{
                padding: '16px',
                borderRadius: '12px',
                border: isSelected
                  ? '1px solid #D4AF37'
                  : isRecommended
                    ? '1px solid rgba(212, 175, 55, 0.4)'
                    : '1px solid rgba(255,255,255,0.1)',
                background: isSelected
                  ? 'rgba(212,175,55,0.1)'
                  : isRecommended
                    ? 'rgba(212,175,55,0.05)'
                    : 'rgba(255,255,255,0.02)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                opacity: disabled ? 0.5 : 1,
                position: 'relative',
              }}
            >
              {/* 推荐标签 */}
              {isRecommended && !isSelected && (
                <div style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '8px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: 'rgba(212, 175, 55, 0.9)',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: '#000',
                }}>
                  推荐
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '20px' }}>{style.preview}</span>
                <span style={{
                  fontSize: '15px',
                  fontWeight: 500,
                  color: isSelected ? '#D4AF37' : 'rgba(255,255,255,0.9)',
                }}>
                  {style.name}
                </span>
                {isSelected && (
                  <span style={{ marginLeft: 'auto', color: '#D4AF37' }}>✓</span>
                )}
              </div>
              <p style={{
                fontSize: '12px',
                color: 'rgba(255,255,255,0.5)',
                margin: 0,
              }}>
                {style.description}
              </p>
            </button>
          );
        })}
      </div>

      {selectedStyles.length > 0 && (
        <div style={{
          marginTop: '12px',
          padding: '12px 16px',
          borderRadius: '8px',
          background: 'rgba(212,175,55,0.08)',
          border: '1px solid rgba(212,175,55,0.15)',
        }}>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
            已选择 <span style={{ color: '#D4AF37', fontWeight: 600 }}>{selectedStyles.length}</span> 种风格，
            将消耗 <span style={{ color: '#D4AF37', fontWeight: 600 }}>{selectedStyles.length}</span> 个额度
          </span>
        </div>
      )}
    </div>
  );
}

export { STYLE_OPTIONS };
export type { StyleMultiSelectorProps };
