# 风格选择器重设计实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 重构风格选择器为视觉化效果库选择模式，采用横向滑动 + Before/After 滑块预览的交互方式。

**Architecture:** 创建新的效果库配置系统 (effect-presets.ts)，重构 UI 组件为横向滑动选择器 + 大图预览模式，保持与现有 Flow 组件的兼容性。

**Tech Stack:** React 18, TypeScript, Next.js 15, Tailwind CSS (inline styles)

**Design Doc:** `docs/plans/2026-03-01-style-selector-redesign.md`

---

## Task 1: 创建效果库配置文件

**Files:**
- Create: `apps/web/lib/effect-presets.ts`

**Step 1: 创建效果库类型定义和初始数据**

```typescript
/**
 * 效果预设配置模块
 *
 * 定义视觉化效果库，替代原有的 4 种固定风格
 */

import type { ContentType } from './content-types';

/**
 * 效果预设接口
 */
export interface EffectPreset {
  id: string;
  name: string;              // 完整名称 "韩系高级 · 奶茶色调"
  shortName: string;         // 缩略名称 "韩系高级" (缩略图显示)
  contentType: ContentType;  // 内容类型

  // 预览图
  preview: {
    before: string;          // 原图 URL
    after: string;           // 效果图 URL
  };

  // Prompt 模板
  promptTemplate: string;
  negativePrompt: string;

  // 元数据
  popularity: number;        // 使用次数（用于排序）
  isHot: boolean;            // 是否热门推荐
  accentColor: string;       // 主题色
}

/**
 * 穿搭效果预设 (12个)
 */
export const OUTFIT_EFFECTS: EffectPreset[] = [
  {
    id: 'outfit-magazine',
    name: '杂志大片 · 高级奢华',
    shortName: '杂志大片',
    contentType: 'outfit',
    preview: {
      before: '/comparisons/fashion-1-original.jpg',
      after: '/comparisons/outfit-magazine.jpg',
    },
    promptTemplate: 'Vogue magazine editorial style, luxury fashion aesthetic, warm golden lighting, sophisticated and elegant, professional model photography, high-end beauty editorial, warm beige and champagne tones, cinematic background, soft studio lighting, premium quality, editorial composition',
    negativePrompt: 'amateur, low quality, blurry, distorted, ugly, bad anatomy, bad proportions, watermark, signature',
    popularity: 1000,
    isHot: true,
    accentColor: '#D4AF37',
  },
  {
    id: 'outfit-soft',
    name: '日系温柔 · 清新治愈',
    shortName: '日系温柔',
    contentType: 'outfit',
    preview: {
      before: '/comparisons/fashion-1-original.jpg',
      after: '/comparisons/outfit-soft.jpg',
    },
    promptTemplate: 'Japanese lifestyle magazine style, soft natural lighting, muted pastel colors, Kinfolk aesthetic, dreamy atmosphere, gentle and warm, artistic and refined, low saturation, earthy tones, natural and authentic, editorial quality',
    negativePrompt: 'harsh lighting, high contrast, neon colors, artificial, flashy, bold, aggressive',
    popularity: 850,
    isHot: true,
    accentColor: '#B8A99A',
  },
  {
    id: 'outfit-korean-premium',
    name: '韩系高级 · 奶茶色调',
    shortName: '韩系高级',
    contentType: 'outfit',
    preview: {
      before: '/comparisons/fashion-1-original.jpg',
      after: '/comparisons/outfit-korean.jpg',
    },
    promptTemplate: 'Korean fashion photography, premium aesthetic, soft beige and milk tea tones, elegant and sophisticated, clean minimal background, natural lighting, high-end editorial, modern Korean style, subtle warmth',
    negativePrompt: 'harsh, oversaturated, cluttered, amateur, low quality',
    popularity: 920,
    isHot: true,
    accentColor: '#C4A77D',
  },
  {
    id: 'outfit-vintage',
    name: '复古胶片 · 电影氛围',
    shortName: '复古胶片',
    contentType: 'outfit',
    preview: {
      before: '/comparisons/fashion-1-original.jpg',
      after: '/comparisons/outfit-vintage.jpg',
    },
    promptTemplate: 'Kodak Portra 400 film look, vintage aesthetic, warm film grain, cinematic color grading, nostalgic atmosphere, retro style, artistic, soft highlights, subtle vignette, analog photography feel',
    negativePrompt: 'digital, sharp, clean, modern, sterile, oversaturated, HDR, artificial lighting',
    popularity: 780,
    isHot: false,
    accentColor: '#C9A86C',
  },
  {
    id: 'outfit-urban',
    name: '都市职场 · 专业干练',
    shortName: '都市职场',
    contentType: 'outfit',
    preview: {
      before: '/comparisons/fashion-1-original.jpg',
      after: '/comparisons/outfit-urban.jpg',
    },
    promptTemplate: 'Apple keynote style, clean professional background, cool blue-gray tones, corporate executive aesthetic, modern minimalist, trustworthy and authoritative, soft diffused lighting, sharp details, premium corporate style',
    negativePrompt: 'casual, messy, warm tones, rustic, vintage, playful, informal, cluttered',
    popularity: 650,
    isHot: false,
    accentColor: '#5E7A99',
  },
  {
    id: 'outfit-street-cool',
    name: '街头酷感 · 高对比度',
    shortName: '街头酷感',
    contentType: 'outfit',
    preview: {
      before: '/comparisons/fashion-1-original.jpg',
      after: '/comparisons/outfit-street.jpg',
    },
    promptTemplate: 'Street photography style, high contrast, urban cool aesthetic, bold shadows, editorial street fashion, gritty texture, dynamic composition, modern edge, fashion-forward',
    negativePrompt: 'soft, pastel, gentle, traditional, boring',
    popularity: 580,
    isHot: false,
    accentColor: '#2C3E50',
  },
  {
    id: 'outfit-minimal-clean',
    name: '极简纯净 · 高级灰',
    shortName: '极简纯净',
    contentType: 'outfit',
    preview: {
      before: '/comparisons/fashion-1-original.jpg',
      after: '/comparisons/outfit-minimal.jpg',
    },
    promptTemplate: 'Minimalist aesthetic, clean lines, neutral gray tones, Scandinavian style, pure and simple, high-key lighting, white space, elegant simplicity, modern editorial',
    negativePrompt: 'cluttered, colorful, busy, chaotic, dark',
    popularity: 520,
    isHot: false,
    accentColor: '#9E9E9E',
  },
  {
    id: 'outfit-warm-cozy',
    name: '温暖惬意 · 秋日氛围',
    shortName: '温暖惬意',
    contentType: 'outfit',
    preview: {
      before: '/comparisons/fashion-1-original.jpg',
      after: '/comparisons/outfit-warm.jpg',
    },
    promptTemplate: 'Warm autumn atmosphere, cozy feeling, golden hour lighting, earthy tones, brown and amber colors, comfortable and inviting, lifestyle photography, natural warmth',
    negativePrompt: 'cold, blue, harsh, artificial, sterile',
    popularity: 480,
    isHot: false,
    accentColor: '#D4A574',
  },
  // 后续 4 个效果待预览图制作完成后添加
];

/**
 * 美妆效果预设 (10个)
 */
export const BEAUTY_EFFECTS: EffectPreset[] = [
  {
    id: 'beauty-magazine',
    name: '杂志大片 · 奢华质感',
    shortName: '杂志大片',
    contentType: 'beauty',
    preview: {
      before: '/hero/hero-beauty-before.jpg',
      after: '/comparisons/beauty-magazine.jpg',
    },
    promptTemplate: 'High-end beauty editorial, Vogue magazine style, luxury cosmetic aesthetic, flawless skin texture, professional studio lighting, glamour photography, premium beauty campaign',
    negativePrompt: 'amateur, poor lighting, harsh shadows, unnatural colors',
    popularity: 900,
    isHot: true,
    accentColor: '#D4AF37',
  },
  {
    id: 'beauty-soft-glow',
    name: '柔光嫩肤 · 清透妆容',
    shortName: '柔光嫩肤',
    contentType: 'beauty',
    preview: {
      before: '/hero/hero-beauty-before.jpg',
      after: '/comparisons/beauty-soft.jpg',
    },
    promptTemplate: 'Soft glow beauty, dewy skin, natural makeup look, soft diffused lighting, fresh and radiant, Korean beauty aesthetic, gentle and pure',
    negativePrompt: 'harsh, oily, overexposed, artificial',
    popularity: 850,
    isHot: true,
    accentColor: '#FFD1DC',
  },
  // 后续效果待预览图制作完成后添加
];

/**
 * 探店效果预设 (8个)
 */
export const CAFE_EFFECTS: EffectPreset[] = [
  {
    id: 'cafe-soft',
    name: '日系温柔 · 治愈氛围',
    shortName: '日系温柔',
    contentType: 'cafe',
    preview: {
      before: '/comparisons/cafe-1-original.jpg',
      after: '/comparisons/cafe-soft.jpg',
    },
    promptTemplate: 'Japanese cafe aesthetic, soft natural lighting, cozy atmosphere, muted warm tones, lifestyle photography, Kinfolk style, inviting and comfortable',
    negativePrompt: 'harsh fluorescent lighting, cluttered, empty, sterile',
    popularity: 800,
    isHot: true,
    accentColor: '#B8A99A',
  },
  {
    id: 'cafe-urban',
    name: '都市简约 · 现代感',
    shortName: '都市简约',
    contentType: 'cafe',
    preview: {
      before: '/comparisons/cafe-1-original.jpg',
      after: '/comparisons/cafe-urban.jpg',
    },
    promptTemplate: 'Modern urban cafe, clean lines, minimalist interior, cool neutral tones, professional architectural photography, contemporary aesthetic',
    negativePrompt: 'cluttered, warm rustic, vintage, messy',
    popularity: 650,
    isHot: false,
    accentColor: '#5E7A99',
  },
  {
    id: 'cafe-vintage',
    name: '复古怀旧 · 文艺氛围',
    shortName: '复古怀旧',
    contentType: 'cafe',
    preview: {
      before: '/comparisons/cafe-1-original.jpg',
      after: '/comparisons/cafe-vintage.jpg',
    },
    promptTemplate: 'Vintage cafe aesthetic, film photography look, warm nostalgic tones, retro interior, cozy and charming, artistic atmosphere',
    negativePrompt: 'modern, sterile, cold, digital sharp look',
    popularity: 580,
    isHot: false,
    accentColor: '#C9A86C',
  },
  // 后续效果待预览图制作完成后添加
];

/**
 * 旅游效果预设 (6个)
 */
export const TRAVEL_EFFECTS: EffectPreset[] = [
  {
    id: 'travel-soft',
    name: '清新自然 · 治愈风景',
    shortName: '清新自然',
    contentType: 'travel',
    preview: {
      before: '/comparisons/lifestyle-1-original.jpg',
      after: '/comparisons/travel-soft.jpg',
    },
    promptTemplate: 'Natural travel photography, soft daylight, scenic beauty, wanderlust feeling, peaceful atmosphere, landscape editorial, authentic travel moment',
    negativePrompt: 'tourist traps, crowded, artificial, cliche',
    popularity: 750,
    isHot: true,
    accentColor: '#87CEEB',
  },
  {
    id: 'travel-vintage',
    name: '复古胶片 · 旅行记忆',
    shortName: '复古胶片',
    contentType: 'travel',
    preview: {
      before: '/comparisons/lifestyle-1-original.jpg',
      after: '/comparisons/travel-vintage.jpg',
    },
    promptTemplate: 'Travel photography film look, Kodak Portra style, nostalgic vacation memories, warm vintage tones, cinematic travel documentary',
    negativePrompt: 'digital, sharp, modern, sterile',
    popularity: 620,
    isHot: false,
    accentColor: '#C9A86C',
  },
  // 后续效果待预览图制作完成后添加
];

/**
 * 美食效果预设 (6个)
 */
export const FOOD_EFFECTS: EffectPreset[] = [
  {
    id: 'food-soft',
    name: '清新自然 · 舒适氛围',
    shortName: '清新自然',
    contentType: 'food',
    preview: {
      before: '/comparisons/food-1-original.jpg',
      after: '/comparisons/food-soft.jpg',
    },
    promptTemplate: 'Natural food photography, soft daylight, appetizing presentation, cozy restaurant atmosphere, lifestyle food editorial, warm and inviting',
    negativePrompt: 'unappetizing, harsh flash, messy plating, artificial colors',
    popularity: 700,
    isHot: true,
    accentColor: '#E8D5B7',
  },
  {
    id: 'food-magazine',
    name: '杂志大片 · 精致高级',
    shortName: '杂志大片',
    contentType: 'food',
    preview: {
      before: '/comparisons/food-1-original.jpg',
      after: '/comparisons/food-magazine.jpg',
    },
    promptTemplate: 'High-end food photography, gourmet magazine style, professional studio lighting, elegant plating, culinary art, premium restaurant quality',
    negativePrompt: 'casual, messy, amateur, poor lighting',
    popularity: 680,
    isHot: false,
    accentColor: '#D4AF37',
  },
  // 后续效果待预览图制作完成后添加
];

/**
 * 所有效果预设（按内容类型分组）
 */
export const EFFECT_PRESETS_BY_TYPE: Record<ContentType, EffectPreset[]> = {
  outfit: OUTFIT_EFFECTS,
  beauty: BEAUTY_EFFECTS,
  cafe: CAFE_EFFECTS,
  travel: TRAVEL_EFFECTS,
  food: FOOD_EFFECTS,
};

/**
 * 获取指定内容类型的效果列表
 */
export function getEffectsByContentType(contentType: ContentType): EffectPreset[] {
  return EFFECT_PRESETS_BY_TYPE[contentType] || OUTFIT_EFFECTS;
}

/**
 * 获取热门效果（用于推荐）
 */
export function getHotEffects(contentType: ContentType): EffectPreset[] {
  const effects = getEffectsByContentType(contentType);
  return effects.filter(e => e.isHot);
}

/**
 * 根据 ID 获取效果
 */
export function getEffectById(id: string): EffectPreset | undefined {
  for (const effects of Object.values(EFFECT_PRESETS_BY_TYPE)) {
    const effect = effects.find(e => e.id === id);
    if (effect) return effect;
  }
  return undefined;
}

/**
 * 获取效果的 Prompt（支持强度调整）
 */
export function getEffectPrompt(effectId: string, intensity: number = 100): string {
  const effect = getEffectById(effectId);
  if (!effect) return '';

  // intensity: 0-100，影响 Prompt 的强度描述
  const intensityModifier = intensity < 50
    ? 'subtle, gentle '
    : intensity > 80
    ? 'strong, pronounced '
    : '';

  return `${intensityModifier}${effect.promptTemplate}`;
}

/**
 * 兼容旧 API：从旧的 StyleType 转换为新的 EffectPreset
 */
export function convertStyleToEffect(styleType: string, contentType: ContentType): EffectPreset {
  const mapping: Record<string, string> = {
    magazine: `${contentType}-magazine`,
    soft: `${contentType}-soft`,
    urban: `${contentType}-urban`,
    vintage: `${contentType}-vintage`,
  };

  const effectId = mapping[styleType] || `${contentType}-magazine`;
  return getEffectById(effectId) || OUTFIT_EFFECTS[0];
}
```

