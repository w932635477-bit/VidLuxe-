# Style Selection & Prompt Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现两步选择流程（内容类型 → 风格），使用真实对比图，并通过内容类型+风格组合生成精准 Prompt

**Architecture:** 新增内容类型配置模块，重构 StyleSelector 组件为两步流程，扩展 Prompt 构建函数支持内容类型增强词

**Tech Stack:** Next.js 15, React 18, TypeScript, CSS Variables

---

## Task 1: 创建内容类型配置模块

**Files:**
- Create: `apps/web/lib/content-types.ts`

**Step 1: 定义内容类型类型和接口**

```typescript
// apps/web/lib/content-types.ts

import type { PresetStyle } from './style-prompts';

/**
 * 内容类型枚举
 */
export type ContentType = 'outfit' | 'beauty' | 'cafe' | 'travel' | 'food';

/**
 * 内容类型配置接口
 */
export interface ContentTypeConfig {
  id: ContentType;
  name: string;
  icon: string;
  description: string;
  keywords: string;
  negativeKeywords: string;
  suitableStyles: PresetStyle[];
  comparisonImage: {
    before: string;
    after: string;
  };
}
```

**Step 2: 添加内容类型配置数据**

```typescript
// apps/web/lib/content-types.ts (继续)

/**
 * 内容类型配置
 */
export const CONTENT_TYPES: Record<ContentType, ContentTypeConfig> = {
  outfit: {
    id: 'outfit',
    name: '穿搭',
    icon: '👗',
    description: '时尚穿搭、街拍、日常搭配',
    keywords: 'fashion photography, outfit details, street style, clothing texture, model pose, fashion editorial',
    negativeKeywords: 'casual snapshot, poor lighting, messy background, unflattering angle',
    suitableStyles: ['magazine', 'soft', 'urban', 'vintage'],
    comparisonImage: {
      before: '/comparisons/fashion-1-original.jpg',
      after: '/comparisons/fashion-1-enhanced.jpg',
    },
  },
  beauty: {
    id: 'beauty',
    name: '美妆',
    icon: '💄',
    description: '妆容展示、美妆产品、护肤',
    keywords: 'beauty close-up, makeup details, skin texture, glamour lighting, portrait photography, cosmetic',
    negativeKeywords: 'harsh shadows, overexposed, unnatural colors, heavy retouching',
    suitableStyles: ['magazine', 'soft'],
    comparisonImage: {
      before: '/hero/hero-beauty-before.jpg',
      after: '/hero/hero-beauty-after.jpg',
    },
  },
  cafe: {
    id: 'cafe',
    name: '探店',
    icon: '☕',
    description: '咖啡店、餐厅、空间探店',
    keywords: 'interior atmosphere, cozy vibe, lifestyle photography, ambient lighting, cafe aesthetic, space design',
    negativeKeywords: 'cluttered, harsh fluorescent lighting, empty, sterile',
    suitableStyles: ['soft', 'urban', 'vintage'],
    comparisonImage: {
      before: '/comparisons/cafe-1-original.jpg',
      after: '/comparisons/cafe-1-enhanced.jpg',
    },
  },
  travel: {
    id: 'travel',
    name: '旅游',
    icon: '✈️',
    description: '旅行记录、风景、目的地',
    keywords: 'travel photography, landscape, scenic view, adventure, destination, wanderlust',
    negativeKeywords: 'tourist traps, crowded, artificial, cliche',
    suitableStyles: ['soft', 'vintage'],
    comparisonImage: {
      before: '/comparisons/lifestyle-1-original.jpg',
      after: '/comparisons/lifestyle-1-enhanced.jpg',
    },
  },
  food: {
    id: 'food',
    name: '美食',
    icon: '🍽️',
    description: '美食摄影、餐厅菜品、烹饪',
    keywords: 'food photography, appetizing, warm lighting, gourmet, culinary art, delicious',
    negativeKeywords: 'unappetizing, harsh flash, messy plating, artificial colors',
    suitableStyles: ['soft', 'magazine'],
    comparisonImage: {
      before: '/comparisons/food-1-original.jpg',
      after: '/comparisons/food-1-enhanced.jpg',
    },
  },
};

/**
 * 获取内容类型配置
 */
export function getContentTypeConfig(contentType: ContentType): ContentTypeConfig {
  return CONTENT_TYPES[contentType] || CONTENT_TYPES.outfit;
}

/**
 * 获取所有内容类型列表
 */
export function getAllContentTypes(): ContentTypeConfig[] {
  return Object.values(CONTENT_TYPES);
}
```

