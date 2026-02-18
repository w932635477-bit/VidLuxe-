'use client';

import { useState } from 'react';

export type StyleType = 'minimal' | 'warmLuxury' | 'coolPro' | 'morandi';

export interface StyleOption {
  id: StyleType;
  name: string;
  description: string;
  color: string;
  tags: string[];
}

export const STYLE_OPTIONS: StyleOption[] = [
  {
    id: 'minimal',
    name: '极简',
    description: 'Apple 风，克制干净',
    color: '#4A90A4',
    tags: ['数码产品', '简约穿搭', '家居'],
  },
  {
    id: 'warmLuxury',
    name: '暖调奢华',
    description: '温暖高级，有质感',
    color: '#C9A962',
    tags: ['美妆护肤', '咖啡探店', '生活方式'],
  },
  {
    id: 'coolPro',
    name: '冷调专业',
    description: '专业冷静，可信赖',
    color: '#5B7C99',
    tags: ['知识分享', '职场穿搭', '科技测评'],
  },
  {
    id: 'morandi',
    name: '莫兰迪',
    description: '低饱和，高级灰调',
    color: '#9CAF88',
    tags: ['文艺穿搭', '手账文具', '艺术感'],
  },
];

interface StyleSelectorProps {
  selectedStyle: StyleType;
  onSelect: (style: StyleType) => void;
  className?: string;
}

export function StyleSelector({
  selectedStyle,
  onSelect,
  className = '',
}: StyleSelectorProps) {
  return (
    <div className={className}>
      <h3 className="text-lg font-medium text-content-primary mb-4">
        选择高级感风格
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STYLE_OPTIONS.map((style) => (
          <StyleCard
            key={style.id}
            style={style}
            isSelected={selectedStyle === style.id}
            onClick={() => onSelect(style.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface StyleCardProps {
  style: StyleOption;
  isSelected: boolean;
  onClick: () => void;
}

function StyleCard({ style, isSelected, onClick }: StyleCardProps) {
  return (
    <button
      onClick={onClick}
      className={`style-card text-left ${isSelected ? 'selected' : ''}`}
    >
      {/* 颜色预览 */}
      <div
        className="w-full aspect-video rounded-lg mb-3"
        style={{
          background: `linear-gradient(135deg, ${style.color}, ${style.color}88)`,
        }}
      />

      {/* 风格名称 */}
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-content-primary">{style.name}</span>
        <div
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
            isSelected
              ? 'border-brand-500 bg-brand-500'
              : 'border-white/30'
          }`}
        >
          {isSelected && (
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              className="text-white"
            >
              <path
                d="M2 6L5 9L10 3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </div>

      {/* 描述 */}
      <p className="text-sm text-content-tertiary mb-2">{style.description}</p>

      {/* 标签 */}
      <div className="flex flex-wrap gap-1">
        {style.tags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-content-tertiary"
          >
            {tag}
          </span>
        ))}
      </div>
    </button>
  );
}