**Step 2: 验证 TypeScript 编译**

Run: `cd /Users/weilei/VidLuxe && pnpm --filter web exec tsc --noEmit --skipLibCheck`
Expected: No errors related to the new file

**Step 3: Commit**

```bash
git add apps/web/lib/effect-presets.ts
git commit -m "feat: add effect presets library configuration"
```

---

## Task 2: 创建 Before/After 滑块对比组件

**Files:**
- Create: `apps/web/components/features/try/BeforeAfterSlider.tsx`

**Step 1: 创建滑块对比组件**

```typescript
/**
 * BeforeAfterSlider - Before/After 滑块对比组件
 *
 * 支持拖动滑块实时对比原图和效果图
 */

'use client';

import { useState, useRef, useCallback } from 'react';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  className?: string;
}

export function BeforeAfterSlider({
  beforeImage,
  afterImage,
  className = '',
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    handleMove(e.clientX);
  }, [handleMove]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  }, [isDragging, handleMove]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    handleMove(e.touches[0].clientX);
  }, [handleMove]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  }, [isDragging, handleMove]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '9/12',
        overflow: 'hidden',
        borderRadius: '16px',
        cursor: isDragging ? 'ew-resize' : 'pointer',
        userSelect: 'none',
        touchAction: 'none',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
    >
      {/* After 图片（底层） */}
      <img
        src={afterImage}
        alt="After"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
        draggable={false}
      />

      {/* Before 图片（上层，带裁剪） */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${sliderPosition}%`,
          height: '100%',
          overflow: 'hidden',
        }}
      >
        <img
          src={beforeImage}
          alt="Before"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${100 / (sliderPosition / 100)}%`,
            maxWidth: 'none',
            height: '100%',
            objectFit: 'cover',
          }}
          draggable={false}
        />
      </div>

      {/* 滑块线 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: `${sliderPosition}%`,
          width: '3px',
          background: 'white',
          transform: 'translateX(-50%)',
          boxShadow: '0 0 10px rgba(0,0,0,0.3)',
          zIndex: 10,
        }}
      />

      {/* 滑块手柄 */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: `${sliderPosition}%`,
          transform: 'translate(-50%, -50%)',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'white',
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 20,
          transition: isDragging ? 'none' : 'transform 0.2s ease',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M8 4L4 8L8 12"
            stroke="#333"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16 4L20 8L16 12"
            stroke="#333"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* 标签 */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          padding: '4px 10px',
          background: 'rgba(0,0,0,0.6)',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 500,
          color: 'white',
        }}
      >
        原图
      </div>
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          padding: '4px 10px',
          background: 'rgba(212, 175, 55, 0.9)',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 500,
          color: '#000',
        }}
      >
        效果
      </div>
    </div>
  );
}
```