**Step 3: 验证文件创建成功**

Run: `ls -la apps/web/lib/content-types.ts`
Expected: 文件存在且内容正确

**Step 4: Commit**

```bash
git add apps/web/lib/content-types.ts
git commit -m "feat: add content types configuration module"
```

---

## Task 2: 扩展 Prompt 构建函数

**Files:**
- Modify: `apps/web/lib/style-prompts.ts:127-150`

**Step 1: 导入内容类型**

在文件顶部添加导入：

```typescript
// apps/web/lib/style-prompts.ts (顶部添加)

import type { ContentType } from './content-types';
```

**Step 2: 更新 buildEnhancePrompt 函数**

替换现有的 `buildEnhancePrompt` 函数：

```typescript
// apps/web/lib/style-prompts.ts (替换 buildEnhancePrompt 函数)

/**
 * 构建完整的图片升级 Prompt
 */
export function buildEnhancePrompt(params: {
  style: PresetStyle;
  contentType?: ContentType;
  customKeywords?: string[];
}): string {
  const { style, contentType, customKeywords = [] } = params;
  const styleConfig = getStyleConfig(style);

  // 基础风格 Prompt
  const basePrompt = styleConfig.prompt;

  // 内容类型增强词
  let contentPrompt = '';
  if (contentType) {
    const { getContentTypeConfig } = require('./content-types');
    const contentConfig = getContentTypeConfig(contentType);
    contentPrompt = contentConfig.keywords;
  }

  // 质量保证词
  const qualityPrompt = '8K, high resolution, professional photography, premium quality, sharp details';

  // 自定义关键词
  const keywordsPrompt = customKeywords.length > 0 ? customKeywords.join(', ') : '';

  return [basePrompt, contentPrompt, qualityPrompt, keywordsPrompt]
    .filter(Boolean)
    .join(', ');
}

/**
 * 构建增强版负面 Prompt
 */
export function buildNegativePrompt(params: {
  style: PresetStyle;
  contentType?: ContentType;
}): string {
  const { style, contentType } = params;
  const styleConfig = getStyleConfig(style);

  // 基础负面 Prompt
  const baseNegative = styleConfig.negativePrompt;

  // 内容类型负面词
  let contentNegative = '';
  if (contentType) {
    const { getContentTypeConfig } = require('./content-types');
    const contentConfig = getContentTypeConfig(contentType);
    contentNegative = contentConfig.negativeKeywords;
  }

  // 通用负面词
  const generalNegative = 'low quality, blurry, distorted, watermark, signature, amateur';

  return [baseNegative, contentNegative, generalNegative]
    .filter(Boolean)
    .join(', ');
}
```

**Step 3: 验证修改**

Run: `cd apps/web && npx tsc --noEmit lib/style-prompts.ts`
Expected: 无类型错误

**Step 4: Commit**

```bash
git add apps/web/lib/style-prompts.ts
git commit -m "feat: extend buildEnhancePrompt with content type support"
```

---

## Task 3: 创建内容类型选择器组件

**Files:**
- Create: `apps/web/components/features/try/ContentTypeSelector.tsx`

**Step 1: 创建组件文件**

```typescript
// apps/web/components/features/try/ContentTypeSelector.tsx

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
        <p style={{
          fontSize: '13px',
          color: 'rgba(255, 255, 255, 0.6)',
        }}>
          {getContentTypeConfig(selectedType).description}
        </p>
      </div>
    </div>
  );
}

export default ContentTypeSelector;
```

**Step 2: 验证组件创建**

Run: `ls -la apps/web/components/features/try/ContentTypeSelector.tsx`
Expected: 文件存在

**Step 3: Commit**

```bash
git add apps/web/components/features/try/ContentTypeSelector.tsx
git commit -m "feat: add ContentTypeSelector component"
```

---

## Task 4: 重构 StyleSelector 组件

**Files:**
- Modify: `apps/web/components/features/try/StyleSelector.tsx`

**Step 1: 添加内容类型支持**

在文件顶部添加导入和类型：

```typescript
// apps/web/components/features/try/StyleSelector.tsx (修改导入部分)

'use client';

import { useState } from 'react';
import type { ContentType } from '@/lib/content-types';
import { getContentTypeConfig } from '@/lib/content-types';

// 在 StylePreset 接口中添加 comparisonImagesByType 字段
export interface StylePreset {
  id: StyleType;
  name: string;
  nameEn: string;
  description: string;
  tags: string[];
  suitableFor: string[];
  accentColor: string;
  gradientFrom: string;
  gradientTo: string;
  thumbnail: {
    before: string;
    after: string;
  };
  // 新增：根据内容类型的不同对比图
  comparisonImagesByType?: Partial<Record<ContentType, { before: string; after: string }>>;
}
```

**Step 2: 更新 StyleCard 组件支持内容类型**

在 StyleCard 组件中添加 contentType 参数：

```typescript
// apps/web/components/features/try/StyleSelector.tsx (修改 StyleCard 组件)

function StyleCard({
  preset,
  isSelected,
  onSelect,
  contentType,
}: {
  preset: StylePreset;
  isSelected: boolean;
  onSelect: () => void;
  contentType?: ContentType;  // 新增
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  // 根据 content type 获取对比图
  const getComparisonImages = () => {
    if (contentType && preset.comparisonImagesByType?.[contentType]) {
      return preset.comparisonImagesByType[contentType];
    }
    return preset.thumbnail;
  };

  const images = getComparisonImages();

  // ... 其余组件代码保持不变，但使用 images.before 和 images.after
```

**Step 3: 更新 StyleSelector 组件 Props**

```typescript
// apps/web/components/features/try/StyleSelector.tsx (修改 StyleSelector 组件)

interface StyleSelectorProps {
  selectedStyle: StyleType;
  onSelect: (style: StyleType) => void;
  contentType?: ContentType;  // 新增
  className?: string;
}

export function StyleSelector({
  selectedStyle,
  onSelect,
  contentType,
  className = '',
}: StyleSelectorProps) {
  return (
    <div className={className}>
      {/* 标题 */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{
          fontSize: '17px',
          fontWeight: 600,
          color: 'rgba(255, 255, 255, 0.95)',
          letterSpacing: '-0.02em',
          marginBottom: '4px',
        }}>
          选择预设风格
        </h3>
        <p style={{
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.45)',
        }}>
          悬停查看效果对比，点击选择
        </p>
      </div>

      {/* 风格卡片网格 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
      }}>
        {STYLE_PRESETS.map((preset) => (
          <StyleCard
            key={preset.id}
            preset={preset}
            isSelected={selectedStyle === preset.id}
            onSelect={() => onSelect(preset.id)}
            contentType={contentType}
          />
        ))}
      </div>
    </div>
  );
}
```

**Step 4: 验证修改**

Run: `cd apps/web && npx tsc --noEmit components/features/try/StyleSelector.tsx`
Expected: 无类型错误

**Step 5: Commit**

```bash
git add apps/web/components/features/try/StyleSelector.tsx
git commit -m "refactor: add content type support to StyleSelector"
```

---

## Task 5: 创建组合选择器组件

**Files:**
- Create: `apps/web/components/features/try/StyleFlowSelector.tsx`

**Step 1: 创建两步流程组合组件**

```typescript
// apps/web/components/features/try/StyleFlowSelector.tsx

'use client';

import { useState } from 'react';
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
        style={{ marginBottom: '32px' }}
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
```