**Step 2: 验证编译**

Run: `cd /Users/weilei/VidLuxe && pnpm --filter web exec tsc --noEmit --skipLibCheck`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/components/features/try/BeforeAfterSlider.tsx
git commit -m "feat: add BeforeAfterSlider component for image comparison"
```

---

## Task 3: 创建效果选择器组件

**Files:**
- Create: `apps/web/components/features/try/EffectSelector.tsx`

**Step 1: 创建效果选择器组件**

```typescript
/**
 * EffectSelector - 视觉化效果选择器
 *
 * 采用横向滑动缩略图 + 大图预览的交互方式
 * 参考 Instagram/VSCO 的最佳实践
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import type { ContentType } from '@/lib/content-types';
import {
  getEffectsByContentType,
  type EffectPreset,
} from '@/lib/effect-presets';
import { BeforeAfterSlider } from './BeforeAfterSlider';

interface EffectSelectorProps {
  contentType: ContentType;
  selectedEffectId: string;
  onSelect: (effectId: string) => void;
  effectIntensity?: number;
  onIntensityChange?: (intensity: number) => void;
  className?: string;
}

export function EffectSelector({
  contentType,
  selectedEffectId,
  onSelect,
  effectIntensity = 100,
  onIntensityChange,
  className = '',
}: EffectSelectorProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const effects = getEffectsByContentType(contentType);
  const selectedEffect = effects.find(e => e.id === selectedEffectId) || effects[0];

  // 确保默认选中第一个效果
  useEffect(() => {
    if (!selectedEffectId && effects.length > 0) {
      onSelect(effects[0].id);
    }
  }, [contentType, selectedEffectId, effects, onSelect]);

  // 滚动到选中的效果
  useEffect(() => {
    if (scrollContainerRef.current && selectedEffect) {
      const container = scrollContainerRef.current;
      const selectedIndex = effects.findIndex(e => e.id === selectedEffect.id);
      if (selectedIndex >= 0) {
        const itemWidth = 80; // 缩略图宽度 + gap
        const scrollLeft = selectedIndex * itemWidth - container.clientWidth / 2 + itemWidth / 2;
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }, [selectedEffect, effects]);

  return (
    <div className={className}>
      {/* 大图预览区 */}
      <div style={{ marginBottom: '20px' }}>
        <BeforeAfterSlider
          beforeImage={selectedEffect.preview.before}
          afterImage={selectedEffect.preview.after}
        />

        {/* 效果名称 */}
        <div
          style={{
            marginTop: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          {selectedEffect.isHot && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#FF6B6B',
                background: 'rgba(255, 107, 107, 0.15)',
                padding: '2px 8px',
                borderRadius: '4px',
              }}
            >
              热门
            </span>
          )}
          <span
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.95)',
            }}
          >
            {selectedEffect.name}
          </span>
        </div>
      </div>

      {/* 横向滚动效果缩略图 */}
      <div
        style={{
          marginBottom: '20px',
        }}
      >
        <div
          ref={scrollContainerRef}
          style={{
            display: 'flex',
            gap: '10px',
            overflowX: 'auto',
            padding: '4px 0',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {effects.map((effect) => (
            <button
              key={effect.id}
              onClick={() => onSelect(effect.id)}
              style={{
                flexShrink: 0,
                width: '70px',
                textAlign: 'center',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              {/* 缩略图 */}
              <div
                style={{
                  width: '70px',
                  height: '90px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: selectedEffectId === effect.id
                    ? `2px solid ${effect.accentColor}`
                    : '2px solid transparent',
                  boxShadow: selectedEffectId === effect.id
                    ? `0 4px 12px ${effect.accentColor}40`
                    : 'none',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                }}
              >
                <img
                  src={effect.preview.after}
                  alt={effect.shortName}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                {/* 热门标记 */}
                {effect.isHot && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#FF6B6B',
                    }}
                  />
                )}
              </div>
              {/* 名称 */}
              <div
                style={{
                  marginTop: '6px',
                  fontSize: '11px',
                  fontWeight: selectedEffectId === effect.id ? 600 : 400,
                  color: selectedEffectId === effect.id
                    ? effect.accentColor
                    : 'rgba(255, 255, 255, 0.5)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {effect.shortName}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 效果强度滑块 */}
      {onIntensityChange && (
        <div
          style={{
            padding: '16px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}
          >
            <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>
              效果强度
            </span>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255, 255, 255, 0.8)' }}>
              {effectIntensity}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={effectIntensity}
            onChange={(e) => onIntensityChange(Number(e.target.value))}
            style={{
              width: '100%',
              height: '4px',
              borderRadius: '2px',
              background: `linear-gradient(to right, #D4AF37 ${effectIntensity}%, rgba(255,255,255,0.1) ${effectIntensity}%)`,
              outline: 'none',
              cursor: 'pointer',
              WebkitAppearance: 'none',
            }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '8px',
            }}
          >
            <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' }}>
              轻微
            </span>
            <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' }}>
              强烈
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 2: 验证编译**

Run: `cd /Users/weilei/VidLuxe && pnpm --filter web exec tsc --noEmit --skipLibCheck`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/components/features/try/EffectSelector.tsx
git commit -m "feat: add EffectSelector component with horizontal scroll and preview"
```

---

## Task 4: 更新组件导出

**Files:**
- Modify: `apps/web/components/features/try/index.ts`

**Step 1: 添加新组件导出**

在文件中添加新的导出：

```typescript
// 在现有导出后添加
export { BeforeAfterSlider } from './BeforeAfterSlider';
export { EffectSelector } from './EffectSelector';
export type { EffectPreset } from '@/lib/effect-presets';
export { getEffectsByContentType, getEffectById } from '@/lib/effect-presets';
```

**Step 2: 验证编译**

Run: `cd /Users/weilei/VidLuxe && pnpm --filter web exec tsc --noEmit --skipLibCheck`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/components/features/try/index.ts
git commit -m "feat: export new EffectSelector and BeforeAfterSlider components"
```

---

## Task 5: 创建效果来源选择器（替换原 StyleSourceSelector）

**Files:**
- Create: `apps/web/components/features/try/EffectSourceSelector.tsx`

**Step 1: 创建新的效果来源选择器**

```typescript
/**
 * EffectSourceSelector - 效果来源选择器
 *
 * 替代原有的 StyleSourceSelector
 * 支持两种模式：
 * 1. 上传参考图（保留原有功能）
 * 2. 效果库选择（新功能）
 */

'use client';

import { useState } from 'react';
import type { ContentType } from '@/lib/content-types';
import { EffectSelector } from './EffectSelector';

// 风格来源类型
export type EffectSourceType = 'reference' | 'effect';

interface EffectSourceSelectorProps {
  sourceType: EffectSourceType;
  onSourceTypeChange: (type: EffectSourceType) => void;
  referenceFile: File | null;
  onReferenceFileChange: (file: File | null) => void;
  selectedEffectId: string;
  onEffectChange: (effectId: string) => void;
  effectIntensity?: number;
  onIntensityChange?: (intensity: number) => void;
  contentType: ContentType;
}

export function EffectSourceSelector({
  sourceType,
  onSourceTypeChange,
  referenceFile,
  onReferenceFileChange,
  selectedEffectId,
  onEffectChange,
  effectIntensity = 100,
  onIntensityChange,
  contentType,
}: EffectSourceSelectorProps) {
  const [referencePreview, setReferencePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleReferenceUpload = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) return;
    if (file.size > 50 * 1024 * 1024) return;

    onReferenceFileChange(file);
    setReferencePreview(URL.createObjectURL(file));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    handleReferenceUpload(file);
  };

  const clearReference = () => {
    onReferenceFileChange(null);
    setReferencePreview(null);
  };

  return (
    <div>
      {/* 标题 */}
      <div style={{ marginBottom: '20px' }}>
        <h3
          style={{
            fontSize: '17px',
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.95)',
            letterSpacing: '-0.02em',
            marginBottom: '4px',
          }}
        >
          选择效果
        </h3>
        <p
          style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.45)',
          }}
        >
          浏览效果库或上传参考图
        </p>
      </div>

      {/* 两种方式切换 */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        {/* 方式A：效果库 */}
        <button
          onClick={() => onSourceTypeChange('effect')}
          style={{
            flex: 1,
            padding: '16px',
            borderRadius: '16px',
            border: sourceType === 'effect'
              ? '2px solid #D4AF37'
              : '1px solid rgba(255, 255, 255, 0.1)',
            background: sourceType === 'effect'
              ? 'rgba(212, 175, 55, 0.08)'
              : 'rgba(255, 255, 255, 0.02)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: sourceType === 'effect'
                  ? '#D4AF37'
                  : 'rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect
                  x="3"
                  y="3"
                  width="18"
                  height="18"
                  rx="4"
                  stroke={sourceType === 'effect' ? '#000' : 'rgba(255,255,255,0.5)'}
                  strokeWidth="2"
                />
                <circle
                  cx="8.5"
                  cy="8.5"
                  r="1.5"
                  fill={sourceType === 'effect' ? '#000' : 'rgba(255,255,255,0.5)'}
                />
                <path
                  d="M21 15L16 10L5 21"
                  stroke={sourceType === 'effect' ? '#000' : 'rgba(255,255,255,0.5)'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: sourceType === 'effect'
                    ? '#D4AF37'
                    : 'rgba(255, 255, 255, 0.8)',
                  marginBottom: '2px',
                }}
              >
                效果库
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.45)',
                }}
              >
                滑动选择预设效果
              </div>
            </div>
          </div>
        </button>

        {/* 方式B：上传参考图 */}
        <button
          onClick={() => onSourceTypeChange('reference')}
          style={{
            flex: 1,
            padding: '16px',
            borderRadius: '16px',
            border: sourceType === 'reference'
              ? '2px solid #D4AF37'
              : '1px solid rgba(255, 255, 255, 0.1)',
            background: sourceType === 'reference'
              ? 'rgba(212, 175, 55, 0.08)'
              : 'rgba(255, 255, 255, 0.02)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: sourceType === 'reference'
                  ? '#D4AF37'
                  : 'rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 16V4M12 4L8 8M12 4L16 8M4 16V18C4 19.1 4.9 20 6 20H18C19.1 20 20 19.1 20 18V16"
                  stroke={sourceType === 'reference' ? '#000' : 'rgba(255,255,255,0.5)'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: sourceType === 'reference'
                    ? '#D4AF37'
                    : 'rgba(255, 255, 255, 0.8)',
                  marginBottom: '2px',
                }}
              >
                参考图
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.45)',
                }}
              >
                AI 学习你喜欢的风格
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* 根据选择显示不同内容 */}
      {sourceType === 'reference' ? (
        <div>
          {referencePreview ? (
            // 已上传参考图
            <div
              style={{
                position: 'relative',
                borderRadius: '16px',
                overflow: 'hidden',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div style={{ aspectRatio: '16/9', position: 'relative' }}>
                {referenceFile?.type.startsWith('video/') ? (
                  <video
                    src={referencePreview}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    muted
                    autoPlay
                    loop
                  />
                ) : (
                  <img
                    src={referencePreview}
                    alt="参考图预览"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                )}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '16px',
                    left: '16px',
                    right: '16px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px',
                    }}
                  >
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#34C759',
                      }}
                    />
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: 'rgba(255, 255, 255, 0.9)',
                      }}
                    >
                      风格已提取
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.5)',
                    }}
                  >
                    AI 将学习这张图片的风格并应用到你的内容
                  </p>
                </div>
              </div>
              <button
                onClick={clearReference}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18 6L6 18M6 6L18 18"
                    stroke="rgba(255,255,255,0.7)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          ) : (
            // 上传区域
            <div
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onClick={() => document.getElementById('reference-input-effect')?.click()}
              style={{
                padding: '40px 24px',
                borderRadius: '16px',
                border: isDragOver
                  ? '2px dashed #D4AF37'
                  : '1px dashed rgba(255, 255, 255, 0.15)',
                background: isDragOver
                  ? 'rgba(212, 175, 55, 0.05)'
                  : 'rgba(255, 255, 255, 0.02)',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.3s ease',
              }}
            >
              <input
                id="reference-input-effect"
                type="file"
                accept="image/*,video/*"
                style={{ display: 'none' }}
                onChange={(e) => e.target.files?.[0] && handleReferenceUpload(e.target.files[0])}
              />
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  margin: '0 auto 16px',
                  borderRadius: '16px',
                  background: 'rgba(212, 175, 55, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 16L8.586 11.414C9.367 10.633 10.633 10.633 11.414 11.414L16 16M14 14L15.586 12.414C16.367 11.633 17.633 11.633 18.414 12.414L20 14M14 8H14.01M6 20H18C19.105 20 20 19.105 20 18V6C20 4.895 19.105 4 18 4H6C4.895 4 4 4.895 4 6V18C4 19.105 4.895 20 6 20Z"
                    stroke="#D4AF37"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p
                style={{
                  fontSize: '15px',
                  fontWeight: 500,
                  color: 'rgba(255, 255, 255, 0.8)',
                  marginBottom: '6px',
                }}
              >
                上传风格参考图
              </p>
              <p
                style={{
                  fontSize: '13px',
                  color: 'rgba(255, 255, 255, 0.4)',
                }}
              >
                支持 JPG、PNG、MP4，最大 50MB
              </p>
            </div>
          )}
        </div>
      ) : (
        // 效果库选择
        <EffectSelector
          contentType={contentType}
          selectedEffectId={selectedEffectId}
          onSelect={onEffectChange}
          effectIntensity={effectIntensity}
          onIntensityChange={onIntensityChange}
        />
      )}
    </div>
  );
}
```

**Step 2: 验证编译**

Run: `cd /Users/weilei/VidLuxe && pnpm --filter web exec tsc --noEmit --skipLibCheck`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/components/features/try/EffectSourceSelector.tsx
git commit -m "feat: add EffectSourceSelector to replace StyleSourceSelector"
```

---

## Task 6: 更新 try-store 以支持新效果系统

**Files:**
- Modify: `apps/web/lib/stores/try-store.ts`

**Step 1: 添加效果相关状态**

在 store 中添加：

```typescript
// 添加到 imports
import type { EffectPreset } from '@/lib/effect-presets';

// 添加到 state 类型
interface TryStoreState {
  // ... existing fields ...

  // 新增：效果系统
  selectedEffectId: string;
  effectIntensity: number;
  effectSourceType: 'reference' | 'effect';
}

// 添加到 actions
interface TryStoreActions {
  // ... existing actions ...

  // 新增：效果系统
  setSelectedEffectId: (id: string) => void;
  setEffectIntensity: (intensity: number) => void;
  setEffectSourceType: (type: 'reference' | 'effect') => void;
}

// 在 create store 中添加
selectedEffectId: '',
effectIntensity: 100,
effectSourceType: 'effect',

setSelectedEffectId: (id) => set({ selectedEffectId: id }),
setEffectIntensity: (intensity) => set({ effectIntensity: intensity }),
setEffectSourceType: (type) => set({ effectSourceType: type }),
```

**Step 2: 验证编译**

Run: `cd /Users/weilei/VidLuxe && pnpm --filter web exec tsc --noEmit --skipLibCheck`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/lib/stores/try-store.ts
git commit -m "feat: add effect system state to try-store"
```

---

## Task 7: 更新 StyleStep 使用新组件

**Files:**
- Modify: `apps/web/components/features/try/steps/StyleStep.tsx`

**Step 1: 替换 StyleSourceSelector 为 EffectSourceSelector**

修改 import：

```typescript
import {
  EffectSourceSelector,  // 新增
  StyleMultiSelector,
  BatchPreviewGrid,
  StepIndicator,
} from '@/components/features/try';
```

修改组件使用：

```typescript
// 在单图模式下使用 EffectSourceSelector
<EffectSourceSelector
  sourceType={effectSourceType}
  onSourceTypeChange={setEffectSourceType}
  referenceFile={referenceFile}
  onReferenceFileChange={setReferenceFile}
  selectedEffectId={selectedEffectId}
  onEffectChange={setSelectedEffectId}
  effectIntensity={effectIntensity}
  onIntensityChange={setEffectIntensity}
  contentType={contentType}
/>
```

**Step 2: 验证编译**

Run: `cd /Users/weilei/VidLuxe && pnpm --filter web exec tsc --noEmit --skipLibCheck`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/components/features/try/steps/StyleStep.tsx
git commit -m "feat: integrate EffectSourceSelector into StyleStep"
```

---

## Task 8: 更新 enhance API 支持新效果系统

**Files:**
- Modify: `apps/web/app/api/enhance/route.ts`

**Step 1: 添加对 effectId 的支持**

在请求处理中：

```typescript
import { getEffectById, getEffectPrompt } from '@/lib/effect-presets';

// 在处理请求时
const { effectId, effectIntensity, style, ...rest } = await request.json();

// 如果提供了 effectId，使用新的效果系统
if (effectId) {
  const effect = getEffectById(effectId);
  if (effect) {
    prompt = getEffectPrompt(effectId, effectIntensity);
    negativePrompt = effect.negativePrompt;
  }
} else {
  // 兼容旧的 style 参数
  // ... existing logic
}
```

**Step 2: 验证编译**

Run: `cd /Users/weilei/VidLuxe && pnpm --filter web exec tsc --noEmit --skipLibCheck`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/app/api/enhance/route.ts
git commit -m "feat: add effectId support to enhance API"
```

---

## Task 9: 本地测试验证

**Step 1: 启动开发服务器**

Run: `cd /Users/weilei/VidLuxe && pnpm web`

Expected: Dev server starts on http://localhost:3000

**Step 2: 手动测试**

1. 访问 http://localhost:3000/try
2. 上传一张图片
3. 验证效果选择器显示正常
4. 验证横向滑动功能
5. 验证 Before/After 滑块对比
6. 验证效果强度滑块
7. 选择效果后提交处理

**Step 3: 检查控制台无错误**

打开浏览器开发者工具，确认无 TypeScript 或运行时错误。

---

## Task 10: 构建验证

**Step 1: 运行 TypeScript 检查**

Run: `cd /Users/weilei/VidLuxe && pnpm --filter web exec tsc --noEmit`
Expected: No errors

**Step 2: 运行 ESLint**

Run: `cd /Users/weilei/VidLuxe && pnpm --filter web lint`
Expected: No critical errors

**Step 3: 运行构建**

Run: `cd /Users/weilei/VidLuxe && pnpm --filter web build`
Expected: Build succeeds

**Step 4: 最终提交**

```bash
git add -A
git commit -m "feat: complete effect-based style selector redesign

- Add effect presets library with 30+ effects across 5 content types
- Create BeforeAfterSlider component for visual comparison
- Create EffectSelector with horizontal scroll navigation
- Create EffectSourceSelector replacing StyleSourceSelector
- Update try-store with effect system state
- Integrate into StyleStep and enhance API
- Support effect intensity adjustment (0-100%)

Design doc: docs/plans/2026-03-01-style-selector-redesign.md"
```

---

## 测试清单

| 测试项 | 预期结果 | 状态 |
|--------|----------|------|
| 效果库加载 | 根据内容类型显示正确效果列表 | ⬜ |
| 横向滑动 | 缩略图可正常滑动，选中效果高亮 | ⬜ |
| Before/After 对比 | 滑块可拖动，对比效果清晰 | ⬜ |
| 效果强度滑块 | 0-100% 范围可调 | ⬜ |
| 参考图上传 | 保留原有功能正常 | ⬜ |
| 单图处理流程 | 选择效果后正常处理 | ⬜ |
| 批量处理流程 | 兼容现有批量流程 | ⬜ |
| TypeScript 编译 | 无错误 | ⬜ |
| ESLint | 无严重错误 | ⬜ |
| 生产构建 | 成功 | ⬜ |

---

## 后续工作

1. **制作剩余预览图**：当前仅有基础效果，需制作全部 42 个效果的预览图
2. **效果使用统计**：添加效果使用次数追踪，用于热门排序
3. **搜索功能**：添加效果搜索入口
4. **智能内容识别**：自动识别内容类型，减少用户操作