**Step 2: 导出组件**

在 `apps/web/components/features/try/index.ts` 中添加导出：

```typescript
// apps/web/components/features/try/index.ts (添加导出)

export { ContentTypeSelector } from './ContentTypeSelector';
export { StyleFlowSelector } from './StyleFlowSelector';
export type { ContentType } from '@/lib/content-types';
```

**Step 3: Commit**

```bash
git add apps/web/components/features/try/StyleFlowSelector.tsx apps/web/components/features/try/index.ts
git commit -m "feat: add StyleFlowSelector two-step selection component"
```

---

## Task 6: 集成到 ImageSingleFlow

**Files:**
- Modify: `apps/web/components/features/try/flows/ImageSingleFlow/index.tsx`

**Step 1: 添加内容类型状态**

在组件中添加：

```typescript
// apps/web/components/features/try/flows/ImageSingleFlow/index.tsx

// 在文件顶部导入
import { StyleFlowSelector } from '@/components/features/try/StyleFlowSelector';
import type { ContentType } from '@/lib/content-types';
import { buildEnhancePrompt, buildNegativePrompt } from '@/lib/style-prompts';

// 在组件内部添加状态
const [selectedContentType, setSelectedContentType] = useState<ContentType>('outfit');

// 修改 enhance API 调用部分，使用新的 Prompt 构建函数
const handleEnhance = async () => {
  // ... 现有代码

  // 使用增强后的 Prompt
  const prompt = buildEnhancePrompt({
    style: selectedStyle,
    contentType: selectedContentType,
  });

  const negativePrompt = buildNegativePrompt({
    style: selectedStyle,
    contentType: selectedContentType,
  });

  // ... 其余代码
};
```

**Step 2: 替换 StyleSelector 为 StyleFlowSelector**

在渲染部分，将：

```tsx
<StyleSelector
  selectedStyle={selectedStyle}
  onSelect={setSelectedStyle}
/>
```

替换为：

```tsx
<StyleFlowSelector
  selectedStyle={selectedStyle}
  selectedContentType={selectedContentType}
  onStyleSelect={setSelectedStyle}
  onContentTypeSelect={setSelectedContentType}
/>
```

**Step 3: 验证修改**

Run: `cd apps/web && npx tsc --noEmit components/features/try/flows/ImageSingleFlow/index.tsx`
Expected: 无类型错误

**Step 4: Commit**

```bash
git add apps/web/components/features/try/flows/ImageSingleFlow/index.tsx
git commit -m "feat: integrate StyleFlowSelector into ImageSingleFlow"
```

---

## Task 7: 集成到 ImageBatchFlow

**Files:**
- Modify: `apps/web/components/features/try/flows/ImageBatchFlow/index.tsx`

**Step 1: 添加内容类型状态和导入**

与 Task 6 类似，添加：

```typescript
// 导入
import { StyleFlowSelector } from '@/components/features/try/StyleFlowSelector';
import type { ContentType } from '@/lib/content-types';
import { buildEnhancePrompt, buildNegativePrompt } from '@/lib/style-prompts';

// 状态
const [selectedContentType, setSelectedContentType] = useState<ContentType>('outfit');
```

**Step 2: 替换 StyleSelector 为 StyleFlowSelector**

**Step 3: 更新批量处理中的 Prompt 构建**

**Step 4: Commit**

```bash
git add apps/web/components/features/try/flows/ImageBatchFlow/index.tsx
git commit -m "feat: integrate StyleFlowSelector into ImageBatchFlow"
```

---

## Task 8: 集成到 VideoFlow

**Files:**
- Modify: `apps/web/components/features/try/flows/VideoFlow/index.tsx`

**Step 1: 添加内容类型状态和导入**

```typescript
// 导入
import { StyleFlowSelector } from '@/components/features/try/StyleFlowSelector';
import type { ContentType } from '@/lib/content-types';
import { buildEnhancePrompt, buildNegativePrompt } from '@/lib/style-prompts';

// 状态
const [selectedContentType, setSelectedContentType] = useState<ContentType>('outfit');
```

**Step 2: 替换 StyleSelector 为 StyleFlowSelector**

**Step 3: 更新视频处理中的 Prompt 构建**

更新 `fetchKeyframes` 函数中的 Prompt 构建：

```typescript
const prompt = buildEnhancePrompt({
  style: selectedStyle,
  contentType: selectedContentType,
});
```

**Step 4: Commit**

```bash
git add apps/web/components/features/try/flows/VideoFlow/index.tsx
git commit -m "feat: integrate StyleFlowSelector into VideoFlow"
```

---

## Task 9: 更新视频封面增强 API

**Files:**
- Modify: `apps/web/app/api/video/enhance-cover/route.ts`

**Step 1: 添加 contentType 参数支持**

```typescript
// apps/web/app/api/video/enhance-cover/route.ts

// 修改请求体接口
interface EnhanceCoverRequest {
  frameUrl: string;
  style?: 'magazine' | 'warm' | 'cinematic';
  contentType?: ContentType;  // 新增
}

// 修改 style 到 prompt 的映射
const STYLE_PROMPTS_WITH_CONTENT: Record<string, Record<ContentType, string>> = {
  magazine: {
    outfit: 'Vogue magazine editorial style, luxury fashion aesthetic, fashion photography',
    beauty: 'beauty editorial, glamour magazine cover, professional makeup photography',
    cafe: 'lifestyle magazine, interior design editorial, sophisticated atmosphere',
    travel: 'travel magazine, wanderlust editorial, scenic destination photography',
    food: 'culinary magazine, gourmet editorial, food photography',
  },
  // ... 其他风格
};

// 在 POST 函数中使用
const stylePrompt = STYLE_PROMPTS_WITH_CONTENT[style]?.[contentType] || STYLE_PROMPTS[style];
```

**Step 2: Commit**

```bash
git add apps/web/app/api/video/enhance-cover/route.ts
git commit -m "feat: add content type support to enhance-cover API"
```

---

## Task 10: 端到端测试

**Step 1: 启动开发服务器**

Run: `cd /Users/weilei/VidLuxe && pnpm web`
Expected: 服务器启动在 http://localhost:3000

**Step 2: 手动测试流程**

1. 访问 http://localhost:3000/try
2. 选择单图模式
3. 上传一张图片
4. 验证内容类型选择器显示正常
5. 点击不同内容类型，验证选中状态
6. 验证风格选择器根据内容类型显示不同对比图
7. 选择风格后点击继续
8. 验证增强功能正常工作

**Step 3: 测试其他流程**

- 批量图流程
- 视频流程

**Step 4: Commit 最终测试验证**

```bash
git add -A
git commit -m "test: verify style selection and prompt optimization implementation"
```

---

## 文件修改汇总

| 文件 | 操作 | 说明 |
|------|------|------|
| `apps/web/lib/content-types.ts` | 新建 | 内容类型配置模块 |
| `apps/web/lib/style-prompts.ts` | 修改 | 扩展 Prompt 构建函数 |
| `apps/web/components/features/try/ContentTypeSelector.tsx` | 新建 | 内容类型选择器组件 |
| `apps/web/components/features/try/StyleSelector.tsx` | 修改 | 添加内容类型支持 |
| `apps/web/components/features/try/StyleFlowSelector.tsx` | 新建 | 两步流程组合组件 |
| `apps/web/components/features/try/index.ts` | 修改 | 导出新组件 |
| `apps/web/components/features/try/flows/ImageSingleFlow/index.tsx` | 修改 | 集成新选择器 |
| `apps/web/components/features/try/flows/ImageBatchFlow/index.tsx` | 修改 | 集成新选择器 |
| `apps/web/components/features/try/flows/VideoFlow/index.tsx` | 修改 | 集成新选择器 |
| `apps/web/app/api/video/enhance-cover/route.ts` | 修改 | 添加内容类型支持 |

---

**Plan complete and saved to `docs/plans/2026-02-27-style-prompt-optimization-impl.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
